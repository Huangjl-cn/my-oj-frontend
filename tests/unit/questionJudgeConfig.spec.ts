import { normalizeJudgeConfig } from "@/services/questionJudgeConfig";

describe("normalizeJudgeConfig", () => {
  const fallback = {
    timeLimit: 1000,
    memoryLimit: 2000,
    stackLimit: 3000,
  };

  it("converts Long values serialized as strings", () => {
    expect(
      normalizeJudgeConfig(
        {
          timeLimit: "1500",
          memoryLimit: "4096",
          stackLimit: "512",
        },
        fallback
      )
    ).toEqual({
      timeLimit: 1500,
      memoryLimit: 4096,
      stackLimit: 512,
    });
  });

  it("supports JSON string responses and falls back invalid fields", () => {
    expect(
      normalizeJudgeConfig(
        '{"timeLimit":"2000","memoryLimit":"invalid"}',
        fallback
      )
    ).toEqual({
      timeLimit: 2000,
      memoryLimit: 2000,
      stackLimit: 3000,
    });
  });
});
