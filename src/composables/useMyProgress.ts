import { computed, ref } from "vue";
import { useStore } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import { ApiId } from "@/services/apiId";
import {
  DifficultyCountVO,
  QuestionControllerService,
  QuestionProgressVO,
} from "../../generated";

export type ProblemStatus = "passed" | "failed" | "judging";

const EMPTY_COUNT: DifficultyCountVO = { all: 0, easy: 0, medium: 0, hard: 0 };

/** 题库页和做题页共用一份进度：做题页判完题直接改这里，回到题库页不用重新拉 */
const progress = ref<QuestionProgressVO | null>(null);
const loadedFor = ref<string | null>(null);
let pending: Promise<void> | null = null;

const isStatus = (value: unknown): value is ProblemStatus =>
  value === "passed" || value === "failed" || value === "judging";

export const useMyProgress = () => {
  const store = useStore();
  const userId = computed<string | null>(() => {
    const loginUser = store.state.user.loginUser;
    return checkAccess(loginUser, ACCESS_ENUM.USER) && loginUser?.id != null
      ? String(loginUser.id)
      : null;
  });

  /** 拉一次进度；同一个用户已经拉过就不再拉，除非 force */
  const load = async (force = false) => {
    const id = userId.value;
    if (id == null) {
      progress.value = null;
      loadedFor.value = null;
      return;
    }
    if (!force && loadedFor.value === id && progress.value) return;
    if (pending && !force) return pending;
    pending = (async () => {
      try {
        const response = await QuestionControllerService.getMyQuestionProgress();
        if (response.code === 0 && userId.value === id) {
          progress.value = response.data ?? null;
          loadedFor.value = id;
        }
      } catch {
        // 进度只是锦上添花，失败时列表照常显示
      } finally {
        pending = null;
      }
    })();
    return pending;
  };

  const statusOf = (questionId?: ApiId | null): ProblemStatus | undefined => {
    if (questionId == null) return undefined;
    const status = progress.value?.statuses?.[String(questionId)];
    return isStatus(status) ? status : undefined;
  };

  /** 做题页判完题后更新本地状态；第一次通过时同步加一 */
  const markStatus = (
    questionId: ApiId,
    status: ProblemStatus,
    difficulty?: keyof Omit<DifficultyCountVO, "all">
  ) => {
    const current = progress.value;
    if (!current) return;
    const key = String(questionId);
    const previous = current.statuses?.[key];
    if (previous === "passed") return;
    const solved = { ...EMPTY_COUNT, ...current.solved };
    if (status === "passed") {
      solved.all += 1;
      if (difficulty) solved[difficulty] += 1;
    }
    progress.value = {
      ...current,
      solved,
      statuses: { ...current.statuses, [key]: status },
    };
  };

  return {
    userId,
    progress,
    total: computed(() => progress.value?.total ?? EMPTY_COUNT),
    solved: computed(() => progress.value?.solved ?? EMPTY_COUNT),
    load,
    statusOf,
    markStatus,
  };
};
