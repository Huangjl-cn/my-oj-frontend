import { ref } from "vue";

import { useCompanion } from "@/composables/useCompanion";
import {
  CompanionApiError,
  CompanionSession,
  getCompanionSession,
  reactToSubmission,
  requestHint,
  setHintLevel,
  startCompanionConversation,
  switchCompanionConversation,
} from "@/services/companion";
import { streamCompanion } from "@/services/companionStream";
import { ApiId } from "@/services/apiId";

jest.mock("../../generated", () => ({ OpenAPI: { BASE: "/api" } }));
jest.mock("@/services/companionStream", () => ({ streamCompanion: jest.fn() }));
jest.mock("@/services/companion", () => ({
  ...jest.requireActual("@/services/companion"),
  getCompanionSession: jest.fn(),
  listCompanionMessages: jest.fn(),
  listCompanionConversations: jest.fn(),
  startCompanionConversation: jest.fn(),
  switchCompanionConversation: jest.fn(),
  reactToSubmission: jest.fn(),
  requestHint: jest.fn(),
  setHintLevel: jest.fn(),
  compactCompanionMemory: jest.fn(),
}));

const mockedSession = getCompanionSession as jest.Mock;
const mockedStream = streamCompanion as jest.Mock;
const mockedReact = reactToSubmission as jest.Mock;
const mockedHint = requestHint as jest.Mock;
const mockedSetLevel = setHintLevel as jest.Mock;
const mockedStart = startCompanionConversation as jest.Mock;
const mockedSwitch = switchCompanionConversation as jest.Mock;

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
  const applyCode = jest.fn().mockReturnValue(true);
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
    jest.resetAllMocks();
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
