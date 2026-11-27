import {
  CompanionControllerService,
  CompanionTraceStepVO,
  CompanionTraceTurnVO,
  CompanionTraceVO,
  TraceTool as TraceToolVO,
} from "../../generated";
import { ApiId, toGeneratedApiId } from "@/services/apiId";

/**
 * 鸭鸭的轨迹：一段对话里每一轮发给模型的内容、模型调用、工具调用、耗时和 token。
 * 后端接口见后端仓库 docs/frontend/ai-companion.md 的「轨迹」一节。
 */

export type TraceTurnType =
  | "chat"
  | "hint"
  | "solution"
  | "reaction"
  | "compaction";

export type TraceStep = {
  id: string;
  kind: "model" | "tool";
  /** 模型名或工具名 */
  name: string;
  /** 工具参数（JSON） */
  input: string;
  /** 模型回答的正文 / 工具结果 */
  output: string;
  thinking: string;
  toolCalls: { name: string; arguments: string }[];
  inputTokens: number | null;
  cachedTokens: number | null;
  outputTokens: number | null;
  finishReason: string;
  error: string;
  /** 毫秒时间戳；从记忆还原的没有 */
  startMs: number | null;
  durationMs: number | null;
};

export type TraceSection = { title: string; text: string };

export type TraceTurn = {
  id: string;
  /** 第几轮，从 1 开始 */
  index: number;
  type: TraceTurnType;
  status: "running" | "ok" | "error" | "fallback";
  userText: string;
  context: TraceSection[];
  systemPromptIndex: number | null;
  toolSetIndex: number | null;
  messageId: string | null;
  error: string;
  startMs: number | null;
  durationMs: number | null;
  steps: TraceStep[];
};

export type TraceTool = {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
};

export type Trace = {
  conversationId: string;
  title: string;
  recordedFromStart: boolean;
  fromMemory: boolean;
  systemPrompts: string[];
  toolSets: TraceTool[][];
  turns: TraceTurn[];
};

export const TURN_LABELS: Record<TraceTurnType, string> = {
  chat: "聊天",
  hint: "提示",
  solution: "看答案",
  reaction: "提交后反应",
  compaction: "整理记忆",
};

const TURN_TYPES = Object.keys(TURN_LABELS) as TraceTurnType[];
const STATUSES: TraceTurn["status"][] = ["running", "ok", "error", "fallback"];

const time = (value?: string | null) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const count = (value?: number | null) =>
  typeof value === "number" ? value : null;

const normalizeStep = (vo: CompanionTraceStepVO): TraceStep => ({
  id: String(vo.id ?? ""),
  kind: vo.kind === "tool" ? "tool" : "model",
  name: vo.name ?? "",
  input: vo.input ?? "",
  output: vo.output ?? "",
  thinking: vo.thinking ?? "",
  toolCalls: (vo.toolCalls ?? []).map((call) => ({
    name: call.name ?? "",
    arguments: call.arguments ?? "",
  })),
  inputTokens: count(vo.inputTokens),
  cachedTokens: count(vo.cachedTokens),
  outputTokens: count(vo.outputTokens),
  finishReason: vo.finishReason ?? "",
  error: vo.error ?? "",
  startMs: time(vo.startTime),
  durationMs: count(vo.durationMs),
});

const normalizeTurn = (vo: CompanionTraceTurnVO, index: number): TraceTurn => ({
  id: String(vo.id ?? `memory-${index}`),
  index: index + 1,
  type: TURN_TYPES.find((type) => type === vo.type) ?? "chat",
  status: STATUSES.find((status) => status === vo.status) ?? "ok",
  userText: vo.userText ?? "",
  context: (vo.context ?? []).map((section) => ({
    title: section.title ?? "",
    text: section.text ?? "",
  })),
  systemPromptIndex: count(vo.systemPromptIndex),
  toolSetIndex: count(vo.toolSetIndex),
  messageId: vo.messageId == null ? null : String(vo.messageId),
  error: vo.error ?? "",
  startMs: time(vo.startTime),
  durationMs: count(vo.durationMs),
  steps: (vo.steps ?? []).map(normalizeStep),
});

const normalizeTool = (vo: TraceToolVO): TraceTool => ({
  name: vo.name ?? "",
  description: vo.description ?? "",
  parameters: (vo.parameters ?? []).map((param) => ({
    name: param.name ?? "",
    type: param.type ?? "",
    description: param.description ?? "",
    required: param.required === true,
  })),
});

export const normalizeTrace = (vo: CompanionTraceVO): Trace => ({
  conversationId: String(vo.conversationId ?? ""),
  title: vo.title ?? "",
  recordedFromStart: vo.recordedFromStart !== false,
  fromMemory: vo.fromMemory === true,
  systemPrompts: vo.systemPrompts ?? [],
  toolSets: (vo.toolSets ?? []).map((set) => (set ?? []).map(normalizeTool)),
  turns: (vo.turns ?? []).map(normalizeTurn),
});

export class TraceServiceError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = "TraceServiceError";
  }
}

export const loadTrace = async (conversationId: ApiId) => {
  const response = await CompanionControllerService.getTrace(
    toGeneratedApiId(conversationId)
  );
  if (response.code !== 0 || !response.data) {
    throw new TraceServiceError(
      response.message || "轨迹没加载出来",
      response.code
    );
  }
  return normalizeTrace(response.data);
};

// region 展示

export const formatDuration = (ms: number | null) => {
  if (ms == null) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  const minutes = Math.floor(ms / 60_000);
  return `${minutes}m ${Math.round((ms % 60_000) / 1000)}s`;
};

export const formatTokens = (value: number | null) => {
  if (value == null) return "";
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
};

const firstLine = (text: string, max = 160) => {
  const line =
    text
      .split("\n")
      .map((item) => item.trim())
      .find(Boolean) ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line;
};

/** 参数 JSON 压成一行；解析不了就原样 */
const compactJson = (json: string) => {
  try {
    return JSON.stringify(JSON.parse(json));
  } catch {
    return json.replace(/\s+/g, " ").trim();
  }
};

/** 参数 JSON 排版好看一点（详情里用） */
export const prettyJson = (json: string) => {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
};

export type TraceRowKind =
  | "system"
  | "user"
  | "context"
  | "model"
  | "tool"
  | "assistant"
  | "error";

export const ROW_LABELS: Record<TraceRowKind, string> = {
  system: "系统",
  user: "用户",
  context: "上下文",
  model: "模型",
  tool: "工具",
  assistant: "助手",
  error: "出错",
};

export type TraceRow = {
  key: string;
  kind: TraceRowKind;
  /** 所属的轮；系统提示词那一行为空 */
  turn: TraceTurn | null;
  step: TraceStep | null;
  section: TraceSection | null;
  systemPromptIndex: number | null;
  toolSetIndex: number | null;
  /** 一行里显示的摘要 */
  title: string;
  /** 右侧的耗时等小字 */
  meta: string;
  error: boolean;
  /** 搜索用的全文（小写） */
  search: string;
};

export type TraceRowOptions = {
  /** 显示发给模型的上下文各段 */
  context: boolean;
  /** 显示每次模型调用（耗时、token） */
  calls: boolean;
};

const row = (partial: Partial<TraceRow> & Pick<TraceRow, "key" | "kind">) =>
  ({
    turn: null,
    step: null,
    section: null,
    systemPromptIndex: null,
    toolSetIndex: null,
    title: "",
    meta: "",
    error: false,
    search: "",
    ...partial,
  } as TraceRow);

const modelMeta = (step: TraceStep) =>
  [
    formatDuration(step.durationMs),
    step.inputTokens != null
      ? `输入 ${formatTokens(step.inputTokens)}${
          step.cachedTokens ? `（缓存 ${formatTokens(step.cachedTokens)}）` : ""
        }`
      : "",
    step.outputTokens != null ? `输出 ${formatTokens(step.outputTokens)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

/**
 * 把轨迹排成一行一行：最上面是系统提示词，然后每一轮依次是用户、上下文、模型调用、工具、助手的回答。
 */
export const buildTraceRows = (
  trace: Trace,
  options: TraceRowOptions = { context: true, calls: true }
): TraceRow[] => {
  const rows: TraceRow[] = [];
  const firstToolSet =
    trace.turns.find((turn) => turn.toolSetIndex != null)?.toolSetIndex ?? null;
  if (trace.systemPrompts.length) {
    rows.push(
      row({
        key: "system-0",
        kind: "system",
        systemPromptIndex: 0,
        toolSetIndex: firstToolSet,
        title: "初始系统提示词",
        search: `系统提示词 ${trace.systemPrompts[0]}`.toLowerCase(),
      })
    );
  }
  let shownPrompt = trace.systemPrompts.length ? 0 : null;
  for (const turn of trace.turns) {
    if (
      turn.systemPromptIndex != null &&
      shownPrompt != null &&
      turn.systemPromptIndex !== shownPrompt
    ) {
      shownPrompt = turn.systemPromptIndex;
      rows.push(
        row({
          key: `system-${turn.id}`,
          kind: "system",
          turn,
          systemPromptIndex: turn.systemPromptIndex,
          toolSetIndex: turn.toolSetIndex,
          title: "系统提示词变了（题目或设置改过）",
          search: (
            trace.systemPrompts[turn.systemPromptIndex] ?? ""
          ).toLowerCase(),
        })
      );
    }
    const userTitle = turn.userText || TURN_LABELS[turn.type];
    rows.push(
      row({
        key: `turn-${turn.id}`,
        kind: "user",
        turn,
        systemPromptIndex: turn.systemPromptIndex,
        toolSetIndex: turn.toolSetIndex,
        title: firstLine(userTitle),
        meta: formatDuration(turn.durationMs),
        search: `${TURN_LABELS[turn.type]} ${userTitle}`.toLowerCase(),
      })
    );
    if (options.context) {
      turn.context.forEach((section, index) =>
        rows.push(
          row({
            key: `turn-${turn.id}-ctx-${index}`,
            kind: "context",
            turn,
            section,
            title: section.title
              ? `${section.title}${
                  section.text ? `：${firstLine(section.text)}` : ""
                }`
              : firstLine(section.text),
            search: `${section.title} ${section.text}`.toLowerCase(),
          })
        )
      );
    }
    for (const step of turn.steps) {
      if (step.kind === "tool") {
        const output = step.error || step.output;
        rows.push(
          row({
            key: `step-${turn.id}-${step.id}`,
            kind: "tool",
            turn,
            step,
            title: `${step.name} ${compactJson(step.input)}${
              output ? `  →  ${firstLine(output, 120)}` : ""
            }`,
            meta: formatDuration(step.durationMs),
            error: !!step.error,
            search:
              `${step.name} ${step.input} ${step.output} ${step.error}`.toLowerCase(),
          })
        );
        continue;
      }
      if (options.calls) {
        const calls = step.toolCalls.map((call) => call.name).join("、");
        rows.push(
          row({
            key: `step-${turn.id}-${step.id}`,
            kind: "model",
            turn,
            step,
            title: [
              step.name || "模型",
              step.error ? "调用失败" : calls ? `调用工具：${calls}` : "回答",
            ].join(" · "),
            meta: modelMeta(step),
            error: !!step.error,
            search:
              `${step.name} ${calls} ${step.finishReason} ${step.error}`.toLowerCase(),
          })
        );
      } else if (step.error) {
        rows.push(
          row({
            key: `step-${turn.id}-${step.id}`,
            kind: "error",
            turn,
            step,
            title: step.error,
            error: true,
            search: step.error.toLowerCase(),
          })
        );
      }
      if (step.output.trim()) {
        rows.push(
          row({
            key: `step-${turn.id}-${step.id}-answer`,
            kind: "assistant",
            turn,
            step,
            title: firstLine(step.output),
            search: `${step.output} ${step.thinking}`.toLowerCase(),
          })
        );
      }
    }
    if (turn.status === "error" && !turn.steps.some((step) => step.error)) {
      rows.push(
        row({
          key: `turn-${turn.id}-error`,
          kind: "error",
          turn,
          title: turn.error || "这一轮出错了",
          error: true,
          search: turn.error.toLowerCase(),
        })
      );
    } else if (turn.status === "fallback") {
      rows.push(
        row({
          key: `turn-${turn.id}-fallback`,
          kind: "error",
          turn,
          title: `模型没调用成功，用了兜底话术${
            turn.error ? `（${firstLine(turn.error, 80)}）` : ""
          }`,
          error: true,
          search: `兜底 ${turn.error}`.toLowerCase(),
        })
      );
    }
  }
  return rows;
};

export const filterTraceRows = (rows: TraceRow[], keyword: string) => {
  const needle = keyword.trim().toLowerCase();
  return needle ? rows.filter((item) => item.search.includes(needle)) : rows;
};

// endregion

// region 时间条

export type TimelineLane = "input" | "model" | "tool";

export type TimelineBar = {
  /** 点了选中哪一行 */
  rowKey: string;
  lane: TimelineLane;
  /** 百分比 */
  left: number;
  width: number;
  error: boolean;
  label: string;
};

/** 两轮之间留的空（压缩后的时间，毫秒）：只看相对长短，轮与轮之间的空闲不按真实时间画 */
const MIN_TURN_GAP_MS = 400;

/**
 * 排时间条：每一轮按真实耗时画，轮与轮之间的空闲压成一小段空白，整条铺满宽度。
 * 输入那条是这一轮开始到第一次调用模型（准备上下文、整理记忆等），模型和工具各一条泳道。
 */
export const layoutTimeline = (trace: Trace): TimelineBar[] => {
  const turns = trace.turns.filter((turn) => turn.startMs != null);
  if (!turns.length) return [];
  const spans = turns.map((turn) => {
    const start = turn.startMs as number;
    const stepEnd = Math.max(
      start,
      ...turn.steps.map((step) =>
        step.startMs == null ? start : step.startMs + (step.durationMs ?? 0)
      )
    );
    const end = Math.max(stepEnd, start + (turn.durationMs ?? 0));
    return { turn, start, span: Math.max(end - start, 200) };
  });
  const average =
    spans.reduce((sum, item) => sum + item.span, 0) / spans.length;
  const gap = Math.max(MIN_TURN_GAP_MS, average * 0.06);
  const total =
    spans.reduce((sum, item) => sum + item.span, 0) + gap * (spans.length - 1);
  const percent = (ms: number) => (ms / total) * 100;

  const bars: TimelineBar[] = [];
  let cursor = 0;
  for (const { turn, start, span } of spans) {
    const firstModel = turn.steps.find(
      (step) => step.kind === "model" && step.startMs != null
    );
    const inputEnd = firstModel ? (firstModel.startMs as number) : start;
    bars.push({
      rowKey: `turn-${turn.id}`,
      lane: "input",
      left: percent(cursor),
      width: percent(Math.max(inputEnd - start, 0)),
      error: false,
      label: `第 ${turn.index} 轮 · ${TURN_LABELS[turn.type]}`,
    });
    for (const step of turn.steps) {
      if (step.startMs == null) continue;
      const answerKey = `step-${turn.id}-${step.id}`;
      bars.push({
        rowKey: answerKey,
        lane: step.kind === "tool" ? "tool" : "model",
        left: percent(cursor + Math.max(step.startMs - start, 0)),
        width: percent(step.durationMs ?? 0),
        error: !!step.error,
        label: `${step.kind === "tool" ? "工具" : "模型"} ${
          step.name
        } · ${formatDuration(step.durationMs)}`,
      });
    }
    cursor += span + gap;
  }
  return bars;
};

// endregion
