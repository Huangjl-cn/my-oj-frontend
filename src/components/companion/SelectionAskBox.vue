<template>
  <div
    ref="rootRef"
    :class="['selection-ask', { expanded, above: placeAbove }]"
    :style="boxStyle"
  >
    <button
      v-if="!expanded"
      class="ask-pill"
      type="button"
      :disabled="!!blockedReason"
      :title="blockedReason || `就选中的代码问${name}（Ctrl+I）`"
      @click="expand"
    >
      <CompanionAvatar :size="16" />
      问{{ name }}
    </button>
    <form v-else class="ask-card" @submit.prevent="submit">
      <div class="ask-head">
        <CompanionAvatar :size="18" />
        <span>问{{ name }} · {{ lineLabel }}</span>
      </div>
      <input
        ref="inputRef"
        v-model="question"
        class="ask-input"
        type="text"
        :maxlength="MAX_QUESTION_CHARS"
        :placeholder="`这段代码怎么了？比如“这里会越界吗”`"
        @keydown.esc.prevent="collapse"
      />
      <p class="ask-tip">Enter 发送 · Esc 取消</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineExpose,
  defineProps,
  nextTick,
  PropType,
  ref,
  watch,
} from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import { EditorSelection } from "@/utils/editorSelection";

/** 和后端的限制保持一致 */
const MAX_QUOTE_CHARS = 4000;
const MAX_QUESTION_CHARS = 2000;
const CARD_WIDTH = 300;
const CARD_HEIGHT = 96;
const GAP = 6;

const props = defineProps({
  selection: { type: Object as PropType<EditorSelection>, required: true },
  name: { type: String, default: "栗子" },
  /** 有请求在进行 */
  busy: { type: Boolean, default: false },
  /** 没配 Key：点了直接去设置 */
  needsKey: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (event: "ask", question: string): void;
  (event: "need-key"): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const expanded = ref(false);
const question = ref("");

const blockedReason = computed(() => {
  if (props.selection.text.length > MAX_QUOTE_CHARS) {
    return `选中的代码太长了，最多 ${MAX_QUOTE_CHARS} 个字符`;
  }
  if (props.busy) return `${props.name}还在忙，等一下`;
  return "";
});

const lineLabel = computed(() => {
  const { startLine, endLine } = props.selection;
  return startLine === endLine
    ? `第 ${startLine} 行`
    : `第 ${startLine}–${endLine} 行`;
});

/** 选区在编辑器下部时，浮层放到选区上方 */
const placeAbove = computed(
  () =>
    props.selection.anchor.bottom + GAP + CARD_HEIGHT >
    props.selection.view.height
);

const boxStyle = computed(() => {
  const { anchor, view } = props.selection;
  const left = Math.max(GAP, Math.min(anchor.left, view.width - CARD_WIDTH));
  return placeAbove.value
    ? { left: `${left}px`, bottom: `${view.height - anchor.top + GAP}px` }
    : { left: `${left}px`, top: `${anchor.bottom + GAP}px` };
});

const expand = () => {
  if (blockedReason.value) return;
  if (props.needsKey) {
    emit("need-key");
    return;
  }
  expanded.value = true;
  void nextTick(() => inputRef.value?.focus());
};

const collapse = () => {
  expanded.value = false;
  question.value = "";
};

const submit = () => {
  const text = question.value.trim();
  if (!text || blockedReason.value) return;
  emit("ask", text);
  collapse();
};

// 换了一段选区，之前没发出去的问题作废
watch(
  () => [props.selection.startLine, props.selection.endLine],
  () => {
    if (!expanded.value) question.value = "";
  }
);

defineExpose({ expand });
</script>

<style scoped>
.selection-ask {
  position: absolute;
  z-index: 8;
}

.ask-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px 0 6px;
  color: var(--ink);
  background: var(--canvas);
  border: 1px solid var(--primary);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-md);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  animation: ask-pop var(--motion-fast) var(--ease-out);
}

.ask-pill:hover:not(:disabled) {
  color: var(--on-primary);
  background: var(--primary);
}

.ask-pill:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.ask-pill:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.ask-card {
  width: 300px;
  padding: 8px 10px;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: ask-pop var(--motion-fast) var(--ease-out);
}

.ask-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 11.5px;
}

.ask-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  color: var(--ink);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 13px;
}

.ask-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-ring);
}

.ask-tip {
  margin: 4px 0 0;
  color: var(--muted-soft);
  font-size: 11px;
}

@keyframes ask-pop {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.97);
  }
}

.above .ask-pill,
.above .ask-card {
  animation-name: ask-pop-up;
}

@keyframes ask-pop-up {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ask-pill,
  .ask-card {
    animation: none;
  }
}
</style>
