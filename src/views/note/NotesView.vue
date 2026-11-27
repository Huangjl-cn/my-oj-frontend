<template>
  <!-- 没选笔记：卡片墙；选了（?id=）：左边列表、右边编辑 -->
  <div v-if="!selectedId" class="notes-wall-page">
    <section class="panel wall-head">
      <h1>笔记</h1>
      <span class="count num">{{ overview.total }}</span>
      <div class="filters" role="group" aria-label="筛选笔记">
        <button
          v-for="item in filterOptions"
          :key="item.key"
          :class="['filter', { on: filter === item.key }]"
          type="button"
          :aria-pressed="filter === item.key"
          @click="filter = item.key"
        >
          {{ item.label }}<span class="num">{{ item.count }}</span>
        </button>
      </div>
      <UiInput
        v-model="keyword"
        class="search"
        icon="search"
        clearable
        placeholder="搜标题和正文"
        aria-label="搜索笔记"
      />
      <button
        class="btn primary sm"
        type="button"
        :disabled="creating"
        @click="create"
      >
        <AppIcon name="plus" :size="16" />
        新建
      </button>
    </section>

    <p v-if="error" class="panel load-error" role="alert">
      {{ error }}
      <button type="button" @click="reload">重试</button>
    </p>

    <div
      ref="wallRef"
      :class="['wall', { stale: loading && items.length > 0 }]"
      :style="{ '--columns': columnCount }"
    >
      <div v-for="(column, index) in columns" :key="index" class="wall-column">
        <article
          v-for="item in column"
          :key="item.id"
          class="panel note-card"
          role="link"
          tabindex="0"
          :aria-label="`打开笔记「${item.title}」`"
          @click="select(item.id)"
          @keydown.enter="select(item.id)"
        >
          <h3>{{ item.title }}</h3>
          <MdViewer
            v-if="cardExcerpt(item)"
            class="excerpt"
            :value="cardExcerpt(item)"
          />
          <p v-else class="blank">空白笔记</p>
          <footer class="card-meta">
            <span v-if="item.questionTitle" class="chip">
              <AppIcon name="book" :size="12" />
              {{ item.questionTitle }}
            </span>
            <span v-else class="chip">自由笔记</span>
            <span class="time">{{ relativeTime(item.updateTime) }}</span>
          </footer>
        </article>
      </div>
    </div>

    <div v-if="!loading && !items.length && !error" class="wall-empty">
      <CompanionAvatar mood="thoughtful" :size="56" />
      <p>{{ keyword.trim() || filter !== "all" ? "没找到" : "还没有笔记" }}</p>
    </div>
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

  <div v-else class="notes-page">
    <aside class="panel notes-list">
      <header class="list-head">
        <button
          class="back tip-down tip-start"
          type="button"
          data-tip="卡片墙"
          aria-label="回到卡片墙"
          @click="backToWall"
        >
          <AppIcon name="chevron-left" :size="18" />
        </button>
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
          {{ keyword.trim() ? "没找到" : "还没有笔记" }}
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
        :key="selectedId"
        :note-id="selectedId"
        @saved="onSaved"
        @deleted="onDeleted"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import NoteEditor from "@/components/note/NoteEditor.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import {
  createNote,
  distributeColumns,
  loadNoteOverview,
  loadNotes,
  Note,
  NoteOverview,
  NoteSummary,
  stripTitleHeading,
  toNoteSummary,
} from "@/services/note";
import { formatRelativeTime } from "@/utils/dateTime";

const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

/** 卡片墙每列至少这么宽 */
const MIN_COLUMN_WIDTH = 270;
const MAX_COLUMNS = 4;
const COLUMN_GAP = 14;
/** 筛选里列几个标签 */
const TAG_FILTERS = 5;

const route = useRoute();
const router = useRouter();

const items = ref<NoteSummary[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const error = ref("");
const keyword = ref("");
const creating = ref(false);
const overview = ref<NoteOverview>({ total: 0, linked: 0, free: 0, tags: [] });
/** all / linked / free / tag:标签 */
const filter = ref("all");

/** 选中的笔记记在 ?id= 里（路由按 query 保持页面，不会整页重来） */
const selectedId = computed(() =>
  typeof route.query.id === "string" && route.query.id ? route.query.id : ""
);

const filterOptions = computed(() => [
  { key: "all", label: "全部", count: overview.value.total },
  { key: "linked", label: "挂在题上", count: overview.value.linked },
  { key: "free", label: "自由笔记", count: overview.value.free },
  ...overview.value.tags.slice(0, TAG_FILTERS).map((item) => ({
    key: `tag:${item.tag}`,
    label: item.tag,
    count: item.count,
  })),
]);

const select = (id: string) => {
  if (id === selectedId.value) return;
  void router.replace({ query: { ...route.query, id } });
};

const backToWall = () => {
  const query = { ...route.query };
  delete query.id;
  void router.replace({ query });
};

let generation = 0;
const fetchPage = async (next: number) => {
  const current = ++generation;
  loading.value = true;
  error.value = "";
  const scope = filter.value;
  try {
    const result = await loadNotes({
      page: next,
      keyword: keyword.value,
      linked: scope === "linked" ? true : scope === "free" ? false : undefined,
      tag: scope.startsWith("tag:") ? scope.slice(4) : undefined,
    });
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

const loadOverview = async () => {
  try {
    overview.value = await loadNoteOverview();
  } catch {
    // 只影响筛选上的数字
  }
};

// 搜索：停止输入 300ms 后再查；换筛选马上查
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(reload, 300);
});
watch(filter, () => void reload());

const create = async () => {
  creating.value = true;
  try {
    const note = await createNote({});
    keyword.value = "";
    items.value = [
      toNoteSummary(note),
      ...items.value.filter((item) => item.id !== note.id),
    ];
    total.value += 1;
    void loadOverview();
    select(note.id);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "新建笔记失败");
  } finally {
    creating.value = false;
  }
};

/** 存好了：列表里这一条换成新的标题、摘要，挪到最前（按最近修改排） */
const onSaved = (note: Note) => {
  const rest = items.value.filter((item) => item.id !== note.id);
  items.value = [toNoteSummary(note), ...rest];
};

const onDeleted = (id: string) => {
  const index = items.value.findIndex((item) => item.id === id);
  items.value = items.value.filter((item) => item.id !== id);
  total.value = Math.max(0, total.value - 1);
  void loadOverview();
  const next = items.value[Math.min(index, items.value.length - 1)];
  const query = { ...route.query };
  if (next) query.id = next.id;
  else delete query.id;
  void router.replace({ query });
};

/** 卡片上的片段：开头那行标题和卡片标题一样时去掉，免得重复 */
const cardExcerpt = (item: NoteSummary) =>
  stripTitleHeading(item.excerpt, item.title);

const relativeTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? "" : formatRelativeTime(time);
};

// region 卡片墙的列数：按宽度算，最多 4 列

const wallRef = ref<HTMLElement | null>(null);
const columnCount = ref(MAX_COLUMNS);
const columns = computed(() =>
  distributeColumns(items.value, columnCount.value)
);

const measure = (width: number) => {
  columnCount.value = Math.max(
    1,
    Math.min(
      MAX_COLUMNS,
      Math.floor((width + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP))
    )
  );
};
const observer =
  typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver(([entry]) => measure(entry.contentRect.width));
watch(wallRef, (element) => {
  observer?.disconnect();
  if (element) {
    measure(element.clientWidth);
    observer?.observe(element);
  }
});
onBeforeUnmount(() => observer?.disconnect());

// endregion

// 从编辑回到卡片墙时刷新一下（标题、片段可能改过）
watch(selectedId, async (id, previous) => {
  if (!id && previous) {
    await nextTick();
    void reload();
  }
});

onMounted(() => {
  void reload();
  void loadOverview();
});
</script>

<style scoped>
/* ===== 卡片墙：页面自己滚动（路由是铺满的） ===== */
.notes-wall-page {
  height: 100%;
  overflow-y: auto;
  padding: 12px 12px 24px 0;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.wall-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-bottom: 14px;
  padding: 14px 18px 14px 22px;
}

.wall-head h1 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.wall-head .count {
  color: var(--faint);
  font-size: 13px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: 8px;
}

.filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.filter .num {
  color: var(--faint);
  font-size: 12px;
}

.filter:hover {
  background: var(--fill-strong);
}

.filter.on {
  background: var(--ink);
  color: var(--panel);
}

.filter.on .num {
  color: color-mix(in srgb, var(--panel) 70%, transparent);
}

.wall-head .search {
  width: 260px;
  margin-left: auto;
}

.wall {
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), minmax(0, 1fr));
  align-items: start;
  gap: 14px;
  transition: opacity var(--motion-fast) ease;
}

.wall.stale {
  opacity: 0.55;
}

.wall-column {
  display: grid;
  gap: 14px;
}

.note-card {
  min-width: 0;
  display: grid;
  gap: 8px;
  padding: 16px 18px 14px;
  cursor: pointer;
  transition: border-color var(--motion-fast) ease,
    box-shadow var(--motion-fast) ease;
}

.note-card:hover,
.note-card:focus-visible {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-float);
  outline: none;
}

.note-card h3 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

/* 片段：小一号的 Markdown，标题压小，代码块紧凑；长代码行在块里横向滚动，不撑宽卡片 */
.excerpt {
  min-width: 0;
}

.excerpt :deep(.markdown-body pre) {
  max-width: 100%;
  overflow-x: auto !important;
}

.excerpt :deep(.markdown-body) {
  background: transparent;
  color: var(--body);
  font-size: 13px !important;
  line-height: 1.65 !important;
  overflow-wrap: anywhere;
}

.excerpt :deep(.markdown-body > :first-child) {
  margin-top: 0 !important;
}

.excerpt :deep(.markdown-body > :last-child) {
  margin-bottom: 0 !important;
}

.excerpt :deep(.markdown-body h1),
.excerpt :deep(.markdown-body h2),
.excerpt :deep(.markdown-body h3),
.excerpt :deep(.markdown-body h4) {
  margin: 8px 0 2px !important;
  padding: 0 !important;
  border: none !important;
  color: var(--ink);
  font-size: 13.5px !important;
}

.excerpt :deep(.markdown-body p),
.excerpt :deep(.markdown-body ul),
.excerpt :deep(.markdown-body ol) {
  margin: 0 0 6px !important;
}

.excerpt :deep(.markdown-body pre) {
  margin: 6px 0 !important;
  padding: 8px 10px !important;
  border-radius: var(--radius-sm) !important;
  font-size: 12px !important;
}

/* 卡片上不需要代码块的复制按钮 */
.excerpt :deep(.markdown-code-copy) {
  display: none !important;
}

.blank {
  margin: 0;
  color: var(--faint);
  font-size: 13px;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
  color: var(--faint);
  font-size: 12px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 70%;
  overflow: hidden;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  line-height: 22px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.time {
  flex: none;
}

.wall-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 60px 0;
  color: var(--muted);
  font-size: 14px;
  --mascot-fill: var(--bg);
}

.wall-empty p {
  margin: 0;
}

.notes-wall-page > .more {
  display: flex;
  margin: 18px auto 0;
}

.load-error {
  margin: 0 0 14px;
  padding: 14px 20px;
  color: var(--body);
  font-size: 13.5px;
}

.load-error button {
  margin-left: 8px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

/* ===== 编辑：和做题页一样铺满（路由 meta.fullHeight），列表和编辑区各自滚动 ===== */
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
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 2px;
}

.list-head h1 {
  margin: 0;
  color: var(--ink);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.list-head .count {
  color: var(--faint);
  font-size: 13px;
}

.back {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--muted);
  cursor: pointer;
}

.back:hover {
  background: var(--fill);
  color: var(--ink);
}

.new-btn {
  margin-left: auto;
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

.items .more {
  align-self: center;
  margin: 8px 0;
}

.notes-editor {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 22px 18px;
}

@media (max-width: 900px) {
  .notes-page {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 38%) minmax(0, 1fr);
  }

  .wall-head .search {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 720px) {
  .notes-page,
  .notes-wall-page {
    padding: 8px 8px 4px;
  }
}
</style>
