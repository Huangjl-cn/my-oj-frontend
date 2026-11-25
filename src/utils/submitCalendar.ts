/**
 * 做题日历：把「有提交的日子」排成按周的格子（一列一周，周一在上），并算连续做题天数。
 * 日期都是 yyyy-MM-dd 字符串，按本地日期比较。
 */
export type CalendarDay = {
  date?: string;
  submitCount?: number;
  acceptedCount?: number;
};

export type CalendarLevel = 0 | 1 | 2 | 3 | 4;

export type CalendarCell = {
  date: string;
  count: number;
  accepted: number;
  level: CalendarLevel;
  /** 今天之后的格子（本周还没到的几天），不画 */
  future: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const addDays = (date: Date, days: number) => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

/** 0 次不亮；1～2、3～5、6～9、10 次以上颜色依次加深 */
export const calendarLevel = (count: number): CalendarLevel => {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
};

const indexDays = (days: CalendarDay[]) => {
  const byDate = new Map<string, CalendarDay>();
  for (const day of days) {
    if (day.date && (day.submitCount ?? 0) > 0) byDate.set(day.date, day);
  }
  return byDate;
};

/** 最近 weeks 周的格子，最后一列是本周 */
export const buildCalendarWeeks = (
  days: CalendarDay[],
  today: Date,
  weeks: number
): CalendarCell[][] => {
  const byDate = indexDays(days);
  const todayKey = toDateKey(today);
  // 周一为一周第一天
  const mondayOffset = (today.getDay() + 6) % 7;
  const firstMonday = addDays(today, -mondayOffset - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (__, weekday) => {
      const date = toDateKey(addDays(firstMonday, week * 7 + weekday));
      const day = byDate.get(date);
      const count = day?.submitCount ?? 0;
      return {
        date,
        count,
        accepted: day?.acceptedCount ?? 0,
        level: calendarLevel(count),
        future: date > todayKey,
      };
    })
  );
};

/** 月份标签：某一列的周一和前一列不在同一个月时，在这一列上方标出月份 */
export const monthLabels = (weeks: CalendarCell[][]) =>
  weeks.flatMap((column, index) => {
    const month = Number(column[0].date.slice(5, 7));
    const previous =
      index > 0 ? Number(weeks[index - 1][0].date.slice(5, 7)) : NaN;
    return index === 0 || month !== previous
      ? [{ index, label: `${month}月` }]
      : [];
  });

/**
 * 连续做题天数：今天做了就从今天往前数；今天还没做但昨天做了，也算还在连续（从昨天数）。
 * 同时给出这段时间里最长的连续天数和做过题的天数。
 */
export const computeStreaks = (days: CalendarDay[], today: Date) => {
  const active = new Set(indexDays(days).keys());
  let current = 0;
  let cursor = active.has(toDateKey(today)) ? today : addDays(today, -1);
  while (active.has(toDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: Date | undefined;
  for (const key of Array.from(active).sort()) {
    const [year, month, date] = key.split("-").map(Number);
    const day = new Date(year, month - 1, date);
    run = previous && toDateKey(addDays(previous, 1)) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return { current, longest, activeDays: active.size };
};
