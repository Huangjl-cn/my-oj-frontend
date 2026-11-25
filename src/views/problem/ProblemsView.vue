<template>
  <div class="problems-page">
    <section class="top-row">
      <div class="panel lead">
        <h1>
          题库
          <span v-if="libraryTotal != null" class="num">{{
            libraryTotal
          }}</span>
        </h1>

        <div v-if="resume" class="resume">
          <CompanionAvatar :size="36" class="resume-mascot" />
          <div class="resume-text">
            <b>{{ resume.title }}</b>
            <span>{{ resume.languageText }} · {{ resume.when }}</span>
          </div>
          <router-link class="btn primary sm" :to="resume.to">继续</router-link>
        </div>
        <div v-else class="resume">
          <CompanionAvatar :size="36" mood="playful" class="resume-mascot" />
          <div class="resume-text">
            <b>还没开始做题</b>
            <span>挑一道，或者让栗子帮你选</span>
          </div>
          <button
            class="btn sm"
            type="button"
            :disabled="!libraryTotal || picking"
            @click="pickRandom"
          >
            <AppIcon name="shuffle" :size="16" />
            随机一题
          </button>
        </div>
      </div>

      <div v-if="isLoggedIn" class="panel progress">
        <div
          class="ring"
          role="img"
          :aria-label="`已通过 ${solved.all} 道，共 ${total.all} 道`"
        >
          <svg viewBox="0 0 36 36">
            <circle class="ring-track" cx="18" cy="18" r="15.5" />
            <circle
              v-if="ringLength > 0"
              class="ring-value"
              cx="18"
              cy="18"
              r="15.5"
              :stroke-dasharray="`${ringLength} ${RING_CIRCUMFERENCE}`"
            />
          </svg>
          <div class="ring-label">
            <b class="num">{{ solved.all }}</b>
            <span class="num">/ {{ total.all }}</span>
          </div>
        </div>
        <div class="bars">
          <div v-for="level in LEVELS" :key="level" class="bar-row">
            <DifficultyLabel :difficulty="level" />
            <span class="bar">
              <i
                :class="level"
                :style="{ width: percent(solved[level], total[level]) }"
              />
            </span>
            <span class="bar-count num">
              <b>{{ solved[level] }}</b> / {{ total[level] }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="panel progress guest">
        <p>登录后，这里会记下你通过了哪些题。</p>
        <router-link
          class="btn primary sm"
          :to="{ path: '/user/login', query: { redirect: route.fullPath } }"
        >
          <AppIcon name="log-in" :size="16" />
          登录
        </router-link>
      </div>
    </section>

    <section class="panel problems">
      <nav class="topics" aria-label="按知识点筛选">
        <button
          v-for="topic in topics"
          :key="topic.value"
          type="button"
          :class="{ on: topic.value === filters.tag }"
          :aria-pressed="topic.value === filters.tag"
          @click="setFilter({ tag: topic.value })"
        >
          {{ topic.label }}
        </button>
      </nav>

      <div class="toolbar">
        <label class="search">
          <AppIcon name="search" :size="17" />
          <input
            v-model="keyword"
            type="search"
            placeholder="搜索题目"
            aria-label="搜索题目"
          />
          <button
            v-if="keyword"
            class="clear"
            type="button"
            aria-label="清空搜索"
            @click="keyword = ''"
          >
            <AppIcon name="close" :size="14" />
          </button>
        </label>
        <UiSegmented
          :model-value="filters.level"
          :options="LEVEL_OPTIONS"
          label="按难度筛选"
          @update:model-value="setFilter({ level: $event })"
        />
        <div class="toolbar-end">
          <button
            v-if="isLoggedIn"
            :class="['icon-btn', 'tip-up', { on: filters.todo }]"
            type="button"
            :data-tip="filters.todo ? '显示全部' : '只看还没通过的'"
            :aria-pressed="filters.todo"
            aria-label="只看还没通过的"
            @click="setFilter({ todo: !filters.todo })"
          >
            <AppIcon name="circle-dashed" :size="18" />
          </button>
          <div ref="sortRef" class="sort">
            <button
              :class="[
                'icon-btn',
                'tip-up',
                { on: filters.sort !== 'default' },
              ]"
              type="button"
              :data-tip="sortOpen ? undefined : `排序：${currentSort.label}`"
              aria-label="排序"
              aria-haspopup="menu"
              :aria-expanded="sortOpen"
              @click="sortOpen = !sortOpen"
            >
              <AppIcon name="sort" :size="18" />
            </button>
            <div v-if="sortOpen" class="menu" role="menu" aria-label="排序">
              <button
                v-for="option in SORT_OPTIONS"
                :key="option.value"
                type="button"
                role="menuitemradio"
                :aria-checked="option.value === filters.sort"
                class="menu-item"
                @click="chooseSort(option.value)"
              >
                {{ option.label }}
                <AppIcon
                  v-if="option.value === filters.sort"
                  name="check"
                  :size="16"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div :class="['plist', { stale: loading && rows.length > 0 }]">
        <template v-if="rows.length > 0">
          <router-link
            v-for="item in rows"
            :key="String(item.id)"
            class="prow"
            :to="`/problem/${item.id}`"
          >
            <ProblemStatusIcon :status="statusOf(item.id)" />
            <span class="title">{{ item.title }}</span>
            <span class="tags">
              <span
                v-for="tag in getTopicTags(item.tags)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </span>
            <DifficultyLabel :difficulty="getDifficulty(item.tags)" />
            <span
              class="stat num tip-up"
              :data-tip="`通过 ${item.acceptedNum ?? 0} / 提交 ${
                item.submitNum ?? 0
              }`"
            >
              <AppIcon name="pie" :size="15" />
              {{ formatAcceptanceRate(item.acceptedNum, item.submitNum) }}
            </span>
            <span class="stat num submits" aria-label="提交次数">
              <AppIcon name="send" :size="15" />
              {{ formatCompactNumber(item.submitNum) }}
            </span>
          </router-link>
        </template>
        <template v-else-if="loading">
          <div v-for="index in 6" :key="index" class="prow skeleton">
            <i /><i /><i /><i />
          </div>
        </template>
        <div v-else class="empty">
          <CompanionAvatar :size="56" mood="confused" />
          <p>{{ loadFailed ? "题目没加载出来" : "没有符合条件的题" }}</p>
          <button
            v-if="loadFailed"
            class="btn sm"
            type="button"
            @click="loadRows"
          >
            <AppIcon name="refresh" :size="16" />
            重新加载
          </button>
          <button
            v-else-if="hasFilters"
            class="btn sm"
            type="button"
            @click="clearFilters"
          >
            清除筛选
          </button>
        </div>
      </div>

      <UiPagination
        class="pager"
        :current="filters.page"
        :total="rowTotal"
        :page-size="PAGE_SIZE"
        @change="setFilter({ page: $event }, false)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, ref, watch } from "vue";
import { LocationQuery, useRoute, useRouter } from "vue-router";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import ProblemStatusIcon from "@/components/problem/ProblemStatusIcon.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import UiSegmented from "@/components/ui/UiSegmented.vue";
import { useDismissable } from "@/composables/useDismissable";
import { useMyProgress } from "@/composables/useMyProgress";
import { toGeneratedApiId } from "@/services/apiId";
import { setProblemListContext } from "@/services/problemNavigation";
import { getLatestQuestionDraft } from "@/services/questionDraft";
import { formatAcceptanceRate } from "@/services/questionProgress";
import {
  getLanguageText,
  getSupportedLanguageOptions,
} from "@/services/questionStarterCode";
import { formatCompactNumber, formatRelativeTime } from "@/utils/dateTime";
import { Difficulty, getDifficulty, getTopicTags } from "@/utils/difficulty";
import {
  QuestionControllerService,
  QuestionQueryRequest,
  QuestionTagVO,
  QuestionVO,
} from "../../../generated";

const PAGE_SIZE = 15;
const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
const LEVEL_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];
const SORT_OPTIONS = [
  { value: "default", label: "默认顺序" },
  { value: "new", label: "最新发布" },
  { value: "hot", label: "提交最多" },
  { value: "ac", label: "通过最多" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];
const SORT_FIELDS: Record<SortValue, string | undefined> = {
  default: undefined,
  new: "createTime",
  hot: "submitNum",
  ac: "acceptedNum",
};
const RING_CIRCUMFERENCE = 2 * Math.PI * 15.5;

type Filters = {
  tag: string;
  level: string;
  q: string;
  page: number;
  todo: boolean;
  sort: SortValue;
};

const route = useRoute();
const router = useRouter();
const { userId, total, solved, load: loadProgress, statusOf } = useMyProgress();
const isLoggedIn = computed(() => userId.value != null);

// ===== 筛选条件都放在地址栏里，从做题页返回时还在 =====
const firstText = (value: LocationQuery[string]) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

const filters = computed<Filters>(() => {
  const query = route.query;
  const level = firstText(query.level);
  const sort = firstText(query.sort) as SortValue;
  const page = Number.parseInt(firstText(query.page), 10);
  return {
    tag: firstText(query.tag),
    level: LEVELS.includes(level as Difficulty) ? level : "all",
    q: firstText(query.q),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    todo: firstText(query.todo) === "1",
    sort: SORT_FIELDS[sort] !== undefined ? sort : "default",
  };
});

const hasFilters = computed(
  () =>
    !!filters.value.tag ||
    filters.value.level !== "all" ||
    !!filters.value.q ||
    filters.value.todo
);

/** 改筛选条件；除了翻页，改别的都回到第一页 */
const setFilter = (patch: Partial<Filters>, resetPage = true) => {
  const next: Filters = {
    ...filters.value,
    ...patch,
    ...(resetPage ? { page: 1 } : {}),
  };
  void router.replace({
    query: {
      ...(next.tag ? { tag: next.tag } : {}),
      ...(next.level !== "all" ? { level: next.level } : {}),
      ...(next.q ? { q: next.q } : {}),
      ...(next.page > 1 ? { page: String(next.page) } : {}),
      ...(next.todo ? { todo: "1" } : {}),
      ...(next.sort !== "default" ? { sort: next.sort } : {}),
    },
  });
};

const clearFilters = () => {
  keyword.value = "";
  setFilter({ tag: "", level: "all", q: "", todo: false });
};

// ===== 搜索框：停止输入 300ms 后再搜 =====
const keyword = ref(filters.value.q);
let keywordTimer: number | undefined;
watch(keyword, (value) => {
  window.clearTimeout(keywordTimer);
  keywordTimer = window.setTimeout(() => {
    if (value.trim() !== filters.value.q) setFilter({ q: value.trim() });
  }, 300);
});
watch(
  () => filters.value.q,
  (value) => {
    if (value !== keyword.value.trim()) keyword.value = value;
  }
);

// ===== 排序 =====
const sortRef = ref<HTMLElement | null>(null);
const sortOpen = ref(false);
useDismissable(sortRef, sortOpen);
const currentSort = computed(
  () =>
    SORT_OPTIONS.find(({ value }) => value === filters.value.sort) ??
    SORT_OPTIONS[0]
);
const chooseSort = (value: SortValue) => {
  sortOpen.value = false;
  setFilter({ sort: value });
};

// ===== 知识点 =====
const tagStats = ref<QuestionTagVO[]>([]);
const topics = computed(() => [
  { value: "", label: "全部" },
  ...tagStats.value
    .filter((item): item is QuestionTagVO & { tag: string } => !!item.tag)
    .map((item) => ({ value: item.tag, label: item.tag })),
]);

const loadTags = async () => {
  try {
    const response = await QuestionControllerService.listQuestionTags();
    if (response.code === 0) tagStats.value = response.data ?? [];
  } catch {
    // 没有知识点也能按难度和搜索找题
  }
};

// ===== 题目列表 =====
const rows = ref<QuestionVO[]>([]);
const rowTotal = ref(0);
const loading = ref(false);
const loadFailed = ref(false);
/** 不带任何筛选时的题目总数，没登录时标题旁的数字用它 */
const unfilteredTotal = ref<number | null>(null);
let loadGeneration = 0;

const libraryTotal = computed(() =>
  isLoggedIn.value && total.value.all > 0
    ? total.value.all
    : unfilteredTotal.value
);

const buildQuery = (): QuestionQueryRequest => {
  const { tag, level, q, page, todo, sort } = filters.value;
  const sortField = SORT_FIELDS[sort];
  return {
    current: page,
    pageSize: PAGE_SIZE,
    title: q || undefined,
    tags: tag ? [tag] : [],
    difficulty: level === "all" ? undefined : level,
    unsolvedOnly: todo && isLoggedIn.value ? true : undefined,
    ...(sortField ? { sortField, sortOrder: "descend" } : {}),
  };
};

const loadRows = async () => {
  const generation = ++loadGeneration;
  loading.value = true;
  loadFailed.value = false;
  try {
    const query = buildQuery();
    const response = await QuestionControllerService.listQuestionVoByPage(
      query
    );
    if (generation !== loadGeneration) return;
    if (response.code !== 0) {
      throw new Error(response.message || "加载题目失败");
    }
    rows.value = response.data?.records ?? [];
    rowTotal.value = response.data?.total ?? 0;
    // 做题页的上一题 / 下一题按这份列表走
    const listQuery = { ...query };
    delete listQuery.current;
    setProblemListContext({
      query: listQuery,
      page: filters.value.page,
      pageSize: PAGE_SIZE,
      total: rowTotal.value,
      items: rows.value,
    });
    if (!hasFilters.value) unfilteredTotal.value = rowTotal.value;
    // 翻到了不存在的页（比如筛选后题变少了），回到最后一页
    const lastPage = Math.max(1, Math.ceil(rowTotal.value / PAGE_SIZE));
    if (filters.value.page > lastPage) setFilter({ page: lastPage }, false);
  } catch (error) {
    if (generation !== loadGeneration) return;
    rows.value = [];
    rowTotal.value = 0;
    loadFailed.value = true;
    message.error(error instanceof Error ? error.message : "加载题目失败");
  } finally {
    if (generation === loadGeneration) loading.value = false;
  }
};

watch(
  () => route.query,
  () => {
    if (route.path === "/" || route.path === "/questions") void loadRows();
  }
);

// ===== 进度 =====
const ringLength = computed(() =>
  total.value.all > 0
    ? (Math.min(solved.value.all, total.value.all) / total.value.all) *
      RING_CIRCUMFERENCE
    : 0
);
const percent = (part?: number, whole?: number) =>
  whole ? `${Math.min(100, ((part ?? 0) / whole) * 100)}%` : "0%";

// ===== 继续上次 / 随机一题 =====
type Resume = { title: string; languageText: string; when: string; to: string };
const resume = ref<Resume | null>(null);

const loadResume = async () => {
  const draft = getLatestQuestionDraft(userId.value ?? "anonymous");
  if (!draft) {
    resume.value = null;
    return;
  }
  try {
    const [response, languages] = await Promise.all([
      QuestionControllerService.getQuestionVoById(
        toGeneratedApiId(draft.questionId)
      ),
      getSupportedLanguageOptions().catch(() => []),
    ]);
    if (response.code !== 0 || !response.data?.title) {
      resume.value = null;
      return;
    }
    resume.value = {
      title: response.data.title,
      languageText: getLanguageText(draft.language, languages),
      when: formatRelativeTime(draft.updatedAt),
      to: `/problem/${draft.questionId}?lang=${encodeURIComponent(
        draft.language
      )}`,
    };
  } catch {
    resume.value = null;
  }
};

const picking = ref(false);
const pickRandom = async () => {
  const count = libraryTotal.value ?? 0;
  if (count <= 0) return;
  picking.value = true;
  try {
    const response = await QuestionControllerService.listQuestionVoByPage({
      current: Math.floor(Math.random() * count) + 1,
      pageSize: 1,
    });
    const id = response.data?.records?.[0]?.id;
    if (response.code === 0 && id != null) {
      void router.push(`/problem/${id}`);
    }
  } finally {
    picking.value = false;
  }
};

watch(userId, () => {
  void loadProgress();
  void loadResume();
  if (filters.value.todo) void loadRows();
});

onMounted(() => {
  void loadRows();
  void loadTags();
  void loadProgress();
  void loadResume();
});
</script>

<style scoped>
/* 题少的时候题目面板一直撑到底，题多的时候整页往下滚 */
div.problems-page {
  flex: 1 0 auto;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  padding: 16px 20px 0 4px;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

/* ===== 上面两块：标题 + 继续上次，做题进度 ===== */
.top-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 14px;
}

.lead {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 22px;
  padding: 24px 26px;
}

.lead h1 {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0;
  color: var(--ink);
  font-size: 34px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.lead h1 span {
  color: var(--faint);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0;
}

.resume {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  background: var(--fill);
}

.resume-mascot {
  flex: none;
  --mascot-fill: var(--fill);
}

.resume-text {
  flex: 1;
  min-width: 0;
}

.resume-text b {
  display: block;
  overflow: hidden;
  color: var(--ink);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.resume-text span {
  color: var(--muted);
  font-size: 12.5px;
}

.progress {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 30px;
  padding: 22px 26px;
}

.progress.guest {
  grid-template-columns: minmax(0, 1fr) auto;
}

.progress.guest p {
  margin: 0;
  color: var(--muted);
}

.ring {
  position: relative;
  width: 118px;
  height: 118px;
}

.ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring circle {
  fill: none;
  stroke-width: 3;
}

.ring-track {
  stroke: var(--fill);
}

.ring-value {
  stroke: var(--ink);
  stroke-linecap: round;
  transition: stroke-dasharray var(--motion-layout) var(--ease-out);
}

.ring-label {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
}

.ring-label b {
  color: var(--ink);
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}

.ring-label span {
  margin-top: 4px;
  color: var(--faint);
  font-size: 12.5px;
}

.bars {
  display: grid;
  gap: 16px;
}

.bar-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 14px;
}

.bar {
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--fill);
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width var(--motion-layout) var(--ease-out);
}

.bar i.easy {
  background: var(--easy);
}

.bar i.medium {
  background: var(--medium);
}

.bar i.hard {
  background: var(--hard);
}

.bar-count {
  color: var(--faint);
  font-size: 13px;
  text-align: right;
}

.bar-count b {
  color: var(--ink);
  font-weight: 600;
}

/* ===== 题目面板 ===== */
.problems {
  display: flex;
  flex-direction: column;
  min-height: 360px;
  overflow: hidden;
}

.topics {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  height: 50px;
  padding: 0 24px;
  overflow-x: auto;
  border-bottom: 1px solid var(--line);
  scrollbar-width: none;
}

.topics::-webkit-scrollbar {
  display: none;
}

.topics button {
  position: relative;
  flex: none;
  height: 50px;
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 14.5px;
  white-space: nowrap;
  cursor: pointer;
}

.topics button:hover {
  color: var(--ink);
}

.topics button.on {
  color: var(--ink);
  font-weight: 600;
}

.topics button.on::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--ink);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px 18px;
}

.search {
  flex: 1;
  max-width: 420px;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 0 16px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
}

.search:focus-within {
  box-shadow: var(--focus-ring);
}

.search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
}

.search input::placeholder {
  color: var(--faint);
}

.search input::-webkit-search-cancel-button {
  display: none;
}

.search .clear {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.search .clear:hover {
  background: var(--fill-strong);
  color: var(--ink);
}

.toolbar-end {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.sort {
  position: relative;
}

.menu {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-float);
}

.menu-item {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--body);
  font-size: 14px;
  cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
  background: var(--fill);
  color: var(--ink);
}

/* ===== 一行一道题 ===== */
.plist {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 8px 6px;
  transition: opacity var(--motion-fast) ease;
}

.plist.stale {
  opacity: 0.55;
}

.prow {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 210px 86px 92px 72px;
  align-items: center;
  gap: 12px;
  height: 58px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
}

.prow + .prow {
  box-shadow: 0 -1px 0 var(--line);
}

.prow:hover,
.prow:focus-visible {
  background: var(--fill);
  box-shadow: none;
}

.prow:hover + .prow,
.prow:focus-visible + .prow {
  box-shadow: none;
}

.title {
  overflow: hidden;
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tags {
  display: flex;
  gap: 6px;
  overflow: hidden;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
  font-size: 12.5px;
  white-space: nowrap;
}

.prow:hover .tag {
  background: var(--panel);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}

.skeleton i {
  height: 12px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  animation: skeleton 1.2s ease-in-out infinite alternate;
}

.skeleton i:nth-child(1) {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.skeleton i:nth-child(2) {
  width: 46%;
}

.skeleton i:nth-child(3) {
  width: 70%;
}

@keyframes skeleton {
  to {
    opacity: 0.4;
  }
}

.empty {
  flex: 1;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--muted);
}

.empty p {
  margin: 0;
}

.pager {
  padding: 12px 0 16px;
  border-top: 1px solid var(--line);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton i {
    animation: none;
  }
}

@media (max-width: 1100px) {
  .prow {
    grid-template-columns: 28px minmax(0, 1fr) 150px 80px 84px;
  }

  .submits {
    display: none;
  }
}

@media (max-width: 900px) {
  .top-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolbar {
    flex-wrap: wrap;
  }

  .search {
    flex-basis: 100%;
    max-width: none;
  }

  .prow {
    grid-template-columns: 24px minmax(0, 1fr) 64px 64px;
  }

  .tags {
    display: none;
  }
}

@media (max-width: 720px) {
  div.problems-page {
    padding: 12px 12px 0;
  }

  .progress {
    gap: 20px;
    padding: 18px;
  }

  .ring {
    width: 92px;
    height: 92px;
  }

  .ring-label b {
    font-size: 24px;
  }
}
</style>
