import { computed, ref, Ref } from "vue";

import { ApiId, toGeneratedApiId } from "@/services/apiId";
import {
  getJudgeResultPresentation,
  getQuestionSubmitRank,
  isJudging,
  listMyQuestionSubmissions,
  requestMyQuestionSubmit,
} from "@/services/questionSubmit";
import { createQuestionSubmitPoller } from "@/services/questionSubmitPolling";
import {
  QuestionSubmitRankVO,
  QuestionSubmitSummaryVO,
  QuestionSubmitVO,
} from "../../../generated";

export type SubmissionTabKey = `submission:${string}`;

export type SubmissionTab = {
  key: SubmissionTabKey;
  id: ApiId;
  label: string;
  detail: QuestionSubmitVO | null;
  loading: boolean;
  error: string;
  rank?: QuestionSubmitRankVO;
  rankLoading: boolean;
  rankError: string;
};

const PAGE_SIZE = 10;

/**
 * 做题页左边「我的提交」：分页列表，点开一条在新标签里看详情（还在判的会接着轮询）。
 */
export const useMySubmissions = (options: {
  questionId: Ref<ApiId | null>;
}) => {
  const items = ref<QuestionSubmitSummaryVO[]>([]);
  const page = ref(1);
  const total = ref(0);
  const loading = ref(false);
  const error = ref("");
  const tabs = ref<SubmissionTab[]>([]);
  const pollers = new Map<
    string,
    ReturnType<typeof createQuestionSubmitPoller>
  >();

  /** 取一页提交记录；返回这一页，取不到时返回空数组 */
  const load = async (): Promise<QuestionSubmitSummaryVO[]> => {
    const questionId = options.questionId.value;
    if (questionId == null) return [];
    loading.value = true;
    error.value = "";
    try {
      const response = await listMyQuestionSubmissions({
        questionId: toGeneratedApiId(questionId),
        current: page.value,
        pageSize: PAGE_SIZE,
      });
      if (String(options.questionId.value) !== String(questionId)) return [];
      if (response.code !== 0) {
        throw new Error(response.message || "加载提交记录失败");
      }
      items.value = response.data?.records ?? [];
      total.value = Number(response.data?.total ?? 0);
      return items.value;
    } catch (cause) {
      if (String(options.questionId.value) !== String(questionId)) return [];
      items.value = [];
      total.value = 0;
      error.value = cause instanceof Error ? cause.message : "加载提交记录失败";
      return [];
    } finally {
      if (String(options.questionId.value) === String(questionId)) {
        loading.value = false;
      }
    }
  };

  const changePage = (value: number) => {
    page.value = value;
    void load();
  };

  const updateTab = (key: string, changes: Partial<SubmissionTab>) => {
    const index = tabs.value.findIndex((tab) => tab.key === key);
    if (index === -1) return;
    tabs.value[index] = { ...tabs.value[index], ...changes };
  };

  const loadTabRank = async (key: string, submissionId: ApiId) => {
    updateTab(key, { rankLoading: true, rankError: "" });
    try {
      updateTab(key, { rank: await getQuestionSubmitRank(submissionId) });
    } catch (cause) {
      updateTab(key, {
        rankError: cause instanceof Error ? cause.message : "排名暂不可用",
      });
    } finally {
      updateTab(key, { rankLoading: false });
    }
  };

  const createTabPoller = (key: string) =>
    createQuestionSubmitPoller({
      request: requestMyQuestionSubmit,
      onUpdate: (submission) => {
        updateTab(key, { detail: submission, loading: false, error: "" });
        const tab = tabs.value.find((item) => item.key === key);
        if (
          tab &&
          !isJudging(submission.status) &&
          getJudgeResultPresentation(submission).tone === "passed" &&
          !tab.rank &&
          !tab.rankLoading &&
          submission.id != null
        ) {
          void loadTabRank(key, submission.id);
        }
        if (!isJudging(submission.status)) void load();
      },
      onTimeout: () => {
        updateTab(key, {
          loading: false,
          error: "判题等待超时，请稍后刷新提交记录",
        });
      },
      onError: (cause) => {
        updateTab(key, {
          loading: false,
          error: cause instanceof Error ? cause.message : "加载提交详情失败",
        });
      },
    });

  /** 打开一条提交的详情标签，已经开着就直接返回它 */
  const openTab = (submission: QuestionSubmitSummaryVO) => {
    if (submission.id == null) return undefined;
    const idText = String(submission.id);
    const key = `submission:${idText}` as const;
    if (tabs.value.some((tab) => tab.key === key)) return key;
    tabs.value.push({
      key,
      id: submission.id,
      label: `#${idText.slice(-6)}`,
      detail: null,
      loading: true,
      error: "",
      rankLoading: false,
      rankError: "",
    });
    const poller = createTabPoller(key);
    pollers.set(key, poller);
    poller.start(submission.id);
    return key;
  };

  const closeTab = (key: string) => {
    pollers.get(key)?.stop();
    pollers.delete(key);
    tabs.value = tabs.value.filter((tab) => tab.key !== key);
  };

  /** 换题或离开页面时：停掉所有轮询，清空列表 */
  const reset = () => {
    for (const poller of pollers.values()) poller.stop();
    pollers.clear();
    tabs.value = [];
    items.value = [];
    total.value = 0;
    page.value = 1;
    error.value = "";
  };

  return {
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
    loading,
    error,
    tabs,
    hasPages: computed(() => total.value > PAGE_SIZE),
    load,
    changePage,
    openTab,
    closeTab,
    reset,
  };
};

export type MySubmissions = ReturnType<typeof useMySubmissions>;
