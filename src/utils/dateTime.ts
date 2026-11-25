export const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** 「刚刚」「12 分钟前」「3 小时前」「2 天前」，再早就显示日期 */
export const formatRelativeTime = (timestamp: number, now = Date.now()) => {
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return formatDateTime(new Date(timestamp).toISOString()).slice(0, 10);
};

/** 1234 → 1.2K，12345 → 12K，1234567 → 1.2M */
export const formatCompactNumber = (value?: number | null) => {
  const number = Math.max(0, value ?? 0);
  const compact = (scaled: number, unit: string) =>
    `${scaled < 10 ? Math.floor(scaled * 10) / 10 : Math.floor(scaled)}${unit}`;
  if (number >= 1_000_000) return compact(number / 1_000_000, "M");
  if (number >= 1000) return compact(number / 1000, "K");
  return String(number);
};
