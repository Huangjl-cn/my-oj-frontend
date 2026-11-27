import message from "@arco-design/web-vue/es/message";
import { computed, ref } from "vue";

import { ApiId } from "@/services/apiId";
import {
  getJudgeResultPresentation,
  getQuestionSubmitRank,
  getSubmissionRankPercent,
  isJudging,
  QuestionSubmitQueueStatus,
  requestQuestionSubmitQueueStatus,
  splitJudgeMessage,
} from "@/services/questionSubmit";
import { createQuestionSubmitPoller } from "@/services/questionSubmitPolling";
import {
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionSubmitRankVO,
  QuestionSubmitSummaryVO,
  QuestionSubmitVO,
} from "../../../generated";

type Submission = QuestionSubmitVO | QuestionSubmitSummaryVO;

/**
 * 提交和判题：提交代码、按队列状态轮询、判完取同语言排名。
 * 结果显示在编辑器底部的判题结果条里。
 */
export const useJudge = (options: {
  /** 每次状态变化（包括刚提交、判题中、判完） */
  onUpdate?: (submission: Submission) => void;
  /** 判完（通过、没通过、判题失败） */
  onFinished?: (submission: Submission) => void;
}) => {
  const result = ref<Submission | null>(null);
  const visible = ref(false);
  const submitting = ref(false);
  const queueStatus = ref<QuestionSubmitQueueStatus | null>(null);
  const detailsOpen = ref(true);
  const rank = ref<QuestionSubmitRankVO>();
  let rankRequest = 0;

  const presentation = computed(() => {
    const base = getJudgeResultPresentation(result.value ?? undefined);
    if (base.tone !== "pending" || !submitting.value) return base;
    if (queueStatus.value?.status === 0) return { ...base, label: "排队中" };
    if (queueStatus.value?.status === 1) return { ...base, label: "判题中" };
    return base;
  });
  const messageParts = computed(() =>
    splitJudgeMessage(presentation.value.message)
  );
  const queueAhead = computed(() => {
    const count = Number(queueStatus.value?.aheadCount);
    return Number.isFinite(count) && count >= 0 ? count : 0;
  });
  const timeBeatPercent = computed(() =>
    getSubmissionRankPercent(rank.value?.timeBeaten, rank.value?.timeTotal)
  );
  const memoryBeatPercent = computed(() =>
    getSubmissionRankPercent(rank.value?.memoryBeaten, rank.value?.memoryTotal)
  );

  const loadRank = async (submitId?: ApiId) => {
    const current = ++rankRequest;
    rank.value = undefined;
    if (submitId == null) return;
    try {
      const value = await getQuestionSubmitRank(submitId);
      if (current === rankRequest) rank.value = value;
    } catch {
      // 排名只是附加信息，取不到就不显示
    }
  };

  const poller = createQuestionSubmitPoller({
    queueRequest: requestQuestionSubmitQueueStatus,
    // 排队可能比较久，交给队列接口的终态来结束轮询
    timeout: null,
    onQueueUpdate: (status) => {
      queueStatus.value = status;
    },
    onUpdate: (submission) => {
      result.value = submission;
      options.onUpdate?.(submission);
      if (isJudging(submission.status)) return;
      submitting.value = false;
      detailsOpen.value = true;
      if (getJudgeResultPresentation(submission).tone === "passed") {
        void loadRank(submission.id);
      }
      options.onFinished?.(submission);
    },
    onTimeout: () => {
      submitting.value = false;
      message.warning("判题太久了，稍后到提交记录看结果");
    },
    onError: () => undefined,
  });

  const stop = () => {
    poller.stop();
    submitting.value = false;
    queueStatus.value = null;
  };

  /** 换题时清空 */
  const reset = () => {
    stop();
    rankRequest += 1;
    rank.value = undefined;
    result.value = null;
    visible.value = false;
    detailsOpen.value = true;
  };

  const startWatching = (submission: Submission) => {
    if (submission.id == null) return;
    visible.value = true;
    detailsOpen.value = true;
    result.value = submission;
    submitting.value = true;
    queueStatus.value = null;
    rankRequest += 1;
    rank.value = undefined;
    poller.start(submission.id);
  };

  const submit = async (request: QuestionSubmitAddRequest) => {
    if (submitting.value) return false;
    stop();
    submitting.value = true;
    try {
      const response = await QuestionControllerService.doQuestionSubmit(
        request
      );
      if (response.code !== 0) {
        submitting.value = false;
        message.error(`提交失败，${response.message || "请稍后重试"}`);
        return false;
      }
      const submission: Submission = { id: response.data, status: 0 };
      startWatching(submission);
      options.onUpdate?.(submission);
      return true;
    } catch {
      submitting.value = false;
      message.error("提交失败，请稍后重试");
      return false;
    }
  };

  /** 打开题目时如果有还在判的提交，接着看它的结果 */
  const resume = (submission: Submission) => {
    if (!isJudging(submission.status) || submitting.value) return;
    startWatching(submission);
  };

  const toggleDetails = () => {
    detailsOpen.value = !detailsOpen.value;
  };

  /** 收起判题结果条（判题中不能收） */
  const hide = () => {
    if (!submitting.value) visible.value = false;
  };

  return {
    result,
    visible,
    submitting,
    queueStatus,
    queueAhead,
    detailsOpen,
    presentation,
    messageParts,
    rank,
    timeBeatPercent,
    memoryBeatPercent,
    submit,
    resume,
    stop,
    reset,
    toggleDetails,
    hide,
  };
};

export type Judge = ReturnType<typeof useJudge>;
