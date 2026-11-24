<template>
  <article :class="['message', message.role, `type-${message.type}`]">
    <template v-if="message.role === 'user'">
      <p class="user-text">{{ message.content }}</p>
    </template>

    <details v-else-if="message.type === 'compaction'" class="compaction">
      <summary>整理了一下之前的对话（点开看笔记）</summary>
      <MdViewer :value="message.content" />
    </details>

    <template v-else>
      <div v-if="badge" class="message-badge">{{ badge }}</div>
      <div v-if="thinking" class="thinking">
        <button
          class="thinking-toggle"
          type="button"
          :aria-expanded="showThinking"
          @click="showThinking = !showThinking"
        >
          {{ streamingText ? "思考过程" : "思考中…" }}
          <span aria-hidden="true">{{ showThinking ? "▴" : "▾" }}</span>
        </button>
        <pre v-if="showThinking" class="thinking-text">{{ thinking }}</pre>
      </div>
      <div class="assistant-text">
        <MdViewer v-if="text" :value="text" />
        <span v-else-if="streaming" class="typing" aria-label="正在输入">
          <i></i><i></i><i></i>
        </span>
      </div>
      <button
        v-if="message.codeEdits"
        class="edits-btn"
        type="button"
        @click="emit('preview', message.codeEdits)"
      >
        查看代码修改（{{ editsLabel }}）
      </button>
    </template>
  </article>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineEmits,
  defineProps,
  ref,
  withDefaults,
} from "vue";

import { COMPANION_MOOD_LABELS } from "@/constants/companionMoods";
import { describeProposal } from "@/services/codeEditProposal";
import {
  CodeEditProposal,
  CompanionMessage,
  HintStep,
  HintTrack,
} from "@/services/companion";

const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

const SOLUTION_LEVEL = 5;

const props = withDefaults(
  defineProps<{
    message: CompanionMessage;
    hintSteps?: Partial<Record<HintTrack, HintStep[]>>;
    /** 流式回答中的这一条 */
    streaming?: boolean;
    streamingText?: string;
    thinking?: string;
  }>(),
  {
    hintSteps: () => ({}),
    streaming: false,
    streamingText: "",
    thinking: "",
  }
);

const emit = defineEmits<{
  (event: "preview", proposal: CodeEditProposal): void;
}>();

const showThinking = ref(false);

const text = computed(() =>
  props.streaming ? props.streamingText : props.message.content
);

const stepTitle = (level?: number | null) => {
  if (level == null) return "";
  const track = props.message.hintTrack ?? "idea";
  return props.hintSteps[track]?.[level]?.title ?? "";
};

const badge = computed(() => {
  const { type, mood } = props.message;
  if (type === "reaction") {
    return mood ? `提交后 · ${COMPANION_MOOD_LABELS[mood] ?? ""}` : "提交后";
  }
  if (type === "hint") {
    const title = stepTitle(props.message.hintLevel);
    return title ? `提示 · ${title}` : "提示";
  }
  if (type === "solution") {
    return stepTitle(SOLUTION_LEVEL) || "看答案";
  }
  return "";
});

const editsLabel = computed(() =>
  props.message.codeEdits ? describeProposal(props.message.codeEdits) : ""
);
</script>

<style scoped>
.message {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 100%;
}

.message.user {
  align-items: flex-end;
}

.user-text {
  max-width: 88%;
  margin: 0;
  padding: 8px 12px;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: var(--radius-md) var(--radius-md) 4px var(--radius-md);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.assistant .assistant-text {
  max-width: 100%;
  padding: 8px 12px;
  color: var(--body);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: 4px var(--radius-md) var(--radius-md) var(--radius-md);
  font-size: 13px;
  line-height: 1.65;
  overflow-x: auto;
}

.assistant-text :deep(.markdown-body) {
  font-size: 13px;
  line-height: 1.65;
  background: transparent;
}

.assistant-text :deep(.markdown-body p) {
  margin: 0 0 6px;
}

.assistant-text :deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

.assistant-text :deep(.markdown-body pre) {
  margin: 6px 0;
  font-size: 12px;
}

.message-badge {
  align-self: flex-start;
  padding: 1px 8px;
  color: var(--primary);
  background: var(--primary-light);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 500;
}

.thinking {
  font-size: 12px;
}

.thinking-toggle {
  padding: 0;
  color: var(--muted);
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.thinking-text {
  max-height: 180px;
  margin: 4px 0 0;
  padding: 8px 10px;
  overflow-y: auto;
  color: var(--muted);
  background: var(--surface-soft);
  border-left: 2px solid var(--hairline);
  font-family: var(--font-body);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.edits-btn {
  align-self: flex-start;
  padding: 4px 10px;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--primary);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.compaction summary {
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
}

.compaction :deep(.markdown-body) {
  margin-top: 6px;
  padding: 8px 12px;
  font-size: 12px;
  background: var(--surface-soft);
  border-radius: var(--radius-md);
}

.typing {
  display: inline-flex;
  gap: 4px;
  padding: 4px 0;
}

.typing i {
  width: 6px;
  height: 6px;
  background: var(--muted-soft);
  border-radius: 50%;
  animation: typing-dot 1.2s ease-in-out infinite;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-dot {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing i {
    animation: none;
  }
}
</style>
