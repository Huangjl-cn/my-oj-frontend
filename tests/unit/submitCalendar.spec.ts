import {
  buildCalendarWeeks,
  calendarLevel,
  computeStreaks,
  monthLabels,
} from "@/utils/submitCalendar";

// 2026-11-25 是周三
const today = new Date(2026, 10, 25);

describe("submit calendar", () => {
  it("lays out weeks from Monday with this week last", () => {
    const weeks = buildCalendarWeeks(
      [
        { date: "2026-11-23", submitCount: 3, acceptedCount: 1 },
        { date: "2026-11-25", submitCount: 12, acceptedCount: 0 },
      ],
      today,
      2
    );

    expect(weeks).toHaveLength(2);
    expect(weeks[0][0].date).toBe("2026-11-16");
    expect(weeks[1][0]).toMatchObject({
      date: "2026-11-23",
      count: 3,
      accepted: 1,
      level: 2,
      future: false,
    });
    expect(weeks[1][2]).toMatchObject({ date: "2026-11-25", level: 4 });
    expect(weeks[1][3]).toMatchObject({ date: "2026-11-26", future: true });
  });

  it("maps counts to five shades", () => {
    expect([0, 1, 2, 3, 5, 6, 9, 10, 40].map(calendarLevel)).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });

  it("labels a column when its month changes", () => {
    const weeks = buildCalendarWeeks([], today, 6);
    expect(monthLabels(weeks)).toEqual([
      { index: 0, label: "10月" },
      { index: 2, label: "11月" },
    ]);
  });

  it("keeps a streak alive until the end of today", () => {
    const days = ["2026-11-20", "2026-11-22", "2026-11-23", "2026-11-24"].map(
      (date) => ({ date, submitCount: 1 })
    );
    expect(computeStreaks(days, today)).toEqual({
      current: 3,
      longest: 3,
      activeDays: 4,
    });
    expect(
      computeStreaks([{ date: "2026-11-23", submitCount: 1 }], today).current
    ).toBe(0);
  });

  it("counts the longest run across months and ignores empty days", () => {
    const days = [
      { date: "2026-10-30", submitCount: 1 },
      { date: "2026-10-31", submitCount: 2 },
      { date: "2026-11-01", submitCount: 1 },
      { date: "2026-11-02", submitCount: 0 },
      { date: "2026-11-25", submitCount: 1 },
    ];
    expect(computeStreaks(days, today)).toEqual({
      current: 1,
      longest: 3,
      activeDays: 4,
    });
  });
});
