import {
  barWidth,
  busiestHours,
  describeAttempts,
  EMPTY_LEARNING_STATS,
  normalizeLearningStats,
  sparklinePoints,
  summarizeCalendar,
  verdictSegments,
} from "@/services/learningStats";

describe("learning stats", () => {
  it("fills in missing fields and drops unusable rows", () => {
    const stats = normalizeLearningStats({
      tags: [
        { tag: "数组", total: 12, solved: 3, attempted: 2 },
        { tag: "空标签", total: 0 },
        { total: 4 },
        { tag: "栈", total: 5 },
      ],
      languages: [
        { language: "java", languageName: "Java 25", submitCount: 9 },
        { language: "pascal", submitCount: 1, acceptedCount: 1 },
        { languageName: "没有标识" },
      ],
      recentSolved: [
        {
          questionId: 42,
          title: "两数之和",
          tags: ["easy", "数组"],
          solvedTime: "2026-11-27T08:00:00.000+08:00",
          languageName: "Java 25",
          attempts: 3,
        },
        { title: "没有 id" },
        { questionId: 7 },
      ],
      firstTrySolved: 2,
    });

    expect(stats.tags).toEqual([
      { tag: "数组", total: 12, solved: 3, attempted: 2 },
      { tag: "栈", total: 5, solved: 0, attempted: 0 },
    ]);
    expect(stats.languages).toEqual([
      { language: "java", name: "Java 25", submits: 9, accepted: 0, solved: 0 },
      {
        language: "pascal",
        name: "pascal",
        submits: 1,
        accepted: 1,
        solved: 0,
      },
    ]);
    expect(stats.recentSolved).toEqual([
      {
        questionId: "42",
        title: "两数之和",
        tags: ["easy", "数组"],
        solvedTime: "2026-11-27T08:00:00.000+08:00",
        language: "Java 25",
        attempts: 3,
      },
      {
        questionId: "7",
        title: "（无标题）",
        tags: [],
        solvedTime: "",
        language: "",
        attempts: 1,
      },
    ]);
    expect(stats.firstTrySolved).toBe(2);
  });

  it("treats a missing response as empty stats", () => {
    expect(normalizeLearningStats(undefined)).toEqual(EMPTY_LEARNING_STATS);
    expect(EMPTY_LEARNING_STATS.hourCounts).toHaveLength(24);
  });

  it("describes how many tries a problem took", () => {
    expect(describeAttempts(1)).toBe("一次通过");
    expect(describeAttempts(4)).toBe("第 4 次通过");
  });

  it("keeps bar widths between 0 and 100 percent", () => {
    expect(barWidth(3, 12)).toBe("25%");
    expect(barWidth(1, 3)).toBe("33.3%");
    expect(barWidth(5, 0)).toBe("0%");
    expect(barWidth(0, 10)).toBe("0%");
    expect(barWidth(20, 10)).toBe("100%");
  });

  it("reads the new numbers for the bento cards", () => {
    const stats = normalizeLearningStats({
      firstTryRecent: [{ questionId: 9, title: "有效的括号", attempts: 1 }],
      hourCounts: [1, 0, 2],
      verdicts: [
        { verdict: "accepted", text: "通过", count: 6 },
        { verdict: "other", count: 0 },
      ],
      stuckTags: [{ tag: "动态规划", solved: 3, averageAttempts: 3.4 }],
    });
    expect(stats.firstTryRecent[0]).toMatchObject({
      questionId: "9",
      attempts: 1,
    });
    expect(stats.hourCounts).toHaveLength(24);
    expect(stats.hourCounts.slice(0, 3)).toEqual([1, 0, 2]);
    expect(stats.verdicts).toEqual([
      { verdict: "accepted", text: "通过", count: 6 },
    ]);
    expect(stats.stuckTags).toEqual([
      { tag: "动态规划", solved: 3, average: 3.4 },
    ]);
  });

  it("names the busiest two hours", () => {
    const hours = Array(24).fill(0);
    hours[21] = 5;
    hours[22] = 4;
    hours[9] = 6;
    expect(busiestHours(hours)).toBe("晚上 9–11 点");
    expect(busiestHours(Array(24).fill(0))).toBe("");
    const morning = Array(24).fill(0);
    morning[9] = 1;
    expect(busiestHours(morning)).toBe("上午 8–10 点");
  });

  it("summarizes the calendar by week and month", () => {
    // 2026-11-27 是周五
    const today = new Date(2026, 10, 27);
    const summary = summarizeCalendar(
      [
        { date: "2026-11-23", submitCount: 3 },
        { date: "2026-11-27", submitCount: 9 },
        { date: "2026-11-20", submitCount: 2 },
        { date: "2026-10-30", submitCount: 4 },
        { date: "2026-11-24", submitCount: 0 },
      ],
      today
    );
    expect(summary.activeDays).toBe(4);
    expect(summary.monthSubmits).toBe(14);
    expect(summary.maxDay).toBe(9);
    expect(summary.thisWeek).toBe(12);
    expect(summary.lastWeek).toBe(2);
    expect(summary.weekly).toHaveLength(12);
    expect(summary.weekly.slice(-2)).toEqual([2, 12]);
    expect(summary.weekDays).toEqual([
      true,
      false,
      false,
      false,
      true,
      false,
      false,
    ]);
  });

  it("draws a sparkline that fills the width", () => {
    expect(sparklinePoints([0, 5, 10], 100, 30)).toBe("0,28 50,15 100,2");
    expect(sparklinePoints([0, 0], 100, 30)).toBe("0,28 100,28");
    expect(sparklinePoints([])).toBe("");
  });

  it("groups verdicts into four segments", () => {
    const segments = verdictSegments([
      { verdict: "accepted", text: "通过", count: 6 },
      { verdict: "wrong_answer", text: "答案错误", count: 2 },
      { verdict: "time_limit", text: "超时", count: 1 },
      { verdict: "compile_error", text: "编译错误", count: 1 },
    ]);
    expect(segments.map((item) => [item.key, item.percent])).toEqual([
      ["accepted", 60],
      ["wrong", 20],
      ["limit", 10],
      ["error", 10],
    ]);
    expect(verdictSegments([])).toEqual([]);
  });
});
