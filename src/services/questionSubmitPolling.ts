import { QuestionSubmitVO } from "../../generated";
import {
  isJudging,
  QuestionSubmitRequest,
  requestQuestionSubmit,
} from "@/services/questionSubmit";
import { ApiId } from "@/services/apiId";

export const QUESTION_SUBMIT_POLL_INTERVAL = 3000;
export const QUESTION_SUBMIT_POLL_TIMEOUT = 75000;

type PollerOptions = {
  onUpdate: (submission: QuestionSubmitVO) => void;
  onTimeout?: () => void;
  onError?: (error: unknown) => void;
  request?: (submitId: ApiId) => QuestionSubmitRequest;
  interval?: number;
  timeout?: number;
};

export const createQuestionSubmitPoller = (options: PollerOptions) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let activeRequest: QuestionSubmitRequest | undefined;
  let generation = 0;

  const stop = () => {
    generation += 1;
    if (timer) clearTimeout(timer);
    timer = undefined;
    activeRequest?.cancel();
    activeRequest = undefined;
  };

  const start = (submitId: ApiId) => {
    stop();
    const currentGeneration = generation;
    const startedAt = Date.now();
    const interval = options.interval ?? QUESTION_SUBMIT_POLL_INTERVAL;
    const timeout = options.timeout ?? QUESTION_SUBMIT_POLL_TIMEOUT;
    const makeRequest = options.request ?? requestQuestionSubmit;

    const poll = async () => {
      if (currentGeneration !== generation) return;
      if (Date.now() - startedAt >= timeout) {
        stop();
        options.onTimeout?.();
        return;
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
