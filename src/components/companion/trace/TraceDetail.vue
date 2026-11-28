<template>
  <aside class="detail" aria-label="这一步的详情">
    <header class="detail-head">
      <span :class="['trace-tag', row.kind]">{{ ROW_LABELS[row.kind] }}</span>
      <span class="detail-title">{{ heading }}</span>
      <button
        class="icon-btn tip-down tip-end"
        type="button"
        data-tip="收起详情"
        aria-label="收起详情"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </header>

    <!-- 系统：提示词 / 工具 -->
    <template v-if="row.kind === 'system'">
      <div class="detail-tabs" role="tablist">
        <button
          :class="['detail-tab', { on: systemTab === 'prompt' }]"
          type="button"
          role="tab"
          :aria-selected="systemTab === 'prompt'"
          @click="systemTab = 'prompt'"
        >
          系统提示词
        </button>
        <button
          :class="['detail-tab', { on: systemTab === 'tools' }]"
          type="button"
          role="tab"
          :aria-selected="systemTab === 'tools'"
          @click="systemTab = 'tools'"
        >
          工具 <span class="num">{{ tools.length }}</span>
        </button>
      </div>
      <div class="detail-body">
        <pre v-if="systemTab === 'prompt'" class="text">{{
          systemPrompt || "（没有记录）"
        }}</pre>
        <template v-else>
          <p v-if="!tools.length" class="muted">这一轮没有工具</p>
          <details v-for="tool in tools" :key="tool.name" class="tool">
            <summary>
              <code class="tool-name">{{ tool.name }}</code>
              <span class="tool-desc">{{ tool.description }}</span>
            </summary>
            <p class="tool-full">{{ tool.description }}</p>
            <table v-if="tool.parameters.length" class="params">
              <tr v-for="param in tool.parameters" :key="param.name">
                <td>
                  <code>{{ param.name }}</code>
                  <span v-if="param.required" class="required">必填</span>
                </td>
                <td class="type">{{ param.type }}</td>
                <td>{{ param.description }}</td>
              </tr>
            </table>
            <p v-else class="muted">没有参数</p>
          </details>
        </template>
      </div>
    </template>

    <div v-else class="detail-body">
      <dl v-if="facts.length" class="facts">
        <template v-for="fact in facts" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </template>
      </dl>

      <template v-if="row.kind === 'user' && row.turn">
        <h4>{{ row.turn.type === "chat" ? "用户说" : "这一轮" }}</h4>
        <pre class="text">{{ row.turn.userText || "（没有记录）" }}</pre>
        <h4 v-if="row.turn.context.length">
          同时发给模型的上下文（{{ row.turn.context.length }} 段）
        </h4>
        <details
          v-for="(section, index) in row.turn.context"
          :key="index"
          class="section"
        >
          <summary>{{ section.title || "（开头）" }}</summary>
          <pre class="text">{{ section.text }}</pre>
        </details>
      </template>

      <template v-else-if="row.kind === 'context' && row.section">
        <pre class="text">{{ row.section.text || "（空）" }}</pre>
      </template>

      <template v-else-if="row.kind === 'tool' && row.step">
        <h4>参数</h4>
        <pre class="code">{{ prettyJson(row.step.input) || "{}" }}</pre>
        <h4>{{ row.step.error ? "出错" : "结果" }}</h4>
        <pre :class="['text', { danger: !!row.step.error }]">{{
          row.step.output || row.step.error || "（没有结果）"
        }}</pre>
      </template>

      <template
        v-else-if="(row.kind === 'model' || row.kind === 'error') && row.step"
      >
        <p v-if="row.step.error" class="danger-text">{{ row.step.error }}</p>
        <template v-if="row.step.toolCalls.length">
          <h4>发起的工具调用</h4>
          <pre
            v-for="(call, index) in row.step.toolCalls"
            :key="index"
            class="code"
            >{{ call.name }} {{ prettyJson(call.arguments) }}</pre
          >
        </template>
        <template v-if="row.step.thinking">
          <h4>思考</h4>
          <pre class="text muted">{{ row.step.thinking }}</pre>
        </template>
        <template v-if="row.step.output">
          <h4>回答</h4>
          <MdViewer :value="row.step.output" />
        </template>
      </template>

      <template v-else-if="row.kind === 'assistant' && row.step">
        <details v-if="row.step.thinking" class="section">
          <summary>思考过程</summary>
          <pre class="text muted">{{ row.step.thinking }}</pre>
        </details>
        <MdViewer :value="row.step.output" />
      </template>

      <template v-else-if="row.kind === 'error'">
        <p class="danger-text">{{ row.turn?.error || row.title }}</p>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineEmits,
  defineProps,
  PropType,
  ref,
  watch,
} from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import {
  formatDuration,
  formatTokens,
  prettyJson,
  ROW_LABELS,
  Trace,
  TraceRow,
  TURN_LABELS,
} from "@/services/companionTrace";
import { formatDateTime } from "@/utils/dateTime";

const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

/** 轨迹右边：选中那一行的详情 */
const props = defineProps({
  trace: { type: Object as PropType<Trace>, required: true },
  row: { type: Object as PropType<TraceRow>, required: true },
});

const emit = defineEmits<{
  (event: "close"): void;
}>();

const systemTab = ref<"prompt" | "tools">("prompt");
watch(
  () => props.row.key,
  () => (systemTab.value = "prompt")
);

const systemPrompt = computed(() =>
  props.row.systemPromptIndex == null
    ? ""
    : props.trace.systemPrompts[props.row.systemPromptIndex] ?? ""
);

const tools = computed(() =>
  props.row.toolSetIndex == null
    ? []
    : props.trace.toolSets[props.row.toolSetIndex] ?? []
);

const heading = computed(() => {
  const { row } = props;
  if (row.kind === "system") return row.title;
  if (row.kind === "user" && row.turn) {
    return `第 ${row.turn.index} 轮 · ${TURN_LABELS[row.turn.type]}`;
  }
  if (row.kind === "context") return row.section?.title || "上下文";
  if (row.step) return row.step.name || ROW_LABELS[row.kind];
  return row.title;
});

const time = (ms: number | null) =>
  ms == null ? "" : formatDateTime(new Date(ms).toISOString());

const facts = computed(() => {
  const { row } = props;
  const list: { label: string; value: string }[] = [];
  const push = (label: string, value: string) => {
    if (value) list.push({ label, value });
  };
  if (row.kind === "user" && row.turn) {
    push("开始", time(row.turn.startMs));
    push("耗时", formatDuration(row.turn.durationMs));
    push(
      "状态",
      {
        running: "进行中",
        ok: "完成",
        error: "出错",
        fallback: "用了兜底话术",
      }[row.turn.status]
    );
    push(
      "调用",
      row.turn.steps.length
        ? `模型 ${
            row.turn.steps.filter((step) => step.kind === "model").length
          } 次、工具 ${
            row.turn.steps.filter((step) => step.kind === "tool").length
          } 次`
        : ""
    );
  } else if (row.step && (row.kind === "model" || row.kind === "tool")) {
    push("开始", time(row.step.startMs));
    push("耗时", formatDuration(row.step.durationMs));
    if (row.kind === "model") {
      push("输入", formatTokens(row.step.inputTokens));
      push("命中缓存", formatTokens(row.step.cachedTokens));
      push("输出", formatTokens(row.step.outputTokens));
      push("结束原因", row.step.finishReason);
    }
  }
  return list;
});
</script>

<style scoped>
.detail {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--line);
}

.detail-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--line);
}

.detail-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.detail-head .icon-btn {
  width: 30px;
  height: 30px;
}

.detail-tabs {
  flex: none;
  display: flex;
  gap: 2px;
  padding: 8px 12px 0;
  border-bottom: 1px solid var(--line);
}

.detail-tab {
  height: 32px;
  padding: 0 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.detail-tab.on {
  border-bottom-color: var(--ink);
  color: var(--ink);
  font-weight: 600;
}

.detail-tab .num {
  color: var(--faint);
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px 18px;
}

h4 {
  margin: 14px 0 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

h4:first-child {
  margin-top: 0;
}

.text,
.code {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--fill);
  color: var(--body);
  font: 12.5px/1.65 var(--font-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.code {
  background: var(--code-surface);
  color: var(--code-ink);
}

.code + .code {
  margin-top: 6px;
}

.text.muted,
.muted {
  color: var(--muted);
}

p.muted {
  margin: 0;
  font-size: 13px;
}

.text.danger,
.danger-text {
  color: var(--danger);
}

.danger-text {
  margin: 0 0 8px;
  font-size: 13px;
}

.facts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 14px;
  margin: 0 0 12px;
  font-size: 12.5px;
}

.facts dt {
  color: var(--faint);
}

.facts dd {
  margin: 0;
  color: var(--body);
  font-variant-numeric: tabular-nums;
}

.section {
  margin-top: 6px;
}

.section summary {
  color: var(--body);
  font-size: 13px;
  cursor: pointer;
}

.section .text {
  margin-top: 6px;
}

.tool {
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}

.tool summary {
  display: flex;
  gap: 10px;
  align-items: baseline;
  min-width: 0;
  cursor: pointer;
}

.tool-name {
  flex: none;
  color: var(--ink);
  font: 12.5px var(--font-mono);
}

.tool-desc {
  min-width: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 12.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tool[open] .tool-desc {
  visibility: hidden;
}

.tool-full {
  margin: 8px 0;
  color: var(--body);
  font-size: 13px;
  line-height: 1.6;
}

.params {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.params td {
  padding: 5px 8px 5px 0;
  border-top: 1px solid var(--line);
  color: var(--body);
  vertical-align: top;
}

.params code {
  font-family: var(--font-mono);
}

.params .type {
  color: var(--faint);
  font-family: var(--font-mono);
}

.required {
  margin-left: 4px;
  color: var(--faint);
  font-size: 11px;
}

.detail-body :deep(.markdown-body) {
  background: transparent;
  font-size: 13.5px;
}
</style>

<style>
/* 轨迹里各行前面的标签（列表和详情共用） */
.trace-tag {
  flex: none;
  display: inline-block;
  min-width: 40px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
}

.trace-tag.system {
  background: var(--fill-strong);
  color: var(--body);
}

.trace-tag.user {
  background: color-mix(in srgb, var(--tint-blue) 14%, var(--panel));
  color: var(--tint-blue);
}

.trace-tag.context {
  background: color-mix(in srgb, var(--tint-green) 14%, var(--panel));
  color: var(--tint-green);
}

.trace-tag.model {
  background: color-mix(in srgb, var(--tint-indigo) 14%, var(--panel));
  color: var(--tint-indigo);
}

.trace-tag.tool {
  background: color-mix(in srgb, var(--tint-orange) 16%, var(--panel));
  color: var(--tint-orange);
}

.trace-tag.assistant {
  background: color-mix(in srgb, var(--tint-violet) 14%, var(--panel));
  color: var(--tint-violet);
}

.trace-tag.error {
  background: color-mix(in srgb, var(--danger) 12%, var(--panel));
  color: var(--danger);
}
</style>
