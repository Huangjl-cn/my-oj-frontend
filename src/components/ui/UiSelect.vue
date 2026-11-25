<template>
  <label :class="['ui-select', { disabled }]">
    <select
      :value="modelValue ?? ''"
      :disabled="disabled"
      :aria-label="ariaLabel || placeholder"
      @change="onChange"
    >
      <option v-if="placeholder != null" value="">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <AppIcon name="chevron-down" :size="14" class="ui-select-chevron" />
  </label>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

type SelectOption = { value: string; label: string };

defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array as PropType<SelectOption[]>, required: true },
  /** 不为空时多一个值为 "" 的选项，用来表示「全部」或「未选择」 */
  placeholder: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const onChange = (event: Event) =>
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
</script>

<style scoped>
.ui-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.ui-select select {
  width: 100%;
  height: 40px;
  padding: 0 34px 0 14px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  appearance: none;
  cursor: pointer;
  text-overflow: ellipsis;
}

.ui-select select:focus-visible {
  outline: none;
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line-strong), var(--focus-ring);
}

.ui-select.disabled select {
  cursor: default;
  opacity: 0.6;
}

.ui-select-chevron {
  position: absolute;
  right: 12px;
  color: var(--muted);
  pointer-events: none;
}
</style>
