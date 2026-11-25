import type { QuestionSubmitSummaryVO } from "../../generated";

import { getJudgeResultPresentation } from "@/services/questionSubmit";

export type QuestionProgressState =
  | "unattempted"
  | "judging"
  | "passed"
  | "failed";

/** 一次提交对应的做题状态；整个题库的进度用 useMyProgress 一次取全 */
export const getQuestionProgressState = (
  submission?: Pick<QuestionSubmitSummaryVO, "status" | "judgeInfo">
): QuestionProgressState => {
  if (!submission) return "unattempted";
  const tone = getJudgeResultPresentation(submission).tone;
  if (tone === "pending") return "judging";
  return tone === "passed" ? "passed" : "failed";
};

export const formatAcceptanceRate = (accepted?: number, submitted?: number) => {
  if (!submitted || submitted <= 0) return "0%";
  const percentage = (Math.max(0, accepted ?? 0) / submitted) * 100;
  const rounded = Math.min(100, Math.round(percentage * 10) / 10);
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
};
