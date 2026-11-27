import {
  moveQuestion,
  normalizeListCard,
  normalizeListDetail,
  validateListForm,
} from "@/services/questionList";

describe("question lists", () => {
  it("fills in list cards and drops ones without an id", () => {
    expect(normalizeListCard({ title: "没有 id" })).toBeNull();
    expect(
      normalizeListCard({
        id: 12,
        title: "动态规划",
        type: "official",
        questionCount: 5,
        solvedCount: 9,
        editable: true,
      })
    ).toEqual({
      id: "12",
      title: "动态规划",
      description: "",
      type: "official",
      questionCount: 5,
      // 通过数不会比题目数多
      solvedCount: 5,
      editable: true,
    });
    expect(normalizeListCard({ id: 1, type: "weird" })?.type).toBe("custom");
  });

  it("keeps the order of the questions in a list", () => {
    const detail = normalizeListDetail({
      list: { id: 3, title: "我的收藏", type: "favorite" },
      questions: [
        { questionId: 20, title: "B", tags: ["easy"], submitNum: 4 },
        { title: "没有 id" },
        { questionId: 10, title: "A" },
      ],
    });
    expect(detail?.list.type).toBe("favorite");
    expect(detail?.questions).toEqual([
      {
        questionId: "20",
        title: "B",
        tags: ["easy"],
        submitNum: 4,
        acceptedNum: 0,
      },
      { questionId: "10", title: "A", tags: [], submitNum: 0, acceptedNum: 0 },
    ]);
    expect(normalizeListDetail({ questions: [] })).toBeNull();
  });

  it("moves a question up or down by one", () => {
    const items = ["a", "b", "c"];
    expect(moveQuestion(items, 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveQuestion(items, 1, 1)).toEqual(["a", "c", "b"]);
    // 挪不动时原样返回同一个数组
    expect(moveQuestion(items, 0, -1)).toBe(items);
    expect(moveQuestion(items, 2, 1)).toBe(items);
    expect(items).toEqual(["a", "b", "c"]);
  });

  it("checks the list form like the backend does", () => {
    expect(validateListForm({ title: "  ", description: "" })).toBe(
      "题单标题不能为空"
    );
    expect(validateListForm({ title: "题".repeat(41), description: "" })).toBe(
      "标题最多 40 个字"
    );
    expect(
      validateListForm({ title: "动态规划", description: "说".repeat(201) })
    ).toBe("简介最多 200 个字");
    expect(validateListForm({ title: "动态规划", description: "" })).toBe("");
  });
});
