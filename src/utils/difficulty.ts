/**
 * 题目难度：放在题目标签里，中英文写法都认（easy / 简单），和后端 QuestionDifficultyEnum 一致
 */
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const DIFFICULTY_BY_TAG: Record<string, Difficulty> = {
  easy: "easy",
  简单: "easy",
  medium: "medium",
  中等: "medium",
  hard: "hard",
  困难: "hard",
};

export const difficultyOfTag = (tag: string): Difficulty | undefined =>
  DIFFICULTY_BY_TAG[tag.trim().toLowerCase()];

/** 一组标签里的难度，取第一个能识别的 */
export const getDifficulty = (
  tags?: string[] | null
): Difficulty | undefined => {
  for (const tag of tags ?? []) {
    const difficulty = difficultyOfTag(tag);
    if (difficulty) return difficulty;
  }
  return undefined;
};

/** 去掉难度之后的普通标签 */
export const getTopicTags = (tags?: string[] | null): string[] =>
  (tags ?? []).filter((tag) => tag.trim() && !difficultyOfTag(tag));
