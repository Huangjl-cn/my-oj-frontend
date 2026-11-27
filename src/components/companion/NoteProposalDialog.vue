<template>
  <Teleport to="body">
    <Transition name="note-dialog" appear>
      <div v-if="visible" class="dialog-backdrop" @click.self="close">
        <section
          class="note-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-proposal-title"
        >
          <header class="dialog-header">
            <span class="dialog-icon" aria-hidden="true">
              <AppIcon name="notebook" :size="18" />
            </span>
            <div class="dialog-heading">
              <h2 id="note-proposal-title">{{ heading }}</h2>
              <p class="dialog-meta">
                <span class="chip">{{ where }}</span>
                <span v-if="proposal?.reason" class="reason">{{
                  proposal.reason
                }}</span>
              </p>
            </div>
            <button
              class="icon-btn"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <p v-if="loading" class="dialog-state">正在对一下笔记现在的样子…</p>
          <p v-else-if="loadError" class="dialog-state error">
            {{ loadError }}
            <button class="link" type="button" @click="load">重试</button>
          </p>
          <template v-else-if="preview">
            <p v-if="statusText" :class="['status', preview.status]">
              {{ statusText }}
            </p>

            <UiSegmented
              v-if="preview.proposal.kind === 'update'"
              v-model="view"
              class="view-switch"
              :options="viewOptions"
              label="预览方式"
            />

            <div class="dialog-body">
              <template
                v-if="view === 'changes' && preview.proposal.kind === 'update'"
              >
                <p v-if="renamed" class="rename">
                  标题：<s>{{ preview.proposal.previousTitle }}</s> →
                  <strong>{{ preview.proposal.title }}</strong>
                </p>
                <ol class="changes">
                  <li
                    v-for="(change, i) in preview.proposal.changes"
                    :key="i"
                    class="change"
                  >
                    <p class="change-head">
                      <span class="change-kind">{{
                        CHANGE_LABELS[change.kind]
                      }}</span>
                      <span v-if="change.reason" class="change-reason">{{
                        change.reason
                      }}</span>
                    </p>
                    <template v-if="change.kind === 'replace'">
                      <pre class="diff del">{{ change.oldText }}</pre>
                      <pre class="diff add">{{
                        change.newText || "（删掉）"
                      }}</pre>
                    </template>
                    <pre
                      v-else-if="change.kind === 'append'"
                      class="diff add"
                      >{{ change.newText }}</pre
                    >
                    <p v-else class="change-note">
                      整篇换成新的内容，切到「改完的全文」看看。
                    </p>
                  </li>
                </ol>
              </template>
              <div v-else class="full">
                <MdViewer :value="preview.content" />
              </div>
            </div>
          </template>

          <p v-if="applyError" class="apply-error" role="alert">
            {{ applyError }}
          </p>

          <footer class="dialog-actions">
            <template v-if="preview?.status === 'applied'">
              <button class="btn sm" type="button" @click="close">关闭</button>
              <router-link
                v-if="noteLink"
                class="btn primary sm"
                :to="noteLink"
                @click="close"
              >
                打开笔记
              </router-link>
            </template>
            <template v-else>
              <button class="btn sm" type="button" @click="close">
                不用了
              </button>
              <button
                class="btn primary sm"
                type="button"
                :disabled="!preview || !canApply || applying"
                @click="apply"
              >
                {{ applyText }}
              </button>
            </template>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import {
  computed,
  defineAsyncComponent,
  defineEmits,
  defineProps,
  onBeforeUnmount,
  PropType,
  ref,
  watch,
} from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import UiSegmented from "@/components/ui/UiSegmented.vue";
import { notifyNoteChanged } from "@/composables/useNoteSync";
import { ApiId } from "@/services/apiId";
import {
  applyNoteProposal,
  canApplyPreview,
  CHANGE_LABELS,
  describeNoteProposal,
  describePreviewStatus,
  NotePreview,
  NoteProposal,
  previewNoteProposal,
} from "@/services/companionNotes";
import { NoteProposal as NoteProposalVO } from "../../../generated";

const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

/** 预览鸭鸭的一条笔记提议：先按笔记现在的内容让后端算一遍，用户点「应用」才写进笔记 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  messageId: { type: [String, Number] as PropType<ApiId>, default: "" },
  index: { type: Number, default: 0 },
  /** 消息上带的那条，加载预览前先用它显示标题 */
  proposal: { type: Object as PropType<NoteProposal | null>, default: null },
  name: { type: String, default: "鸭鸭" },
});

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "applied", index: number, proposal: NoteProposalVO): void;
}>();

const viewOptions = [
  { value: "changes", label: "改了哪些" },
  { value: "full", label: "改完的全文" },
];

const preview = ref<NotePreview | null>(null);
const loading = ref(false);
const loadError = ref("");
const applying = ref(false);
const applyError = ref("");
const view = ref("changes");

let generation = 0;
const load = async () => {
  const current = ++generation;
  loading.value = true;
  loadError.value = "";
  try {
    const result = await previewNoteProposal(props.messageId, props.index);
    if (current === generation) preview.value = result;
  } catch (cause) {
    if (current === generation) {
      loadError.value =
        cause instanceof Error ? cause.message : "预览没加载出来";
    }
  } finally {
    if (current === generation) loading.value = false;
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    preview.value = null;
    applyError.value = "";
    view.value = "changes";
    void load();
  },
  { immediate: true }
);

const shown = computed(() => preview.value?.proposal ?? props.proposal);

const heading = computed(() =>
  shown.value
    ? `${props.name}提议${describeNoteProposal(shown.value)}`
    : "笔记提议"
);

const where = computed(() => {
  const proposal = shown.value;
  if (!proposal) return "";
  if (!proposal.questionId) return "自由笔记";
  return proposal.questionTitle ? `本题 · ${proposal.questionTitle}` : "本题";
});

const renamed = computed(() => {
  const proposal = preview.value?.proposal;
  return !!proposal?.previousTitle && proposal.previousTitle !== proposal.title;
});

const statusText = computed(() =>
  preview.value ? describePreviewStatus(preview.value) : ""
);

const canApply = computed(() =>
  preview.value ? canApplyPreview(preview.value) : false
);

const applyText = computed(() => {
  if (applying.value) return "正在应用…";
  if (preview.value?.status === "overwrite") return "覆盖并应用";
  return preview.value?.proposal.kind === "create" ? "存进笔记" : "应用";
});

const noteLink = computed(() => {
  const id = preview.value?.noteId ?? preview.value?.proposal.noteId;
  return id ? { path: "/notes", query: { id } } : null;
});

const close = () => emit("update:visible", false);

const apply = async () => {
  if (!preview.value || applying.value) return;
  applying.value = true;
  applyError.value = "";
  try {
    const result = await applyNoteProposal(
      props.messageId,
      props.index,
      preview.value.status === "overwrite"
    );
    notifyNoteChanged(result.note);
    emit("applied", props.index, result.raw);
    message.success(
      result.skipped
        ? `已更新「${result.note.title}」，有 ${result.skipped} 处对不上，跳过了`
        : `已存进「${result.note.title}」`
    );
    close();
  } catch (cause) {
    applyError.value = cause instanceof Error ? cause.message : "没有应用上";
    // 笔记又变了：重新对一遍，按钮跟着变
    void load();
  } finally {
    applying.value = false;
  }
};

// 打开时 Esc 关闭
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") close();
};
watch(
  () => props.visible,
  (visible) => {
    if (visible) document.addEventListener("keydown", onKeydown);
    else document.removeEventListener("keydown", onKeydown);
  },
  { immediate: true }
);
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  overflow: auto;
  background: rgba(9, 9, 11, 0.42);
  backdrop-filter: blur(4px);
}

.note-dialog {
  width: min(640px, 100%);
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 22px 20px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.dialog-icon {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--tint-violet) 12%, var(--panel));
  color: var(--tint-violet);
}

.dialog-heading {
  flex: 1;
  min-width: 0;
}

.dialog-heading h2 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.dialog-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}

.chip {
  padding: 0 9px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  line-height: 22px;
}

.dialog-state {
  margin: 12px 0;
  color: var(--muted);
  font-size: 13.5px;
  text-align: center;
}

.dialog-state.error,
.apply-error {
  color: var(--danger);
}

.apply-error {
  margin: 0;
  font-size: 13px;
}

.link {
  margin-left: 6px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.status {
  margin: 0;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--body);
  font-size: 13px;
}

.status.overwrite,
.status.stale,
.status.missing {
  background: color-mix(in srgb, var(--danger) 8%, var(--panel));
}

.view-switch {
  align-self: flex-start;
}

.dialog-body {
  min-height: 0;
  overflow: auto;
}

.rename {
  margin: 0 0 10px;
  color: var(--body);
  font-size: 13px;
}

.rename s {
  color: var(--faint);
}

.changes {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.change {
  display: grid;
  gap: 6px;
}

.change-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  font-size: 12.5px;
}

.change-kind {
  color: var(--ink);
  font-weight: 600;
}

.change-reason {
  color: var(--muted);
}

.change-note {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.diff {
  max-height: 220px;
  margin: 0;
  padding: 8px 12px;
  overflow: auto;
  border-left: 3px solid;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font: 12.5px/1.6 var(--font-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.diff.del {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 7%, var(--panel));
  color: var(--muted);
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--danger) 45%, transparent);
}

.diff.add {
  border-color: var(--success);
  background: color-mix(in srgb, var(--success) 8%, var(--panel));
  color: var(--ink);
}

.full {
  padding: 4px 2px;
}

/* 标题已经在弹窗顶上；正文里的标题压小一点，别比弹窗标题还大 */
.full :deep(.markdown-body) {
  background: transparent;
  font-size: 14px;
}

.full :deep(.markdown-body > :first-child) {
  margin-top: 0 !important;
}

.full :deep(.markdown-body h1),
.full :deep(.markdown-body h2),
.full :deep(.markdown-body h3),
.full :deep(.markdown-body h4) {
  margin: 14px 0 6px !important;
  padding: 0 !important;
  border: none !important;
  font-size: 15px !important;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-actions a.btn {
  text-decoration: none;
}

.note-dialog-enter-active,
.note-dialog-leave-active {
  transition: opacity 180ms ease;
}

.note-dialog-enter-active .note-dialog,
.note-dialog-leave-active .note-dialog {
  transition: transform var(--motion-standard) var(--ease-out);
}

.note-dialog-enter-from,
.note-dialog-leave-to {
  opacity: 0;
}

.note-dialog-enter-from .note-dialog,
.note-dialog-leave-to .note-dialog {
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .note-dialog-enter-from .note-dialog,
  .note-dialog-leave-to .note-dialog {
    transform: none;
  }
}
</style>
