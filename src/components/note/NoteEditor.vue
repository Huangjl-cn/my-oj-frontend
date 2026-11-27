<template>
  <div class="note-editor">
    <div v-if="loadError" class="editor-state">
      <p>{{ loadError }}</p>
      <button class="btn sm" type="button" @click="load(noteId)">重试</button>
    </div>
    <div v-else-if="!editor.note.value" class="editor-state">
      <p>加载中…</p>
    </div>
    <template v-else>
      <header class="editor-head">
        <input
          class="title-input"
          :value="editor.title.value"
          maxlength="80"
          placeholder="标题"
          aria-label="笔记标题"
          @input="onTitle"
        />
        <div class="head-actions">
          <span :class="['save-state', editor.state.value]" role="status">{{
            stateText
          }}</span>
          <button
            v-if="editor.state.value === 'error'"
            class="btn sm"
            type="button"
            @click="editor.flush()"
          >
            重试
          </button>
          <ObsidianExport :note="exportNote" />
          <button
            class="icon-btn tip-down tip-end"
            type="button"
            data-tip="删除笔记"
            aria-label="删除笔记"
            @click="deleteOpen = true"
          >
            <AppIcon name="trash" :size="17" />
          </button>
        </div>
      </header>

      <p class="meta">
        <router-link
          v-if="editor.note.value.questionId"
          class="question-chip"
          :to="`/problem/${editor.note.value.questionId}`"
        >
          <AppIcon name="book" :size="13" />
          {{ editor.note.value.questionTitle ?? "题目已删除" }}
        </router-link>
        <span v-else class="free">自由笔记</span>
        <span v-if="editor.note.value.updateTime" class="updated">
          {{ formatDateTime(editor.note.value.updateTime) }} 更新
        </span>
      </p>

      <div
        v-if="editor.state.value === 'conflict'"
        class="conflict"
        role="alert"
      >
        <span
          >这篇笔记在别处改过了（另一个标签页，或者鸭鸭）。你的改动还在编辑框里，没有存。</span
        >
        <span class="conflict-actions">
          <button class="btn sm" type="button" @click="resolve('reload')">
            用别处的版本
          </button>
          <button
            class="btn sm primary"
            type="button"
            @click="resolve('overwrite')"
          >
            用我的覆盖
          </button>
        </span>
      </div>

      <div class="editor-body">
        <MdEditor
          :value="editor.content.value"
          :mode="mode"
          :handle-change="onContent"
        />
      </div>
    </template>

    <ConfirmDialog
      v-model:visible="deleteOpen"
      title="删除笔记"
      :message="`确定删除「${
        editor.title.value || '未命名笔记'
      }」吗？删除后找不回来。`"
      confirm-text="删除"
      tone="danger"
      @confirm="remove"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import {
  computed,
  defineAsyncComponent,
  defineEmits,
  defineExpose,
  defineProps,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import ObsidianExport from "@/components/note/ObsidianExport.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { useNoteEditor } from "@/composables/useNoteEditor";
import { lastNoteChange } from "@/composables/useNoteSync";
import { loadNote, Note, removeNote } from "@/services/note";
import { formatDateTime } from "@/utils/dateTime";

const MdEditor = defineAsyncComponent(
  () => import("@/components/editor/MdEditor.vue")
);

/** 一篇笔记的编辑区：自动保存、冲突处理、导出、删除。外面换 noteId 就换一篇（先把没存的存掉） */
const props = defineProps({
  noteId: { type: String, required: true },
  /** split：左边写右边预览（宽的地方）；tab：写和预览切换（窄的地方） */
  mode: { type: String, default: "split" },
});

const emit = defineEmits<{
  (event: "saved", note: Note): void;
  (event: "deleted", id: string): void;
}>();

const editor = useNoteEditor();
const loadError = ref("");
const deleteOpen = ref(false);

const stateText = computed(() => {
  switch (editor.state.value) {
    case "dirty":
      return "有改动";
    case "saving":
      return "保存中…";
    case "error":
      return editor.error.value || "没存上";
    case "conflict":
      return "有冲突";
    default:
      return "已保存";
  }
});

/** 导出的是编辑框里看到的内容 */
const exportNote = computed<Note | null>(() =>
  editor.note.value
    ? {
        ...editor.note.value,
        title: editor.title.value,
        content: editor.content.value,
      }
    : null
);

const load = async (id: string) => {
  loadError.value = "";
  try {
    const note = await loadNote(id);
    if (id === props.noteId) editor.open(note);
  } catch (cause) {
    if (id === props.noteId) {
      loadError.value =
        cause instanceof Error ? cause.message : "笔记没加载出来";
    }
  }
};

watch(
  () => props.noteId,
  async (id, previous) => {
    if (previous) await editor.flush();
    editor.note.value = null;
    void load(id);
  }
);

// 存好一次就告诉外面（列表里的标题、时间跟着变）
watch(
  () => editor.note.value?.version,
  (version, previous) => {
    const note = editor.note.value;
    if (note && previous !== undefined && version !== previous) {
      emit("saved", note);
    }
  }
);

// 这篇在编辑器之外被写过（应用了鸭鸭的提议、存进笔记）：没有未保存的改动就直接换成新的，
// 有改动就留着，保存时会提示冲突让用户选
watch(lastNoteChange, (change) => {
  const current = editor.note.value;
  if (
    !change ||
    !current ||
    change.note.id !== current.id ||
    change.note.version <= current.version ||
    editor.state.value !== "saved"
  ) {
    return;
  }
  editor.open(change.note);
});

const onTitle = (event: Event) =>
  editor.edit({ title: (event.target as HTMLInputElement).value });

const onContent = (value: string) => editor.edit({ content: value });

const resolve = async (choice: "reload" | "overwrite") => {
  try {
    await editor.resolveConflict(choice);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败");
  }
};

const remove = async () => {
  try {
    await removeNote(props.noteId);
    deleteOpen.value = false;
    message.success("已删除");
    emit("deleted", props.noteId);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "删除失败");
  }
};

// 还有没存的改动时，关页面前提醒一下
const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (["dirty", "saving", "error", "conflict"].includes(editor.state.value)) {
    void editor.flush();
    event.preventDefault();
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnload);
  void load(props.noteId);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  void editor.flush();
  editor.dispose();
});

defineExpose({ flush: () => editor.flush() });
</script>

<style scoped>
.note-editor {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-state {
  display: grid;
  place-items: center;
  gap: 10px;
  margin: auto;
  color: var(--muted);
  font-size: 13.5px;
}

.editor-state p {
  margin: 0;
}

.editor-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.title-input:focus-visible {
  outline: none;
}

.title-input::placeholder {
  color: var(--faint);
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.save-state {
  color: var(--faint);
  font-size: 12.5px;
  white-space: nowrap;
}

.save-state.dirty,
.save-state.saving {
  color: var(--muted);
}

.save-state.error,
.save-state.conflict {
  color: var(--danger);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: -4px 0 0;
  color: var(--faint);
  font-size: 12.5px;
}

.question-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 280px;
  height: 24px;
  padding: 0 10px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  white-space: nowrap;
  text-overflow: ellipsis;
  text-decoration: none;
}

.question-chip:hover {
  background: var(--fill-strong);
  color: var(--ink);
}

.free {
  padding: 0 10px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  line-height: 24px;
}

.conflict {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--danger) 8%, var(--panel));
  color: var(--body);
  font-size: 13px;
}

.conflict-actions {
  display: flex;
  gap: 8px;
}

/* 编辑器铺满剩下的高度：MdEditor 默认固定 400px，外面还包了一层没有高度的容器，逐层撑开 */
.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-body > :deep(*) {
  flex: 1;
  min-height: 0;
}

.editor-body :deep(.bytemd) {
  height: 100% !important;
  min-height: 320px;
}
</style>
