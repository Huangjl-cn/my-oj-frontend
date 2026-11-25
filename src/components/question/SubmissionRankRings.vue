<template>
  <section class="rank-section">
    <header class="rank-section-header">
      <div>
        <h4>和同语言的通过提交比</h4>
      </div>
      <span v-if="loading && !rank" class="rank-loading">加载中...</span>
      <span v-else-if="error" class="rank-error">{{ error }}</span>
    </header>
    <div class="rank-rings">
      <article class="rank-ring-card">
        <div
          class="rank-ring"
          :style="ringStyle(timeProgress)"
          :class="{ empty: timePercent == null }"
        >
          <strong>{{
            timePercent == null ? "--" : `${Math.round(timeProgress)}%`
          }}</strong>
        </div>
        <div>
          <h5>运行时间</h5>
          <p>
            {{ timePercent == null ? "暂无有效样本" : comparisonLabel }}
          </p>
        </div>
      </article>
      <article class="rank-ring-card">
        <div
          class="rank-ring memory"
          :style="ringStyle(memoryProgress)"
          :class="{ empty: memoryPercent == null }"
        >
          <strong>{{
            memoryPercent == null ? "--" : `${Math.round(memoryProgress)}%`
          }}</strong>
        </div>
        <div>
          <h5>内存占用</h5>
          <p>
            {{ memoryPercent == null ? "暂无有效样本" : comparisonLabel }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  withDefaults,
  defineProps,
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";
import { QuestionSubmitRankVO } from "../../../generated";
import { getSubmissionRankPercent } from "@/services/questionSubmit";

const props = withDefaults(
  defineProps<{
    rank?: QuestionSubmitRankVO;
    loading?: boolean;
    error?: string;
    comparisonLabel?: string;
  }>(),
  {
    comparisonLabel: "超过同语言提交",
  }
);

const timePercent = computed(() =>
  getSubmissionRankPercent(props.rank?.timeBeaten, props.rank?.timeTotal)
);
const memoryPercent = computed(() =>
  getSubmissionRankPercent(props.rank?.memoryBeaten, props.rank?.memoryTotal)
);
const timeProgress = ref(0);
const memoryProgress = ref(0);
let animationFrame: number | undefined;

const ringStyle = (percent: number) => ({
  background: `conic-gradient(var(--ring-color, var(--ink)) ${percent}%, var(--fill-strong) 0)`,
});

const animate = () => {
  if (animationFrame != null) cancelAnimationFrame(animationFrame);
  const start = performance.now();
  const duration = 650;
  const targetTime = timePercent.value ?? 0;
  const targetMemory = memoryPercent.value ?? 0;
  timeProgress.value = 0;
  memoryProgress.value = 0;

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - progress) ** 3;
    timeProgress.value = targetTime * eased;
    memoryProgress.value = targetMemory * eased;
    if (progress < 1) animationFrame = requestAnimationFrame(tick);
  };
  animationFrame = requestAnimationFrame(tick);
};

watch([timePercent, memoryPercent], animate, { immediate: true });

onBeforeUnmount(() => {
  if (animationFrame != null) cancelAnimationFrame(animationFrame);
});
</script>

<style scoped>
.rank-section {
  display: grid;
  gap: 12px;
}

.rank-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rank-section-header h4 {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.rank-error {
  color: var(--danger);
  font-size: 12px;
}

.rank-loading {
  color: var(--muted);
  font-size: 12px;
}

.rank-rings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.rank-ring-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.rank-ring {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 50%;
}

.rank-ring::after {
  position: absolute;
  inset: 5px;
  background: var(--fill);
  border-radius: 50%;
  content: "";
}

.rank-ring.memory {
  --ring-color: var(--muted);
}

.rank-ring.empty {
  background: var(--fill-strong) !important;
}

.rank-ring strong {
  position: relative;
  z-index: 1;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.rank-ring-card h5 {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}

.rank-ring-card p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}

@media (max-width: 680px) {
  .rank-rings {
    grid-template-columns: 1fr;
  }
}
</style>
