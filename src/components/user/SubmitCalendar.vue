<template>
  <section
    :class="['panel', 'calendar', { fill }]"
    :style="{ '--weeks': weekCount }"
  >
    <header class="calendar-head">
      <h2>做题日历</h2>
      <span class="range">最近 {{ weekCount }} 周</span>
    </header>

    <div v-if="showStats" class="stats">
      <div>
        <b class="num">{{ totals.submits }}</b>
        <span>次提交</span>
      </div>
      <div>
        <b class="num">{{ acceptRate }}</b>
        <span>通过率</span>
      </div>
      <div>
        <b class="num">{{ streaks.current }}</b>
        <span>天连续</span>
      </div>
    </div>

    <p v-if="failed" class="failed">
      日历没加载出来
      <button type="button" @click="load(true)">重试</button>
    </p>
    <template v-else>
      <div class="months" aria-hidden="true">
        <span
          v-for="month in months"
          :key="month.index"
          :style="{ gridColumn: `${month.index + 1} / span 4` }"
        >
          {{ month.label }}
        </span>
      </div>
      <div
        :class="['grid', { loading }]"
        role="img"
        :aria-label="`最近 ${weekCount} 周提交了 ${recentSubmits} 次`"
      >
        <template v-for="(week, column) in columns" :key="column">
          <i
            v-for="cell in week"
            :key="cell.date"
            :class="[
              'cell',
              'tip-up',
              `l${cell.level}`,
              { future: cell.future },
            ]"
            :data-tip="cell.future ? undefined : describe(cell)"
          />
        </template>
      </div>
      <footer class="legend">
        <span>最长连续 {{ streaks.longest }} 天</span>
        <span class="scale" aria-hidden="true">
          少
          <i
            v-for="level in 5"
            :key="level"
            :class="['cell', `l${level - 1}`]"
          />
          多
        </span>
      </footer>
    </template>
    <!-- 铺满模式下贴在底部的内容（学习统计页的一排概况） -->
    <div v-if="$slots.footer" class="calendar-footer">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps, onMounted } from "vue";

import { useSubmitCalendar } from "@/composables/useSubmitCalendar";
import { formatAcceptanceRate } from "@/services/questionProgress";
import {
  buildCalendarWeeks,
  CalendarCell,
  monthLabels,
} from "@/utils/submitCalendar";

const props = defineProps({
  /** 画多少周（个人中心 20 周，学习统计页按宽度给）；连续天数总是按接口返回的一整年算 */
  weeks: { type: Number, default: 20 },
  /** 顶上那排数字（提交次数、通过率、连续天数）；学习统计页上面已经有了，就不重复 */
  showStats: { type: Boolean, default: true },
  /** 格子按宽度铺满（不限制最大宽度），高度跟着面板拉伸，footer 贴底 */
  fill: { type: Boolean, default: false },
});

const weekCount = computed(() =>
  Math.max(8, Math.min(53, Math.round(props.weeks)))
);

const { days, totals, loading, failed, streaks, load } = useSubmitCalendar();
const today = new Date();

// 一列一周（不能叫 weeks，会和同名的 prop 撞上）
const columns = computed(() =>
  buildCalendarWeeks(days.value, today, weekCount.value)
);
// 两个月份挨得太近（比如第一列正好是上个月最后一周）时只留后一个，免得叠在一起
const months = computed(() =>
  monthLabels(columns.value).filter(
    (month, index, labels) =>
      index === labels.length - 1 || labels[index + 1].index - month.index >= 3
  )
);
const recentSubmits = computed(() =>
  columns.value.flat().reduce((sum, cell) => sum + cell.count, 0)
);
const acceptRate = computed(() =>
  formatAcceptanceRate(totals.value.accepted, totals.value.submits)
);

const describe = (cell: CalendarCell) => {
  const [, month, day] = cell.date.split("-").map(Number);
  if (!cell.count) return `${month}月${day}日 没有提交`;
  return `${month}月${day}日 提交 ${cell.count} 次${
    cell.accepted ? `，通过 ${cell.accepted} 次` : ""
  }`;
};

// 进个人中心时总是取最新的
onMounted(() => load(true));
</script>

<style scoped>
.calendar {
  display: grid;
  gap: 14px;
  padding: 20px 22px 18px;
}

.calendar-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

h2 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.range {
  color: var(--faint);
  font-size: 12.5px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stats div {
  display: grid;
  gap: 1px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.stats b {
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.stats span {
  color: var(--faint);
  font-size: 12px;
}

/* 月份和格子用同一套列，一周一列；格子最大约 18px，宽面板里不会撑得太大 */
.months,
.grid {
  display: grid;
  grid-template-columns: repeat(var(--weeks, 20), minmax(0, 1fr));
  column-gap: 3px;
  max-width: calc(var(--weeks, 20) * 21px);
}

.months {
  height: 14px;
  color: var(--faint);
  font-size: 11px;
  line-height: 14px;
  white-space: nowrap;
}

.months span {
  grid-row: 1;
}

.grid {
  grid-template-rows: repeat(7, auto);
  grid-auto-flow: column;
  row-gap: 3px;
  margin-top: -8px;
  transition: opacity var(--motion-fast) ease;
}

.grid.loading {
  opacity: 0.4;
}

.cell {
  display: block;
  aspect-ratio: 1;
  border-radius: 3px;
}

/* 只用黑白灰：提交越多越接近文字色 */
.l0 {
  background: var(--fill-strong);
}

.l1 {
  background: color-mix(in srgb, var(--ink) 22%, var(--fill-strong));
}

.l2 {
  background: color-mix(in srgb, var(--ink) 45%, var(--fill-strong));
}

.l3 {
  background: color-mix(in srgb, var(--ink) 70%, var(--fill-strong));
}

.l4 {
  background: var(--ink);
}

.cell.future {
  background: transparent;
}

.grid .cell:not(.future):hover {
  outline: 1.5px solid var(--ink);
  outline-offset: 1px;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: calc(var(--weeks, 20) * 21px);
  color: var(--faint);
  font-size: 12px;
}

.scale {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.scale .cell {
  width: 10px;
}

/* 铺满：格子按面板宽度排，面板被网格拉高时 footer 贴到底部 */
.calendar.fill {
  display: flex;
  flex-direction: column;
}

.calendar.fill .months,
.calendar.fill .grid,
.calendar.fill .legend {
  max-width: none;
}

.calendar-footer {
  margin-top: auto;
}

.failed {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.failed button {
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
</style>
