import type { Mock } from "vitest";

import { CompanionControllerService } from "../../generated";
import {
  buildTraceRows,
  filterTraceRows,
  formatDuration,
  formatTokens,
  layoutTimeline,
  loadTrace,
  normalizeTrace,
  Trace,
} from "@/services/companionTrace";

vi.mock("../../generated", () => ({
  CompanionControllerService: { getTrace: vi.fn() },
}));

const T0 = Date.parse("2026-11-27T14:00:00.000+08:00");
const at = (offset: number) => new Date(T0 + offset).toISOString();

// 后端的样子：Long 是字符串，一轮聊天里模型先调工具、再回答
const raw = {
  conversationId: "50",
  title: "这里为什么超时",
  recordedFromStart: true,
  fromMemory: false,
  systemPrompts: ["系统提示词 A", "系统提示词 B"],
  toolSets: [
    [
      {
        name: "readNote",
        description: "读一篇笔记",
        parameters: [
          {
            name: "noteId",
            type: "string",
            description: "笔记 id",
            required: true,
          },
        ],
      },
    ],
  ],
  turns: [
    {
      id: "11",
      type: "chat",
      status: "ok",
      userText: "这里为什么超时",
      context: [
        { title: "场景", text: "用户在陪练面板里和你聊天。" },
        { title: "用户当前代码", text: "```\n1| int a;\n```" },
      ],
      systemPromptIndex: 0,
      toolSetIndex: 0,
      startTime: at(0),
      durationMs: 3000,
      steps: [
        {
          id: "101",
          kind: "model",
          name: "deepseek-flash",
          toolCalls: [{ name: "readNote", arguments: '{"noteId":"9"}' }],
          inputTokens: 9336,
          cachedTokens: 8832,
          outputTokens: 56,
          startTime: at(100),
          durationMs: 1000,
        },
        {
          id: "102",
          kind: "tool",
          name: "readNote",
          input: '{ "noteId": "9" }',
          output: "笔记 id 9，标题「思路」\n正文：……",
          startTime: at(1150),
          durationMs: 30,
        },
        {
          id: "103",
          kind: "model",
          name: "deepseek-flash",
          output: "循环里每次都重新算了长度。\n可以先存下来。",
          startTime: at(1200),
          durationMs: 1700,
        },
      ],
    },
    {
      id: "12",
      type: "reaction",
      status: "fallback",
      userText: "提交了代码，判题结果：答案错误",
      error: "余额不足",
      startTime: at(60_000),
      durationMs: 800,
      steps: [],
    },
    {
      id: "13",
      type: "hint",
      status: "error",
      userText: "要一条提示（点关键）",
      error: "模型超时",
      systemPromptIndex: 1,
      startTime: at(120_000),
      durationMs: 5000,
      steps: [
        {
          id: "104",
          kind: "model",
          name: "deepseek-flash",
          error: "模型超时",
          startTime: at(120_050),
          durationMs: 4900,
        },
      ],
    },
  ],
};

const trace = (): Trace => normalizeTrace(raw as never);

describe("companion trace", () => {
  beforeEach(() => vi.resetAllMocks());

  it("normalizes turns, steps and times", () => {
    const value = trace();
    expect(value.turns.map((turn) => turn.index)).toEqual([1, 2, 3]);
    expect(value.turns[0].steps[0]).toMatchObject({
      id: "101",
      kind: "model",
      cachedTokens: 8832,
      startMs: T0 + 100,
      toolCalls: [{ name: "readNote", arguments: '{"noteId":"9"}' }],
    });
    expect(value.toolSets[0][0].parameters[0].required).toBe(true);
    expect(value.turns[1]).toMatchObject({
      status: "fallback",
      systemPromptIndex: null,
    });
  });

  it("lays out rows like the conversation went", () => {
    const rows = buildTraceRows(trace());
    expect(rows.map((row) => row.kind)).toEqual([
      "system",
      "user",
      "context",
      "context",
      "model",
      "tool",
      "model",
      "assistant",
      "user",
      "error",
      "system",
      "user",
      "model",
    ]);
    expect(rows[2].title).toBe("场景：用户在陪练面板里和你聊天。");
    expect(rows[4].meta).toBe("1.0s · 输入 9.3k（缓存 8.8k） · 输出 56");
    expect(rows[5].title).toBe(
      'readNote {"noteId":"9"}  →  笔记 id 9，标题「思路」'
    );
    expect(rows[7].title).toBe("循环里每次都重新算了长度。");
    expect(rows[9].title).toContain("兜底话术（余额不足）");
    // 提示那一轮换了系统提示词
    expect(rows[10]).toMatchObject({ kind: "system", systemPromptIndex: 1 });
    expect(rows[12].error).toBe(true);
  });

  it("hides context and model calls when switched off, but keeps errors", () => {
    const rows = buildTraceRows(trace(), { context: false, calls: false });
    expect(rows.map((row) => row.kind)).toEqual([
      "system",
      "user",
      "tool",
      "assistant",
      "user",
      "error",
      "system",
      "user",
      "error",
    ]);
  });

  it("searches every row's full text", () => {
    const rows = buildTraceRows(trace());
    expect(filterTraceRows(rows, "先存下来").map((row) => row.kind)).toEqual([
      "assistant",
    ]);
    expect(filterTraceRows(rows, "READNOTE").length).toBeGreaterThan(1);
    expect(filterTraceRows(rows, "  ")).toHaveLength(rows.length);
  });

  it("draws turns by real time and squeezes the idle time between them", () => {
    const bars = layoutTimeline(trace());
    const first = bars.filter((bar) => bar.rowKey.includes("11"));
    expect(first.map((bar) => bar.lane)).toEqual([
      "input",
      "model",
      "tool",
      "model",
    ]);
    const lastBar = bars[bars.length - 1];
    expect(lastBar.error).toBe(true);
    expect(lastBar.left + lastBar.width).toBeLessThanOrEqual(100.0001);
    // 两轮之间隔了一分钟，压缩后第二轮紧跟着第一轮
    const second = bars.find((bar) => bar.rowKey === "turn-12");
    expect(second?.left).toBeLessThan(50);
    expect(layoutTimeline({ ...trace(), turns: [] })).toEqual([]);
  });

  it("formats durations and token counts", () => {
    expect(formatDuration(820)).toBe("820ms");
    expect(formatDuration(1234)).toBe("1.2s");
    expect(formatDuration(42_000)).toBe("42s");
    expect(formatDuration(75_000)).toBe("1m 15s");
    expect(formatDuration(null)).toBe("");
    expect(formatTokens(56)).toBe("56");
    expect(formatTokens(9336)).toBe("9.3k");
  });

  it("loads a trace through the generated client", async () => {
    (CompanionControllerService.getTrace as Mock).mockResolvedValue({
      code: 0,
      data: raw,
    });
    await expect(loadTrace("50")).resolves.toMatchObject({ title: raw.title });
    expect(CompanionControllerService.getTrace).toHaveBeenCalledWith("50");

    (CompanionControllerService.getTrace as Mock).mockResolvedValue({
      code: 40400,
      message: "对话不存在",
    });
    await expect(loadTrace("51")).rejects.toMatchObject({
      code: 40400,
      message: "对话不存在",
    });
  });
});
