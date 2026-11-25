<template>
  <section :class="['verdict', tone]" aria-live="polite">
    <div class="verdict-line">
      <span class="result">{{ judge.presentation.label }}</span>
      <span v-if="judge.submitting" class="queue">{{ queueText }}</span>
      <span v-if="tone !== 'pending'" class="nums num">
        <span class="tip-up" data-tip="用时">
          <AppIcon name="clock" :size="15" />
          {{ timeText }}
          <em v-if="judge.timeBeatPercent != null">
            超过 {{ Math.round(judge.timeBeatPercent) }}%
          </em>
        </span>
        <span class="tip-up" data-tip="内存">
          <AppIcon name="chip" :size="15" />
          {{ formatJudgeMemory(judge.result?.judgeInfo?.memory) }}
          <em v-if="judge.memoryBeatPercent != null">
            超过 {{ Math.round(judge.memoryBeatPercent) }}%
          </em>
        </span>
      </span>
      <span class="actions">
        <button
          v-if="hasDetails"
          class="icon-btn sm tip-up"
          type="button"
          :data-tip="judge.detailsOpen ? '收起详情' : '展开详情'"
          :aria-expanded="judge.detailsOpen"
          aria-label="判题详情"
          @click="judge.toggleDetails()"
        >
          <AppIcon
            name="chevron-down"
            :size="16"
            :class="['chevron', { open: judge.detailsOpen }]"
          />
        </button>
        <button
          v-if="!judge.submitting"
          class="icon-btn sm tip-up"
          type="button"
          data-tip="收起结果"
          aria-label="收起判题结果"
          @click="judge.hide()"
        >
          <AppIcon name="close" :size="15" />
        </button>
      </span>
    </div>
    <div v-if="tone === 'pending'" class="progress" aria-hidden="true">
      <i />
    </div>
    <div v-if="hasDetails && judge.detailsOpen" class="details">
      <strong>{{ judge.messageParts.title }}</strong>
      <pre v-if="judge.messageParts.details">{{
        judge.messageParts.details
      }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps, PropType } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { Judge } from "@/composables/problem/useJudge";
import { formatJudgeMemory } from "@/services/questionSubmit";

type JudgeState = {
  [K in keyof Judge]: Judge[K] extends { value: infer V } ? V : Judge[K];
};

// 用运行时声明：Judge 是推导出来的复杂类型，避免 SFC 编译器去解析它
const props = defineProps({
  judge: { type: Object as PropType<JudgeState>, required: true },
});

const tone = computed(() => props.judge.presentation.tone);

/** Accepted 不用再展开看；其他结果（错误信息、编译输出）可以展开 */
const hasDetails = computed(
  () =>
    tone.value === "failed" &&
    !!(props.judge.messageParts.title || props.judge.messageParts.details)
);

const timeText = computed(() => {
  const time = props.judge.result?.judgeInfo?.time;
  return time != null ? `${time} ms` : "--";
});

const queueText = computed(() => {
  const status = props.judge.queueStatus;
  if (status?.status === 0) {
    return props.judge.queueAhead > 0
      ? `前面还有 ${props.judge.queueAhead} 份`
      : "马上轮到你";
  }
  if (status?.status === 1) return "正在运行测试用例";
  if (status) return "正在整理结果";
  return "正在进入判题队列";
});
</script>

<style scoped>
.verdict {
  flex: none;
  display: grid;
  gap: 12px;
  margin: 0 10px 10px;
  padding: 12px 12px 12px 16px;
  border-radius: 14px;
  background: var(--fill);
  animation: verdict-in var(--motion-standard) var(--ease-out);
}

.verdict-line {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 32px;
}

.result {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--muted);
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
}

.result::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 18%, transparent);
}

.passed .result {
  color: var(--success);
}

.failed .result {
  color: var(--danger);
}

.pending .result::before {
  animation: verdict-pulse 1.2s ease-in-out infinite;
}

.queue {
  color: var(--muted);
  font-size: 13px;
}

.nums {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  color: var(--ink);
  font-size: 13px;
}

.nums > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nums :deep(svg) {
  color: var(--muted);
}

.nums em {
  color: var(--muted);
  font-style: normal;
}

.actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.icon-btn.sm {
  width: 30px;
  height: 30px;
}

.chevron {
  transition: transform var(--motion-fast) ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.progress {
  height: 3px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--line);
}

.progress i {
  display: block;
  width: 30%;
  height: 100%;
  border-radius: inherit;
  background: var(--ink);
  animation: verdict-slide 1.4s var(--ease-in-out) infinite;
}

.details {
  display: grid;
  gap: 6px;
  max-height: 200px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--panel);
}

.details strong {
  color: var(--danger);
  font-size: 13px;
}

.details pre {
  margin: 0;
  color: var(--ink);
  font: 12.5px/1.6 var(--font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}

@keyframes verdict-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes verdict-pulse {
  50% {
    opacity: 0.35;
  }
}

@keyframes verdict-slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(340%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .verdict,
  .pending .result::before,
  .progress i {
    animation: none;
  }
}
</style>
