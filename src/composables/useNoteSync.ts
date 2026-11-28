import { shallowReadonly, shallowRef } from "vue";

import { Note } from "@/services/note";

/**
 * 笔记在编辑器之外被写过（应用了鸭鸭的提议、「存进笔记」）时广播一下：
 * 做题页的笔记列表跟着刷新，开着的那篇没有未保存的改动就换成新的。
 */
export type NoteChange = { note: Note; seq: number };

const lastChange = shallowRef<NoteChange | null>(null);
let seq = 0;

export const notifyNoteChanged = (note: Note) => {
  seq += 1;
  lastChange.value = { note, seq };
};

/** 最近一次变化；用 watch 监听 */
export const lastNoteChange = shallowReadonly(lastChange);
