import {
  apiUrl,
  CodeEditProposal,
  CodeSnapshot,
  COMPANION_NETWORK_ERROR,
  CompanionApiError,
  CompanionStreamDone,
} from "@/services/companion";
import { ApiId } from "@/services/apiId";

/**
 * 陪练的流式接口（chat / solution）：POST 请求返回 text/event-stream，所以用 fetch 读流，不能用 EventSource。
 * 开始推流前就出错时，后端返回普通 JSON（{code, message}）。
 */

export interface SseEvent {
  event: string;
  data: string;
}

/**
 * 按 SSE 规范把文本块解析成事件：空行结束一个事件，data 可以多行，冒号开头是注释。
 */
export const createSseParser = (onEvent: (event: SseEvent) => void) => {
  let buffer = "";
  let eventName = "";
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length) {
      onEvent({ event: eventName || "message", data: dataLines.join("\n") });
    }
    eventName = "";
    dataLines = [];
  };

  const handleLine = (line: string) => {
    if (line === "") {
      dispatch();
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") eventName = value;
    else if (field === "data") dataLines.push(value);
  };

  return {
    push(chunk: string) {
      let text = buffer + chunk;
      // 末尾的 \r 可能和下一块开头的 \n 组成一个换行，先留着
      const carry = text.endsWith("\r") ? "\r" : "";
      if (carry) text = text.slice(0, -1);
      const lines = text.split(/\r\n|\r|\n/);
      // 最后一段可能是半行，留到下一块
      buffer = (lines.pop() ?? "") + carry;
      lines.forEach(handleLine);
    },
    end() {
      const rest = buffer.replace(/\r$/, "");
      if (rest) handleLine(rest);
      buffer = "";
      dispatch();
    },
  };
};

export interface CompanionStreamHandlers {
  onThinking?: (text: string) => void;
  onDelta?: (text: string) => void;
  onEdits?: (proposal: CodeEditProposal) => void;
}

const parseJson = <T>(data: string): T | undefined => {
  try {
    return JSON.parse(data) as T;
  } catch {
    return undefined;
  }
};

/**
 * 发起一次流式回答，返回结束事件；出错（包括流中途的 error 事件和连接中断）时抛出 CompanionApiError。
 */
export const streamCompanion = async (
  path: "/companion/chat" | "/companion/solution",
  body: { questionId: ApiId; snapshot: CodeSnapshot; message?: string },
  handlers: CompanionStreamHandlers,
  signal?: AbortSignal
): Promise<CompanionStreamDone> => {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new CompanionApiError(COMPANION_NETWORK_ERROR, "连不上服务器了");
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const json = parseJson<{ code?: number; message?: string }>(
      await response.text()
    );
    throw new CompanionApiError(
      json?.code ?? COMPANION_NETWORK_ERROR,
      json?.message || "请求失败"
    );
  }
  if (!response.ok || !response.body) {
    throw new CompanionApiError(
      COMPANION_NETWORK_ERROR,
      `请求失败（HTTP ${response.status}）`
    );
  }

  let done: CompanionStreamDone | undefined;
  let failure: CompanionApiError | undefined;
  const parser = createSseParser(({ event, data }) => {
    if (failure) return;
    if (event === "thinking" || event === "delta") {
      const text = parseJson<{ text?: string }>(data)?.text;
      if (!text) return;
      if (event === "thinking") handlers.onThinking?.(text);
      else handlers.onDelta?.(text);
    } else if (event === "edits") {
      const proposal = parseJson<CodeEditProposal>(data);
      if (proposal) handlers.onEdits?.(proposal);
    } else if (event === "done") {
      done = parseJson<CompanionStreamDone>(data);
    } else if (event === "error") {
      const error = parseJson<{ code?: number; message?: string }>(data);
      failure = new CompanionApiError(
        error?.code ?? COMPANION_NETWORK_ERROR,
        error?.message || "回答中断了"
      );
    }
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      parser.push(decoder.decode(value, { stream: true }));
      if (failure) break;
    }
    parser.push(decoder.decode());
    parser.end();
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new CompanionApiError(COMPANION_NETWORK_ERROR, "连接中断了");
  } finally {
    reader.releaseLock();
  }

  if (failure) throw failure;
  if (!done) {
    throw new CompanionApiError(COMPANION_NETWORK_ERROR, "回答没有正常结束");
  }
  return done;
};
