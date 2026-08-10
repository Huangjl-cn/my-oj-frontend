<template>
  <a-select v-if="type === 'BOOLEAN'" v-model="booleanValue">
    <a-option value="true">true</a-option>
    <a-option value="false">false</a-option>
  </a-select>
  <a-input-number
    v-else-if="type === 'INTEGER' || type === 'DOUBLE'"
    v-model="numberValue"
    :precision="type === 'INTEGER' ? 0 : undefined"
    hide-button
    placeholder="请输入数值"
  />
  <a-input
    v-else
    v-model="textValue"
    :placeholder="type === 'LONG' ? '请输入十进制整数' : '请输入文本'"
  />
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";

import { JudgeValue } from "@/services/questionJudgeCase";

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

<style scoped>
:deep(.arco-input-wrapper),
:deep(.arco-input-number),
:deep(.arco-select-view) {
  width: 100%;
  min-width: 0;
}
</style>
