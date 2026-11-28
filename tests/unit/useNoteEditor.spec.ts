import { useNoteEditor } from "@/composables/useNoteEditor";
import { Note, NOTE_CONFLICT_CODE, NoteServiceError } from "@/services/note";

const note = (patch: Partial<Note> = {}): Note => ({
  id: "9",
  title: "思路",
  content: "旧内容",
  questionId: null,
  questionTitle: null,
  questionTags: [],
  version: 1,
  createTime: "",
  updateTime: "",
  ...patch,
});

describe("note editor", () => {
  let save: ReturnType<typeof vi.fn>;
  let load: ReturnType<typeof vi.fn>;
  let editor: ReturnType<typeof useNoteEditor>;

  beforeEach(() => {
    vi.useFakeTimers();
    save = vi.fn(
      async (input: { title: string; content: string; version: number }) =>
        note({
          title: input.title,
          content: input.content,
          version: input.version + 1,
        })
    );
    load = vi.fn();
    editor = useNoteEditor({ save, load }, 1000);
    editor.open(note());
  });

  afterEach(() => {
    editor.dispose();
    vi.useRealTimers();
  });

  it("saves one second after typing stops", async () => {
    editor.edit({ content: "新" });
    await vi.advanceTimersByTimeAsync(600);
    editor.edit({ content: "新内容" });
    expect(editor.state.value).toBe("dirty");
    await vi.advanceTimersByTimeAsync(900);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({
      id: "9",
      title: "思路",
      content: "新内容",
      version: 1,
    });
    expect(editor.state.value).toBe("saved");
    expect(editor.note.value?.version).toBe(2);
  });

  it("saves again when typing continues during a save", async () => {
    let finish!: (value: Note) => void;
    save.mockImplementationOnce(
      () => new Promise<Note>((resolve) => (finish = resolve))
    );
    editor.edit({ content: "第一次" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(editor.state.value).toBe("saving");

    editor.edit({ content: "第二次" });
    finish(note({ content: "第一次", version: 2 }));
    await vi.advanceTimersByTimeAsync(0);
    // 保存期间又改了：还是「有改动」，停下来以后用新版本号再存
    expect(editor.state.value).toBe("dirty");
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenLastCalledWith({
      id: "9",
      title: "思路",
      content: "第二次",
      version: 2,
    });
    expect(editor.state.value).toBe("saved");
  });

  it("stops on a conflict until the user chooses", async () => {
    save.mockRejectedValueOnce(
      new NoteServiceError("在别处改过了", NOTE_CONFLICT_CODE)
    );
    editor.edit({ content: "我的" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(editor.state.value).toBe("conflict");

    // 冲突时继续打字也不自动存
    editor.edit({ content: "我的，接着写" });
    await vi.advanceTimersByTimeAsync(3000);
    expect(save).toHaveBeenCalledTimes(1);

    load.mockResolvedValue(note({ content: "别处的", version: 5 }));
    await editor.resolveConflict("overwrite");
    expect(save).toHaveBeenLastCalledWith({
      id: "9",
      title: "思路",
      content: "我的，接着写",
      version: 5,
    });
    expect(editor.state.value).toBe("saved");
  });

  it("can drop my changes and take the other version", async () => {
    save.mockRejectedValueOnce(
      new NoteServiceError("在别处改过了", NOTE_CONFLICT_CODE)
    );
    editor.edit({ content: "我的" });
    await vi.advanceTimersByTimeAsync(1000);
    load.mockResolvedValue(note({ content: "别处的", version: 5 }));

    await editor.resolveConflict("reload");
    expect(editor.content.value).toBe("别处的");
    expect(editor.state.value).toBe("saved");
    expect(editor.note.value?.version).toBe(5);
  });

  it("keeps the text and retries after a network error", async () => {
    save.mockRejectedValueOnce(new Error("网络断了"));
    editor.edit({ content: "重要的内容" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(editor.state.value).toBe("error");
    expect(editor.error.value).toBe("网络断了");
    expect(editor.content.value).toBe("重要的内容");

    await editor.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(editor.state.value).toBe("saved");
  });

  it("flushes pending changes right away", async () => {
    editor.edit({ title: "新标题" });
    await editor.flush();
    expect(save).toHaveBeenCalledWith({
      id: "9",
      title: "新标题",
      content: "旧内容",
      version: 1,
    });
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
