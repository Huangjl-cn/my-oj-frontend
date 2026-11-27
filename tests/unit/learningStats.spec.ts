import {
  barWidth,
  describeAttempts,
  normalizeLearningStats,
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
    expect(normalizeLearningStats(undefined)).toEqual({
      tags: [],
      languages: [],
      recentSolved: [],
      firstTrySolved: 0,
    });
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
});
