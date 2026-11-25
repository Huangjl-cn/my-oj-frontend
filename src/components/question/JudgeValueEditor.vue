<template>
  <JudgeScalarInput
    v-if="dimensions === 0"
    :model-value="modelValue"
    :type="type"
    @update:model-value="updateValue"
  />

  <div v-else-if="dimensions === 1" class="structured-value-editor">
    <label class="shape-control">
      <span>长度</span>
      <UiNumberInput v-model="arrayLength" :min="0" integer stepper />
    </label>
    <div v-if="arrayValue.length" class="array-grid">
      <label
        v-for="(item, index) in arrayValue"
        :key="index"
        class="value-cell"
      >
        <span>[{{ index }}]</span>
        <JudgeScalarInput
          :model-value="item"
          :type="elementType"
          @update:model-value="updateArrayItem(index, $event)"
        />
      </label>
    </div>
    <p v-else class="empty-value">空数组</p>
  </div>

  <div v-else class="structured-value-editor">
    <div class="matrix-shape-controls">
      <label class="shape-control">
        <span>行</span>
        <UiNumberInput v-model="matrixRowCount" :min="0" integer stepper />
      </label>
      <label class="shape-control">
        <span>列</span>
        <UiNumberInput v-model="matrixColumnCount" :min="0" integer stepper />
      </label>
    </div>
    <div v-if="matrixValue.length" class="matrix-scroll">
      <div class="matrix-grid">
        <div
          v-for="(row, rowIndex) in matrixValue"
          :key="rowIndex"
          class="matrix-row"
        >
          <label
            v-for="(item, columnIndex) in row"
            :key="columnIndex"
            class="value-cell matrix-cell"
          >
            <span>[{{ rowIndex }}][{{ columnIndex }}]</span>
            <JudgeScalarInput
              :model-value="item"
              :type="elementType"
              @update:model-value="
                updateMatrixItem(rowIndex, columnIndex, $event)
              "
            />
          </label>
        </div>
      </div>
    </div>
    <p v-else class="empty-value">空矩阵</p>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";

import JudgeScalarInput from "@/components/question/JudgeScalarInput.vue";
import UiNumberInput from "@/components/ui/UiNumberInput.vue";
import {
  createDefaultJudgeValue,
  getJudgeTypeOption,
  JudgeTypeOption,
  JudgeValue,
} from "@/services/questionJudgeCase";

const props = defineProps<{
  modelValue: JudgeValue;
  type: string;
  types: JudgeTypeOption[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: JudgeValue): void;
}>();

const typeOption = computed(() => getJudgeTypeOption(props.type, props.types));
const dimensions = computed(() => typeOption.value?.dimensions ?? 0);
const elementType = computed(() => typeOption.value?.elementType || "STRING");
const defaultElementValue = () =>
  createDefaultJudgeValue(elementType.value, props.types);

const arrayValue = computed<JudgeValue[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : []
);

const matrixValue = computed<JudgeValue[][]>(() =>
  arrayValue.value.map((row) => (Array.isArray(row) ? row : []))
);

const toSize = (value: number | undefined) =>
  Math.max(0, Math.floor(value ?? 0));

const arrayLength = computed({
  get: () => arrayValue.value.length,
  set: (value: number | undefined) => {
    const next = arrayValue.value.slice(0, toSize(value));
    while (next.length < toSize(value)) next.push(defaultElementValue());
    emit("update:modelValue", next);
  },
});

const matrixRowCount = computed({
  get: () => matrixValue.value.length,
  set: (value: number | undefined) => {
    const size = toSize(value);
    const columns = matrixColumnCount.value;
    const next = matrixValue.value.slice(0, size).map((row) => [...row]);
    while (next.length < size) {
      next.push(Array.from({ length: columns }, () => defaultElementValue()));
    }
    emit("update:modelValue", next);
  },
});

const matrixColumnCount = computed({
  get: () => matrixValue.value[0]?.length ?? 1,
  set: (value: number | undefined) => {
    const size = toSize(value);
    const next = matrixValue.value.map((row) => {
      const resized = row.slice(0, size);
      while (resized.length < size) resized.push(defaultElementValue());
      return resized;
    });
    emit("update:modelValue", next);
  },
});

const updateValue = (value: JudgeValue) => emit("update:modelValue", value);

const updateArrayItem = (index: number, value: JudgeValue) => {
  const next = [...arrayValue.value];
  next[index] = value;
  emit("update:modelValue", next);
};

const updateMatrixItem = (
  rowIndex: number,
  columnIndex: number,
  value: JudgeValue
) => {
  const next = matrixValue.value.map((row) => [...row]);
  next[rowIndex][columnIndex] = value;
  emit("update:modelValue", next);
};
</script>

<style scoped>
.structured-value-editor {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.shape-control {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
}

.shape-control > :last-child {
  width: 132px;
}

.matrix-shape-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.array-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.value-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.value-cell > span {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.matrix-scroll {
  max-width: 100%;
  padding-bottom: 4px;
  overflow-x: auto;
}

.matrix-grid {
  display: grid;
  gap: 8px;
  min-width: max-content;
}

.matrix-row {
  display: flex;
  gap: 8px;
}

.matrix-cell {
  width: 140px;
}

.empty-value {
  margin: 0;
  padding: 12px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-md);
  color: var(--faint);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 768px) {
  .array-grid {
    grid-template-columns: 1fr;
  }
}
</style>
