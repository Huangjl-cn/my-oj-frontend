import { formatCompactNumber, formatRelativeTime } from "@/utils/dateTime";

describe("relative time and compact numbers", () => {
  const now = new Date("2026-11-25T12:00:00").getTime();

  it("formats recent times relative to now", () => {
    expect(formatRelativeTime(now - 20_000, now)).toBe("刚刚");
    expect(formatRelativeTime(now - 12 * 60_000, now)).toBe("12 分钟前");
    expect(formatRelativeTime(now - 3 * 3600_000, now)).toBe("3 小时前");
    expect(formatRelativeTime(now - 2 * 86400_000, now)).toBe("2 天前");
    expect(formatRelativeTime(now - 9 * 86400_000, now)).toBe("2026-11-16");
  });

  it("shortens large counts", () => {
    expect(formatCompactNumber(undefined)).toBe("0");
    expect(formatCompactNumber(986)).toBe("986");
    expect(formatCompactNumber(1234)).toBe("1.2K");
    expect(formatCompactNumber(12_345)).toBe("12K");
    expect(formatCompactNumber(1_250_000)).toBe("1.2M");
  });
});
