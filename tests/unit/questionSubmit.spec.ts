import {
  formatJudgeMemory,
  getJudgeResultPresentation,
  isJudging,
  normalizeJudgeInfo,
  normalizeQuestionSubmit,
  splitJudgeMessage,
} from "@/services/questionSubmit";

describe("question submit adaptation", () => {
  it("normalizes a JSON judgeInfo string without losing multiline content", () => {
    const message =
      "Wrong Answer\n用例: 1\n输入:\n1 2\n预期输出:\n3\n实际输出:\n4";
    const submission = normalizeQuestionSubmit({
      status: 2,
      judgeInfo: JSON.stringify({ message, time: 12, memory: 256 }),
    });

    expect(submission?.judgeInfo).toEqual({ message, time: 12, memory: 256 });
  });

  it("keeps raw diagnostics as plain message text when they are not JSON", () => {
    const diagnostic =
      'Runtime Error\n<img src=x onerror="alert(1)">\nat Main.main(Main.java:10)';

    expect(normalizeJudgeInfo(diagnostic)).toEqual({ message: diagnostic });
  });

  it.each([
    [{ status: 2, judgeInfo: { message: "Accepted" } }, "通过", "passed"],
    [
      { status: 2, judgeInfo: { message: "Wrong Answer\n用例: 1" } },
      "未通过",
      "failed",
    ],
    [
      { status: 2, judgeInfo: { message: "Runtime Error\nstack trace" } },
      "未通过",
      "failed",
    ],
    [
      { status: 2, judgeInfo: { message: "Compile Error\nMain.java:10" } },
      "未通过",
      "failed",
    ],
    [{ status: 3 }, "判题失败", "failed"],
  ])(
    "maps %p to %s instead of inferring success from status",
    (input, label, tone) => {
      expect(getJudgeResultPresentation(input)).toMatchObject({ label, tone });
    }
  );

  it("continues judging only for task statuses 0 and 1", () => {
    expect([0, 1, 2, 3, 4, undefined].filter(isJudging)).toEqual([0, 1]);
  });

  it.each([
    [22560, "22.03 MB"],
    [256, "0.25 MB"],
    [0, "0.00 MB"],
    [undefined, "--"],
  ])("formats %p KB as %s", (memory, expected) => {
    expect(formatJudgeMemory(memory)).toBe(expected);
  });

  it("separates the diagnostic heading without changing the remaining text", () => {
    const message =
      'Runtime Error\nExecution timed out after 8000 ms\n<img onerror="alert(1)">';

    expect(splitJudgeMessage(message)).toEqual({
      title: "Runtime Error",
      details: 'Execution timed out after 8000 ms\n<img onerror="alert(1)">',
    });
  });
});
