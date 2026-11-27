<template>
  <div class="problem-notes">
    <template v-if="openId">
      <div class="notes-bar">
        <button class="back" type="button" @click="close">
          <AppIcon name="chevron-left" :size="16" />
          本题笔记
        </button>
        <router-link
          class="full"
          :to="{ path: '/notes', query: { id: openId } }"
        >
          在笔记页打开
          <AppIcon name="external-link" :size="13" />
        </router-link>
      </div>
      <NoteEditor
        :key="openId"
        class="inline-editor"
        :note-id="openId"
        mode="tab"
        @saved="onSaved"
        @deleted="onDeleted"
      />
    </template>
    <template v-else>
      <div class="notes-bar">
        <span class="bar-title"
          >本题笔记 <span class="num">{{ items.length }}</span></span
        >
        <button
          class="btn sm primary"
          type="button"
          :disabled="creating"
          @click="create"
        >
          <AppIcon name="plus" :size="15" />
          新建笔记
        </button>
      </div>
      <p v-if="error" class="hint">
        {{ error }}
        <button class="link" type="button" @click="load">重试</button>
      </p>
      <p v-else-if="!loading && !items.length" class="hint">
        这道题还没有笔记。思路、易错点、复杂度都可以记下来，以后复习时回来看。
      </p>
      <button
        v-for="item in items"
        :key="item.id"
        class="note-item"
        type="button"
        @click="openId = item.id"
      >
        <span class="item-title">{{ item.title }}</span>
        <span v-if="item.snippet" class="item-snippet">{{ item.snippet }}</span>
        <span class="item-time">{{ relativeTime(item.updateTime) }}</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { defineProps, onMounted, PropType, ref } from "vue";

import NoteEditor from "@/components/note/NoteEditor.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { ApiId } from "@/services/apiId";
import {
  createNote,
  loadNotes,
  Note,
  noteSnippet,
  NoteSummary,
} from "@/services/note";
import { formatRelativeTime } from "@/utils/dateTime";

/** 做题页的「笔记」标签：这道题的笔记列表，点开就在面板里编辑 */
const props = defineProps({
  questionId: { type: [String, Number] as PropType<ApiId>, required: true },
});

const items = ref<NoteSummary[]>([]);
const loading = ref(false);
const error = ref("");
const creating = ref(false);
const openId = ref("");

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    // 一道题的笔记一般没几篇，取第一页就够
    items.value = (
      await loadNotes({ page: 1, questionId: props.questionId })
    ).items;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "笔记没加载出来";
  } finally {
    loading.value = false;
  }
};

const create = async () => {
  creating.value = true;
  try {
    const note = await createNote({ questionId: props.questionId });
    items.value = [toSummary(note), ...items.value];
    openId.value = note.id;
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "新建笔记失败");
  } finally {
    creating.value = false;
  }
};

const toSummary = (note: Note): NoteSummary => ({
  id: note.id,
  title: note.title,
  snippet: noteSnippet(note.content),
  questionId: note.questionId,
  questionTitle: note.questionTitle,
  questionTags: note.questionTags,
  updateTime: note.updateTime,
});

const onSaved = (note: Note) => {
  items.value = [
    toSummary(note),
    ...items.value.filter((item) => item.id !== note.id),
  ];
};

const onDeleted = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
  openId.value = "";
};

const close = () => {
  openId.value = "";
};

const relativeTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? "" : formatRelativeTime(time);
};

onMounted(load);
</script>

<style scoped>
/* 和题解区一样的边距 */
.problem-notes {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 22px 18px;
}

.notes-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.bar-title {
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.bar-title .num {
  margin-left: 4px;
  color: var(--faint);
  font-size: 13px;
  font-weight: 500;
}

.back,
.full {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}

.back:hover,
.full:hover {
  color: var(--ink);
}

.inline-editor {
  flex: 1;
  min-height: 420px;
}

.inline-editor :deep(.title-input) {
  font-size: 18px;
}

.note-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.note-item:hover {
  border-color: var(--line-strong);
  background: var(--fill);
}

.item-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-time {
  grid-column: 2;
  grid-row: 1;
  color: var(--faint);
  font-size: 12px;
}

.item-snippet {
  grid-column: 1 / -1;
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.55;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hint {
  margin: 4px 0;
  color: var(--faint);
  font-size: 13px;
  line-height: 1.6;
}

.link {
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
