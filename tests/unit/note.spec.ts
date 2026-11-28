import type { Mock } from "vitest";

import { NoteControllerService } from "../../generated";
import {
  appendMarkdown,
  appendToNote,
  buildObsidianMarkdown,
  distributeColumns,
  noteExcerpt,
  stripTitleHeading,
  buildObsidianUri,
  DEFAULT_OBSIDIAN_SETTINGS,
  Note,
  noteSnippet,
  normalizeNote,
  obsidianFileName,
  readObsidianSettings,
} from "@/services/note";

vi.mock("../../generated", () => ({
  NoteControllerService: { getNote: vi.fn(), updateNote: vi.fn() },
}));

const note = (patch: Partial<Note> = {}): Note => ({
  id: "9",
  title: "两数之和：哈希表",
  content: "## 思路\n用哈希表记下见过的数。\n",
  questionId: "42",
  questionTitle: "两数之和",
  questionTags: ["简单", "哈希表", "数组 题"],
  version: 3,
  createTime: "2026-11-20T08:00:00.000+08:00",
  updateTime: "2026-11-27T09:30:00.000+08:00",
  ...patch,
});

describe("notes", () => {
  it("fills in missing note fields", () => {
    expect(normalizeNote({ title: "没有 id" })).toBeNull();
    expect(normalizeNote({ id: 5 })).toEqual({
      id: "5",
      title: "未命名笔记",
      content: "",
      questionId: null,
      questionTitle: null,
      questionTags: [],
      version: 0,
      createTime: "",
      updateTime: "",
    });
  });

  it("makes a plain snippet like the backend does", () => {
    expect(
      noteSnippet("# 思路\n> 先**排序**，再用 `双指针`。\n```js\nlet a\n```")
    ).toBe("思路 先排序，再用 双指针。 [代码]");
    expect(noteSnippet("一二三四五", 3)).toBe("一二三…");
    expect(noteSnippet("😀😀😀", 2)).toBe("😀😀…");
  });

  it("turns titles into safe file names", () => {
    expect(obsidianFileName('a/b\\c:d*e?"f<g>h|i#j^k[l]')).toBe(
      "a b c d e f g h i j k l"
    );
    expect(obsidianFileName("   ")).toBe("未命名笔记");
    expect(obsidianFileName("题".repeat(100))).toHaveLength(80);
  });

  it("writes Obsidian properties before the note", () => {
    const markdown = buildObsidianMarkdown(note(), "https://myoj.space");
    expect(markdown).toBe(
      [
        "---",
        'title: "两数之和：哈希表"',
        'source: "https://myoj.space/problem/42"',
        'problem: "两数之和"',
        "tags:",
        '  - "myoj"',
        '  - "哈希表"',
        '  - "数组-题"',
        'difficulty: "简单"',
        "created: 2026-11-20",
        "updated: 2026-11-27",
        "---",
        "",
        "## 思路",
        "用哈希表记下见过的数。",
        "",
      ].join("\n")
    );
  });

  it("leaves out the problem for free notes", () => {
    const markdown = buildObsidianMarkdown(
      note({ questionId: null, questionTitle: null, questionTags: [] }),
      "https://myoj.space"
    );
    expect(markdown).not.toContain("source:");
    expect(markdown).not.toContain("difficulty:");
    expect(markdown).toContain('tags:\n  - "myoj"\ncreated: 2026-11-20');
  });

  it("builds the obsidian://new link with the content from the clipboard", () => {
    // 全角冒号在文件名里可以用，不替换；/ 必须编码成 %2F
    expect(
      buildObsidianUri("两数之和：哈希表", DEFAULT_OBSIDIAN_SETTINGS)
    ).toBe(
      `obsidian://new?file=${encodeURIComponent(
        "MyOJ/两数之和：哈希表"
      )}&clipboard=true`
    );
    expect(
      buildObsidianUri("笔记: 1/2", {
        vault: "我的 库",
        folder: "学习/MyOJ/",
        overwrite: true,
      })
    ).toBe(
      `obsidian://new?vault=${encodeURIComponent(
        "我的 库"
      )}&file=${encodeURIComponent(
        "学习/MyOJ/笔记 1 2"
      )}&clipboard=true&overwrite=true`
    );
    expect(
      buildObsidianUri("笔记", { vault: "", folder: "", overwrite: false })
    ).toBe(`obsidian://new?file=${encodeURIComponent("笔记")}&clipboard=true`);
    expect(encodeURIComponent("a/b")).toBe("a%2Fb");
  });

  it("falls back to default export settings when storage is broken", () => {
    localStorage.setItem("myoj:obsidian", "{not json");
    expect(readObsidianSettings()).toEqual(DEFAULT_OBSIDIAN_SETTINGS);
    localStorage.setItem(
      "myoj:obsidian",
      JSON.stringify({ vault: "库", overwrite: true })
    );
    expect(readObsidianSettings()).toEqual({
      vault: "库",
      folder: "MyOJ",
      overwrite: true,
    });
    localStorage.removeItem("myoj:obsidian");
  });
});

describe("appending to a note", () => {
  const mockedGet = NoteControllerService.getNote as Mock;
  const mockedUpdate = NoteControllerService.updateNote as Mock;

  beforeEach(() => vi.resetAllMocks());

  it("leaves one blank line before the appended text", () => {
    expect(appendMarkdown("开头\n\n\n", "\n## 新的\n")).toBe(
      "开头\n\n## 新的\n"
    );
    expect(appendMarkdown("", "## 新的")).toBe("## 新的\n");
    expect(appendMarkdown("开头", "  ")).toBe("开头");
  });

  it("reloads and tries once more when the note changed meanwhile", async () => {
    mockedGet
      .mockResolvedValueOnce({
        code: 0,
        data: { id: "9", content: "a", version: 1 },
      })
      .mockResolvedValueOnce({
        code: 0,
        data: { id: "9", content: "a\nb", version: 2 },
      });
    mockedUpdate
      .mockResolvedValueOnce({ code: 40900, message: "改过了" })
      .mockResolvedValueOnce({
        code: 0,
        data: { id: "9", content: "a\nb\n\n鸭鸭说的\n", version: 3 },
      });

    const note = await appendToNote("9", "鸭鸭说的");

    expect(mockedUpdate).toHaveBeenLastCalledWith({
      id: "9",
      title: "未命名笔记",
      content: "a\nb\n\n鸭鸭说的\n",
      version: 2,
    });
    expect(note.version).toBe(3);
  });

  it("gives up after the second conflict", async () => {
    mockedGet.mockResolvedValue({ code: 0, data: { id: "9", version: 1 } });
    mockedUpdate.mockResolvedValue({ code: 40900, message: "改过了" });

    await expect(appendToNote("9", "x")).rejects.toMatchObject({ code: 40900 });
    expect(mockedUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("note card wall", () => {
  it("cuts an excerpt at whole lines and closes code blocks", () => {
    expect(noteExcerpt("## 思路\r\n双指针\n")).toBe("## 思路\n双指针");
    const markdown = "说明\n```java\nint a = 1;\nint b = 2;\nint c = 3;\n```";
    expect(noteExcerpt(markdown, 34)).toBe(
      "说明\n```java\nint a = 1;\nint b = 2;\n```\n\n…"
    );
  });

  it("drops a first heading that repeats the title", () => {
    expect(stripTitleHeading("# 复盘\n\n内容", "复盘")).toBe("内容");
    expect(stripTitleHeading("## 思路\n内容", "复盘")).toBe("## 思路\n内容");
    expect(stripTitleHeading("复盘", "复盘")).toBe("复盘");
  });

  it("deals cards into columns so the newest fill the first row", () => {
    expect(distributeColumns([1, 2, 3, 4, 5], 3)).toEqual([
      [1, 4],
      [2, 5],
      [3],
    ]);
    expect(distributeColumns([1, 2], 0)).toEqual([[1, 2]]);
  });
});
