import {
  buildObsidianMarkdown,
  buildObsidianUri,
  DEFAULT_OBSIDIAN_SETTINGS,
  Note,
  noteSnippet,
  normalizeNote,
  obsidianFileName,
  readObsidianSettings,
} from "@/services/note";

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
