import {
  buildStarterCodeList,
  normalizeLanguageOptions,
  normalizeStarterCodeList,
  StarterCodeServiceError,
} from "@/services/questionStarterCode";

const languages = normalizeLanguageOptions([
  { text: "Java 25", value: "java" },
  { text: "C++ 17", value: "cpp" },
]);

describe("question starter code adaptation", () => {
  it("keeps display text separate from the backend language value", () => {
    expect(languages).toEqual([
      { text: "Java 25", value: "java" },
      { text: "C++ 17", value: "cpp" },
    ]);
  });

  it("maps an unordered response by language value", () => {
    expect(
      normalizeStarterCodeList(
        [
          { language: "cpp", starterCode: "cpp code" },
          { language: "java", starterCode: "java code" },
        ],
        languages
      )
    ).toEqual({ java: "java code", cpp: "cpp code" });
  });

  it.each([
    [[{ language: "java", starterCode: "code" }], "缺少：cpp"],
    [
      [
        { language: "java", starterCode: "one" },
        { language: "java", starterCode: "two" },
      ],
      "语言重复",
    ],
    [[{ language: "rust", starterCode: "code" }], "未支持的语言"],
  ])("rejects invalid template configuration", (templates, message) => {
    expect(() => normalizeStarterCodeList(templates, languages)).toThrow(
      message
    );
  });

  it("builds a complete save request using language values", () => {
    expect(buildStarterCodeList({ java: "java code" }, languages)).toEqual([
      { language: "java", starterCode: "java code" },
      { language: "cpp", starterCode: "" },
    ]);
  });

  it("rejects duplicate language values from the backend", () => {
    expect(() =>
      normalizeLanguageOptions([
        { text: "Java", value: "java" },
        { text: "Another Java", value: "java" },
      ])
    ).toThrow(StarterCodeServiceError);
  });
});
