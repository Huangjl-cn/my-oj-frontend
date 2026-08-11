import { JudgeConfig } from "../../generated";

type CompatibleJudgeConfig =
  | JudgeConfig
  | string
  | null
  | undefined
  | Partial<Record<keyof JudgeConfig, number | string | null>>;

const toFiniteNumber = (value: unknown, fallback: number | undefined) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const normalizeJudgeConfig = (
  value: CompatibleJudgeConfig,
  fallback: JudgeConfig
): JudgeConfig => {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = undefined;
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...fallback };
  }

  const config = parsed as Record<string, unknown>;
  return {
    timeLimit: toFiniteNumber(config.timeLimit, fallback.timeLimit),
    memoryLimit: toFiniteNumber(config.memoryLimit, fallback.memoryLimit),
    stackLimit: toFiniteNumber(config.stackLimit, fallback.stackLimit),
  };
};
