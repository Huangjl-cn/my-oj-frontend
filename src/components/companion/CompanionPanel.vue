<template>
  <aside ref="rootRef" class="companion-panel" aria-label="AI 陪练">
    <header class="panel-header">
      <!-- 面板打开时，编辑器上的鸭鸭飞到这里，动作照常 -->
      <span
        ref="duckBox"
        :class="['panel-duck', { 'in-flight': flight.active }]"
        @pointerenter="duck?.hover()"
      >
        <CompanionAvatar
          v-if="duck"
          :pose="duck.pose.value"
          :replay="duck.poseKey.value"
          :amp="companion.pet.intensity"
          :look="look"
          :size="40"
          lively
        />
        <CompanionAvatar v-else :mood="companion.pet.mood" :size="30" />
      </span>
      <div class="panel-title">
        <strong>{{ name }}</strong>
        <span v-if="companion.busy" class="panel-status">{{ statusText }}</span>
      </div>
      <button
        class="icon-btn tip-down"
        type="button"
        :data-tip="companion.isFreshConversation ? '已经是新对话了' : '新对话'"
        aria-label="开一段新对话"
        :disabled="
          !session || !!companion.busy || companion.isFreshConversation
        "
        @click="companion.startConversation()"
      >
        <AppIcon name="plus" :size="18" />
      </button>
      <ConversationMenu
        :conversations="companion.conversations"
        :loading="companion.conversationsLoading"
        :disabled="!session || !!companion.busy"
        @open="companion.loadConversations()"
        @select="companion.switchConversation"
      />
      <button
        class="icon-btn tip-down"
        type="button"
        data-tip="AI 设置"
        aria-label="AI 设置"
        @click="companion.setSettingsOpen(true)"
      >
        <AppIcon name="settings" :size="18" />
      </button>
      <button
        class="icon-btn tip-down"
        type="button"
        data-tip="收起"
        aria-label="收起陪练面板"
        @click="companion.closePanel()"
      >
        <AppIcon name="close" :size="18" />
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

      <footer :class="['composer', { lifted: !atBottom }]">
        <p v-if="companion.lastError" class="composer-error">
          {{ companion.lastError }}
        </p>
        <div class="composer-box">
          <textarea
            v-model="draft"
            rows="2"
            :placeholder="placeholder"
            :disabled="!session.canCallModel"
            aria-label="发给陪练的消息"
            @keydown="onKeydown"
          />
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
              <AppIcon name="bulb" :size="14" />
              提示
            </button>
            <button
              class="send-btn tip-up tip-end"
              type="button"
              data-tip="发送 (Enter)，Shift+Enter 换行"
              aria-label="发送"
              :disabled="!canSend"
              @click="submit"
            >
              <AppIcon name="arrow-up" :size="16" :stroke-width="2.2" />
            </button>
          </div>
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
import message from "@arco-design/web-vue/es/message";
import {
  computed,
  defineExpose,
  defineProps,
  nextTick,
  PropType,
  ref,
  watch,
} from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AiSettingDialog from "@/components/companion/AiSettingDialog.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import CompanionMessageItem from "@/components/companion/CompanionMessageItem.vue";
import ContextUsageRing from "@/components/companion/ContextUsageRing.vue";
import ConversationMenu from "@/components/companion/ConversationMenu.vue";
import HintLevelPicker from "@/components/companion/HintLevelPicker.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { CompanionState, SOLUTION_LEVEL } from "@/composables/useCompanion";
import { toFlightRect, useDuckFlight } from "@/composables/useDuckFlight";
import { PetBehavior } from "@/composables/usePetBehavior";
import { usePetLook } from "@/composables/usePetLook";
import { CompanionMessage } from "@/services/companion";

/** 离底部不到这么多像素时，新内容到来自动滚到底 */
const STICK_TO_BOTTOM_PX = 80;

// 用运行时声明：CompanionState 是从 vue 泛型推导出的复杂类型，避免 SFC 编译器去解析它
const props = defineProps({
  companion: { type: Object as PropType<CompanionState>, required: true },
  /** 和编辑器上的桌宠共用的鸭鸭行为；不传就显示静态的小鸭鸭 */
  duck: { type: Object as PropType<PetBehavior | null>, default: null },
});

// region 标题里的鸭鸭

const rootRef = ref<HTMLElement | null>(null);
const duckBox = ref<HTMLElement | null>(null);
const { flight } = useDuckFlight();
const look = usePetLook(duckBox, (point) =>
  props.duck?.noteUserActivity(point)
);

/** 飞行动画用：标题里鸭鸭的最终位置（面板刚打开时还在滑入，扣掉这段位移） */
const duckRect = () => {
  const svg = duckBox.value?.querySelector("svg");
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  const transform = rootRef.value
    ? getComputedStyle(rootRef.value).transform
    : "none";
  let dx = 0;
  let dy = 0;
  if (transform && transform !== "none") {
    const matrix = new DOMMatrixReadOnly(transform);
    dx = matrix.m41;
    dy = matrix.m42;
  }
  return toFlightRect({
    left: rect.left - dx,
    top: rect.top - dy,
    width: rect.width,
    height: rect.height,
  });
};

defineExpose({ duckRect });

// endregion

const draft = ref("");
const solutionConfirmVisible = ref(false);
const listRef = ref<HTMLElement | null>(null);
let stickToBottom = true;
/** 消息列表滚到了最底下；没到底时输入框上方加一条分隔，和上面的回答分开 */
const atBottom = ref(true);

const measureBottom = () => {
  const list = listRef.value;
  if (!list) return;
  atBottom.value = list.scrollHeight - list.scrollTop - list.clientHeight < 4;
};

const session = computed(() => props.companion.session);
const name = computed(() => session.value?.personaName || "鸭鸭");
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
  measureBottom();
};

const scrollToBottom = () => {
  const list = listRef.value;
  if (list && stickToBottom) list.scrollTop = list.scrollHeight;
  measureBottom();
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
/* 做题页右边的第三块面板 */
.companion-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);
  animation: panel-in var(--motion-standard) var(--ease-out);
}

.panel-header {
  height: 54px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--line);
  --mascot-fill: var(--panel);
}

.panel-duck {
  flex: none;
  display: grid;
  place-items: center;
}

.panel-duck.in-flight {
  visibility: hidden;
}

.panel-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-left: 6px;
}

.panel-title strong {
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
}

.panel-status {
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.icon-btn {
  width: 34px;
  height: 34px;
}

.icon-btn:disabled {
  cursor: default;
  opacity: 0.35;
}

.icon-btn:disabled:hover {
  background: transparent;
  color: var(--muted);
}

.panel-hint {
  padding: 20px 18px;
  color: var(--muted);
  font-size: 13.5px;
}

.panel-hint.error {
  color: var(--danger);
}

.notice {
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--body);
  font-size: 12.5px;
  line-height: 1.6;
}

.link-btn {
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.link-btn:disabled {
  cursor: default;
  opacity: 0.5;
}

.message-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 18px 16px 24px;
  overflow-y: auto;
  /* 上下边缘淡出，滚动时文字不会贴着标题栏和输入框硬切 */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 12px,
    #000 calc(100% - 20px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 12px,
    #000 calc(100% - 20px),
    transparent 100%
  );
}

.load-more {
  align-self: center;
  padding: 3px 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
}

.empty,
.pending {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.75;
}

.composer {
  position: relative;
  flex: none;
  padding: 10px 12px 12px;
  border-top: 1px solid transparent;
  transition: border-color var(--motion-fast) ease;
}

/* 上面还有没看到的回答：输入框区域和消息列表之间加一条线 */
.composer.lifted {
  border-top-color: var(--line);
}

.composer-error {
  margin: 0 4px 8px;
  color: var(--danger);
  font-size: 12.5px;
}

.composer-box {
  padding: 10px 10px 10px 14px;
  border-radius: 18px;
  background: var(--fill);
  transition: box-shadow var(--motion-fast) ease;
}

.composer-box:focus-within {
  box-shadow: 0 0 0 1px var(--line-strong);
}

.composer-box textarea {
  display: block;
  width: 100%;
  min-height: 44px;
  max-height: 160px;
  padding: 2px 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}

.composer-box textarea::placeholder {
  color: var(--faint);
}

.composer-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.hint-btn {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 11px 0 9px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line);
  color: var(--muted);
  font-size: 12.5px;
  white-space: nowrap;
  cursor: pointer;
}

.hint-btn:hover:not(:disabled) {
  color: var(--ink);
}

.hint-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.hint-btn:disabled {
  cursor: default;
  opacity: 0.5;
}

.send-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: none;
  margin-left: auto;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  color: var(--on-primary);
  cursor: pointer;
}

.send-btn:disabled {
  cursor: default;
  opacity: 0.3;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .companion-panel {
    animation: none;
  }
}

@media (max-width: 1024px) {
  .companion-panel {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2000;
    height: 78vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    box-shadow: var(--shadow-float);
  }
}
</style>
