<template>
  <div ref="rootRef" class="save-note">
    <button
      class="save-btn"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      :disabled="saving"
      @click="toggle"
    >
      <AppIcon name="notebook" :size="13" />
      {{ saving ? "正在存…" : "存进笔记" }}
    </button>

    <div v-if="open" class="save-popover" role="menu" aria-label="存进笔记">
      <button
        class="save-item new"
        type="button"
        role="menuitem"
        @click="saveAsNew"
      >
        <AppIcon name="plus" :size="14" />
        新建一篇本题笔记
      </button>
      <p v-if="loading" class="save-hint">加载中…</p>
      <p v-else-if="error" class="save-hint">{{ error }}</p>
      <template v-else-if="notes.length">
        <p class="save-caption">追加到</p>
        <button
          v-for="note in notes"
          :key="note.id"
          class="save-item"
          type="button"
          role="menuitem"
          @click="appendTo(note)"
        >
          <span class="item-title">{{ note.title }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { defineProps, PropType, ref } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { useDismissable } from "@/composables/useDismissable";
import { notifyNoteChanged } from "@/composables/useNoteSync";
import { ApiId } from "@/services/apiId";
import {
  appendToNote,
  createNote,
  loadNotes,
  Note,
  NoteSummary,
} from "@/services/note";

/** 追加时列出本题最近修改的几篇 */
const MAX_TARGETS = 5;

/** 把鸭鸭的一条回答原样存进笔记：新建一篇挂在本题上，或追加到本题已有的一篇末尾。不调用模型 */
const props = defineProps({
  content: { type: String, required: true },
  questionId: { type: [String, Number] as PropType<ApiId>, required: true },
});

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const notes = ref<NoteSummary[]>([]);
useDismissable(rootRef, open);

const toggle = async () => {
  open.value = !open.value;
  if (!open.value) return;
  loading.value = true;
  error.value = "";
  try {
    notes.value = (
      await loadNotes({ page: 1, questionId: props.questionId })
    ).items.slice(0, MAX_TARGETS);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "笔记没加载出来";
  } finally {
    loading.value = false;
  }
};

const run = async (save: () => Promise<Note>) => {
  open.value = false;
  saving.value = true;
  try {
    const note = await save();
    notifyNoteChanged(note);
    message.success(`已存进「${note.title}」`);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "没存上");
  } finally {
    saving.value = false;
  }
};

const saveAsNew = () =>
  run(() =>
    createNote({ questionId: props.questionId, content: props.content })
  );

const appendTo = (note: NoteSummary) =>
  run(() => appendToNote(note.id, props.content));
</script>

<style scoped>
.save-note {
  position: relative;
  align-self: flex-start;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  margin-left: -8px;
  border: none;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--faint);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.save-btn:hover,
.save-btn[aria-expanded="true"] {
  background: var(--fill);
  color: var(--tint-violet);
}

.save-btn:disabled {
  cursor: default;
}

/* 往上弹：回答多在列表下方 */
.save-popover {
  position: absolute;
  bottom: calc(100% + 6px);
  left: -8px;
  z-index: 10;
  width: 240px;
  display: grid;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-float);
}

.save-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--body);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.save-item:hover {
  background: var(--fill);
  color: var(--ink);
}

.save-item.new {
  color: var(--ink);
  font-weight: 600;
}

.item-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.save-caption,
.save-hint {
  margin: 4px 10px 2px;
  color: var(--faint);
  font-size: 12px;
}
</style>
