<template>
  <div class="notes-page">
    <aside class="panel notes-list">
      <header class="list-head">
        <h1>笔记</h1>
        <span class="count num">{{ total }}</span>
        <button
          class="btn primary sm new-btn"
          type="button"
          :disabled="creating"
          @click="create"
        >
          <AppIcon name="plus" :size="16" />
          新建
        </button>
      </header>
      <UiInput
        v-model="keyword"
        class="search"
        icon="search"
        clearable
        placeholder="搜标题和正文"
        aria-label="搜索笔记"
      />

      <div :class="['items', { stale: loading && items.length > 0 }]">
        <button
          v-for="item in items"
          :key="item.id"
          :class="['item', { on: item.id === selectedId }]"
          type="button"
          @click="select(item.id)"
        >
          <span class="item-title">{{ item.title }}</span>
          <span v-if="item.snippet" class="item-snippet">{{
            item.snippet
          }}</span>
          <span class="item-meta">
            <span v-if="item.questionTitle" class="item-question">
              <AppIcon name="book" :size="12" />
              {{ item.questionTitle }}
            </span>
            <span class="item-time">{{ relativeTime(item.updateTime) }}</span>
          </span>
        </button>
        <p v-if="error" class="hint">
          {{ error }}
          <button class="link" type="button" @click="reload">重试</button>
        </p>
        <p v-else-if="!loading && !items.length" class="hint">
          {{
            keyword.trim()
              ? "没有找到相关的笔记"
              : "还没有笔记。点「新建」写第一篇，或者在做题页的「笔记」里记。"
          }}
        </p>
        <button
          v-if="items.length < total"
          class="btn sm more"
          type="button"
          :disabled="loading"
          @click="loadMore"
        >
          加载更多
        </button>
      </div>
    </aside>

    <section class="panel notes-editor">
      <NoteEditor
        v-if="selectedId"
        :key="selectedId"
        :note-id="selectedId"
        @saved="onSaved"
        @deleted="onDeleted"
      />
      <div v-else class="editor-empty">
        <CompanionAvatar mood="thoughtful" :size="64" />
        <p>选一篇笔记，或者新建一篇。</p>
        <p class="sub">
          笔记可以挂在题目上（在做题页的「笔记」里新建），也可以是不挂题的自由笔记。
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import NoteEditor from "@/components/note/NoteEditor.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import {
  createNote,
  loadNotes,
  Note,
  noteSnippet,
  NoteSummary,
} from "@/services/note";
import { formatRelativeTime } from "@/utils/dateTime";

const route = useRoute();
const router = useRouter();

const items = ref<NoteSummary[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const error = ref("");
const keyword = ref("");
const creating = ref(false);

/** 选中的笔记记在 ?id= 里（路由按 query 保持页面，不会整页重来） */
const selectedId = computed(() =>
  typeof route.query.id === "string" && route.query.id ? route.query.id : ""
);

const select = (id: string) => {
  if (id === selectedId.value) return;
  void router.replace({ query: { ...route.query, id } });
};

let generation = 0;
const fetchPage = async (next: number) => {
  const current = ++generation;
  loading.value = true;
  error.value = "";
  try {
    const result = await loadNotes({ page: next, keyword: keyword.value });
    if (current !== generation) return;
    items.value = next === 1 ? result.items : [...items.value, ...result.items];
    total.value = result.total;
    page.value = next;
  } catch (cause) {
    if (current !== generation) return;
    error.value = cause instanceof Error ? cause.message : "笔记没加载出来";
  } finally {
    if (current === generation) loading.value = false;
  }
};

const reload = () => fetchPage(1);
const loadMore = () => fetchPage(page.value + 1);

// 搜索：停止输入 300ms 后再查
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(reload, 300);
});

const create = async () => {
  creating.value = true;
  try {
    const note = await createNote({});
    keyword.value = "";
    items.value = [
      toSummary(note),
      ...items.value.filter((item) => item.id !== note.id),
    ];
    total.value += 1;
    select(note.id);
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

/** 存好了：列表里这一条换成新的标题、摘要，挪到最前（按最近修改排） */
const onSaved = (note: Note) => {
  const rest = items.value.filter((item) => item.id !== note.id);
  items.value = [toSummary(note), ...rest];
};

const onDeleted = (id: string) => {
  const index = items.value.findIndex((item) => item.id === id);
  items.value = items.value.filter((item) => item.id !== id);
  total.value = Math.max(0, total.value - 1);
  const next = items.value[Math.min(index, items.value.length - 1)];
  const query = { ...route.query };
  if (next) query.id = next.id;
  else delete query.id;
  void router.replace({ query });
};

const relativeTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? "" : formatRelativeTime(time);
};

onMounted(reload);
</script>

<style scoped>
/* 和做题页一样铺满（路由 meta.fullHeight），列表和编辑区各自滚动 */
.notes-page {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 14px;
  padding: 12px 12px 6px 0;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.notes-list {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 12px 12px;
}

.list-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 0 8px;
}

.list-head h1 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.list-head .count {
  color: var(--faint);
  font-size: 13px;
}

.new-btn {
  margin-left: auto;
  align-self: center;
}

.search {
  margin: 0 4px;
}

.items {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  transition: opacity var(--motion-fast) ease;
}

.items.stale {
  opacity: 0.55;
}

.item {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item:hover {
  background: var(--fill);
}

.item.on {
  background: var(--fill-strong);
}

.item-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-snippet {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.55;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--faint);
  font-size: 12px;
}

.item-question {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-time {
  margin-left: auto;
  flex: none;
}

.hint {
  margin: 12px;
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

.more {
  align-self: center;
  margin: 8px 0;
}

.notes-editor {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 22px 18px;
}

.editor-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin: auto;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  --mascot-fill: var(--panel);
}

.editor-empty p {
  margin: 0;
}

.editor-empty .sub {
  max-width: 360px;
  color: var(--faint);
  font-size: 12.5px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .notes-page {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 38%) minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .notes-page {
    padding: 8px 8px 4px;
  }
}
</style>
