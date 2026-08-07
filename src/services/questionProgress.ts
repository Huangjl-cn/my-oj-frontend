import type { QuestionSubmitSummaryVO } from "../../generated";

import { ApiId, toGeneratedApiId } from "@/services/apiId";
import {
  getJudgeResultPresentation,
  listMyQuestionSubmissions,
} from "@/services/questionSubmit";

export type QuestionProgressState =
  | "unattempted"
  | "judging"
  | "passed"
  | "failed";

const progressCache = new Map<string, Promise<QuestionProgressState>>();

const createCacheKey = (userId: ApiId, questionId: ApiId) =>
  `${userId}:${questionId}`;

export const getQuestionProgressState = (
  submission?: Pick<QuestionSubmitSummaryVO, "status" | "judgeInfo">
): QuestionProgressState => {
  if (!submission) return "unattempted";
  const tone = getJudgeResultPresentation(submission).tone;
  if (tone === "pending") return "judging";
  return tone === "passed" ? "passed" : "failed";
};

export const getMyQuestionProgress = (userId: ApiId, questionId: ApiId) => {
  const cacheKey = createCacheKey(userId, questionId);
  const cached = progressCache.get(cacheKey);
  if (cached) return cached;

  const request = listMyQuestionSubmissions({
    questionId: toGeneratedApiId(questionId),
    current: 1,
    pageSize: 1,
  })
    .then((response) => {
      if (response.code !== 0) {
        throw new Error(response.message || "加载题目进度失败");
      }
      return getQuestionProgressState(response.data?.records?.[0]);
    })
    .catch((error) => {
      progressCache.delete(cacheKey);
      throw error;
    });

  progressCache.set(cacheKey, request);
  return request;
};

export const setMyQuestionProgress = (
  userId: ApiId,
  questionId: ApiId,
  submission: Pick<QuestionSubmitSummaryVO, "status" | "judgeInfo">
) => {
  progressCache.set(
    createCacheKey(userId, questionId),
    Promise.resolve(getQuestionProgressState(submission))
  );
};

export const formatAcceptanceRate = (accepted?: number, submitted?: number) => {
  if (!submitted || submitted <= 0) return "0%";
  const percentage = (Math.max(0, accepted ?? 0) / submitted) * 100;
  const rounded = Math.min(100, Math.round(percentage * 10) / 10);
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
};
