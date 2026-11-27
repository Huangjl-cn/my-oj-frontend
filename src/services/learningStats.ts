import { LearningStatsVO, QuestionControllerService } from "../../generated";

/**
 * 学习统计页的数据：各标签、各语言、最近通过的题。
 * 按难度的进度（useMyProgress）和做题日历（useSubmitCalendar）另有接口，页面上直接复用。
 */
export type TagProgress = {
  tag: string;
  /** 题库里带这个标签的题目数 */
  total: number;
  solved: number;
  /** 做过但还没通过的 */
  attempted: number;
};

export type LanguageStat = {
  language: string;
  name: string;
  submits: number;
  accepted: number;
  /** 用这门语言通过过的题目数 */
  solved: number;
};

export type SolvedQuestion = {
  questionId: string;
  title: string;
  tags: string[];
  solvedTime: string;
  language: string;
  /** 第几次提交才通过，1 就是一次通过 */
  attempts: number;
};

export type LearningStats = {
  tags: TagProgress[];
  languages: LanguageStat[];
  recentSolved: SolvedQuestion[];
  firstTrySolved: number;
};

const count = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;

export const EMPTY_LEARNING_STATS: LearningStats = {
  tags: [],
  languages: [],
  recentSolved: [],
  firstTrySolved: 0,
};

/** 接口返回的字段都是可选的，这里补齐成页面直接能用的样子 */
export const normalizeLearningStats = (
  data?: LearningStatsVO | null
): LearningStats => ({
  tags: (data?.tags ?? [])
    .filter((item) => item.tag && count(item.total) > 0)
    .map((item) => ({
      tag: item.tag as string,
      total: count(item.total),
      solved: count(item.solved),
      attempted: count(item.attempted),
    })),
  languages: (data?.languages ?? [])
    .filter((item) => item.language)
    .map((item) => ({
      language: item.language as string,
      name: item.languageName || (item.language as string),
      submits: count(item.submitCount),
      accepted: count(item.acceptedCount),
      solved: count(item.solvedCount),
    })),
  recentSolved: (data?.recentSolved ?? [])
    .filter((item) => item.questionId != null)
    .map((item) => ({
      questionId: String(item.questionId),
      title: item.title || "（无标题）",
      tags: item.tags ?? [],
      solvedTime: item.solvedTime ?? "",
      language: item.languageName ?? "",
      attempts: Math.max(1, count(item.attempts)),
    })),
  firstTrySolved: count(data?.firstTrySolved),
});

export const loadLearningStats = async (): Promise<LearningStats> => {
  const response = await QuestionControllerService.getMyLearningStats();
  if (response.code !== 0) {
    throw new Error(response.message || "学习统计没加载出来");
  }
  return normalizeLearningStats(response.data);
};

/** 第几次通过的说法 */
export const describeAttempts = (attempts: number) =>
  attempts <= 1 ? "一次通过" : `第 ${attempts} 次通过`;

/** 条形图的宽度：part 占 whole 的百分比，限制在 0～100% */
export const barWidth = (part: number, whole: number) => {
  if (whole <= 0 || part <= 0) return "0%";
  const percent = Math.min(100, (part / whole) * 100);
  return `${Math.round(percent * 10) / 10}%`;
};

/** 标签默认显示几个，其余点「展开」再看 */
export const TAG_PREVIEW_COUNT = 10;
