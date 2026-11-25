import {
  formatAcceptanceRate,
  getQuestionProgressState,
} from "@/services/questionProgress";

jest.mock("@/services/questionSubmit", () => ({
  getJudgeResultPresentation: jest.fn((submission) => {
    if (submission?.status === 0 || submission?.status === 1) {
      return { tone: "pending" };
    }
    if (
      submission?.status === 2 &&
      submission?.judgeInfo?.message === "Accepted"
    ) {
      return { tone: "passed" };
    }
    return { tone: "failed" };
  }),
}));

describe("question progress", () => {
  it.each([
    [undefined, "unattempted"],
    [{ status: 0 }, "judging"],
    [{ status: 1 }, "judging"],
    [{ status: 2, judgeInfo: { message: "Accepted" } }, "passed"],
    [{ status: 2, judgeInfo: { message: "Wrong Answer" } }, "failed"],
    [{ status: 3 }, "failed"],
  ])("maps the latest submission %p to %s", (submission, expected) => {
    expect(getQuestionProgressState(submission)).toBe(expected);
  });

  it.each([
    [0, 0, "0%"],
    [1, 3, "33.3%"],
    [2, 4, "50%"],
  ])("formats %p accepted from %p submissions", (accepted, total, expected) => {
    expect(formatAcceptanceRate(accepted, total)).toBe(expected);
  });
});
