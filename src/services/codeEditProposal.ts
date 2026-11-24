import { CodeEdit, CodeEditProposal } from "@/services/companion";

/**
 * 陪练提出的代码修改：用户预览后再应用。
 *
 * 修改是针对请求时那份代码算的（baseHash 是那份代码的 SHA-256）。用户在模型思考期间可能又改了代码，
 * 这时不能直接用 resultCode 覆盖，要逐处在当前代码里找原文重新应用。
 */

const normalizeNewlines = (text: string) => text.replace(/\r\n?/g, "\n");

const countOccurrences = (text: string, target: string) => {
  if (!target) return 0;
  let count = 0;
  for (
    let index = text.indexOf(target);
    index >= 0;
    index = text.indexOf(target, index + 1)
  ) {
    count += 1;
  }
  return count;
};

/** 十六进制 SHA-256；不在安全上下文（非 HTTPS 也非 localhost）时浏览器不提供，返回 undefined */
export const sha256Hex = async (text: string): Promise<string | undefined> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return undefined;
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * 当前代码是否还是提出修改时的那份。
 * 知道请求时发出去的原文就直接比较，否则（比如历史消息里的修改）比较哈希；算不了哈希时按"已变化"处理，走逐处应用。
 */
export const isProposalBase = async (
  currentCode: string,
  proposal: CodeEditProposal,
  sentCode?: string
) => {
  if (sentCode !== undefined) return currentCode === sentCode;
  const hash = await sha256Hex(currentCode);
  return hash !== undefined && hash === proposal.baseHash;
};

export interface ProposalResolution {
  /** 应用后的完整代码 */
  code: string;
  /** 成功应用的修改数 */
  applied: number;
  /** 在当前代码里找不到（或不唯一）的修改 */
  failed: CodeEdit[];
  /** 包含整体替换且代码已经变过：要先让用户确认覆盖 */
  needsOverwriteConfirm: boolean;
}

export const hasRewrite = (proposal: CodeEditProposal) =>
  proposal.edits.some((edit) => edit.kind === "rewrite");

/**
 * 算出应用修改后的代码。baseMatches 为 true 时直接用 resultCode；否则逐处查找原文替换。
 */
export const resolveProposal = (
  currentCode: string,
  proposal: CodeEditProposal,
  baseMatches: boolean
): ProposalResolution => {
  if (baseMatches) {
    return {
      code: proposal.resultCode,
      applied: proposal.edits.length,
      failed: [],
      needsOverwriteConfirm: false,
    };
  }
  if (hasRewrite(proposal)) {
    return {
      code: proposal.resultCode,
      applied: proposal.edits.length,
      failed: [],
      needsOverwriteConfirm: true,
    };
  }
  let code = normalizeNewlines(currentCode);
  let applied = 0;
  const failed: CodeEdit[] = [];
  for (const edit of proposal.edits) {
    const oldText = normalizeNewlines(edit.oldText ?? "");
    if (countOccurrences(code, oldText) !== 1) {
      failed.push(edit);
      continue;
    }
    const index = code.indexOf(oldText);
    code =
      code.slice(0, index) +
      normalizeNewlines(edit.newText) +
      code.slice(index + oldText.length);
    applied += 1;
  }
  return { code, applied, failed, needsOverwriteConfirm: false };
};

/** 修改说明，用于预览条 */
export const describeProposal = (proposal: CodeEditProposal) => {
  if (hasRewrite(proposal)) return "整体替换为参考代码";
  const lines = Array.from(
    new Set(proposal.edits.map((edit) => edit.startLine))
  ).sort((a, b) => a - b);
  return `${proposal.edits.length} 处修改（第 ${lines.join("、")} 行）`;
};
