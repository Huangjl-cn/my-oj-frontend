<template>
  <div :class="['ui-number', { stepper, disabled }]">
    <button
      v-if="stepper"
      class="step"
      type="button"
      aria-label="减少"
      :disabled="disabled || (min != null && (modelValue ?? 0) <= min)"
      @click="nudge(-1)"
    >
      <span aria-hidden="true">−</span>
    </button>
    <input
      :value="text"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-label="ariaLabel || placeholder"
      @input="onInput"
      @blur="normalize"
    />
    <span v-if="unit" class="unit">{{ unit }}</span>
    <button
      v-if="stepper"
      class="step"
      type="button"
      aria-label="增加"
      :disabled="disabled || (max != null && (modelValue ?? 0) >= max)"
      @click="nudge(1)"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, ref, watch } from "vue";

/**
 * 数字输入：输入过程中允许 "-"、"1." 这样的半成品，能解析成数字时才往外更新，
 * 失焦时把文字整理成当前的值。
 */
const props = defineProps({
  modelValue: { type: Number, default: undefined },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  integer: { type: Boolean, default: false },
  unit: { type: String, default: "" },
  stepper: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: number): void;
}>();

const format = (value?: number) => (value == null ? "" : String(value));
const text = ref(format(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    if (parse(text.value) !== value) text.value = format(value);
  }
);

const clamp = (value: number) => {
  let next = props.integer ? Math.trunc(value) : value;
  if (props.min != null) next = Math.max(props.min, next);
  if (props.max != null) next = Math.min(props.max, next);
  return next;
};

const parse = (value: string) => {
  const trimmed = value.trim();
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(trimmed)) return undefined;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : undefined;
};

const onInput = (event: Event) => {
  text.value = (event.target as HTMLInputElement).value;
  const number = parse(text.value);
  if (number != null) emit("update:modelValue", clamp(number));
};

const normalize = () => {
  const number = parse(text.value);
  const next = clamp(number ?? props.modelValue ?? props.min ?? 0);
  if (next !== props.modelValue) emit("update:modelValue", next);
  text.value = format(next);
};

const nudge = (direction: 1 | -1) => {
  const next = clamp((props.modelValue ?? 0) + direction * props.step);
  text.value = format(next);
  emit("update:modelValue", next);
};
</script>

<style scoped>
.ui-number {
  height: 40px;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 12px 0 14px;
  border-radius: var(--radius-md);
  background: var(--fill);
  transition: box-shadow var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.ui-number.stepper {
  padding: 0 4px;
}

.ui-number:focus-within {
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line-strong), var(--focus-ring);
}

.ui-number.disabled {
  opacity: 0.6;
}

input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.stepper input {
  text-align: center;
}

input::placeholder {
  color: var(--faint);
}

.unit {
  flex: none;
  margin-left: 8px;
  color: var(--faint);
  font-size: 13px;
}

.step {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  flex: none;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-size: 17px;
  cursor: pointer;
}

.step:hover:not(:disabled) {
  background: var(--fill-strong);
  color: var(--ink);
}

.step:disabled {
  cursor: default;
  opacity: 0.35;
}
</style>
