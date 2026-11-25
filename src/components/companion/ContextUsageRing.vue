<template>
  <div ref="rootRef" class="context-ring">
    <button
      :class="['ring-btn', { warn: near }]"
      type="button"
      :title="`上下文占用 ${percentText}`"
      :aria-label="`上下文占用 ${percentText}，点开查看`"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle class="ring-track" cx="10" cy="10" :r="RADIUS" />
        <circle
          class="ring-value"
          cx="10"
          cy="10"
          :r="RADIUS"
          :stroke-dasharray="`${filled} ${CIRCUMFERENCE}`"
        />
      </svg>
      <span class="ring-text">{{ shortPercent }}</span>
    </button>

    <div v-if="open" class="ring-popover" role="dialog" aria-label="上下文占用">
      <div class="popover-head">
        <strong>上下文占用</strong>
        <span>{{ percentText }}</span>
      </div>
      <div class="usage-bar" aria-hidden="true">
        <i :style="{ width: `${Math.min(100, ratio * 100)}%` }"></i>
        <span class="compact-mark" :style="{ left: `${compactPercent}%` }" />
      </div>
      <p class="usage-numbers">
        {{ usedText }} / {{ limitText }} tokens{{
          usage?.estimated ? "（估算）" : ""
        }}
      </p>
      <p class="usage-note">
        到 {{ compactPercent }}%
        时会自动整理记忆：较早的对话变成一份笔记，最近几轮原样保留。
      </p>
      <button
        class="compact-btn"
        type="button"
        :disabled="disabled"
        @click="compactNow"
      >
        {{ compacting ? "正在整理…" : "现在整理" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, PropType, ref } from "vue";

import { useDismissable } from "@/composables/useDismissable";
import { ContextUsage } from "@/services/companion";

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const props = defineProps({
  usage: {
    type: Object as PropType<ContextUsage | undefined>,
    default: undefined,
  },
  /** 不能整理（没配 Key、有请求在进行） */
  disabled: { type: Boolean, default: false },
  compacting: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (event: "compact"): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
useDismissable(rootRef, open);

const ratio = computed(() => Math.max(0, props.usage?.ratio ?? 0));
const compactPercent = computed(() =>
  Math.round((props.usage?.compactRatio ?? 0.8) * 100)
);
const filled = computed(() => Math.min(1, ratio.value) * CIRCUMFERENCE);
/** 离自动整理不远了 */
const near = computed(
  () => ratio.value >= (props.usage?.compactRatio ?? 0.8) * 0.9
);

const percentText = computed(() => {
  const percent = ratio.value * 100;
  return `${percent > 0 && percent < 0.1 ? "<0.1" : percent.toFixed(1)}%`;
});
const shortPercent = computed(() => {
  const percent = ratio.value * 100;
  if (percent > 0 && percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
});

const formatTokens = (count: number) => {
  if (count >= 1_000_000) return `${Number((count / 1_000_000).toFixed(1))}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
};
const usedText = computed(() => formatTokens(props.usage?.usedTokens ?? 0));
const limitText = computed(() => formatTokens(props.usage?.limitTokens ?? 0));

const compactNow = () => {
  open.value = false;
  emit("compact");
};
</script>

<style scoped>
.context-ring {
  position: relative;
}

.ring-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 6px 0 4px;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-family: var(--font-code);
  font-size: 11px;
  cursor: pointer;
}

.ring-btn:hover,
.ring-btn[aria-expanded="true"] {
  color: var(--body);
  background: var(--surface-soft);
  border-color: var(--hairline);
}

.ring-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.ring-btn svg {
  width: 18px;
  height: 18px;
  transform: rotate(-90deg);
}

.ring-track,
.ring-value {
  fill: none;
  stroke-width: 3;
}

.ring-track {
  stroke: var(--hairline);
}

.ring-value {
  stroke: var(--primary);
  stroke-linecap: round;
  transition: stroke-dasharray var(--motion-standard) var(--ease-out);
}

.ring-btn.warn {
  color: var(--accent-amber);
}

.ring-btn.warn .ring-value {
  stroke: var(--accent-amber);
}

.ring-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: 260px;
  padding: 12px;
  color: var(--body);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 12px;
}

.popover-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--ink);
}

.popover-head span {
  font-family: var(--font-code);
}

.usage-bar {
  position: relative;
  height: 6px;
  background: var(--surface-soft);
  border-radius: var(--radius-pill);
}

.usage-bar i {
  display: block;
  height: 100%;
  min-width: 2px;
  background: var(--primary);
  border-radius: inherit;
}

.compact-mark {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 12px;
  background: var(--accent-amber);
  border-radius: 1px;
}

.usage-numbers {
  margin: 8px 0 4px;
  font-family: var(--font-code);
  font-size: 11px;
}

.usage-note {
  margin: 0 0 10px;
  color: var(--muted);
  line-height: 1.6;
}

.compact-btn {
  width: 100%;
  height: 28px;
  color: var(--body);
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.compact-btn:hover:not(:disabled) {
  color: var(--ink);
  border-color: var(--primary);
}

.compact-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .ring-value {
    transition: none;
  }
}
</style>
