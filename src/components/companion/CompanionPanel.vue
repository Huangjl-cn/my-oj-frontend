<template>
  <aside class="companion-panel" aria-label="AI 陪练">
    <header class="panel-header">
      <CompanionAvatar :mood="companion.pet.mood" :size="34" />
      <div class="panel-title">
        <strong>{{ name }}</strong>
        <span class="panel-status">{{ statusText }}</span>
      </div>
      <button
        class="icon-btn"
        type="button"
        :title="
          companion.isFreshConversation ? '已经是新对话了' : '开一段新对话'
        "
        aria-label="开一段新对话"
        :disabled="
          !session || !!companion.busy || companion.isFreshConversation
        "
        @click="companion.startConversation()"
      >
        <IconPlus />
      </button>
      <ConversationMenu
        :conversations="companion.conversations"
        :loading="companion.conversationsLoading"
        :disabled="!session || !!companion.busy"
        @open="companion.loadConversations()"
        @select="companion.switchConversation"
      />
      <button
        class="icon-btn"
        type="button"
        title="AI 设置"
        aria-label="AI 设置"
        @click="companion.setSettingsOpen(true)"
      >
        <IconSettings />
      </button>
      <button
        class="icon-btn"
        type="button"
        title="收起"
        aria-label="收起陪练面板"
        @click="companion.closePanel()"
      >
        <IconClose />
      </button>
    </header>

    <div v-if="companion.loading" class="panel-hint">正在叫醒{{ name }}…</div>
    <div v-else-if="companion.loadError" class="panel-hint error">
      {{ companion.loadError }}
      <button class="link-btn" type="button" @click="companion.load()">
        重试
      </button>
    </div>
    <template v-else-if="session">
      <p v-if="session.mockMode" class="notice">
        模拟模式：不会真正调用模型，回复是固定话术
      </p>
      <p v-if="!session.canCallModel" class="notice action">
        还没配置 DeepSeek API Key。提交后的反应照常有，聊天和提示要先配置。
        <button
          class="link-btn"
          type="button"
          @click="companion.setSettingsOpen(true)"
        >
          去设置
        </button>
      </p>

      <div ref="listRef" class="message-list" @scroll="onListScroll">
        <button
          v-if="companion.hasMore"
          class="load-more"
          type="button"
          :disabled="companion.loadingMore"
          @click="companion.loadMore()"
        >
          {{ companion.loadingMore ? "加载中…" : "加载更早的消息" }}
        </button>
        <p
          v-if="!companion.messages.length && !companion.streaming"
          class="empty"
        >
          嗨，我是{{
            name
          }}。卡住了就点下面的「给点提示」，想让我多说一点就把档位调高；也可以直接问我，或者在代码里选中一段再「问{{
            name
          }}」。
        </p>
        <CompanionMessageItem
          v-for="item in companion.messages"
          :key="item.id"
          :message="item"
          :hint-steps="session.hintSteps"
          @preview="companion.openPreview"
        />
        <CompanionMessageItem
          v-if="companion.streaming"
          :message="streamingMessage"
          :hint-steps="session.hintSteps"
          streaming
          :streaming-text="companion.streaming.text"
          :thinking="companion.streaming.thinking"
        />
        <p v-else-if="companion.busy === 'hint'" class="pending">
          {{ name }}在看你的代码…
        </p>
        <p v-else-if="companion.busy === 'compact'" class="pending">
          正在整理之前的对话…
        </p>
      </div>

      <footer class="composer">
        <p v-if="companion.lastError" class="composer-error">
          {{ companion.lastError }}
        </p>
        <div class="composer-box">
          <textarea
            v-model="draft"
            rows="2"
            :placeholder="placeholder"
            :disabled="!session.canCallModel"
            @keydown="onKeydown"
          />
          <button
            class="send-btn"
            type="button"
            :disabled="!canSend"
            @click="submit"
          >
            发送
          </button>
        </div>
        <div class="composer-tools">
          <ContextUsageRing
            :usage="companion.contextUsage"
            :disabled="!canAsk"
            :compacting="companion.busy === 'compact'"
            @compact="compactNow"
          />
          <HintLevelPicker
            :steps="companion.steps"
            :level="companion.level"
            :direct="companion.isDirectMode"
            :disabled="!!companion.busy"
            :name="name"
            @change="companion.changeLevel"
            @solution="solutionConfirmVisible = true"
          />
          <button
            class="hint-btn"
            type="button"
            :disabled="!canAsk"
            :title="hintTitle"
            @click="companion.askHint()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18h6M10 21h4" />
              <path
                d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"
              />
            </svg>
            给点提示
          </button>
          <span
            class="composer-tip"
            title="Shift+Enter 换行；会带上你当前的代码"
          >
            Enter 发送
          </span>
        </div>
      </footer>
    </template>

    <ConfirmDialog
      v-model:visible="solutionConfirmVisible"
      :title="`确定要${solutionTitle}吗？`"
      message="会给出完整的参考代码和讲解，并作为修改建议放进编辑器预览。自己再想想也许就差一步。"
      :confirm-text="solutionTitle"
      @confirm="confirmSolution"
    />
    <AiSettingDialog
      :visible="companion.settingsOpen"
      @update:visible="companion.setSettingsOpen"
      @saved="companion.load()"
    />
  </aside>
</template>

<script setup lang="ts">
import {
  IconClose,
  IconPlus,
  IconSettings,
} from "@arco-design/web-vue/es/icon";
import message from "@arco-design/web-vue/es/message";
import { computed, defineProps, nextTick, PropType, ref, watch } from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AiSettingDialog from "@/components/companion/AiSettingDialog.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import CompanionMessageItem from "@/components/companion/CompanionMessageItem.vue";
import ContextUsageRing from "@/components/companion/ContextUsageRing.vue";
import ConversationMenu from "@/components/companion/ConversationMenu.vue";
import HintLevelPicker from "@/components/companion/HintLevelPicker.vue";
import { CompanionState, SOLUTION_LEVEL } from "@/composables/useCompanion";
import { CompanionMessage } from "@/services/companion";

/** 离底部不到这么多像素时，新内容到来自动滚到底 */
const STICK_TO_BOTTOM_PX = 80;

// 用运行时声明：CompanionState 是从 vue 泛型推导出的复杂类型，避免 SFC 编译器去解析它
const props = defineProps({
  companion: { type: Object as PropType<CompanionState>, required: true },
});

const draft = ref("");
const solutionConfirmVisible = ref(false);
const listRef = ref<HTMLElement | null>(null);
let stickToBottom = true;

const session = computed(() => props.companion.session);
const name = computed(() => session.value?.personaName || "栗子");
const canAsk = computed(
  () => !!session.value?.canCallModel && !props.companion.busy
);
const canSend = computed(() => canAsk.value && !!draft.value.trim());
const solutionTitle = computed(
  () => props.companion.steps[SOLUTION_LEVEL]?.title || "看答案"
);
const hintTitle = computed(() => {
  const step = props.companion.currentStep;
  if (props.companion.isDirectMode || !step) return "要一条提示";
  return `按「${step.title}」这一档给一条提示：${step.description}`;
});

const statusText = computed(() => {
  switch (props.companion.busy) {
    case "chat":
    case "hint":
      return "思考中…";
    case "solution":
      return "在写参考答案…";
    case "compact":
      return "在整理笔记…";
    case "conversation":
      return "在翻对话…";
    default:
      return session.value?.canCallModel ? "陪你一起做题" : "等你配置 Key";
  }
});

const placeholder = computed(() =>
  session.value?.canCallModel
    ? `问问${name.value}，比如“这里为什么超时？”`
    : "先配置 API Key 才能聊天"
);

const streamingMessage = computed<CompanionMessage>(() => ({
  id: "streaming",
  role: "assistant",
  type: props.companion.streaming?.type ?? "chat",
  hintLevel:
    props.companion.streaming?.type === "solution" ? SOLUTION_LEVEL : null,
  content: "",
}));

const confirmSolution = () => {
  solutionConfirmVisible.value = false;
  void props.companion.showSolution();
};

const submit = async () => {
  const text = draft.value.trim();
  if (!text || !canSend.value) return;
  draft.value = "";
  stickToBottom = true;
  const ok = await props.companion.send(text);
  if (!ok && !draft.value) draft.value = text;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  void submit();
};

const compactNow = async () => {
  const result = await props.companion.compact();
  if (!result) return;
  if (result.compacted) message.success("整理好了，之前的对话变成了一份笔记");
  else message.info("对话还不长，暂时不用整理");
};

const onListScroll = () => {
  const list = listRef.value;
  if (!list) return;
  stickToBottom =
    list.scrollHeight - list.scrollTop - list.clientHeight < STICK_TO_BOTTOM_PX;
};

const scrollToBottom = () => {
  const list = listRef.value;
  if (list && stickToBottom) list.scrollTop = list.scrollHeight;
};

watch(
  () => [
    props.companion.messages.length,
    props.companion.streaming?.text.length,
    props.companion.streaming?.thinking.length,
    props.companion.busy,
  ],
  () => void nextTick(scrollToBottom)
);

// 切题、切对话后回到最新的消息
watch(
  () => props.companion.conversationId,
  () => {
    stickToBottom = true;
    void nextTick(scrollToBottom);
  },
  { immediate: true }
);
</script>

<style scoped>
.companion-panel {
  width: 360px;
  flex: 0 0 360px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--canvas);
  border-left: 1px solid var(--hairline);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
}

.panel-title {
  display: grid;
  flex: 1;
  min-width: 0;
}

.panel-title strong {
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}

.panel-status {
  color: var(--muted);
  font-size: 11px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  cursor: pointer;
  flex-shrink: 0;
}

.icon-btn:hover:not(:disabled) {
  color: var(--ink);
  background: var(--surface-soft);
}

.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.panel-hint {
  padding: 20px 16px;
  color: var(--muted);
  font-size: 13px;
}

.panel-hint.error {
  color: var(--error);
}

.notice {
  margin: 10px 12px 0;
  padding: 8px 10px;
  color: var(--body);
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  line-height: 1.6;
}

.link-btn {
  padding: 0;
  color: var(--primary);
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.link-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.message-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow-y: auto;
}

.load-more {
  align-self: center;
  padding: 2px 10px;
  color: var(--muted);
  background: none;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  font-size: 11px;
  cursor: pointer;
}

.empty,
.pending {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.composer {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--hairline);
  flex-shrink: 0;
}

.composer-error {
  margin: 0 0 6px;
  color: var(--error);
  font-size: 12px;
}

.composer-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.composer-box textarea {
  flex: 1;
  min-height: 52px;
  max-height: 160px;
  padding: 8px 10px;
  color: var(--ink);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.composer-box textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-ring);
}

.send-btn {
  height: 34px;
  padding: 0 14px;
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.composer-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.hint-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px 0 8px;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.hint-btn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hint-btn:hover:not(:disabled) {
  color: var(--on-primary);
  background: var(--primary);
  border-color: var(--primary);
}

.hint-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.hint-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.composer-tip {
  margin-left: auto;
  color: var(--muted-soft);
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .companion-panel {
    width: 320px;
    flex-basis: 320px;
  }
}

@media (max-width: 768px) {
  .companion-panel {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2000;
    width: 100%;
    height: 78vh;
    border-top: 1px solid var(--hairline);
    border-left: none;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.18);
  }
}
</style>
