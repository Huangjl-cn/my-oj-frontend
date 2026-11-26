import {
  clearQuestionDraftsForQuestion,
  clearQuestionDraftsForUser,
  getLatestQuestionDraft,
  getQuestionDraft,
  removeQuestionDraft,
  saveQuestionDraft,
  sweepExpiredQuestionDrafts,
} from "@/services/questionDraft";

const DRAFT_PREFIX = "myoj:question-draft";
const createStorageKey = (key: {
  userId: string;
  questionId: string;
  language: string;
}) =>
  `${DRAFT_PREFIX}:${[key.userId, key.questionId, key.language]
    .map((part) => encodeURIComponent(part))
    .join(":")}`;

describe("question draft local cache", () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("separates drafts by user, question and language", () => {
    const javaKey = { userId: "7", questionId: "42", language: "java" };
    const pythonKey = { ...javaKey, language: "python" };

    saveQuestionDraft(javaKey, "java draft");
    saveQuestionDraft(pythonKey, "python draft");

    expect(getQuestionDraft(javaKey)).toBe("java draft");
    expect(getQuestionDraft(pythonKey)).toBe("python draft");
    removeQuestionDraft(javaKey);
    expect(getQuestionDraft(javaKey)).toBeUndefined();
  });

  it("clears only the selected user's drafts when the session changes", () => {
    const firstUser = { userId: "7", questionId: "42", language: "java" };
    const secondUser = { userId: "8", questionId: "42", language: "java" };
    saveQuestionDraft(firstUser, "first");
    saveQuestionDraft(secondUser, "second");

    clearQuestionDraftsForUser("7");

    expect(getQuestionDraft(firstUser)).toBeUndefined();
    expect(getQuestionDraft(secondUser)).toBe("second");
  });

  it("clears every language draft for the selected question", () => {
    const firstLanguage = { userId: "7", questionId: "42", language: "java" };
    const secondLanguage = {
      ...firstLanguage,
      language: "python",
    };
    const otherQuestion = { ...firstLanguage, questionId: "43" };
    saveQuestionDraft(firstLanguage, "java");
    saveQuestionDraft(secondLanguage, "python");
    saveQuestionDraft(otherQuestion, "other");

    clearQuestionDraftsForQuestion("42");

    expect(getQuestionDraft(firstLanguage)).toBeUndefined();
    expect(getQuestionDraft(secondLanguage)).toBeUndefined();
    expect(getQuestionDraft(otherQuestion)).toBe("other");
  });

  it("expires drafts older than 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const key = { userId: "7", questionId: "42", language: "java" };
    saveQuestionDraft(key, "stale draft");

    vi.setSystemTime(new Date("2026-01-08T00:00:01.000Z"));

    // 纯读：getter 不再顺手删除，过期清理由 sweepExpiredQuestionDrafts 负责
    expect(getQuestionDraft(key)).toBeUndefined();
    expect(localStorage.getItem(createStorageKey(key))).not.toBeNull();

    sweepExpiredQuestionDrafts();
    expect(localStorage.getItem(createStorageKey(key))).toBeNull();
  });

  it("sweepExpiredQuestionDrafts removes expired drafts and keeps fresh ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const staleKey = { userId: "7", questionId: "42", language: "java" };
    const freshKey = { userId: "7", questionId: "43", language: "java" };
    saveQuestionDraft(staleKey, "stale");
    saveQuestionDraft(freshKey, "fresh");

    vi.setSystemTime(new Date("2026-01-05T00:00:00.000Z"));
    saveQuestionDraft(freshKey, "fresh");

    vi.setSystemTime(new Date("2026-01-08T00:00:01.000Z"));
    sweepExpiredQuestionDrafts();

    expect(getQuestionDraft(staleKey)).toBeUndefined();
    expect(getQuestionDraft(freshKey)).toBe("fresh");
  });

  it("ignores legacy sessionStorage entries — localStorage is the single source", () => {
    const key = { userId: "7", questionId: "42", language: "java" };
    const storageKey = createStorageKey(key);
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ code: "legacy draft", updatedAt: Date.now() })
    );

    sweepExpiredQuestionDrafts();

    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(getQuestionDraft(key)).toBeUndefined();
  });

  it("finds the user's most recently saved draft", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-11-25T10:00:00Z"));
    saveQuestionDraft(
      { userId: "1", questionId: "100", language: "java" },
      "a"
    );
    vi.setSystemTime(new Date("2026-11-25T10:05:00Z"));
    saveQuestionDraft({ userId: "1", questionId: "200", language: "cpp" }, "b");
    vi.setSystemTime(new Date("2026-11-25T10:09:00Z"));
    saveQuestionDraft({ userId: "2", questionId: "300", language: "go" }, "c");

    expect(getLatestQuestionDraft("1")).toEqual({
      questionId: "200",
      language: "cpp",
      updatedAt: new Date("2026-11-25T10:05:00Z").getTime(),
    });
    expect(getLatestQuestionDraft("3")).toBeUndefined();
  });
});
