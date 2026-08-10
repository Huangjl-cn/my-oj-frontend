import {
  clearQuestionDraftsForQuestion,
  clearQuestionDraftsForUser,
  getQuestionDraft,
  removeQuestionDraft,
  saveQuestionDraft,
} from "@/services/questionDraft";

describe("question draft session cache", () => {
  beforeEach(() => sessionStorage.clear());

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
});
