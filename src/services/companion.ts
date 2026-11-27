import axios from "axios";

import { NoteProposal as NoteProposalVO, OpenAPI } from "../../generated";
import { ApiId } from "@/services/apiId";

/**
 * AI 陪练的接口与类型。后端接口说明见后端仓库 docs/frontend/ai-companion.md。
 * 后端的 Long 序列化成字符串，ID 一律用 ApiId。
 */

export type HintMode = "guided" | "direct";
export type CompanionRole = "user" | "assistant";
export type CompanionMessageType =
  | "chat"
  | "hint"
  | "reaction"
  | "solution"
  | "compaction";
export type CompanionMood =
  | "excited"
  | "proud"
  | "surprised"
  | "thoughtful"
  | "sympathetic"
  | "encouraging"
  | "playful"
  | "nervous"
  | "confused";

export interface HintStep {
  level: number;
  title: string;
  description: string;
}

export interface ContextUsage {
  usedTokens: number;
  limitTokens: number;
  ratio: number;
  compactRatio: number;
  estimated: boolean;
}

export interface CodeEdit {
  kind: "replace" | "rewrite";
  oldText?: string | null;
  newText: string;
  startLine: number;
  reason?: string | null;
}

/** 用户选中代码后提问时引用的那一段，行号从 1 开始 */
export interface CodeQuote {
  startLine: number;
  endLine: number;
  code: string;
}

export interface CodeEditProposal {
  baseHash: string;
  edits: CodeEdit[];
  resultCode: string;
}

export interface CompanionMessage {
  id: ApiId;
  role: CompanionRole;
  type: CompanionMessageType;
  hintLevel?: number | null;
  mood?: CompanionMood | null;
  moodIntensity?: number | null;
  submissionId?: ApiId | null;
  content: string;
  quote?: CodeQuote | null;
  codeEdits?: CodeEditProposal | null;
  /** 鸭鸭的笔记提议（原样，用 normalizeNoteProposals 解析），下标就是应用时的 index */
  noteEdits?: NoteProposalVO[] | null;
  createTime?: string;
}

export interface CompanionSession {
  questionId: ApiId;
  /** 当前对话，聊天、提示、看答案、整理记忆都带上它 */
  conversationId: ApiId;
  /** 提示档位 0-5，5 表示看过答案 */
  hintLevel: number;
  effectiveLevel: number;
  hintMode: HintMode;
  /** 6 档的名字和说明，下标即档位 */
  hintSteps: HintStep[];
  canCallModel: boolean;
  mockMode: boolean;
  personaName: string;
  contextUsage: ContextUsage;
  messages: CompanionMessage[];
  hasMoreMessages: boolean;
}

export interface CompanionReaction {
  messageId: ApiId;
  submissionId: ApiId;
  mood: CompanionMood;
  moodIntensity: number;
  /** 反应记在哪段对话里 */
  conversationId: ApiId;
  message: string;
  fallback: boolean;
}

export interface CompanionHint {
  messageId: ApiId;
  hintLevel: number;
  stepTitle: string;
  message: string;
  codeEdits?: CodeEditProposal | null;
  contextUsage: ContextUsage;
}

export interface CompanionHintState {
  questionId: ApiId;
  hintLevel: number;
  effectiveLevel: number;
}

export interface CompanionConversation {
  id: ApiId;
  /** 第一次提问的开头，还没提问时为空 */
  title?: string | null;
  messageCount: number;
  active: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface CompanionCompaction {
  compacted: boolean;
  messageId?: ApiId | null;
  note?: string | null;
  compactedRounds?: number | null;
  keptRounds?: number | null;
  contextUsage: ContextUsage;
}

export interface CompanionStreamDone {
  messageId: ApiId;
  hintLevel: number;
  contextUsage: ContextUsage;
  compacted: boolean;
}

/** 编辑器当前状态，行号从 1 开始，没有选区时不传选区 */
export interface CodeSnapshot {
  code: string;
  language: string;
  cursorLine?: number;
  selectionStartLine?: number;
  selectionEndLine?: number;
}

export interface AiModelOption {
  id: string;
  displayName: string;
  contextWindow: number;
}

export interface AiSetting {
  provider: string;
  keyConfigured: boolean;
  keyHint?: string | null;
  model: string;
  models: AiModelOption[];
  hintMode: HintMode;
  mockMode: boolean;
}

export interface AiSettingSaveRequest {
  apiKey?: string;
  model?: string;
  hintMode?: HintMode;
}

export const COMPANION_ERROR_CODE = {
  NOT_LOGIN: 40100,
  KEY_NOT_CONFIGURED: 40020,
  KEY_INVALID: 40021,
  BALANCE_INSUFFICIENT: 40022,
  BUSY: 42900,
  RATE_LIMITED: 42901,
  UPSTREAM: 50020,
} as const;

/** 网络异常、连接中断等没有业务码的错误 */
export const COMPANION_NETWORK_ERROR = -1;

export class CompanionApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "CompanionApiError";
    this.code = code;
  }
}

export const isKeyProblem = (error: unknown) =>
  error instanceof CompanionApiError &&
  (error.code === COMPANION_ERROR_CODE.KEY_NOT_CONFIGURED ||
    error.code === COMPANION_ERROR_CODE.KEY_INVALID);

export const toCompanionError = (error: unknown): CompanionApiError => {
  if (error instanceof CompanionApiError) return error;
  return new CompanionApiError(
    COMPANION_NETWORK_ERROR,
    "网络有点问题，稍后再试试"
  );
};

interface BaseResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export const apiUrl = (path: string) => `${OpenAPI.BASE}${path}`;

const unwrap = async <T>(
  request: Promise<{ data: BaseResponse<T> }>
): Promise<T> => {
  let body: BaseResponse<T>;
  try {
    body = (await request).data;
  } catch (error) {
    const response = (error as { response?: { data?: BaseResponse<T> } })
      .response;
    if (response?.data?.code != null) {
      throw new CompanionApiError(
        response.data.code,
        response.data.message || "请求失败"
      );
    }
    throw toCompanionError(error);
  }
  if (body?.code === 0) return body.data;
  throw new CompanionApiError(
    body?.code ?? COMPANION_NETWORK_ERROR,
    body?.message || "请求失败"
  );
};

export const getCompanionSession = (questionId: ApiId) =>
  unwrap<CompanionSession>(
    axios.get(apiUrl("/companion/session"), { params: { questionId } })
  );

export const listCompanionMessages = (conversationId: ApiId, beforeId: ApiId) =>
  unwrap<CompanionMessage[]>(
    axios.get(apiUrl("/companion/messages"), {
      params: { conversationId, beforeId },
    })
  );

export const listCompanionConversations = (questionId: ApiId) =>
  unwrap<CompanionConversation[]>(
    axios.get(apiUrl("/companion/conversations"), { params: { questionId } })
  );

/** 开一段新对话（当前对话还没有消息时沿用它），返回切换后的会话 */
export const startCompanionConversation = (questionId: ApiId) =>
  unwrap<CompanionSession>(
    axios.post(apiUrl("/companion/conversation"), { questionId })
  );

export const switchCompanionConversation = (conversationId: ApiId) =>
  unwrap<CompanionSession>(
    axios.put(apiUrl("/companion/conversation/active"), { conversationId })
  );

export const reactToSubmission = (submissionId: ApiId) =>
  unwrap<CompanionReaction>(
    axios.post(apiUrl("/companion/react"), { submissionId })
  );

/** 按当前档位要一条提示，不改变档位 */
export const requestHint = (conversationId: ApiId, snapshot: CodeSnapshot) =>
  unwrap<CompanionHint>(
    axios.post(apiUrl("/companion/hint"), { conversationId, snapshot })
  );

export const setHintLevel = (questionId: ApiId, level: number) =>
  unwrap<CompanionHintState>(
    axios.put(apiUrl("/companion/level"), { questionId, level })
  );

export const compactCompanionMemory = (conversationId: ApiId) =>
  unwrap<CompanionCompaction>(
    axios.post(apiUrl("/companion/compact"), { conversationId })
  );

export const getAiSetting = () =>
  unwrap<AiSetting>(axios.get(apiUrl("/ai/setting")));

export const saveAiSetting = (request: AiSettingSaveRequest) =>
  unwrap<AiSetting>(axios.put(apiUrl("/ai/setting"), request));

export const deleteAiKey = () =>
  unwrap<AiSetting>(axios.delete(apiUrl("/ai/setting/key")));

/** 面向用户的错误提示 */
export const describeCompanionError = (error: unknown) => {
  const { code, message } = toCompanionError(error);
  switch (code) {
    case COMPANION_ERROR_CODE.KEY_NOT_CONFIGURED:
      return "还没有配置 DeepSeek API Key，先去设置里填一下";
    case COMPANION_ERROR_CODE.KEY_INVALID:
      return "API Key 无效，去设置里重新填一个";
    case COMPANION_ERROR_CODE.BALANCE_INSUFFICIENT:
      return "DeepSeek 账户余额不足，充值后再来";
    case COMPANION_ERROR_CODE.BUSY:
      return "上一条还在处理，稍等一下";
    case COMPANION_ERROR_CODE.RATE_LIMITED:
      return "DeepSeek 有点忙，稍后再试";
    default:
      return message || "出了点问题，稍后再试";
  }
};
