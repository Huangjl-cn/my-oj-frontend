<template>
  <div ref="rootRef" class="level-picker">
    <button
      class="level-chip"
      type="button"
      :disabled="!steps.length"
      :title="chipTitle"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <span v-if="!direct && level <= MAX_HINT_LEVEL" class="level-tag">
        L{{ level }}
      </span>
      <span class="level-name">{{ chipLabel }}</span>
      <IconDown class="chevron" aria-hidden="true" />
    </button>

    <div v-if="open" class="level-popover">
      <p class="popover-title">{{ name }}最多说到哪一步</p>
      <p v-if="direct" class="popover-note">
        已开启「有问必答」，不限档位。想循序渐进就在设置里关掉它。
      </p>
      <p v-else-if="level > MAX_HINT_LEVEL" class="popover-note">
        已经看过答案了。选一档，之后的提示就按这一档来。
      </p>
      <ul class="level-list" role="listbox" aria-label="提示档位">
        <li v-for="step in adjustableSteps" :key="step.level">
          <button
            type="button"
            role="option"
            :aria-selected="step.level === level"
            :class="['level-option', { current: step.level === level }]"
            :disabled="direct || disabled"
            @mouseenter="hovered = step.level"
            @mouseleave="hovered = null"
            @focus="hovered = step.level"
            @blur="hovered = null"
            @click="choose(step.level)"
          >
            <span class="level-tag">L{{ step.level }}</span>
            <span class="level-name">{{ step.title }}</span>
            <span class="level-meter" aria-hidden="true">
              <i
                v-for="n in MAX_HINT_LEVEL"
                :key="n"
                :class="{ on: n <= step.level }"
              />
            </span>
          </button>
        </li>
      </ul>
      <p class="level-description" aria-live="polite">
        {{
          describedStep?.description ?? "把鼠标移到某一档上，看它会说到什么程度"
        }}
      </p>
      <button
        v-if="solutionStep"
        class="solution-btn"
        type="button"
        :disabled="disabled"
        :title="solutionStep.description"
        @click="askSolution"
      >
        {{ solutionStep.title }}
        <span>{{ solutionStep.description }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconDown } from "@arco-design/web-vue/es/icon";
import { computed, defineEmits, defineProps, PropType, ref } from "vue";

import { useDismissable } from "@/composables/useDismissable";
import { MAX_HINT_LEVEL, SOLUTION_LEVEL } from "@/composables/useCompanion";
import { HintStep } from "@/services/companion";

const props = defineProps({
  steps: { type: Array as PropType<HintStep[]>, default: () => [] },
  level: { type: Number, default: 0 },
  /** 有问必答：不分档位 */
  direct: { type: Boolean, default: false },
  /** 有请求在进行，或者没配 Key */
  disabled: { type: Boolean, default: false },
  name: { type: String, default: "栗子" },
});

const emit = defineEmits<{
  (event: "change", level: number): void;
  (event: "solution"): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
const hovered = ref<number | null>(null);
useDismissable(rootRef, open);

const adjustableSteps = computed(() =>
  props.steps.filter((step) => step.level <= MAX_HINT_LEVEL)
);
const solutionStep = computed(() =>
  props.steps.find((step) => step.level === SOLUTION_LEVEL)
);
const currentStep = computed(() =>
  props.steps.find((step) => step.level === props.level)
);
/** 悬停的那一档，没有悬停时是当前档 */
const describedStep = computed(() =>
  hovered.value == null
    ? currentStep.value
    : props.steps.find((step) => step.level === hovered.value)
);

const chipLabel = computed(() => {
  if (props.direct) return "不设限";
  if (props.level > MAX_HINT_LEVEL) return "已看答案";
  return currentStep.value?.title ?? "提示档位";
});

const chipTitle = computed(() =>
  props.direct
    ? "有问必答：不限档位"
    : `提示档位：${currentStep.value?.description ?? ""}（点击调整）`
);

const choose = (level: number) => {
  open.value = false;
  if (level !== props.level) emit("change", level);
};

const askSolution = () => {
  open.value = false;
  emit("solution");
};
</script>

<style scoped>
.level-picker {
  position: relative;
}

.level-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  color: var(--body);
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.level-chip:hover:not(:disabled),
.level-chip[aria-expanded="true"] {
  color: var(--ink);
  border-color: var(--primary);
}

.level-chip:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.level-chip:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.level-tag {
  color: var(--primary);
  font-family: var(--font-code);
  font-size: 11px;
  font-weight: 600;
}

.chevron {
  color: var(--muted);
  font-size: 11px;
}

.level-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: 272px;
  padding: 10px;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.popover-title {
  margin: 0 2px 8px;
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
}

.popover-note {
  margin: 0 2px 8px;
  padding: 6px 8px;
  color: var(--body);
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  line-height: 1.6;
}

.level-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.level-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  color: var(--body);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.level-option:hover:not(:disabled),
.level-option:focus-visible {
  outline: none;
  background: var(--surface-soft);
}

.level-option.current {
  color: var(--ink);
  background: var(--primary-light);
  border-color: rgba(204, 120, 92, 0.35);
}

.level-option:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.level-option .level-name {
  flex: 1;
}

.level-meter {
  display: inline-flex;
  gap: 2px;
}

.level-meter i {
  width: 4px;
  height: 10px;
  background: var(--hairline);
  border-radius: 1px;
}

.level-meter i.on {
  background: var(--primary);
}

.level-description {
  min-height: 38px;
  margin: 8px 2px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.solution-btn {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  color: var(--body);
  background: transparent;
  border: 1px dashed var(--hairline);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.solution-btn span {
  overflow: hidden;
  color: var(--muted);
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.solution-btn:hover:not(:disabled) {
  color: var(--primary);
  border-color: var(--primary);
}

.solution-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
