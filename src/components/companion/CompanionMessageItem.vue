<template>
  <article :class="['message', message.role, `type-${message.type}`]">
    <template v-if="message.role === 'user'">
      <figure v-if="message.quote" class="user-quote">
        <figcaption>{{ quoteLines }}</figcaption>
        <pre>{{ message.quote.code }}</pre>
      </figure>
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
      <ul v-if="noteProposals.length" class="note-cards">
        <li v-for="(item, index) in noteProposals" :key="index">
          <button
            v-if="item"
            :class="['note-card', { applied: item.applied }]"
            type="button"
            @click="emit('note-preview', index, item)"
          >
            <span class="note-icon" aria-hidden="true">
              <AppIcon :name="item.applied ? 'check' : 'notebook'" :size="15" />
            </span>
            <span class="note-copy">
              <span class="note-title">{{ describeNoteProposal(item) }}</span>
              <span class="note-sub">{{
                item.applied
                  ? "已存进笔记"
                  : item.reason || "点开预览，满意再应用"
              }}</span>
            </span>
            <span class="note-action">{{
              item.applied ? "查看" : "预览"
            }}</span>
          </button>
        </li>
      </ul>
      <SaveToNoteMenu
        v-if="canSaveToNote && questionId != null"
        :content="message.content"
        :question-id="questionId"
      />
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

import SaveToNoteMenu from "@/components/companion/SaveToNoteMenu.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { SOLUTION_LEVEL } from "@/composables/useCompanion";
import { COMPANION_MOOD_LABELS } from "@/constants/companionMoods";
import { describeProposal } from "@/services/codeEditProposal";
import { ApiId } from "@/services/apiId";
import {
  CodeEditProposal,
  CompanionMessage,
  HintStep,
} from "@/services/companion";
import {
  describeNoteProposal,
  NoteProposal,
  normalizeNoteProposals,
} from "@/services/companionNotes";

const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

const props = withDefaults(
  defineProps<{
    message: CompanionMessage;
    /** 各档位的名字，下标即档位 */
    hintSteps?: HintStep[];
    /** 流式回答中的这一条 */
    streaming?: boolean;
    streamingText?: string;
    thinking?: string;
    /** 本题 id：有了才显示「存进笔记」 */
    questionId?: ApiId | null;
  }>(),
  {
    questionId: null,
    hintSteps: () => [],
    streaming: false,
    streamingText: "",
    thinking: "",
  }
);

const emit = defineEmits<{
  (event: "preview", proposal: CodeEditProposal): void;
  (event: "note-preview", index: number, proposal: NoteProposal): void;
}>();

/** 下标和后端一致（应用时按下标找），解析不了的是 null，不显示 */
const noteProposals = computed(() =>
  normalizeNoteProposals(props.message.noteEdits)
);

/** 已经保存的聊天、提示、看答案回答可以存进笔记（流式中的、提交反应、整理笔记不行） */
const canSaveToNote = computed(
  () =>
    !props.streaming &&
    /^\d+$/.test(String(props.message.id)) &&
    ["chat", "hint", "solution"].includes(props.message.type) &&
    !!props.message.content.trim()
);

const showThinking = ref(false);

const text = computed(() =>
  props.streaming ? props.streamingText : props.message.content
);

const stepTitle = (level?: number | null) =>
  level == null ? "" : props.hintSteps[level]?.title ?? "";

const quoteLines = computed(() => {
  const quote = props.message.quote;
  if (!quote) return "";
  return quote.startLine === quote.endLine
    ? `第 ${quote.startLine} 行`
    : `第 ${quote.startLine}–${quote.endLine} 行`;
});

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
  min-width: 0;
  max-width: 100%;
}

.message.user {
  align-items: flex-end;
}

.user-text {
  max-width: 88%;
  margin: 0;
  padding: 9px 15px;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.user-quote {
  width: 88%;
  margin: 0;
  overflow: hidden;
  background: var(--code-surface);
  border-radius: 12px;
}

.user-quote figcaption {
  padding: 6px 12px 0;
  color: var(--faint);
  font-size: 11.5px;
}

.user-quote pre {
  max-height: 140px;
  margin: 0;
  padding: 2px 12px 8px;
  overflow: auto;
  color: var(--code-ink);
  font: 12.5px/1.6 var(--font-mono);
}

/*
 * 陪练的回答不套外框：文字直接排在面板上，代码块、表格各自是一块，
 * 太宽时只有这一块左右滑动，不会带着整条回答一起滑
 */
.assistant-text {
  min-width: 0;
  max-width: 100%;
  color: var(--body);
}

.assistant-text :deep(.bytemd-viewer),
.assistant-text :deep(.markdown-body) {
  min-width: 0;
  max-width: 100%;
  background: transparent;
  font-size: 14px !important;
  line-height: 1.75 !important;
  overflow-wrap: anywhere;
}

.assistant-text :deep(.markdown-body > :first-child) {
  margin-top: 0 !important;
}

.assistant-text :deep(.markdown-body > :last-child) {
  margin-bottom: 0 !important;
}

.assistant-text :deep(.markdown-body p),
.assistant-text :deep(.markdown-body ul),
.assistant-text :deep(.markdown-body ol) {
  margin: 0 0 10px !important;
}

.assistant-text :deep(.markdown-body h1),
.assistant-text :deep(.markdown-body h2),
.assistant-text :deep(.markdown-body h3),
.assistant-text :deep(.markdown-body h4) {
  margin: 16px 0 8px !important;
  padding: 0 !important;
  border: none !important;
  font-size: 14.5px !important;
}

.assistant-text :deep(.markdown-code-block) {
  margin: 10px 0 12px;
}

.assistant-text :deep(.markdown-body pre) {
  max-width: 100%;
  overflow-x: auto !important;
  padding: 12px 14px !important;
  border-radius: 12px !important;
  font-size: 12.5px;
}

.assistant-text :deep(.markdown-body pre code) {
  white-space: pre !important;
  overflow-wrap: normal;
  font-size: 12.5px !important;
}

/* 表格：自己一块，超宽时这一块左右滑动 */
.assistant-text :deep(.markdown-body table) {
  display: block;
  width: max-content;
  max-width: 100%;
  margin: 10px 0 12px !important;
  overflow-x: auto;
  border: 1px solid var(--line) !important;
  border-radius: 12px;
  border-collapse: separate !important;
  border-spacing: 0;
  font-size: 13px;
  overflow-wrap: normal;
}

.assistant-text :deep(.markdown-body table th),
.assistant-text :deep(.markdown-body table td) {
  border: none !important;
  border-bottom: 1px solid var(--line) !important;
  padding: 7px 12px !important;
  white-space: nowrap;
}

.assistant-text :deep(.markdown-body table tr:last-child td) {
  border-bottom: none !important;
}

.assistant-text :deep(.markdown-body table tr) {
  background: transparent !important;
  border: none !important;
}

.assistant-text :deep(.markdown-body blockquote) {
  margin: 10px 0 !important;
  padding: 2px 0 2px 12px !important;
  border-left: 2px solid var(--line-strong) !important;
  color: var(--muted) !important;
}

.message-badge {
  align-self: flex-start;
  color: var(--faint);
  font-size: 12px;
}

.thinking {
  font-size: 12.5px;
}

.thinking-toggle {
  padding: 0;
  color: var(--muted);
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
}

.thinking-toggle:hover {
  color: var(--ink);
}

.thinking-text {
  max-height: 180px;
  margin: 6px 0 0;
  padding: 2px 0 2px 12px;
  overflow-y: auto;
  color: var(--muted);
  border-left: 2px solid var(--line-strong);
  font-family: var(--font-sans);
  font-size: 12.5px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.edits-btn {
  align-self: flex-start;
  height: 30px;
  padding: 0 14px;
  color: var(--on-primary);
  background: var(--primary);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

.note-cards {
  display: grid;
  gap: 6px;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
}

/* 笔记提议：紫色是笔记的颜色（和图标栏一致） */
.note-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid color-mix(in srgb, var(--tint-violet) 28%, var(--line));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--tint-violet) 5%, var(--panel));
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.note-card:hover {
  border-color: color-mix(in srgb, var(--tint-violet) 55%, var(--line));
  background: color-mix(in srgb, var(--tint-violet) 9%, var(--panel));
}

.note-card.applied {
  border-color: var(--line);
  background: var(--panel);
}

.note-icon {
  width: 28px;
  height: 28px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--tint-violet) 14%, var(--panel));
  color: var(--tint-violet);
}

.note-card.applied .note-icon {
  background: var(--fill);
  color: var(--success);
}

.note-copy {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 1px;
}

.note-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note-sub {
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note-action {
  flex: none;
  color: var(--tint-violet);
  font-size: 12.5px;
  font-weight: 600;
}

.note-card.applied .note-action {
  color: var(--muted);
}

.compaction summary {
  color: var(--muted);
  font-size: 12.5px;
  cursor: pointer;
}

.compaction :deep(.markdown-body) {
  margin-top: 6px;
  padding: 10px 12px;
  font-size: 12.5px;
  background: var(--fill);
  border-radius: 12px;
}

.typing {
  display: inline-flex;
  gap: 4px;
  padding: 6px 0;
}

.typing i {
  width: 6px;
  height: 6px;
  background: var(--faint);
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
