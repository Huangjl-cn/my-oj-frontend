<template>
  <div class="page">
    <section class="panel page-head">
      <div>
        <h1>学习统计</h1>
        <p class="head-sub">只有你能看到</p>
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

    <p v-if="error" class="panel load-error" role="alert">
      {{ error }}
      <button type="button" @click="reload">重试</button>
    </p>

    <!-- 便当格：12 列，每一行的卡片等高、铺满 -->
    <div :class="['bento', { loading }]">
      <SubmitCalendar
        class="calendar-card"
        :weeks="calendarWeeks"
        :show-stats="false"
        fill
      >
        <template #footer>
          <div class="cal-facts">
            <div>
              <span>活跃天数</span><b class="num">{{ summary.activeDays }}</b>
            </div>
            <div>
              <span>本月提交</span><b class="num">{{ summary.monthSubmits }}</b>
            </div>
            <div>
              <span>单日最多</span><b class="num">{{ summary.maxDay }}</b>
            </div>
            <div>
              <span>最常在</span><b>{{ busiest || "--" }}</b>
            </div>
          </div>
        </template>
      </SubmitCalendar>

      <section class="panel tile">
        <div class="tile-top">
          <div>
            <span class="tile-label">已通过</span>
            <b class="num"
              >{{ solved.all }}<small>/ {{ total.all }}</small></b
            >
          </div>
          <svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
            <circle class="ring-track" cx="18" cy="18" r="15" />
            <circle
              class="ring-value"
              cx="18"
              cy="18"
              r="15"
              :stroke-dasharray="`${ringLength(solved.all, total.all)} 94.25`"
            />
          </svg>
        </div>
        <span class="tile-sub">一次就过 {{ stats.firstTrySolved }}</span>
      </section>

      <section class="panel tile">
        <div>
          <span class="tile-label">提交</span>
          <b class="num">{{ totals.submits }}</b>
        </div>
        <svg
          class="spark"
          viewBox="0 0 120 30"
          preserveAspectRatio="none"
          role="img"
          :aria-label="`最近 12 周每周提交：${summary.weekly.join('、')}`"
        >
          <polyline :points="sparkline" />
        </svg>
        <span class="tile-sub"
          >本周 {{ summary.thisWeek }} · 上周 {{ summary.lastWeek }}</span
        >
      </section>

      <section class="panel tile">
        <div>
          <span class="tile-label">通过率</span>
          <b class="num">{{ acceptRate }}</b>
        </div>
        <span
          class="segments"
          role="img"
          :aria-label="
            segments.map((s) => `${s.text} ${s.percent}%`).join('，')
          "
        >
          <i
            v-for="segment in segments"
            :key="segment.key"
            :class="segment.key"
            :style="{ width: `${segment.percent}%` }"
            :title="`${segment.text} ${segment.percent}%`"
          />
        </span>
        <span class="tile-sub">{{ failureNote || "还没有判完的提交" }}</span>
      </section>

      <section class="panel tile">
        <div>
          <span class="tile-label">连续做题</span>
          <b class="num">{{ streaks.current }}<small>天</small></b>
        </div>
        <span class="week" aria-label="本周每天有没有做题">
          <span v-for="(done, index) in summary.weekDays" :key="index">
            <i :class="{ on: done }" />{{ WEEKDAYS[index] }}
          </span>
        </span>
        <span class="tile-sub">最长 {{ streaks.longest }} 天</span>
      </section>

      <section class="panel block tags-card">
        <header class="block-head">
          <h2>按标签</h2>
          <span class="legend" aria-hidden="true">
            <i class="dot solved" />通过 <i class="dot tried" />没通过
          </span>
        </header>
        <ul v-if="visibleTags.length" class="tag-grid">
          <li v-for="item in visibleTags" :key="item.tag" class="bar-item">
            <router-link
              class="bar-name"
              :to="{ path: '/', query: { tag: item.tag } }"
              :title="`题库里的「${item.tag}」`"
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
        <p v-else-if="!loading" class="empty">还没有带标签的题</p>
        <button
          v-if="stats.tags.length > TAG_PREVIEW_COUNT"
          class="more"
          type="button"
          :aria-expanded="showAllTags"
          @click="showAllTags = !showAllTags"
        >
          {{ showAllTags ? "收起" : `全部 ${stats.tags.length} 个` }}
          <AppIcon
            name="chevron-down"
            :size="14"
            :class="{ flipped: showAllTags }"
          />
        </button>
      </section>

      <section class="panel block side-card">
        <header class="block-head">
          <h2>按难度</h2>
        </header>
        <DifficultyBars class="spread" :total="total" :solved="solved" />
      </section>

      <section class="panel block side-card">
        <header class="block-head">
          <h2>语言</h2>
          <span class="legend">提交次数</span>
        </header>
        <ul v-if="stats.languages.length" class="bar-list spread">
          <li
            v-for="item in stats.languages.slice(0, 5)"
            :key="item.language"
            class="bar-item"
          >
            <span class="bar-name" :title="item.name">{{ item.name }}</span>
            <span class="bar" aria-hidden="true">
              <i
                class="lang"
                :style="{ width: barWidth(item.submits, maxLanguageSubmits) }"
              />
            </span>
            <span class="bar-count num" :title="`通过 ${item.solved} 题`">{{
              item.submits
            }}</span>
          </li>
        </ul>
        <p v-else-if="!loading" class="empty">还没有提交</p>
      </section>

      <section class="panel block recent-card">
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
          <li
            v-for="item in stats.recentSolved.slice(0, RECENT_COUNT)"
            :key="item.questionId"
          >
            <router-link
              class="recent-title"
              :to="`/problem/${item.questionId}`"
            >
              {{ item.title }}
            </router-link>
            <DifficultyLabel
              v-if="getDifficulty(item.tags)"
              :difficulty="getDifficulty(item.tags)"
            />
            <span v-else />
            <span :class="['attempts', { first: item.attempts === 1 }]">
              {{ describeAttempts(item.attempts) }}
            </span>
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
          <CompanionAvatar mood="encouraging" :size="56" />
          <p>还没有通过的题</p>
          <router-link class="btn sm primary" to="/">去题库</router-link>
        </div>
      </section>

      <section class="panel block first-card">
        <div class="tile-top">
          <div>
            <span class="tile-label">一次就过</span>
            <b class="num">{{ stats.firstTrySolved }}<small>题</small></b>
          </div>
          <svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
            <circle class="ring-track" cx="18" cy="18" r="15" />
            <circle
              class="ring-value first"
              cx="18"
              cy="18"
              r="15"
              :stroke-dasharray="`${ringLength(
                stats.firstTrySolved,
                solved.all
              )} 94.25`"
            />
          </svg>
        </div>
        <div v-if="stats.firstTryRecent.length" class="chips">
          <router-link
            v-for="item in stats.firstTryRecent"
            :key="item.questionId"
            class="chip"
            :to="`/problem/${item.questionId}`"
          >
            {{ item.title }}
          </router-link>
          <span v-if="moreFirstTry > 0" class="chip faint"
            >还有 {{ moreFirstTry }} 题</span
          >
        </div>
        <p
          v-if="!stats.firstTryRecent.length && !stats.stuckTags.length"
          class="empty"
        >
          还没有
        </p>
        <template v-if="stats.stuckTags.length">
          <h3 class="sub-head">最常卡住（平均第几次过）</h3>
          <ul class="bar-list">
            <li
              v-for="item in stats.stuckTags"
              :key="item.tag"
              class="bar-item"
            >
              <span class="bar-name">{{ item.tag }}</span>
              <span class="bar" aria-hidden="true">
                <i class="stuck" :style="{ width: stuckWidth(item.average) }" />
              </span>
              <span class="bar-count num">{{ item.average.toFixed(1) }}</span>
            </li>
          </ul>
        </template>
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
  busiestHours,
  describeAttempts,
  EMPTY_LEARNING_STATS,
  LearningStats,
  loadLearningStats,
  sparklinePoints,
  summarizeCalendar,
  TAG_PREVIEW_COUNT,
  verdictSegments,
} from "@/services/learningStats";
import { formatAcceptanceRate } from "@/services/questionProgress";
import { formatDateTime, formatRelativeTime } from "@/utils/dateTime";
import { getDifficulty } from "@/utils/difficulty";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
/** 最近通过列几道（和右边那张卡一样高） */
const RECENT_COUNT = 6;
/** 进度环的周长（r = 15） */
const RING = 94.25;

const { total, solved, load: loadProgress } = useMyProgress();
const { days, totals, streaks, load: loadCalendar } = useSubmitCalendar();

const stats = ref<LearningStats>(EMPTY_LEARNING_STATS);
const loading = ref(false);
const error = ref("");
const showAllTags = ref(false);

const summary = computed(() => summarizeCalendar(days.value, new Date()));
const sparkline = computed(() => sparklinePoints(summary.value.weekly));
const busiest = computed(() => busiestHours(stats.value.hourCounts));
const segments = computed(() => verdictSegments(stats.value.verdicts));

const acceptRate = computed(() =>
  formatAcceptanceRate(totals.value.accepted, totals.value.submits)
);

/** 没通过的里面最多的两类，比如「答案错误 22% · 超时 / 超内存 9%」 */
const failureNote = computed(() =>
  segments.value
    .filter((item) => item.key !== "accepted")
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2)
    .map((item) => `${item.text} ${item.percent}%`)
    .join(" · ")
);

const visibleTags = computed(() =>
  showAllTags.value
    ? stats.value.tags
    : stats.value.tags.slice(0, TAG_PREVIEW_COUNT)
);
const maxLanguageSubmits = computed(() =>
  Math.max(0, ...stats.value.languages.map((item) => item.submits))
);
const moreFirstTry = computed(
  () => stats.value.firstTrySolved - stats.value.firstTryRecent.length
);
const maxStuck = computed(() =>
  Math.max(1, ...stats.value.stuckTags.map((item) => item.average))
);

const ringLength = (part: number, whole: number) =>
  whole > 0 ? Math.round((Math.min(part, whole) / whole) * RING * 10) / 10 : 0;

const stuckWidth = (average: number) =>
  `${Math.round((average / maxStuck.value) * 100)}%`;

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
/* === 便当格：12 列；日历占左 8 列两行，右边 2×2 四个数字 === */
.bento {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  /* 页面比内容高时各行保持自己的高度，不被拉长 */
  align-content: start;
  gap: 14px;
  padding-bottom: 20px;
  transition: opacity var(--motion-fast) ease;
}

.bento.loading {
  opacity: 0.6;
}

.calendar-card {
  grid-column: span 8;
  grid-row: span 2;
}

.tile {
  grid-column: span 2;
}

.tags-card {
  grid-column: span 6;
}

.side-card {
  grid-column: span 3;
}

.recent-card {
  grid-column: span 8;
}

.first-card {
  grid-column: span 4;
}

/* 日历底下的一排概况 */
.cal-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.cal-facts div {
  display: grid;
  gap: 1px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.cal-facts span {
  color: var(--faint);
  font-size: 12px;
}

.cal-facts b {
  overflow: hidden;
  color: var(--ink);
  font-size: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* === 四个数字卡：数字 + 一张小图 === */
.tile {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 18px;
}

.tile-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.tile-label {
  display: block;
  color: var(--muted);
  font-size: 13px;
}

.tile b,
.first-card b {
  color: var(--ink);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.tile small,
.first-card small {
  margin-left: 3px;
  color: var(--faint);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
}

.tile-sub {
  color: var(--faint);
  font-size: 12.5px;
}

.ring {
  width: 50px;
  height: 50px;
  flex: none;
  transform: rotate(-90deg);
}

.ring circle {
  fill: none;
  stroke-width: 4;
}

.ring-track {
  stroke: var(--fill-strong);
}

.ring-value {
  stroke: var(--ink);
  stroke-linecap: round;
  transition: stroke-dasharray var(--motion-standard) var(--ease-out);
}

.ring-value.first {
  stroke: var(--success);
}

.spark {
  width: 100%;
  height: 30px;
  overflow: visible;
}

.spark polyline {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.segments {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--fill-strong);
}

.segments i {
  display: block;
  height: 100%;
}

.segments .accepted {
  background: var(--ink);
}

.segments .wrong {
  background: var(--medium);
}

.segments .limit {
  background: var(--hard);
}

.segments .error {
  background: var(--faint);
}

.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.week span {
  display: grid;
  justify-items: center;
  gap: 3px;
  color: var(--faint);
  font-size: 10.5px;
}

.week i {
  width: 100%;
  height: 8px;
  border-radius: 3px;
  background: var(--fill-strong);
}

.week i.on {
  background: var(--ink);
}

/* === 下面几张卡 === */
.block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
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

/* 同一行里比别人矮的卡：内容在高度里匀开，不留一截空白 */
.spread {
  flex: 1;
  align-content: space-around;
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

/* 标签两列排 */
.tag-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bar-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bar-item {
  display: grid;
  grid-template-columns: minmax(56px, 88px) minmax(0, 1fr) 44px;
  align-items: center;
  gap: 10px;
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

.stuck {
  border-radius: var(--radius-pill);
  background: var(--medium);
}

.bar-count {
  color: var(--muted);
  font-size: 12.5px;
  text-align: right;
}

.more {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
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
  margin: -4px -10px;
  padding: 0;
  list-style: none;
}

.recent-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px 92px 72px;
  align-items: center;
  gap: 14px;
  padding: 9px 10px;
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

.attempts {
  color: var(--muted);
  font-size: 12.5px;
  white-space: nowrap;
}

.attempts.first {
  color: var(--success);
  font-weight: 600;
}

.recent-time {
  color: var(--faint);
  font-size: 12.5px;
  text-align: right;
  white-space: nowrap;
}

/* === 一次就过 + 最常卡住 === */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  max-width: 100%;
  overflow: hidden;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  font-size: 12.5px;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-decoration: none;
}

a.chip:hover {
  background: var(--fill-strong);
  color: var(--ink);
}

.chip.faint {
  color: var(--faint);
}

.sub-head {
  margin: 4px 0 -4px;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 500;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin: auto;
  padding: 8px 0;
  color: var(--muted);
  font-size: 13.5px;
  text-align: center;
  --mascot-fill: var(--panel);
}

.empty-state p {
  margin: 0;
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

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 中等宽度：日历通栏，四个数字一行；下面两两一行 */
@media (max-width: 1279px) {
  .calendar-card {
    grid-column: span 12;
    grid-row: auto;
  }

  .tile {
    grid-column: span 3;
  }

  .tags-card,
  .recent-card,
  .first-card {
    grid-column: span 12;
  }

  .side-card {
    grid-column: span 6;
  }
}

@media (max-width: 760px) {
  .tile,
  .side-card {
    grid-column: span 6;
  }

  .side-card {
    grid-column: span 12;
  }

  .tag-grid,
  .cal-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recent-list li {
    grid-template-columns: minmax(0, 1fr) auto 64px;
  }

  .recent-list li > :nth-child(2) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
  }

  .bar i,
  .ring-value {
    transition: none;
  }
}
</style>
