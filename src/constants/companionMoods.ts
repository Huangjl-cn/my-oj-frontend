import { CompanionMood } from "@/services/companion";

/** 桌宠的状态：后端给的心情，加上前端自己的待机、思考两种 */
export type PetMood = CompanionMood | "idle" | "thinking";

export const COMPANION_MOOD_LABELS: Record<CompanionMood, string> = {
  excited: "兴奋",
  proud: "骄傲",
  surprised: "惊喜",
  thoughtful: "若有所思",
  sympathetic: "心疼",
  encouraging: "打气",
  playful: "调皮",
  nervous: "紧张",
  confused: "困惑",
};

const MOODS = Object.keys(COMPANION_MOOD_LABELS) as CompanionMood[];

export const isCompanionMood = (value: unknown): value is CompanionMood =>
  typeof value === "string" && (MOODS as string[]).includes(value);

/**
 * 判题结果一到先播的动作，不等接口（零延迟）；接口返回后再换成模型选的心情。
 * status 3 是判题失败（系统问题，不是用户的错）。
 */
export const instantMoodForJudge = (
  tone: "passed" | "failed" | "pending",
  status?: number
): CompanionMood => {
  if (tone === "passed") return "excited";
  if (status === 3) return "confused";
  return "thoughtful";
};
