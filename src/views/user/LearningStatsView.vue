<template>
  <div class="page">
    <section class="panel page-head">
      <div>
        <h1>学习统计</h1>
        <p class="head-sub">根据你的全部提交统计，只有你自己看得到。</p>
      </div>
      <div class="head-end">
        <button
          class="icon-btn tip-down tip-end"
          type="button"
          data-tip="刷新"
          aria-label="刷新统计"
          :disabled="loading"
          @click="reload"
        >
          <AppIcon
            :name="loading ? 'spinner' : 'refresh'"
            :size="18"
            :class="{ spin: loading }"
          />
        </button>
      </div>
    </section>

    <div class="stats-body">
      <section class="tiles" aria-label="概览">
        <div class="panel tile">
          <span class="tile-label">已通过</span>
          <b class="num">
            {{ solved.all }}<small> / {{ total.all }} 题</small>
          </b>
          <span class="tile-sub">一次通过 {{ stats.firstTrySolved }} 题</span>
        </div>
        <div class="panel tile">
          <span class="tile-label">提交</span>
          <b class="num">{{ totals.submits }}<small> 次</small></b>
          <span class="tile-sub">本周 {{ thisWeekSubmits }} 次</span>
        </div>
        <div class="panel tile">
          <span class="tile-label">通过率</span>
          <b class="num">{{ acceptRate }}</b>
          <span class="tile-sub">通过 {{ totals.accepted }} 次</span>
        </div>
        <div class="panel tile">
          <span class="tile-label">连续做题</span>
          <b class="num">{{ streaks.current }}<small> 天</small></b>
          <span class="tile-sub">最长 {{ streaks.longest }} 天</span>
        </div>
      </section>

      <SubmitCalendar :weeks="calendarWeeks" :show-stats="false" />

      <p v-if="error" class="panel load-error" role="alert">
        {{ error }}
        <button type="button" @click="reload">重试</button>
      </p>

      <div :class="['split', { loading }]">
        <section class="panel block">
          <header class="block-head">
            <h2>按标签</h2>
            <span class="legend" aria-hidden="true">
              <i class="dot solved" />已通过 <i class="dot tried" />做过没通过
            </span>
          </header>
          <ul v-if="visibleTags.length" class="bar-list">
            <li v-for="item in visibleTags" :key="item.tag" class="bar-item">
              <router-link
                class="bar-name"
                :to="{ path: '/', query: { tag: item.tag } }"
                :title="`去题库看「${item.tag}」的题`"
              >
                {{ item.tag }}
              </router-link>
              <span class="bar" aria-hidden="true">
                <i
                  class="solved"
                  :style="{ width: barWidth(item.solved, item.total) }"
                />
                <i
                  class="tried"
                  :style="{ width: barWidth(item.attempted, item.total) }"
                />
              </span>
              <span class="bar-count num">
                {{ item.solved }} / {{ item.total }}
              </span>
            </li>
          </ul>
          <p v-else-if="!loading" class="empty">题库里还没有带标签的题</p>
          <button
            v-if="stats.tags.length > TAG_PREVIEW_COUNT"
            class="more"
            type="button"
            :aria-expanded="showAllTags"
            @click="showAllTags = !showAllTags"
          >
            {{ showAllTags ? "收起" : `展开全部 ${stats.tags.length} 个标签` }}
            <AppIcon
              name="chevron-down"
              :size="14"
              :class="{ flipped: showAllTags }"
            />
          </button>
        </section>

        <div class="side">
          <section class="panel block">
            <header class="block-head">
              <h2>按难度</h2>
            </header>
            <DifficultyBars :total="total" :solved="solved" />
          </section>

          <section class="panel block">
            <header class="block-head">
              <h2>语言</h2>
            </header>
            <ul v-if="stats.languages.length" class="bar-list">
              <li
                v-for="item in stats.languages"
                :key="item.language"
                class="bar-item"
              >
                <span class="bar-name" :title="item.name">{{ item.name }}</span>
                <span class="bar" aria-hidden="true">
                  <i
                    class="lang"
                    :style="{
                      width: barWidth(item.submits, maxLanguageSubmits),
                    }"
                  />
                </span>
                <span class="bar-count num">{{ item.submits }} 次</span>
                <span class="bar-note">通过 {{ item.solved }} 题</span>
              </li>
            </ul>
            <p v-else-if="!loading" class="empty">还没有提交过代码</p>
          </section>
        </div>
      </div>

      <section :class="['panel', 'block', 'recent', { loading }]">
        <header class="block-head">
          <h2>最近通过</h2>
          <router-link
            v-if="stats.recentSolved.length"
            class="head-link"
            to="/question_submit"
          >
            全部提交
            <AppIcon name="chevron-right" :size="14" />
          </router-link>
        </header>
        <ol v-if="stats.recentSolved.length" class="recent-list">
          <li v-for="item in stats.recentSolved" :key="item.questionId">
            <router-link
              class="recent-title"
              :to="`/problem/${item.questionId}`"
            >
              {{ item.title }}
            </router-link>
            <span class="recent-meta">
              <DifficultyLabel
                v-if="getDifficulty(item.tags)"
                :difficulty="getDifficulty(item.tags)"
              />
              <span
                v-for="tag in getTopicTags(item.tags).slice(0, 2)"
                :key="tag"
                class="recent-tag"
              >
                {{ tag }}
              </span>
            </span>
            <span :class="['attempts', { first: item.attempts === 1 }]">
              {{ describeAttempts(item.attempts) }}
            </span>
            <span class="recent-lang">{{ item.language }}</span>
            <time
              class="recent-time num"
              :datetime="item.solvedTime"
              :title="formatDateTime(item.solvedTime)"
            >
              {{ relativeTime(item.solvedTime) }}
            </time>
          </li>
        </ol>
        <div v-else-if="!loading" class="empty-state">
          <CompanionAvatar mood="encouraging" :size="64" />
          <p>还没有通过的题。挑一道简单的开始吧，鸭鸭陪你。</p>
          <router-link class="btn sm primary" to="/">
            <AppIcon name="book" :size="16" />
            去题库
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import DifficultyBars from "@/components/user/DifficultyBars.vue";
import SubmitCalendar from "@/components/user/SubmitCalendar.vue";
import { useMyProgress } from "@/composables/useMyProgress";
import { useSubmitCalendar } from "@/composables/useSubmitCalendar";
import {
  barWidth,
  describeAttempts,
  EMPTY_LEARNING_STATS,
  LearningStats,
  loadLearningStats,
  TAG_PREVIEW_COUNT,
} from "@/services/learningStats";
import { formatAcceptanceRate } from "@/services/questionProgress";
import { formatDateTime, formatRelativeTime } from "@/utils/dateTime";
import { getDifficulty, getTopicTags } from "@/utils/difficulty";

const { total, solved, load: loadProgress } = useMyProgress();
const {
  totals,
  streaks,
  thisWeekSubmits,
  load: loadCalendar,
} = useSubmitCalendar();

const stats = ref<LearningStats>(EMPTY_LEARNING_STATS);
const loading = ref(false);
const error = ref("");
const showAllTags = ref(false);

const acceptRate = computed(() =>
  formatAcceptanceRate(totals.value.accepted, totals.value.submits)
);
const visibleTags = computed(() =>
  showAllTags.value
    ? stats.value.tags
    : stats.value.tags.slice(0, TAG_PREVIEW_COUNT)
);
const maxLanguageSubmits = computed(() =>
  Math.max(0, ...stats.value.languages.map((item) => item.submits))
);

const relativeTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? "--" : formatRelativeTime(time);
};

// 日历按页面宽度画：宽屏一整年，窄一点少画几周，格子不会挤成一条线
const pickWeeks = () => {
  const width = window.innerWidth;
  if (width >= 1280) return 52;
  if (width >= 1000) return 40;
  if (width >= 760) return 26;
  return 16;
};
const calendarWeeks = ref(pickWeeks());
let resizeFrame = 0;
const onResize = () => {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    calendarWeeks.value = pickWeeks();
  });
};

const reload = async () => {
  loading.value = true;
  error.value = "";
  // 进度和日历各自有共享的缓存，这里强制取最新；日历组件挂载时也会自己取一次
  void loadProgress(true);
  void loadCalendar(true);
  try {
    stats.value = await loadLearningStats();
  } catch (cause) {
    error.value =
      cause instanceof Error && cause.message
        ? cause.message
        : "学习统计没加载出来";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", onResize, { passive: true });
  void reload();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
});
</script>

<style scoped>
/* 页面比内容高时（大屏），面板保持自己的高度往上靠，不被拉长 */
.stats-body {
  display: grid;
  align-content: start;
  gap: 14px;
  padding-bottom: 20px;
}

/* === 四个数 === */
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.tile {
  display: grid;
  gap: 2px;
  padding: 18px 20px;
}

.tile-label {
  color: var(--muted);
  font-size: 13px;
}

.tile b {
  color: var(--ink);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.tile small {
  margin-left: 2px;
  color: var(--faint);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
}

.tile-sub {
  color: var(--faint);
  font-size: 12.5px;
}

/* === 中间两栏：标签在左，难度和语言在右 === */
.split {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
  align-items: start;
  gap: 14px;
  transition: opacity var(--motion-fast) ease;
}

.side {
  display: grid;
  gap: 14px;
}

.loading {
  opacity: 0.55;
}

.block {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 20px 22px;
}

.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.block-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--faint);
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dot.tried {
  margin-left: 6px;
}

.head-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--muted);
  font-size: 13px;
  text-decoration: none;
}

.head-link:hover {
  color: var(--ink);
}

/* === 条形图：名字 | 条 | 数字 === */
.bar-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bar-item {
  display: grid;
  grid-template-columns: minmax(64px, 132px) minmax(0, 1fr) 64px;
  align-items: center;
  gap: 4px 12px;
}

.bar-name {
  overflow: hidden;
  color: var(--body);
  font-size: 13.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-decoration: none;
}

a.bar-name:hover {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.bar {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--fill);
}

.bar i {
  display: block;
  height: 100%;
  transition: width var(--motion-standard) var(--ease-out);
}

.solved {
  background: var(--ink);
}

.tried {
  background: color-mix(in srgb, var(--ink) 22%, var(--fill-strong));
}

.lang {
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--ink) 62%, var(--fill-strong));
}

.bar-count {
  color: var(--muted);
  font-size: 12.5px;
  text-align: right;
}

.bar-note {
  grid-column: 2 / -1;
  margin-top: -6px;
  color: var(--faint);
  font-size: 12px;
}

.more {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.more:hover {
  color: var(--ink);
}

.flipped {
  transform: rotate(180deg);
}

.empty {
  margin: 0;
  color: var(--faint);
  font-size: 13px;
}

/* === 最近通过 === */
.recent-list {
  display: grid;
  margin: 0 -10px;
  padding: 0;
  list-style: none;
}

.recent-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 84px minmax(0, 150px) 76px;
  align-items: center;
  gap: 16px;
  padding: 11px 10px;
  border-radius: var(--radius-sm);
}

.recent-list li:hover {
  background: var(--fill);
}

.recent-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-decoration: none;
}

.recent-title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.recent-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.recent-tag {
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}

.recent-list li:hover .recent-tag {
  background: var(--panel);
}

.attempts {
  color: var(--muted);
  font-size: 12.5px;
  white-space: nowrap;
}

.attempts.first {
  color: var(--success);
  font-weight: 600;
}

.recent-lang {
  overflow: hidden;
  color: var(--faint);
  font-size: 12.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.recent-time {
  color: var(--faint);
  font-size: 12.5px;
  text-align: right;
  white-space: nowrap;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 12px 0 8px;
  color: var(--muted);
  font-size: 13.5px;
  text-align: center;
  --mascot-fill: var(--panel);
}

.empty-state p {
  margin: 0;
}

.load-error {
  margin: 0;
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

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .split {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    align-items: start;
  }
}

@media (max-width: 900px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recent-list li {
    grid-template-columns: minmax(0, 1fr) auto 64px;
    gap: 4px 12px;
  }

  .recent-meta {
    grid-column: 1;
    grid-row: 2;
  }

  .recent-lang {
    display: none;
  }

  .recent-time {
    grid-row: 1 / span 2;
    grid-column: 3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
  }

  .bar i {
    transition: none;
  }
}
</style>
