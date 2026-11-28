import { LearningStatsVO, QuestionControllerService } from "../../generated";
import { addDays, CalendarDay, toDateKey } from "@/utils/submitCalendar";

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

export type VerdictCount = {
  /** accepted / wrong_answer / time_limit / memory_limit / runtime_error / compile_error / other */
  verdict: string;
  text: string;
  count: number;
};

export type StuckTag = {
  tag: string;
  solved: number;
  /** 平均第几次才通过 */
  average: number;
};

export type LearningStats = {
  tags: TagProgress[];
  languages: LanguageStat[];
  recentSolved: SolvedQuestion[];
  firstTrySolved: number;
  /** 最近一次就过的题，最多 6 道 */
  firstTryRecent: SolvedQuestion[];
  /** 一天里各个小时（0-23）的提交次数 */
  hourCounts: number[];
  verdicts: VerdictCount[];
  stuckTags: StuckTag[];
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
  firstTryRecent: [],
  hourCounts: Array(24).fill(0),
  verdicts: [],
  stuckTags: [],
};

const normalizeSolved = (
  list?: LearningStatsVO["recentSolved"]
): SolvedQuestion[] =>
  (list ?? [])
    .filter((item) => item.questionId != null)
    .map((item) => ({
      questionId: String(item.questionId),
      title: item.title || "（无标题）",
      tags: item.tags ?? [],
      solvedTime: item.solvedTime ?? "",
      language: item.languageName ?? "",
      attempts: Math.max(1, count(item.attempts)),
    }));

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
  recentSolved: normalizeSolved(data?.recentSolved),
  firstTrySolved: count(data?.firstTrySolved),
  firstTryRecent: normalizeSolved(data?.firstTryRecent),
  hourCounts: Array.from({ length: 24 }, (_, hour) =>
    count(data?.hourCounts?.[hour])
  ),
  verdicts: (data?.verdicts ?? [])
    .filter((item) => item.verdict && count(item.count) > 0)
    .map((item) => ({
      verdict: item.verdict as string,
      text: item.text || (item.verdict as string),
      count: count(item.count),
    })),
  stuckTags: (data?.stuckTags ?? [])
    .filter((item) => item.tag)
    .map((item) => ({
      tag: item.tag as string,
      solved: count(item.solved),
      average:
        typeof item.averageAttempts === "number" ? item.averageAttempts : 0,
    })),
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

// region 便当格里的小图

/** 一天里提交最多的连续两小时，说成「晚上 9–11 点」；没有提交时为空 */
export const busiestHours = (hourCounts: number[]) => {
  let best = -1;
  let bestCount = 0;
  for (let hour = 0; hour < 24; hour += 1) {
    const sum = (hourCounts[hour] ?? 0) + (hourCounts[(hour + 1) % 24] ?? 0);
    if (sum > bestCount) {
      best = hour;
      bestCount = sum;
    }
  }
  if (best < 0) return "";
  const period =
    best < 5
      ? "凌晨"
      : best < 11
      ? "上午"
      : best < 13
      ? "中午"
      : best < 18
      ? "下午"
      : "晚上";
  const clock = (hour: number) => {
    const value = hour % 24;
    return value > 12 ? value - 12 : value;
  };
  return `${period} ${clock(best)}–${clock(best + 2)} 点`;
};

export type CalendarSummary = {
  /** 有提交的天数 */
  activeDays: number;
  monthSubmits: number;
  /** 单日最多提交 */
  maxDay: number;
  thisWeek: number;
  lastWeek: number;
  /** 最近 12 周每周的提交次数，最后一个是本周 */
  weekly: number[];
  /** 本周一到周日每天有没有提交 */
  weekDays: boolean[];
};

/** 日历数据里算出便当格要的几个数（周一算一周的第一天） */
export const summarizeCalendar = (
  days: CalendarDay[],
  today: Date,
  weeks = 12
): CalendarSummary => {
  const counts = new Map<string, number>();
  for (const day of days) {
    if (day.date && (day.submitCount ?? 0) > 0) {
      counts.set(day.date, day.submitCount ?? 0);
    }
  }
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const weekSum = (start: Date) => {
    let sum = 0;
    for (let i = 0; i < 7; i += 1) {
      sum += counts.get(toDateKey(addDays(start, i))) ?? 0;
    }
    return sum;
  };
  const monthPrefix = toDateKey(today).slice(0, 8);
  return {
    activeDays: counts.size,
    monthSubmits: [...counts.entries()]
      .filter(([date]) => date.startsWith(monthPrefix))
      .reduce((sum, [, value]) => sum + value, 0),
    maxDay: Math.max(0, ...counts.values()),
    thisWeek: weekSum(monday),
    lastWeek: weekSum(addDays(monday, -7)),
    weekly: Array.from({ length: weeks }, (_, index) =>
      weekSum(addDays(monday, -7 * (weeks - 1 - index)))
    ),
    weekDays: Array.from(
      { length: 7 },
      (_, index) => (counts.get(toDateKey(addDays(monday, index))) ?? 0) > 0
    ),
  };
};

/** 折线的点：横向铺满 width，最高的一点贴近顶部；全是 0 时贴着底 */
export const sparklinePoints = (values: number[], width = 120, height = 30) => {
  if (!values.length) return "";
  const max = Math.max(...values);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const y =
        max > 0 ? height - 2 - (value / max) * (height - 4) : height - 2;
      return `${Math.round(index * step * 10) / 10},${Math.round(y * 10) / 10}`;
    })
    .join(" ");
};

export type VerdictSegment = {
  key: "accepted" | "wrong" | "limit" | "error";
  text: string;
  count: number;
  /** 百分比，0～100 */
  percent: number;
};

/** 通过率那张卡的分段：通过、答案错误、超时和超内存、其余（运行错误、编译错误等） */
export const verdictSegments = (verdicts: VerdictCount[]): VerdictSegment[] => {
  const total = verdicts.reduce((sum, item) => sum + item.count, 0);
  if (!total) return [];
  const sum = (keys: string[]) =>
    verdicts
      .filter((item) => keys.includes(item.verdict))
      .reduce((value, item) => value + item.count, 0);
  const segments: Omit<VerdictSegment, "percent">[] = [
    { key: "accepted", text: "通过", count: sum(["accepted"]) },
    { key: "wrong", text: "答案错误", count: sum(["wrong_answer"]) },
    {
      key: "limit",
      text: "超时 / 超内存",
      count: sum(["time_limit", "memory_limit"]),
    },
    {
      key: "error",
      text: "运行 / 编译错误等",
      count: sum(["runtime_error", "compile_error", "other"]),
    },
  ];
  return segments
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      percent: Math.round((item.count / total) * 1000) / 10,
    }));
};

// endregion
