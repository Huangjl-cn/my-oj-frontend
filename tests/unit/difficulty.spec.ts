import { getDifficulty, getTopicTags } from "@/utils/difficulty";

describe("difficulty tags", () => {
  it("recognises both spellings and takes the first one", () => {
    expect(getDifficulty(["数学", " Easy "])).toBe("easy");
    expect(getDifficulty(["困难", "medium"])).toBe("hard");
    expect(getDifficulty(["数学"])).toBeUndefined();
    expect(getDifficulty(undefined)).toBeUndefined();
  });

  it("keeps only topic tags", () => {
    expect(getTopicTags(["简单", "栈", " ", "hard", "字符串"])).toEqual([
      "栈",
      "字符串",
    ]);
  });
});
