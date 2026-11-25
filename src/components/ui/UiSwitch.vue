<template>
  <button
    :class="['ui-switch', { on: modelValue }]"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <i />
  </button>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from "vue";

defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();
</script>

<style scoped>
.ui-switch {
  position: relative;
  width: 40px;
  height: 24px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--line-strong);
  cursor: pointer;
  transition: background-color var(--motion-fast) ease;
}

.ui-switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--panel);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--motion-fast) var(--ease-out);
}

.ui-switch.on {
  background: var(--primary);
}

.ui-switch.on i {
  background: var(--on-primary);
  transform: translateX(16px);
}

.ui-switch:disabled {
  cursor: default;
  opacity: 0.5;
}

.ui-switch:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
