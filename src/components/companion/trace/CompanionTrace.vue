<template>
  <section class="trace" role="dialog" aria-label="鸭鸭的轨迹">
    <header class="trace-head">
      <div class="trace-tabs">
        <button class="trace-tab" type="button" @click="emit('close')">
          对话
        </button>
        <button class="trace-tab on" type="button" aria-current="true">
          轨迹
        </button>
      </div>
      <span class="trace-title" :title="title">{{ title }}</span>
      <div class="toggles" role="group" aria-label="显示哪些内容">
        <button
          v-for="toggle in toggles"
          :key="toggle.key"
          :class="['toggle', { on: options[toggle.key] }]"
          type="button"
          :aria-pressed="options[toggle.key]"
          @click="options[toggle.key] = !options[toggle.key]"
        >
          {{ toggle.label }}
        </button>
      </div>
      <UiInput
        v-model="keyword"
        class="search"
        icon="search"
        clearable
        placeholder="搜索"
        aria-label="搜索轨迹"
      />
      <button
        class="icon-btn tip-down"
        type="button"
        data-tip="刷新"
        aria-label="刷新轨迹"
        :disabled="loading"
        @click="load()"
      >
        <AppIcon name="refresh" :size="17" />
      </button>
      <button
        class="icon-btn tip-down tip-end"
        type="button"
        data-tip="回到对话 (Esc)"
        aria-label="关闭轨迹"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="18" />
      </button>
    </header>

    <p v-if="error" class="state error">
      {{ error }}
      <button class="link" type="button" @click="load()">重试</button>
    </p>
    <p v-else-if="!trace" class="state">加载中…</p>
    <template v-else>
      <p v-if="notice" class="notice">{{ notice }}</p>
      <TraceTimeline
        v-if="bars.length"
        :bars="bars"
        :turns="trace.turns.length"
        :selected="selectedKey"
        @select="select"
      />
      <div :class="['trace-body', { 'with-detail': !!selectedRow }]">
        <ol ref="listRef" class="rows" aria-label="每一步">
          <li v-if="!visibleRows.length" class="empty">
            {{ keyword.trim() ? "没找到" : "还没有轨迹" }}
          </li>
          <li
            v-for="item in visibleRows"
            :key="item.key"
            :class="[
              'row',
              item.kind,
              {
                on: item.key === selectedKey,
                error: item.error,
                'turn-start': item.kind === 'user',
              },
            ]"
          >
            <span class="gutter">
              <template v-if="item.kind === 'user' && item.turn">
                <span class="round">第 {{ item.turn.index }} 轮</span>
                <span class="round-type">{{
                  TURN_LABELS[item.turn.type]
                }}</span>
              </template>
            </span>
            <button
              class="row-main"
              type="button"
              :data-key="item.key"
              @click="select(item.key)"
            >
              <span :class="['trace-tag', item.kind]">{{
                ROW_LABELS[item.kind]
              }}</span>
              <span :class="['row-title', { mono: item.kind === 'tool' }]">{{
                item.title
              }}</span>
              <span v-if="options.duration && item.meta" class="row-meta">{{
                item.meta
              }}</span>
            </button>
          </li>
        </ol>
        <TraceDetail
          v-if="selectedRow"
          class="trace-detail"
          :trace="trace"
          :row="selectedRow"
          @close="selectedKey = ''"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  reactive,
  ref,
  watch,
} from "vue";

import TraceDetail from "@/components/companion/trace/TraceDetail.vue";
import TraceTimeline from "@/components/companion/trace/TraceTimeline.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import { ApiId } from "@/services/apiId";
import {
  buildTraceRows,
  filterTraceRows,
  layoutTimeline,
  loadTrace,
  ROW_LABELS,
  Trace,
  TURN_LABELS,
} from "@/services/companionTrace";

/**
 * 鸭鸭的轨迹：一段对话里每一轮发给模型的内容、模型和工具调用、耗时和 token。
 * 铺满做题页显示；鸭鸭回答完一轮会自动刷新。
 */
const props = defineProps({
  conversationId: {
    type: [String, Number] as PropType<ApiId>,
    required: true,
  },
  /** 鸭鸭是否正在忙（回答、提示……）：忙完自动刷新 */
  busy: { type: Boolean, default: false },
  name: { type: String, default: "鸭鸭" },
});

const emit = defineEmits<{
  (event: "close"): void;
}>();

type ToggleKey = "duration" | "context" | "calls";
const toggles: { key: ToggleKey; label: string }[] = [
  { key: "duration", label: "耗时" },
  { key: "context", label: "上下文" },
  { key: "calls", label: "模型调用" },
];

const options = reactive<Record<ToggleKey, boolean>>({
  duration: true,
  context: true,
  calls: true,
});

const trace = ref<Trace | null>(null);
const loading = ref(false);
const error = ref("");
const keyword = ref("");
const selectedKey = ref("system-0");
const listRef = ref<HTMLElement | null>(null);

let generation = 0;
const load = async () => {
  const current = ++generation;
  loading.value = true;
  error.value = "";
  try {
    const result = await loadTrace(props.conversationId);
    if (current === generation) trace.value = result;
  } catch (cause) {
    if (current === generation) {
      error.value = cause instanceof Error ? cause.message : "轨迹没加载出来";
    }
  } finally {
    if (current === generation) loading.value = false;
  }
};

watch(
  () => props.conversationId,
  () => {
    trace.value = null;
    selectedKey.value = "system-0";
    void load();
  }
);

// 鸭鸭忙完一轮（回答、提示、整理记忆）就刷新，新的一轮出现在最下面
watch(
  () => props.busy,
  (busy, wasBusy) => {
    if (wasBusy && !busy) void load();
  }
);

const title = computed(() => trace.value?.title || "还没提问的对话");

/** 全部的行（按开关隐藏的也在里面，点时间条能选中） */
const allRows = computed(() =>
  trace.value ? buildTraceRows(trace.value) : []
);

const visibleRows = computed(() =>
  trace.value
    ? filterTraceRows(
        buildTraceRows(trace.value, {
          context: options.context,
          calls: options.calls,
        }),
        keyword.value
      )
    : []
);

const selectedRow = computed(
  () => allRows.value.find((item) => item.key === selectedKey.value) ?? null
);

const bars = computed(() => (trace.value ? layoutTimeline(trace.value) : []));

const notice = computed(() => {
  if (!trace.value) return "";
  if (trace.value.fromMemory) {
    return `没有记录，从${props.name}的记忆还原（没有耗时）`;
  }
  if (!trace.value.recordedFromStart) {
    return "更早的部分没有记录";
  }
  return "";
});

const select = async (key: string) => {
  selectedKey.value = key;
  await nextTick();
  listRef.value
    ?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)
    ?.scrollIntoView({ block: "nearest" });
};

// Esc 回到对话
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && !event.defaultPrevented) emit("close");
};

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  void load();
});

onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.trace {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  animation: trace-in var(--motion-standard) var(--ease-out);
}

@keyframes trace-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.trace-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 10px 0 12px;
  border-bottom: 1px solid var(--line);
}

.trace-tabs {
  display: flex;
  gap: 2px;
}

.trace-tab {
  height: 32px;
  padding: 0 13px;
  border: none;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 13.5px;
  cursor: pointer;
}

.trace-tab:hover {
  background: var(--fill);
  color: var(--ink);
}

.trace-tab.on {
  background: var(--fill-strong);
  color: var(--ink);
  font-weight: 600;
  cursor: default;
}

.trace-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.toggles {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  background: var(--fill);
}

.toggle {
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--faint);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
}

.toggle.on {
  background: var(--panel);
  color: var(--ink);
  box-shadow: var(--shadow-panel);
}

.search {
  width: 200px;
  flex: none;
}

.state {
  margin: auto;
  color: var(--muted);
  font-size: 13.5px;
}

.state.error {
  color: var(--danger);
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

.notice {
  flex: none;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--fill);
  color: var(--muted);
  font-size: 12.5px;
}

.trace-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.trace-body.with-detail {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 42%);
}

.rows {
  min-height: 0;
  margin: 0;
  padding: 6px 0 16px;
  overflow-y: auto;
  list-style: none;
}

.empty {
  padding: 40px 20px;
  color: var(--faint);
  font-size: 13px;
  text-align: center;
}

.row {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
}

/* 每一轮开头空一点、加一条分隔 */
.row.turn-start {
  margin-top: 6px;
  border-top: 1px solid var(--line);
  padding-top: 6px;
}

.gutter {
  display: grid;
  align-content: start;
  justify-items: end;
  padding: 7px 8px 0 0;
  border-right: 2px solid var(--line);
}

.round {
  color: var(--muted);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.round-type {
  color: var(--faint);
  font-size: 11px;
  white-space: nowrap;
}

.row-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 5px 16px 5px 12px;
  border: none;
  background: none;
  color: var(--body);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.row-main:hover {
  background: var(--fill);
}

.row.on .row-main {
  background: var(--fill-strong);
}

.row.on .gutter {
  border-right-color: var(--ink);
}

.row-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.row-title.mono {
  font-family: var(--font-mono);
  font-size: 12.5px;
}

.row.user .row-title {
  color: var(--ink);
  font-weight: 600;
}

.row.context .row-title,
.row.model .row-title {
  color: var(--muted);
}

.row.error .row-title {
  color: var(--danger);
}

.row-meta {
  flex: none;
  color: var(--faint);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1100px) {
  .search {
    width: 150px;
  }
}

@media (max-width: 860px) {
  .toggles {
    display: none;
  }
}

@media (max-width: 900px) {
  .trace-body.with-detail {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(0, 1.2fr);
  }

  .trace-body.with-detail .trace-detail {
    border-left: none;
    border-top: 1px solid var(--line);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trace {
    animation: none;
  }
}
</style>
