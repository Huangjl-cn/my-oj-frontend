import {
  computeColumns,
  PANE_LIMITS,
} from "@/composables/problem/useProblemLayout";

describe("problem page column widths", () => {
  it("uses the saved ratio when there is room", () => {
    expect(
      computeColumns(1400, { statement: 0.4, companion: 360 }, true)
    ).toEqual({ statement: 560, companion: 360 });
  });

  it("always leaves the editor its minimum width", () => {
    const width = 1200;
    const { statement, companion } = computeColumns(
      width,
      { statement: 0.9, companion: 500 },
      true
    );
    const editor = width - statement - companion - 2 * PANE_LIMITS.handle;
    expect(editor).toBeGreaterThanOrEqual(PANE_LIMITS.editorMin);
    expect(companion).toBe(496);
  });

  it("keeps panels above their minimum", () => {
    expect(
      computeColumns(1400, { statement: 0.05, companion: 10 }, true)
    ).toEqual({
      statement: PANE_LIMITS.statementMin,
      companion: PANE_LIMITS.companionMin,
    });
  });

  it("ignores the companion width while the panel is closed", () => {
    expect(
      computeColumns(1000, { statement: 0.5, companion: 360 }, false)
    ).toEqual({ statement: 500, companion: 0 });
  });
});
