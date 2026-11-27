import {
  CompanionControllerService,
  CompanionNotePreviewVO,
  NoteChange as NoteChangeVO,
  NoteProposal as NoteProposalVO,
} from "../../generated";
import { ApiId, toGeneratedApiId } from "@/services/apiId";
import { Note, normalizeNote, NoteServiceError } from "@/services/note";

/**
 * 鸭鸭的笔记提议：聊天时鸭鸭提议新建或修改笔记，随回答保存在消息的 noteEdits 里；
 * 用户预览后点「应用」，后端才写进笔记。接口说明见后端 docs/frontend/ai-companion.md 的「笔记」一节。
 */

export type NoteChangeKind = "replace" | "append" | "rewrite";

export type NoteChange = {
  kind: NoteChangeKind;
  /** 被替换的原文，只有 replace 有 */
  oldText: string;
  newText: string;
  reason: string;
};

export type NoteProposal = {
  kind: "create" | "update";
  /** 修改的那篇；新建的在应用后才有 */
  noteId: string | null;
  baseVersion: number | null;
  title: string;
  previousTitle: string | null;
  questionId: string | null;
  questionTitle: string | null;
  changes: NoteChange[];
  /** 提议时算好的全文 */
  content: string;
  reason: string;
  applied: boolean;
};

/** 预览时按笔记现在的内容算出的状态 */
export type NotePreviewStatus =
  | "ready"
  | "rebased"
  | "partial"
  | "overwrite"
  | "stale"
  | "missing"
  | "applied";

export type NotePreview = {
  status: NotePreviewStatus;
  proposal: NoteProposal;
  /** 应用后的标题和正文 */
  title: string;
  content: string;
  /** 笔记现在的正文，只有修改有 */
  currentContent: string | null;
  /** 对不上、会跳过的修改数 */
  skipped: number;
  noteId: string | null;
};

const CHANGE_KINDS: NoteChangeKind[] = ["replace", "append", "rewrite"];
const PREVIEW_STATUSES: NotePreviewStatus[] = [
  "ready",
  "rebased",
  "partial",
  "overwrite",
  "stale",
  "missing",
  "applied",
];

const idOrNull = (value: unknown) =>
  value === null || value === undefined || value === "" ? null : String(value);

const normalizeChange = (vo: NoteChangeVO): NoteChange | null => {
  const kind = CHANGE_KINDS.find((item) => item === vo.kind);
  if (!kind) return null;
  return {
    kind,
    oldText: vo.oldText ?? "",
    newText: vo.newText ?? "",
    reason: vo.reason?.trim() ?? "",
  };
};

export const normalizeNoteProposal = (
  vo?: NoteProposalVO | null
): NoteProposal | null => {
  if (!vo || (vo.kind !== "create" && vo.kind !== "update")) return null;
  if (vo.kind === "update" && vo.noteId == null) return null;
  return {
    kind: vo.kind,
    noteId: idOrNull(vo.noteId),
    baseVersion: typeof vo.baseVersion === "number" ? vo.baseVersion : null,
    title: vo.title || "未命名笔记",
    previousTitle: vo.previousTitle ?? null,
    questionId: idOrNull(vo.questionId),
    questionTitle: vo.questionTitle ?? null,
    changes: (vo.changes ?? [])
      .map(normalizeChange)
      .filter((item): item is NoteChange => item !== null),
    content: vo.content ?? "",
    reason: vo.reason?.trim() ?? "",
    applied: vo.applied === true,
  };
};

/** 消息上的提议列表；下标要和后端一致（应用时按下标找），所以解析不了的保留为 null */
export const normalizeNoteProposals = (
  list?: NoteProposalVO[] | null
): (NoteProposal | null)[] => (list ?? []).map(normalizeNoteProposal);

type Response<T> = { code?: number; data?: T; message?: string };

const unwrap = <T>(response: Response<T>, fallback: string): T => {
  if (response.code !== 0 || response.data == null) {
    throw new NoteServiceError(response.message || fallback, response.code);
  }
  return response.data;
};

const normalizePreview = (vo: CompanionNotePreviewVO): NotePreview => {
  const proposal = normalizeNoteProposal(vo.proposal);
  const status = PREVIEW_STATUSES.find((item) => item === vo.status);
  if (!proposal || !status) throw new NoteServiceError("这条提议看不懂了");
  return {
    status,
    proposal,
    title: vo.title || proposal.title,
    content: vo.content ?? proposal.content,
    currentContent: vo.currentContent ?? null,
    skipped: vo.skipped ?? 0,
    noteId: idOrNull(vo.noteId),
  };
};

export const previewNoteProposal = async (messageId: ApiId, index: number) =>
  normalizePreview(
    unwrap(
      await CompanionControllerService.previewNoteEdit(
        toGeneratedApiId(messageId),
        index
      ),
      "预览没加载出来"
    )
  );

export const applyNoteProposal = async (
  messageId: ApiId,
  index: number,
  overwrite = false
): Promise<{
  note: Note;
  proposal: NoteProposal;
  /** 后端返回的原样提议，用来替换消息上的那条 */
  raw: NoteProposalVO;
  skipped: number;
}> => {
  const data = unwrap(
    await CompanionControllerService.applyNoteEdit({
      messageId: toGeneratedApiId(messageId),
      index,
      overwrite,
    }),
    "没有应用上"
  );
  const note = normalizeNote(data.note);
  const proposal = normalizeNoteProposal(data.proposal);
  if (!note || !proposal || !data.proposal) {
    throw new NoteServiceError("没有应用上");
  }
  return { note, proposal, raw: data.proposal, skipped: data.skipped ?? 0 };
};

/** 卡片上的一行说明：新建笔记「…」/ 修改「…」· 2 处 */
export const describeNoteProposal = (proposal: NoteProposal) => {
  if (proposal.kind === "create") return `新建笔记「${proposal.title}」`;
  const rewrite = proposal.changes.some((change) => change.kind === "rewrite");
  const renamed =
    proposal.previousTitle !== null &&
    proposal.previousTitle !== proposal.title;
  const name = renamed ? proposal.previousTitle : proposal.title;
  if (rewrite) return `整理「${name}」`;
  const count = proposal.changes.length;
  return count > 1 ? `修改「${name}」· ${count} 处` : `修改「${name}」`;
};

export const CHANGE_LABELS: Record<NoteChangeKind, string> = {
  replace: "改写一段",
  append: "追加到末尾",
  rewrite: "整篇重新整理",
};

/** 预览时的提醒；没有要提醒的返回空串 */
export const describePreviewStatus = (preview: NotePreview) => {
  switch (preview.status) {
    case "rebased":
      return "这篇笔记在这之后改过，修改都重新对上了。";
    case "partial":
      return `这篇笔记在这之后改过，有 ${preview.skipped} 处对不上了，应用时会跳过。`;
    case "overwrite":
      return "这篇笔记在这之后改过，应用会整篇覆盖那些改动。";
    case "stale":
      return "这篇笔记在这之后改过，这些修改都对不上了，让鸭鸭重新改一次吧。";
    case "missing":
      return "这篇笔记已经删除了。";
    default:
      return "";
  }
};

export const canApplyPreview = (preview: NotePreview) =>
  preview.status !== "stale" &&
  preview.status !== "missing" &&
  preview.status !== "applied";
