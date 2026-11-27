<template>
  <div ref="rootRef" class="conversation-menu">
    <button
      class="icon-btn tip-down"
      type="button"
      :data-tip="open ? undefined : '之前的对话'"
      aria-label="之前的对话"
      aria-haspopup="menu"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
    >
      <AppIcon name="history" :size="18" />
    </button>

    <div v-if="open" class="menu-popover" role="menu" aria-label="之前的对话">
      <p class="menu-title">这道题的对话</p>
      <p v-if="loading && !conversations.length" class="menu-empty">加载中…</p>
      <p v-else-if="!conversations.length" class="menu-empty">还没有其他对话</p>
      <ul v-else class="menu-list">
        <li v-for="item in conversations" :key="String(item.id)">
          <button
            type="button"
            role="menuitem"
            :class="['menu-item', { active: item.active }]"
            @click="choose(item)"
          >
            <span class="item-title">{{ titleOf(item) }}</span>
            <span class="item-meta">
              {{ item.active ? "当前 · " : ""
              }}{{ formatTime(item.updateTime) }} · {{ item.messageCount }} 条
            </span>
          </button>
        </li>
      </ul>
      <div class="menu-actions">
        <button
          type="button"
          role="menuitem"
          class="menu-action"
          :disabled="!canSummarize"
          :title="canSummarize ? undefined : '先聊几句、并且配好 Key，才能整理'"
          @click="summarize"
        >
          <AppIcon name="notebook" :size="15" />
          把当前对话整理成笔记
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType, ref } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { useDismissable } from "@/composables/useDismissable";
import { CompanionConversation } from "@/services/companion";
import { ApiId } from "@/services/apiId";
import { formatDateTime } from "@/utils/dateTime";

defineProps({
  conversations: {
    type: Array as PropType<CompanionConversation[]>,
    default: () => [],
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** 当前对话聊过、能调模型时才能「整理成笔记」 */
  canSummarize: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (event: "open"): void;
  (event: "select", id: ApiId): void;
  (event: "summarize"): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
useDismissable(rootRef, open);

const toggle = () => {
  open.value = !open.value;
  if (open.value) emit("open");
};

const choose = (item: CompanionConversation) => {
  open.value = false;
  if (!item.active) emit("select", item.id);
};

const summarize = () => {
  open.value = false;
  emit("summarize");
};

const titleOf = (item: CompanionConversation) => {
  if (item.title) return item.title;
  return item.messageCount ? "提示与提交记录" : "新对话";
};

/** 今年的只显示月日时分 */
const formatTime = (value?: string) => {
  const text = formatDateTime(value);
  const year = String(new Date().getFullYear());
  return text.startsWith(`${year}-`) ? text.slice(year.length + 1) : text;
};
</script>

<style scoped>
.conversation-menu {
  position: relative;
}

.icon-btn {
  width: 34px;
  height: 34px;
}

.icon-btn[aria-expanded="true"] {
  background: var(--fill);
  color: var(--ink);
}

.icon-btn:disabled {
  cursor: default;
  opacity: 0.35;
}

.menu-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  width: 260px;
  max-height: 320px;
  padding: 8px;
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-float);
}

.menu-title {
  margin: 2px 4px 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
}

.menu-empty {
  margin: 6px 4px;
  color: var(--muted);
  font-size: 12px;
}

.menu-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 7px 8px;
  color: var(--body);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  text-align: left;
  cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
  outline: none;
  background: var(--surface-soft);
}

.menu-item.active {
  background: var(--primary-light);
  border-color: var(--line-strong);
  cursor: default;
}

.item-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  color: var(--muted);
  font-size: 11px;
}

/* 列表很长时这一行贴在弹层底部 */
.menu-actions {
  position: sticky;
  bottom: -8px;
  margin: 6px -8px -8px;
  padding: 6px 8px 8px;
  border-top: 1px solid var(--line);
  background: var(--panel);
}

.menu-action {
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--body);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.menu-action:hover:not(:disabled),
.menu-action:focus-visible {
  outline: none;
  background: var(--fill);
  color: var(--tint-violet);
}

.menu-action:disabled {
  cursor: default;
  opacity: 0.45;
}
</style>
