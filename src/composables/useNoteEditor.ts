import { ref } from "vue";

import {
  loadNote,
  Note,
  NOTE_CONFLICT_CODE,
  NoteServiceError,
  saveNote,
} from "@/services/note";

/**
 * saved：已保存；dirty：有改动，等停下来再存；saving：正在存；
 * error：没存上（网络之类），下次改动或点重试再存；conflict：在别处改过了，等用户选
 */
export type NoteSaveState = "saved" | "dirty" | "saving" | "error" | "conflict";

type Deps = {
  save: typeof saveNote;
  load: typeof loadNote;
};

/** 停止输入多久后自动保存 */
export const NOTE_AUTOSAVE_MS = 1000;

/**
 * 一篇笔记的编辑状态：自动保存（停止输入 1 秒后）、保存时又有改动就接着再存、
 * 版本号对不上（另一个标签页或鸭鸭改过）就停下来，让用户选用哪一边。
 */
export const useNoteEditor = (
  deps: Deps = { save: saveNote, load: loadNote },
  delay = NOTE_AUTOSAVE_MS
) => {
  /** 服务端的那份（版本号以它为准） */
  const note = ref<Note | null>(null);
  /** 编辑框里的内容 */
  const title = ref("");
  const content = ref("");
  const state = ref<NoteSaveState>("saved");
  const error = ref("");

  let timer: ReturnType<typeof setTimeout> | undefined;
  let saving: Promise<void> | null = null;
  let saveAgain = false;

  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const open = (next: Note) => {
    clearTimer();
    saveAgain = false;
    note.value = next;
    title.value = next.title;
    content.value = next.content;
    state.value = "saved";
    error.value = "";
  };

  const schedule = () => {
    clearTimer();
    timer = setTimeout(() => void flush(), delay);
  };

  const edit = (patch: { title?: string; content?: string }) => {
    if (!note.value) return;
    if (patch.title !== undefined) title.value = patch.title;
    if (patch.content !== undefined) content.value = patch.content;
    // 冲突时先不存，等用户选
    if (state.value === "conflict") return;
    state.value = "dirty";
    schedule();
  };

  /** 有没存的改动就马上存（切换笔记、离开页面前调用） */
  const flush = async (): Promise<void> => {
    clearTimer();
    const target = note.value;
    if (!target) return;
    if (saving) {
      saveAgain = true;
      return saving;
    }
    if (state.value !== "dirty" && state.value !== "error") return;
    const snapshot = { title: title.value, content: content.value };
    state.value = "saving";
    saving = (async () => {
      try {
        const saved = await deps.save({
          id: target.id,
          title: snapshot.title,
          content: snapshot.content,
          version: target.version,
        });
        if (note.value?.id !== target.id) return;
        note.value = saved;
        error.value = "";
        const changed =
          title.value !== snapshot.title || content.value !== snapshot.content;
        state.value = changed ? "dirty" : "saved";
      } catch (cause) {
        if (note.value?.id !== target.id) return;
        error.value = cause instanceof Error ? cause.message : "保存失败";
        state.value =
          cause instanceof NoteServiceError && cause.code === NOTE_CONFLICT_CODE
            ? "conflict"
            : "error";
      } finally {
        saving = null;
      }
      if (state.value === "dirty") {
        // 保存期间又改了：接着存（flush 过就马上存，否则等停下来）
        if (saveAgain) {
          saveAgain = false;
          await flush();
        } else {
          schedule();
        }
      }
      saveAgain = false;
    })();
    return saving;
  };

  /** 冲突时：reload 用别处的版本（丢掉自己的改动），overwrite 用自己的改动覆盖 */
  const resolveConflict = async (choice: "reload" | "overwrite") => {
    const target = note.value;
    if (!target) return;
    const latest = await deps.load(target.id);
    if (note.value?.id !== target.id) return;
    if (choice === "reload") {
      open(latest);
      return;
    }
    note.value = latest;
    state.value = "dirty";
    await flush();
  };

  const dispose = () => clearTimer();

  return {
    note,
    title,
    content,
    state,
    error,
    open,
    edit,
    flush,
    resolveConflict,
    dispose,
  };
};

export type NoteEditorState = ReturnType<typeof useNoteEditor>;
