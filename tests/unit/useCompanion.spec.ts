import { ref } from "vue";

import { useCompanion } from "@/composables/useCompanion";
import {
  CompanionApiError,
  CompanionSession,
  getCompanionSession,
  reactToSubmission,
  requestHint,
} from "@/services/companion";
import { streamCompanion } from "@/services/companionStream";
import { ApiId } from "@/services/apiId";

jest.mock("../../generated", () => ({ OpenAPI: { BASE: "/api" } }));
jest.mock("@/services/companionStream", () => ({ streamCompanion: jest.fn() }));
jest.mock("@/services/companion", () => ({
  ...jest.requireActual("@/services/companion"),
  getCompanionSession: jest.fn(),
  listCompanionMessages: jest.fn(),
  reactToSubmission: jest.fn(),
  requestHint: jest.fn(),
  setHintLevel: jest.fn(),
  compactCompanionMemory: jest.fn(),
}));

const mockedSession = getCompanionSession as jest.Mock;
const mockedStream = streamCompanion as jest.Mock;
const mockedReact = reactToSubmission as jest.Mock;
const mockedHint = requestHint as jest.Mock;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const steps = ["自己想", "指个方向", "点出关键", "说出解法", "给出步骤", "看答案"].map(
  (title, level) => ({ level, title, description: title })
);

const session = (overrides: Partial<CompanionSession> = {}): CompanionSession => ({
  questionId: "7",
  hintLevel: 0,
  effectiveLevel: 0,
  hintTrack: "idea",
  hintMode: "guided",
  hintSteps: { idea: steps, bug: steps },
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
    expect(companion.session.value?.personaName).toBe("栗子");
    expect(companion.nextStep.value?.title).toBe("指个方向");

    enabled.value = false;
    await flush();
    expect(companion.session.value).toBeNull();
  });

  it("streams a chat reply and opens the proposed code edit for preview", async () => {
    const proposal = {
      baseHash: "h",
      edits: [
        { kind: "replace", oldText: "int a = 1", newText: "int a = 1;", startLine: 1 },
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
        hintTrack: "bug",
        contextUsage: session().contextUsage,
        compacted: false,
      };
    });
    const { companion, applyCode } = setup();
    await flush();

    await expect(companion.send("帮我看看")).resolves.toBe(true);
    await flush();

    expect(mockedStream.mock.calls[0][1]).toMatchObject({
      questionId: "7",
      message: "帮我看看",
      snapshot: { code, language: "java", cursorLine: 1 },
    });
    expect(companion.messages.value.map((item) => item.content)).toEqual([
      "帮我看看",
      "补上分号了",
    ]);
    expect(companion.session.value?.hintTrack).toBe("bug");
    expect(companion.busy.value).toBeNull();
    expect(companion.preview.value?.resolution.code).toBe("int a = 1;\n");

    expect(companion.applyPreview()).toBe(true);
    expect(applyCode).toHaveBeenCalledWith("int a = 1;\n");
    expect(companion.preview.value).toBeNull();
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

  it("records hints and moves the ladder forward", async () => {
    mockedHint.mockResolvedValue({
      messageId: "30",
      hintLevel: 1,
      hintTrack: "idea",
      stepTitle: "指个方向",
      message: "看看数据范围",
      codeEdits: null,
      contextUsage: session().contextUsage,
    });
    const { companion } = setup();
    await flush();

    await companion.askHint();

    expect(mockedHint).toHaveBeenCalledWith(
      "7",
      expect.objectContaining({ code }),
      undefined
    );
    expect(companion.level.value).toBe(1);
    expect(companion.nextStep.value?.title).toBe("点出关键");
    expect(companion.messages.value[0]).toMatchObject({
      type: "hint",
      content: "看看数据范围",
    });
  });

  it("reacts to a judged submission once and speaks through the bubble", async () => {
    mockedReact.mockResolvedValue({
      messageId: "40",
      submissionId: "100",
      mood: "encouraging",
      moodIntensity: 2,
      hintTrack: "bug",
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
