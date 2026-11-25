<template>
  <div class="seg" role="radiogroup" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :class="['seg-item', option.tone, { on: option.value === modelValue }]"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType } from "vue";

type SegmentedOption = { value: string; label: string; tone?: string };

defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array as PropType<SegmentedOption[]>, required: true },
  label: { type: String, default: undefined },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();
</script>

<style scoped>
.seg {
  display: inline-flex;
  padding: 3px;
  border-radius: var(--radius-pill);
  background: var(--fill);
}

.seg-item {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 13.5px;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.seg-item:hover {
  color: var(--ink);
}

.seg-item.on {
  background: var(--panel);
  color: var(--ink);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--line);
}
</style>
