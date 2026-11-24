<template>
  <aside class="companion-panel" aria-label="AI 陪练">
    <header class="panel-header">
      <CompanionAvatar :mood="companion.pet.mood" :size="34" />
      <div class="panel-title">
        <strong>{{ name }}</strong>
        <span class="panel-status">{{ statusText }}</span>
      </div>
      <span
        v-if="usage"
        :class="['usage-chip', { warn: usage.near }]"
        :title="usage.title"
      >
        {{ usage.text }}
      </span>
      <button
        class="icon-btn"
        type="button"
        title="整理记忆：把较早的对话整理成笔记，腾出上下文"
        aria-label="整理记忆"
        :disabled="!canAsk"
        @click="compactNow"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" />
          <path d="M10 11h4M10 15h4M9 4h6" />
        </svg>
      </button>
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

      <section v-if="!companion.isDirectMode" class="ladder">
        <div class="ladder-head">
          <span class="ladder-track">{{ trackLabel }}</span>
          <span class="ladder-current">
            已到「{{ currentStep?.title ?? "自己想" }}」
          </span>
        </div>
        <ol class="ladder-steps">
          <li
            v-for="step in companion.steps"
            :key="step.level"
            :class="{
              unlocked: step.level <= companion.level,
              current: step.level === companion.level,
              solution: step.level === SOLUTION_LEVEL,
            }"
          >
            <button
              type="button"
              :title="step.description"
              :disabled="!canStep(step)"
              @click="onStepClick(step)"
            >
              {{ step.title }}
            </button>
          </li>
        </ol>
        <div class="ladder-actions">
          <button
            class="action-btn primary"
            type="button"
            :disabled="!canAsk || !companion.nextStep"
            :title="companion.nextStep?.description"
            @click="companion.askHint()"
          >
            {{
              companion.nextStep
                ? `再给点提示：${companion.nextStep.title}`
                : "提示已经到最后一步"
            }}
          </button>
          <button
            class="action-btn secondary"
            type="button"
            :disabled="!canAsk"
            @click="solutionConfirmVisible = true"
          >
            {{ solutionTitle }}
          </button>
        </div>
        <button
          v-if="companion.level > 0"
          class="link-btn restart"
          type="button"
          :disabled="!!companion.busy"
          @click="companion.changeLevel(0)"
        >
          从头自己做
        </button>
      </section>
      <section v-else class="ladder direct">
        <span>有问必答模式：不分步骤，问什么答什么</span>
        <button
          class="link-btn"
          type="button"
          :disabled="!canAsk"
          @click="companion.showSolution()"
        >
          看答案
        </button>
      </section>

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
        <p v-if="!companion.messages.length && !companion.streaming" class="empty">
          嗨，我是{{ name }}。卡住了就点「再给点提示」，也可以直接问我；提交之后我也会说两句。
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
        <p class="composer-tip">
          Enter 发送，Shift+Enter 换行；会带上你当前的代码和选中的行
        </p>
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
import { IconClose, IconSettings } from "@arco-design/web-vue/es/icon";
import message from "@arco-design/web-vue/es/message";
import { computed, defineProps, nextTick, PropType, ref, watch } from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AiSettingDialog from "@/components/companion/AiSettingDialog.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import CompanionMessageItem from "@/components/companion/CompanionMessageItem.vue";
import { CompanionState, MAX_HINT_LEVEL } from "@/composables/useCompanion";
import { CompanionMessage, HintStep } from "@/services/companion";

const SOLUTION_LEVEL = MAX_HINT_LEVEL + 1;
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
const trackLabel = computed(() =>
  props.companion.track === "bug" ? "找 bug" : "找思路"
);
const currentStep = computed(() => props.companion.steps[props.companion.level]);
const solutionTitle = computed(
  () => props.companion.steps[SOLUTION_LEVEL]?.title || "看答案"
);

const statusText = computed(() => {
  switch (props.companion.busy) {
    case "chat":
    case "hint":
      return "思考中…";
    case "solution":
      return "在写参考答案…";
    case "compact":
      return "在整理笔记…";
    default:
      return session.value?.canCallModel ? "陪你一起做题" : "等你配置 Key";
  }
});

const placeholder = computed(() =>
  session.value?.canCallModel
    ? `问问${name.value}，比如“这里为什么超时？”`
    : "先配置 API Key 才能聊天"
);

const formatTokens = (count: number) => {
  if (count >= 1_000_000) {
    return `${Number((count / 1_000_000).toFixed(1))}M`;
  }
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
};

const usage = computed(() => {
  const value = props.companion.contextUsage;
  if (!value || !value.limitTokens) return undefined;
  const percent = (value.ratio * 100).toFixed(1);
  return {
    text: `${percent}% · ${formatTokens(value.usedTokens)} / ${formatTokens(
      value.limitTokens
    )}`,
    title: `上下文占用${value.estimated ? "（估算）" : ""}：到 ${Math.round(
      value.compactRatio * 100
    )}% 时会自动整理记忆`,
    near: value.ratio >= value.compactRatio * 0.9,
  };
});

const streamingMessage = computed<CompanionMessage>(() => ({
  id: "streaming",
  role: "assistant",
  type: props.companion.streaming?.type ?? "chat",
  hintLevel:
    props.companion.streaming?.type === "solution" ? SOLUTION_LEVEL : null,
  hintTrack: props.companion.track,
  content: "",
}));

const canStep = (step: HintStep) =>
  canAsk.value && step.level !== props.companion.level;

const onStepClick = (step: HintStep) => {
  if (step.level === SOLUTION_LEVEL) {
    solutionConfirmVisible.value = true;
  } else if (step.level > props.companion.level) {
    void props.companion.askHint(step.level);
  } else {
    void props.companion.changeLevel(step.level);
  }
};

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

watch(
  () => props.companion.session?.questionId,
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

.usage-chip {
  padding: 2px 8px;
  color: var(--muted);
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  font-family: var(--font-code);
  font-size: 10.5px;
  white-space: nowrap;
}

.usage-chip.warn {
  color: var(--accent-amber);
  border-color: var(--accent-amber);
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

.ladder {
  margin: 10px 12px 0;
  padding: 10px;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.ladder.direct {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--body);
  font-size: 12px;
}

.ladder-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.ladder-track {
  color: var(--ink);
  font-weight: 600;
}

.ladder-current {
  color: var(--muted);
}

.ladder-steps {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 3px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
}

.ladder-steps button {
  width: 100%;
  min-height: 34px;
  padding: 4px 2px;
  color: var(--muted);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 10.5px;
  line-height: 1.25;
  cursor: pointer;
}

.ladder-steps li.unlocked button {
  color: var(--primary);
  border-color: rgba(204, 120, 92, 0.45);
}

.ladder-steps li.current button {
  color: var(--on-primary);
  background: var(--primary);
  border-color: var(--primary);
}

.ladder-steps li.solution button {
  border-style: dashed;
}

.ladder-steps button:disabled {
  cursor: default;
}

.ladder-steps li:not(.current) button:disabled {
  opacity: 0.55;
}

.ladder-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn.primary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btn.secondary {
  color: var(--body);
  background: var(--canvas);
  border: 1px solid var(--hairline);
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.restart {
  margin-top: 8px;
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

.composer-tip {
  margin: 6px 0 0;
  color: var(--muted-soft);
  font-size: 11px;
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
