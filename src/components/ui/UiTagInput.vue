<template>
  <div class="ui-tags" @click="inputRef?.focus()">
    <span v-for="(tag, index) in modelValue" :key="tag" class="chip">
      {{ tag }}
      <button
        type="button"
        :aria-label="`删除 ${tag}`"
        @click.stop="remove(index)"
      >
        <AppIcon name="close" :size="12" />
      </button>
    </span>
    <input
      ref="inputRef"
      v-model="draft"
      :placeholder="modelValue.length ? '' : placeholder"
      :aria-label="ariaLabel || placeholder"
      @keydown="onKeydown"
      @blur="commit"
    />
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType, ref } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

/** 标签输入：回车或逗号加一个，退格删掉最后一个，重复的不加 */
const props = defineProps({
  modelValue: { type: Array as PropType<string[]>, default: () => [] },
  placeholder: { type: String, default: "" },
  ariaLabel: { type: String, default: undefined },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string[]): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const draft = ref("");

const commit = () => {
  const tags = draft.value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag && !props.modelValue.includes(tag));
  draft.value = "";
  if (tags.length) {
    emit("update:modelValue", [
      ...props.modelValue,
      ...Array.from(new Set(tags)),
    ]);
  }
};

const remove = (index: number) => {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, i) => i !== index)
  );
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return;
  if (event.key === "Enter" || event.key === "," || event.key === "，") {
    event.preventDefault();
    commit();
  } else if (
    event.key === "Backspace" &&
    !draft.value &&
    props.modelValue.length
  ) {
    remove(props.modelValue.length - 1);
  }
};
</script>

<style scoped>
.ui-tags {
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  background: var(--fill);
  cursor: text;
}

.ui-tags:focus-within {
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line-strong), var(--focus-ring);
}

.chip {
  height: 26px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px 0 10px;
  border-radius: var(--radius-pill);
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line);
  color: var(--ink);
  font-size: 13px;
}

.chip button {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.chip button:hover {
  background: var(--fill);
  color: var(--ink);
}

input {
  flex: 1;
  min-width: 120px;
  height: 26px;
  padding: 0 4px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
}

input::placeholder {
  color: var(--faint);
}
</style>
