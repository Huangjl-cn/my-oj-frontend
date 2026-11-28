<template>
  <div class="difficulty-bars">
    <div v-for="level in LEVELS" :key="level" class="bar-row">
      <DifficultyLabel :difficulty="level" />
      <span class="bar">
        <i
          :class="level"
          :style="{ width: barWidth(solved[level], total[level]) }"
        />
      </span>
      <span class="bar-count num">
        {{ solved[level] }} / {{ total[level] }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from "vue";

import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import { barWidth } from "@/services/learningStats";
import { Difficulty } from "@/utils/difficulty";

type Counts = Record<Difficulty, number>;

/** 各难度已通过 / 总数的进度条（个人中心和学习统计页共用） */
defineProps({
  total: { type: Object as PropType<Counts>, required: true },
  solved: { type: Object as PropType<Counts>, required: true },
});

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
</script>

<style scoped>
.difficulty-bars {
  display: grid;
  gap: 14px;
}

.bar-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 12px;
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
  font-size: 12.5px;
  text-align: right;
}
</style>
