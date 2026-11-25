import { selectedLineRange } from "@/utils/editorSelection";

describe("selectedLineRange", () => {
  it("keeps a selection that ends inside a line", () => {
    expect(selectedLineRange(3, 5, 8)).toEqual({ startLine: 3, endLine: 5 });
  });

  it("drops the next line when whole lines are selected", () => {
    expect(selectedLineRange(3, 6, 1)).toEqual({ startLine: 3, endLine: 5 });
  });

  it("keeps a single line selected from its start", () => {
    expect(selectedLineRange(4, 4, 1)).toEqual({ startLine: 4, endLine: 4 });
  });
});
