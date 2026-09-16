import { QuestionSubmitVO } from "../../generated";
import {
  isJudging,
  QuestionSubmitRequest,
  requestQuestionSubmit,
  QuestionSubmitQueueStatus,
  QuestionSubmitQueueStatusRequest,
} from "@/services/questionSubmit";
import { ApiId } from "@/services/apiId";

export const QUESTION_SUBMIT_POLL_INTERVAL = 3000;
export const QUESTION_SUBMIT_POLL_TIMEOUT = 75000;

type PollerOptions = {
  onUpdate: (submission: QuestionSubmitVO) => void;
  onTimeout?: () => void;
  onError?: (error: unknown) => void;
  request?: (submitId: ApiId) => QuestionSubmitRequest;
  queueRequest?: (submitId: ApiId) => QuestionSubmitQueueStatusRequest;
  onQueueUpdate?: (queueStatus: QuestionSubmitQueueStatus) => void;
  interval?: number;
  /** Set to null for queue-backed submissions that should wait until a terminal status. */
  timeout?: number | null;
};

export const createQuestionSubmitPoller = (options: PollerOptions) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let activeRequest: QuestionSubmitRequest | undefined;
  let activeQueueRequest: QuestionSubmitQueueStatusRequest | undefined;
  let generation = 0;

  const stop = () => {
    generation += 1;
    if (timer) clearTimeout(timer);
    timer = undefined;
    activeRequest?.cancel();
    activeRequest = undefined;
    activeQueueRequest?.cancel();
    activeQueueRequest = undefined;
  };

  const start = (submitId: ApiId) => {
    stop();
    const currentGeneration = generation;
    const startedAt = Date.now();
    const interval = options.interval ?? QUESTION_SUBMIT_POLL_INTERVAL;
    const timeout =
      options.timeout === undefined
        ? QUESTION_SUBMIT_POLL_TIMEOUT
        : options.timeout;
    const makeRequest = options.request ?? requestQuestionSubmit;
    const makeQueueRequest = options.queueRequest;
    let queuePollingActive = Boolean(makeQueueRequest);

    const poll = async () => {
      if (currentGeneration !== generation) return;
      if (timeout != null && Date.now() - startedAt >= timeout) {
        stop();
        options.onTimeout?.();
        return;
      }

      if (queuePollingActive && makeQueueRequest) {
        activeQueueRequest = makeQueueRequest(submitId);
        try {
          const queueStatus = await activeQueueRequest.promise;
          if (currentGeneration !== generation) return;
          activeQueueRequest = undefined;

          if (queueStatus) {
            options.onQueueUpdate?.(queueStatus);
            if (isJudging(queueStatus.status)) {
              timer = setTimeout(poll, interval);
              return;
            }
            queuePollingActive = false;
          }
        } catch {
          if (currentGeneration !== generation) return;
          activeQueueRequest = undefined;
          // Fall back to the existing detail request so transient queue API
          // failures do not interrupt the result flow.
        }
      }

      activeRequest = makeRequest(submitId);
      try {
        const submission = await activeRequest.promise;
        if (currentGeneration !== generation) return;
        activeRequest = undefined;

        if (!submission) {
          stop();
          return;
        }

        options.onUpdate(submission);
        if (!isJudging(submission.status)) {
          stop();
          return;
        }
      } catch (error) {
        if (currentGeneration !== generation) return;
        activeRequest = undefined;
        options.onError?.(error);
      }

      if (currentGeneration === generation) {
        timer = setTimeout(poll, interval);
      }
    };

    void poll();
  };

  return { start, stop };
};
