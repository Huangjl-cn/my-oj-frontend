import {
  JudgeInfo,
  QuestionControllerService,
  QuestionSubmitQueryRequest,
  QuestionSubmitSummaryVO,
  QuestionSubmitVO,
} from "../../generated";
import { CancelablePromise } from "../../generated/core/CancelablePromise";
import { ApiId, toGeneratedApiId } from "@/services/apiId";

type CompatibleQuestionSubmit = Omit<QuestionSubmitVO, "judgeInfo"> & {
  judgeInfo?: JudgeInfo | string | null;
};

export type QuestionSubmitRequest = {
  promise: Promise<QuestionSubmitVO | undefined>;
  cancel: () => void;
};

export const QUESTION_SUBMIT_REQUEST_TIMEOUT = 10000;

export const normalizeJudgeInfo = (
  judgeInfo?: JudgeInfo | string | null
): JudgeInfo | undefined => {
  if (typeof judgeInfo !== "string") return judgeInfo ?? undefined;

  try {
    const parsed = JSON.parse(judgeInfo);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as JudgeInfo;
    }
  } catch {
    // Some compatible backends return the diagnostic itself instead of JSON.
  }

  return { message: judgeInfo };
};

export function normalizeQuestionSubmit(
  submission: CompatibleQuestionSubmit
): QuestionSubmitVO;
export function normalizeQuestionSubmit(
  submission?: CompatibleQuestionSubmit
): QuestionSubmitVO | undefined;
export function normalizeQuestionSubmit(
  submission?: CompatibleQuestionSubmit
): QuestionSubmitVO | undefined {
  if (!submission) return undefined;
  return {
    ...submission,
    judgeInfo: normalizeJudgeInfo(submission.judgeInfo),
  };
}

export const listQuestionSubmissions = async (
  query: QuestionSubmitQueryRequest
) => {
  const response = await QuestionControllerService.listQuestionSubmitByPage(
    query
  );
  if (response.data?.records) {
    response.data = {
      ...response.data,
      records: response.data.records.map(
        (submission: CompatibleQuestionSubmit) =>
          normalizeQuestionSubmit(submission)
      ),
    };
  }
  return response;
};

export const listMyQuestionSubmissions = async (
  query: Pick<QuestionSubmitQueryRequest, "questionId" | "current" | "pageSize">
) => {
  const response = await QuestionControllerService.listMyQuestionSubmitByPage(
    query
  );
  if (response.data?.records) {
    response.data = {
      ...response.data,
      records: response.data.records.map((submission) => ({
        ...submission,
        judgeInfo: normalizeJudgeInfo(submission.judgeInfo),
      })),
    };
  }
  return response;
};

type CompatibleQuestionSubmitResponse = {
  code?: number;
  data?: CompatibleQuestionSubmit;
  message?: string;
};

const createQuestionSubmitRequest = (
  request: CancelablePromise<CompatibleQuestionSubmitResponse>,
  timeout: number
): QuestionSubmitRequest => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  const promise = new Promise<QuestionSubmitVO | undefined>(
    (resolve, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        request.cancel();
      }, timeout);

      request
        .then((response) => {
          if (response.code !== 0) {
            reject(new Error(response.message || "查询判题结果失败"));
            return;
          }
          resolve(normalizeQuestionSubmit(response.data));
        })
        .catch((error) => {
          reject(timedOut ? new Error("查询判题结果超时") : error);
        })
        .finally(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });
    }
  );

  return {
    promise,
    cancel: () => {
      if (timeoutId) clearTimeout(timeoutId);
      request.cancel();
    },
  };
};

export const requestQuestionSubmit = (
  submitId: ApiId,
  timeout = QUESTION_SUBMIT_REQUEST_TIMEOUT
): QuestionSubmitRequest => {
  const request = QuestionControllerService.getQuestionSubmitById(
    toGeneratedApiId(submitId)
  );
  return createQuestionSubmitRequest(
    request as CancelablePromise<CompatibleQuestionSubmitResponse>,
    timeout
  );
};

export const requestMyQuestionSubmit = (
  submitId: ApiId,
  timeout = QUESTION_SUBMIT_REQUEST_TIMEOUT
): QuestionSubmitRequest => {
  const request = QuestionControllerService.getMyQuestionSubmitById(
    toGeneratedApiId(submitId)
  );
  return createQuestionSubmitRequest(
    request as CancelablePromise<CompatibleQuestionSubmitResponse>,
    timeout
  );
};

export const isJudging = (status?: number) => status === 0 || status === 1;

export const formatJudgeMemory = (memory?: number) =>
  memory == null ? "--" : `${(memory / 1024).toFixed(2)} MB`;

export const splitJudgeMessage = (message?: string) => {
  if (!message) return { title: "", details: "" };
  const [title, ...detailLines] = message.split(/\r?\n/);
  return { title, details: detailLines.join("\n") };
};

export type JudgeResultTone = "pending" | "passed" | "failed";

export const getJudgeResultPresentation = (
  submission?: Pick<QuestionSubmitSummaryVO, "status" | "judgeInfo">
) => {
  const status = submission?.status;
  const judgeMessage = submission?.judgeInfo?.message || "";

  if (status === 0 || status === undefined) {
    return { label: "等待中", message: judgeMessage, tone: "pending" as const };
  }
  if (status === 1) {
    return { label: "判题中", message: judgeMessage, tone: "pending" as const };
  }
  if (status === 2 && judgeMessage === "Accepted") {
    return { label: "通过", message: judgeMessage, tone: "passed" as const };
  }
  if (status === 2) {
    return { label: "未通过", message: judgeMessage, tone: "failed" as const };
  }
  if (status === 3) {
    return {
      label: "判题失败",
      message: judgeMessage,
      tone: "failed" as const,
    };
  }
  return { label: "未知状态", message: judgeMessage, tone: "failed" as const };
};
