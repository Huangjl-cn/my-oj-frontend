<template>
  <UiSelect
    v-if="type === 'BOOLEAN'"
    v-model="booleanValue"
    :options="BOOLEAN_OPTIONS"
    aria-label="布尔值"
  />
  <UiNumberInput
    v-else-if="type === 'INTEGER' || type === 'DOUBLE'"
    v-model="numberValue"
    :integer="type === 'INTEGER'"
    placeholder="数值"
  />
  <UiInput
    v-else
    v-model="textValue"
    :placeholder="type === 'LONG' ? '十进制整数' : '文本'"
  />
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";

import UiInput from "@/components/ui/UiInput.vue";
import UiNumberInput from "@/components/ui/UiNumberInput.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import { JudgeValue } from "@/services/questionJudgeCase";

const BOOLEAN_OPTIONS = [
  { value: "true", label: "true" },
  { value: "false", label: "false" },
];

const props = defineProps<{
  modelValue: JudgeValue;
  type: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: JudgeValue): void;
}>();

const booleanValue = computed({
  get: () => (props.modelValue === true ? "true" : "false"),
  set: (value: string) => emit("update:modelValue", value === "true"),
});

const numberValue = computed({
  get: () =>
    typeof props.modelValue === "number" ? props.modelValue : undefined,
  set: (value: number | undefined) => emit("update:modelValue", value ?? 0),
});

const textValue = computed({
  get: () => (typeof props.modelValue === "string" ? props.modelValue : ""),
  set: (value: string) => emit("update:modelValue", value),
});
</script>
