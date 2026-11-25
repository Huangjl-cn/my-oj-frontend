import {
  getNeighbors,
  getProblemListContext,
  hasNeighborPage,
  loadNeighborAcrossPage,
  resetProblemListContextForTest,
  setProblemListContext,
} from "@/services/problemNavigation";
import { QuestionControllerService } from "../../generated";

jest.mock("../../generated", () => ({
  QuestionControllerService: { listQuestionVoByPage: jest.fn() },
}));

const mockedList = QuestionControllerService.listQuestionVoByPage as jest.Mock;

const page = (ids: string[]) => ids.map((id) => ({ id, title: `题 ${id}` }));

describe("problem list navigation", () => {
  beforeEach(() => {
    resetProblemListContextForTest();
    sessionStorage.clear();
    mockedList.mockReset();
    setProblemListContext({
      query: { difficulty: "easy", tags: [] },
      page: 2,
      pageSize: 3,
      total: 8,
      items: page(["4", "5", "6"]),
    });
  });

  it("finds neighbours inside the remembered page", () => {
    expect(getNeighbors("5")).toEqual({ prev: "4", next: "6" });
    expect(getNeighbors("99")).toEqual({});
  });

  it("knows when the neighbour is on another page", () => {
    expect(hasNeighborPage("4", "prev")).toBe(true);
    expect(hasNeighborPage("6", "next")).toBe(true);
    expect(hasNeighborPage("5", "next")).toBe(false);
  });

  it("loads the next page with the same filters", async () => {
    mockedList.mockResolvedValue({
      code: 0,
      data: { total: 8, records: page(["7", "8"]) },
    });

    await expect(loadNeighborAcrossPage("next")).resolves.toBe("7");
    expect(mockedList).toHaveBeenCalledWith({
      difficulty: "easy",
      tags: [],
      current: 3,
      pageSize: 3,
    });
    expect(getProblemListContext()?.page).toBe(3);
    expect(getNeighbors("7")).toEqual({ prev: undefined, next: "8" });
  });

  it("survives a reload through sessionStorage", () => {
    resetProblemListContextForTest();
    expect(getProblemListContext()?.items.map(({ id }) => id)).toEqual([
      "4",
      "5",
      "6",
    ]);
  });
});
