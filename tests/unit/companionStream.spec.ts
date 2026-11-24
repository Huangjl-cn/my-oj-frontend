import { TextDecoder, TextEncoder } from "util";

import { CompanionApiError } from "@/services/companion";
import {
  createSseParser,
  SseEvent,
  streamCompanion,
} from "@/services/companionStream";

jest.mock("../../generated", () => ({ OpenAPI: { BASE: "/api" } }));

const globals = globalThis as unknown as Record<string, unknown>;

const collect = (chunks: string[]) => {
  const events: SseEvent[] = [];
  const parser = createSseParser((event) => events.push(event));
  chunks.forEach((chunk) => parser.push(chunk));
  parser.end();
  return events;
};

const streamResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    ok: true,
    status: 200,
    headers: { get: () => "text/event-stream;charset=UTF-8" },
    body: {
      getReader: () => ({
        read: async () =>
          index < chunks.length
            ? { done: false, value: encoder.encode(chunks[index++]) }
            : { done: true, value: undefined },
        releaseLock: () => undefined,
      }),
    },
  };
};

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => "application/json" },
  text: async () => JSON.stringify(body),
});

const body = { questionId: "1", snapshot: { code: "", language: "java" } };

describe("SSE parser", () => {
  it("parses Spring style events without a space after the colon", () => {
    expect(
      collect(['event:delta\ndata:{"text":"你好"}\n\nevent:done\ndata:{}\n\n'])
    ).toEqual([
      { event: "delta", data: '{"text":"你好"}' },
      { event: "done", data: "{}" },
    ]);
  });

  it("handles events and CRLF line endings split across chunks", () => {
    expect(
      collect(["event: del", "ta\r", "\ndata: a\r\n", "data: b\r\n\r\n"])
    ).toEqual([{ event: "delta", data: "a\nb" }]);
  });

  it("ignores comments and uses the default event name", () => {
    expect(collect([": keep-alive\n\ndata: x\n\n"])).toEqual([
      { event: "message", data: "x" },
    ]);
  });
});

describe("streamCompanion", () => {
  let originalFetch: unknown;

  beforeAll(() => {
    if (!globals.TextDecoder) globals.TextDecoder = TextDecoder;
    originalFetch = globals.fetch;
  });

  afterEach(() => {
    globals.fetch = originalFetch;
  });

  it("dispatches thinking, delta and edits, then resolves with done", async () => {
    globals.fetch = jest
      .fn()
      .mockResolvedValue(
        streamResponse([
          'event:thinking\ndata:{"text":"想一想"}\n\n',
          'event:delta\ndata:{"text":"先看"}\n\nevent:delta\ndata:{"te',
          'xt":"第 3 行"}\n\n',
          'event:edits\ndata:{"baseHash":"h","edits":[],"resultCode":"x"}\n\n',
          'event:done\ndata:{"messageId":"9","hintLevel":1,"hintTrack":"bug","compacted":false}\n\n',
        ])
      );
    const thinking: string[] = [];
    const deltas: string[] = [];
    const edits = jest.fn();

    const done = await streamCompanion("/companion/chat", body, {
      onThinking: (text) => thinking.push(text),
      onDelta: (text) => deltas.push(text),
      onEdits: edits,
    });

    expect(thinking).toEqual(["想一想"]);
    expect(deltas.join("")).toBe("先看第 3 行");
    expect(edits).toHaveBeenCalledWith(
      expect.objectContaining({ resultCode: "x" })
    );
    expect(done).toMatchObject({ messageId: "9", hintTrack: "bug" });
    expect(globals.fetch).toHaveBeenCalledWith(
      "/api/companion/chat",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("throws the business error when the server answers with JSON", async () => {
    globals.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ code: 42900, message: "忙" }));

    await expect(
      streamCompanion("/companion/chat", body, {})
    ).rejects.toMatchObject({ code: 42900 });
  });

  it("throws the error event sent in the middle of the stream", async () => {
    globals.fetch = jest
      .fn()
      .mockResolvedValue(
        streamResponse([
          'event:delta\ndata:{"text":"一半"}\n\nevent:error\ndata:{"code":40022,"message":"余额不足"}\n\n',
        ])
      );

    const error = await streamCompanion("/companion/solution", body, {}).catch(
      (e) => e
    );
    expect(error).toBeInstanceOf(CompanionApiError);
    expect(error.code).toBe(40022);
  });

  it("treats a stream that ends without done as interrupted", async () => {
    globals.fetch = jest
      .fn()
      .mockResolvedValue(
        streamResponse(['event:delta\ndata:{"text":"a"}\n\n'])
      );

    await expect(
      streamCompanion("/companion/chat", body, {})
    ).rejects.toMatchObject({ code: -1 });
  });
});
