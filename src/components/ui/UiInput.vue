<template>
  <label :class="['ui-input', { 'has-icon': icon, disabled }]">
    <AppIcon v-if="icon" :name="icon" :size="16" class="ui-input-icon" />
    <input
      ref="inputRef"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :aria-label="ariaLabel || placeholder"
      @input="onInput"
      @keydown.enter="emit('enter')"
    />
    <button
      v-if="clearable && modelValue && !disabled && !readonly"
      class="ui-input-clear"
      type="button"
      aria-label="清空"
      @click="clear"
    >
      <AppIcon name="close" :size="13" />
    </button>
  </label>
</template>

<script setup lang="ts">
import { defineEmits, defineExpose, defineProps, PropType, ref } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { AppIconName } from "@/components/ui/icons";

defineProps({
  modelValue: { type: [String, Number], default: "" },
  placeholder: { type: String, default: "" },
  type: { type: String, default: "text" },
  icon: { type: String as PropType<AppIconName>, default: undefined },
  clearable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  autocomplete: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "enter"): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const onInput = (event: Event) =>
  emit("update:modelValue", (event.target as HTMLInputElement).value);

const clear = () => {
  emit("update:modelValue", "");
  inputRef.value?.focus();
};

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<style scoped>
.ui-input {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 8px 0 14px;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--muted);
  cursor: text;
  transition: box-shadow var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.ui-input:focus-within {
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line-strong), var(--focus-ring);
}

.ui-input.disabled {
  cursor: default;
  opacity: 0.6;
}

.ui-input input {
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
}

.ui-input input::placeholder {
  color: var(--faint);
}

.ui-input input[readonly] {
  color: var(--muted);
}

.ui-input input[type="number"] {
  font-variant-numeric: tabular-nums;
}

.ui-input-clear {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  flex: none;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.ui-input-clear:hover {
  background: var(--fill-strong);
  color: var(--ink);
}
</style>
