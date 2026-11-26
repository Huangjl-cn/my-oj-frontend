import type { Mock } from "vitest";
import { ref } from "vue";

import { useProblemEditor } from "@/composables/problem/useProblemEditor";
import { getQuestionDraft, saveQuestionDraft } from "@/services/questionDraft";
import {
  clearQuestionStarterCodeCache,
  getQuestionStarterCode,
  getSupportedLanguageOptions,
} from "@/services/questionStarterCode";

vi.mock("@arco-design/web-vue/es/message", () => ({
  default: { error: vi.fn() },
}));
vi.mock("../../generated", () => ({}));
vi.mock("@/services/questionStarterCode", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/questionStarterCode")>()),
  getQuestionStarterCode: vi.fn(),
  getSupportedLanguageOptions: vi.fn(),
}));

const mockedStarter = getQuestionStarterCode as Mock;
const mockedLanguages = getSupportedLanguageOptions as Mock;
const key = (language: string) => ({
  userId: "7",
  questionId: "100",
  language,
});

const setup = async () => {
  const editor = useProblemEditor({
    questionId: ref("100"),
    userKey: () => "7",
  });
  await editor.loadLanguageOptions();
  return editor;
};

describe("problem editor", () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    clearQuestionStarterCodeCache("100");
    mockedLanguages.mockResolvedValue([
      { text: "Java", value: "java" },
      { text: "C++", value: "cpp" },
    ]);
    mockedStarter.mockImplementation(
      async (_id: string, language: string) => `// ${language} template`
    );
  });

  it("prefers the requested language, then the last one, then the first", async () => {
    const editor = await setup();
    expect(editor.pickLanguage("cpp", "java")).toBe("cpp");
    expect(editor.pickLanguage("ruby", "java")).toBe("java");
    expect(editor.pickLanguage(undefined, undefined)).toBe("java");
  });

  it("restores a saved draft instead of the template", async () => {
    saveQuestionDraft(key("java"), "int answer = 42;");
    const editor = await setup();

    await editor.activateLanguage("java");

    expect(editor.code.value).toBe("int answer = 42;");
    expect(editor.draftSaved.value).toBe(true);
    expect(editor.ready.value).toBe(true);
  });

  it("saves the draft 300ms after typing and drops it when back to the template", async () => {
    vi.useFakeTimers();
    const editor = await setup();
    await editor.activateLanguage("java");

    editor.changeCode("edited");
    expect(getQuestionDraft(key("java"))).toBeUndefined();
    vi.advanceTimersByTime(300);
    expect(getQuestionDraft(key("java"))).toBe("edited");

    editor.changeCode("// java template");
    vi.advanceTimersByTime(300);
    expect(getQuestionDraft(key("java"))).toBeUndefined();
  });

  it("keeps each language's draft when switching", async () => {
    const editor = await setup();
    await editor.activateLanguage("java");
    editor.changeCode("java draft");

    editor.changeLanguage("cpp");
    await Promise.resolve();
    await Promise.resolve();

    expect(getQuestionDraft(key("java"))).toBe("java draft");
    expect(editor.language.value).toBe("cpp");
  });

  it("does not wipe a draft when the template fails to load", async () => {
    saveQuestionDraft(key("java"), "precious");
    mockedStarter.mockRejectedValueOnce(new Error("boom"));
    const editor = await setup();

    await editor.activateLanguage("java");
    editor.persistDraft();

    expect(editor.templateError.value).toBe("boom");
    expect(getQuestionDraft(key("java"))).toBe("precious");
  });

  it("reset puts the template back and removes the draft", async () => {
    saveQuestionDraft(key("java"), "old work");
    const editor = await setup();
    await editor.activateLanguage("java");

    editor.resetToTemplate();

    expect(editor.code.value).toBe("// java template");
    expect(getQuestionDraft(key("java"))).toBeUndefined();
  });
});
