import type { Mock } from "vitest";
import { ref } from "vue";

import { SUMMARIZE_TO_NOTE, useCompanion } from "@/composables/useCompanion";
import {
  CompanionApiError,
  CompanionSession,
  deleteCompanionConversation,
  getCompanionSession,
  reactToSubmission,
  requestHint,
  setHintLevel,
  startCompanionConversation,
  switchCompanionConversation,
} from "@/services/companion";
import { streamCompanion } from "@/services/companionStream";
import { ApiId } from "@/services/apiId";

vi.mock("../../generated", () => ({ OpenAPI: { BASE: "/api" } }));
vi.mock("@/services/companionStream", () => ({ streamCompanion: vi.fn() }));
vi.mock("@/services/companion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/companion")>()),
  getCompanionSession: vi.fn(),
  listCompanionMessages: vi.fn(),
  listCompanionConversations: vi.fn(),
  startCompanionConversation: vi.fn(),
  switchCompanionConversation: vi.fn(),
  reactToSubmission: vi.fn(),
  requestHint: vi.fn(),
  setHintLevel: vi.fn(),
  compactCompanionMemory: vi.fn(),
  deleteCompanionConversation: vi.fn(),
}));

const mockedSession = getCompanionSession as Mock;
const mockedStream = streamCompanion as Mock;
const mockedReact = reactToSubmission as Mock;
const mockedHint = requestHint as Mock;
const mockedSetLevel = setHintLevel as Mock;
const mockedStart = startCompanionConversation as Mock;
const mockedSwitch = switchCompanionConversation as Mock;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const steps = ["只陪伴", "指方向", "点关键", "说方法", "给步骤", "看答案"].map(
  (title, level) => ({ level, title, description: title })
);

const session = (
  overrides: Partial<CompanionSession> = {}
): CompanionSession => ({
  questionId: "7",
  conversationId: "50",
  hintLevel: 0,
  effectiveLevel: 0,
  hintMode: "guided",
  hintSteps: steps,
  canCallModel: true,
  mockMode: false,
  personaName: "栗子",
  contextUsage: {
    usedTokens: 1000,
    limitTokens: 1000000,
    ratio: 0.001,
    compactRatio: 0.8,
    estimated: false,
  },
  messages: [],
  hasMoreMessages: false,
  ...overrides,
});

const code = "int a = 1\n";

const setup = (questionId: ApiId | null = "7") => {
  const id = ref<ApiId | null>(questionId);
  const enabled = ref(true);
  const applyCode = vi.fn().mockReturnValue(true);
  const companion = useCompanion({
    questionId: id,
    enabled,
    getSnapshot: () => ({ code, language: "java", cursorLine: 1 }),
    applyCode,
  });
  return { companion, id, enabled, applyCode };
};

describe("useCompanion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedSession.mockResolvedValue(session());
  });

  it("loads the session of the current question only when logged in", async () => {
    const { companion, enabled } = setup();
    await flush();

    expect(mockedSession).toHaveBeenCalledWith("7");
    expect(companion.conversationId.value).toBe("50");
    expect(companion.currentStep.value?.title).toBe("只陪伴");

    enabled.value = false;
    await flush();
    expect(companion.session.value).toBeNull();
  });

  it("streams a chat reply in the current conversation and previews the code edit", async () => {
    const proposal = {
      baseHash: "h",
      edits: [
        {
          kind: "replace",
          oldText: "int a = 1",
          newText: "int a = 1;",
          startLine: 1,
        },
      ],
      resultCode: "int a = 1;\n",
    };
    mockedStream.mockImplementation(async (path, body, handlers) => {
      handlers.onDelta("补上");
      handlers.onDelta("分号了");
      handlers.onEdits(proposal);
      return {
        messageId: "21",
        hintLevel: 0,
        contextUsage: session().contextUsage,
        compacted: false,
      };
    });
    const { companion, applyCode } = setup();
    await flush();

    await expect(companion.send("帮我看看")).resolves.toBe(true);
    await flush();

    expect(mockedStream.mock.calls[0][1]).toMatchObject({
      conversationId: "50",
      message: "帮我看看",
      snapshot: { code, language: "java", cursorLine: 1 },
    });
    expect(companion.messages.value.map((item) => item.content)).toEqual([
      "帮我看看",
      "补上分号了",
    ]);
    expect(companion.busy.value).toBeNull();
    expect(companion.preview.value?.resolution.code).toBe("int a = 1;\n");

    expect(companion.applyPreview()).toBe(true);
    expect(applyCode).toHaveBeenCalledWith("int a = 1;\n");
    expect(companion.preview.value).toBeNull();
  });

  it("keeps the note proposals on the reply and marks one applied", async () => {
    const note = { kind: "create", title: "两数之和 笔记", applied: false };
    mockedStream.mockImplementation(async (path, body, handlers) => {
      handlers.onDelta("整理好了");
      handlers.onNotes([note]);
      return {
        messageId: "22",
        hintLevel: 0,
        contextUsage: session().contextUsage,
        compacted: false,
      };
    });
    const { companion } = setup();
    await flush();

    await expect(companion.summarizeToNote()).resolves.toBe(true);

    expect(mockedStream.mock.calls[0][1]).toMatchObject({
      message: SUMMARIZE_TO_NOTE,
    });
    const reply = companion.messages.value[1];
    expect(reply.noteEdits).toEqual([note]);

    companion.markNoteApplied("22", 0, { ...note, applied: true, noteId: 30 });
    expect(companion.messages.value[1].noteEdits?.[0]).toMatchObject({
      applied: true,
      noteId: 30,
    });
    // 别的消息、不存在的下标不受影响
    companion.markNoteApplied("21", 0, { ...note, title: "别的" });
    companion.markNoteApplied("22", 3, { ...note, title: "别的" });
    expect(companion.messages.value[1].noteEdits).toHaveLength(1);
    expect(companion.messages.value[1].noteEdits?.[0].title).toBe(
      "两数之和 笔记"
    );
  });

  it("sends the quoted code with the question and keeps it on the message", async () => {
    mockedStream.mockResolvedValue({
      messageId: "22",
      hintLevel: 0,
      contextUsage: session().contextUsage,
      compacted: false,
    });
    const { companion } = setup();
    await flush();
    const quote = { startLine: 1, endLine: 1, code: "int a = 1" };

    await companion.send("这里少了什么？", quote);

    expect(mockedStream.mock.calls[0][1]).toMatchObject({
      message: "这里少了什么？",
      quote,
    });
    expect(companion.messages.value[0]).toMatchObject({
      role: "user",
      quote,
    });
  });

  it("drops the unsent message and opens settings when the key is missing", async () => {
    mockedStream.mockRejectedValue(new CompanionApiError(40020, "未配置"));
    const { companion } = setup();
    await flush();

    await expect(companion.send("在吗")).resolves.toBe(false);

    expect(companion.messages.value).toEqual([]);
    expect(companion.settingsOpen.value).toBe(true);
    expect(companion.lastError.value).toContain("API Key");
  });

  it("asks a hint at the current level without moving it", async () => {
    mockedSession.mockResolvedValue(session({ hintLevel: 2 }));
    mockedHint.mockResolvedValue({
      messageId: "30",
      hintLevel: 2,
      stepTitle: "点关键",
      message: "看看数据范围",
      codeEdits: null,
      contextUsage: session().contextUsage,
    });
    const { companion } = setup();
    await flush();

    await companion.askHint();

    expect(mockedHint).toHaveBeenCalledWith(
      "50",
      expect.objectContaining({ code })
    );
    expect(companion.level.value).toBe(2);
    expect(companion.messages.value[0]).toMatchObject({
      type: "hint",
      hintLevel: 2,
      content: "看看数据范围",
    });
  });

  it("changes the level only through the level API", async () => {
    mockedSetLevel.mockResolvedValue({
      questionId: "7",
      hintLevel: 3,
      effectiveLevel: 3,
    });
    const { companion } = setup();
    await flush();

    await companion.changeLevel(3);

    expect(mockedSetLevel).toHaveBeenCalledWith("7", 3);
    expect(companion.currentStep.value?.title).toBe("说方法");
    expect(mockedHint).not.toHaveBeenCalled();
  });

  it("starts a new conversation only when the current one has messages", async () => {
    const { companion } = setup();
    await flush();

    await expect(companion.startConversation()).resolves.toBe(false);
    expect(mockedStart).not.toHaveBeenCalled();

    mockedStream.mockResolvedValue({
      messageId: "23",
      hintLevel: 0,
      contextUsage: session().contextUsage,
      compacted: false,
    });
    await companion.send("先聊一句");
    mockedStart.mockResolvedValue(session({ conversationId: "51" }));

    await expect(companion.startConversation()).resolves.toBe(true);

    expect(mockedStart).toHaveBeenCalledWith("7");
    expect(companion.conversationId.value).toBe("51");
    expect(companion.messages.value).toEqual([]);
  });

  it("deletes a conversation and switches away when it was the current one", async () => {
    const mockedDelete = deleteCompanionConversation as Mock;
    mockedSession.mockResolvedValue(
      session({
        messages: [{ id: "1", role: "user", type: "chat", content: "在吗" }],
      })
    );
    mockedDelete.mockResolvedValue(
      session({ conversationId: "61", messages: [] })
    );
    const { companion } = setup();
    await flush();
    companion.conversations.value = [
      { id: "50", messageCount: 1, active: true },
      { id: "61", messageCount: 3, active: false },
    ];

    await expect(companion.deleteConversation("50")).resolves.toBe(true);

    expect(mockedDelete).toHaveBeenCalledWith("50");
    expect(companion.conversationId.value).toBe("61");
    expect(companion.messages.value).toEqual([]);
    expect(companion.conversations.value.map((item) => item.id)).toEqual([
      "61",
    ]);
    expect(companion.busy.value).toBeNull();

    // 删别的对话：当前这段不动
    mockedDelete.mockResolvedValue(session({ conversationId: "61" }));
    companion.conversations.value = [
      { id: "61", messageCount: 3, active: true },
      { id: "70", messageCount: 2, active: false },
    ];
    await companion.deleteConversation("70");
    expect(companion.conversationId.value).toBe("61");
    expect(companion.conversations.value.map((item) => item.id)).toEqual([
      "61",
    ]);
  });

  it("switches to an earlier conversation and shows its messages", async () => {
    mockedSwitch.mockResolvedValue(
      session({
        conversationId: "49",
        messages: [
          { id: "1", role: "user", type: "chat", content: "上次的问题" },
        ],
      })
    );
    const { companion } = setup();
    await flush();

    await companion.switchConversation("49");

    expect(mockedSwitch).toHaveBeenCalledWith("49");
    expect(companion.conversationId.value).toBe("49");
    expect(companion.messages.value[0].content).toBe("上次的问题");
  });

  it("reacts to a judged submission once and speaks through the bubble", async () => {
    mockedReact.mockResolvedValue({
      messageId: "40",
      submissionId: "100",
      mood: "encouraging",
      moodIntensity: 2,
      conversationId: "50",
      message: "编译过了，进步！",
      fallback: false,
    });
    const { companion } = setup();
    await flush();

    await companion.onJudged({ id: "100", status: 2, tone: "failed" });
    await companion.onJudged({ id: "100", status: 2, tone: "failed" });

    expect(companion.pet.mood).toBe("encouraging");
    expect(companion.pet.intensity).toBe(2);
    expect(companion.pet.bubble).toBe("编译过了，进步！");
    expect(
      companion.messages.value.filter((item) => item.type === "reaction")
    ).toHaveLength(1);
  });

  it("does not insert a reaction recorded in another conversation", async () => {
    mockedReact.mockResolvedValue({
      messageId: "41",
      submissionId: "101",
      mood: "proud",
      moodIntensity: 1,
      conversationId: "49",
      message: "过了！",
      fallback: false,
    });
    const { companion } = setup();
    await flush();

    await companion.onJudged({ id: "101", status: 2, tone: "passed" });

    expect(companion.pet.bubble).toBe("过了！");
    expect(companion.messages.value).toEqual([]);
  });

  it("resets when switching to another question", async () => {
    const { companion, id } = setup();
    await flush();
    companion.openPanel();
    mockedSession.mockResolvedValue(session({ questionId: "8", hintLevel: 3 }));

    id.value = "8";
    await flush();

    expect(mockedSession).toHaveBeenLastCalledWith("8");
    expect(companion.level.value).toBe(3);
    expect(companion.panelOpen.value).toBe(true);
  });
});
