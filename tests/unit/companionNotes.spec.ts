import type { Mock } from "vitest";

import { CompanionControllerService } from "../../generated";
import {
  applyNoteProposal,
  canApplyPreview,
  describeNoteProposal,
  describePreviewStatus,
  NotePreview,
  normalizeNoteProposal,
  normalizeNoteProposals,
  previewNoteProposal,
} from "@/services/companionNotes";
import { NoteServiceError } from "@/services/note";

vi.mock("../../generated", () => ({
  CompanionControllerService: {
    previewNoteEdit: vi.fn(),
    applyNoteEdit: vi.fn(),
  },
}));

const mockedPreview = CompanionControllerService.previewNoteEdit as Mock;
const mockedApply = CompanionControllerService.applyNoteEdit as Mock;

// 后端的 Long 在 JSON 里是字符串
const update = {
  kind: "update",
  noteId: "9" as unknown as number,
  baseVersion: 3,
  title: "两数之和 笔记",
  previousTitle: "两数之和 笔记",
  questionId: "7" as unknown as number,
  questionTitle: "两数之和",
  changes: [
    { kind: "replace", oldText: "暴力", newText: "哈希表", reason: "更快" },
    { kind: "append", newText: "## 坑", reason: "" },
  ],
  content: "思路\n哈希表\n\n## 坑\n",
  reason: "更快",
  applied: false,
};

describe("companion note proposals", () => {
  beforeEach(() => vi.resetAllMocks());

  it("normalizes proposals and keeps positions for unreadable ones", () => {
    expect(normalizeNoteProposal(update)).toMatchObject({
      kind: "update",
      noteId: "9",
      questionId: "7",
      changes: [{ kind: "replace" }, { kind: "append", oldText: "" }],
      applied: false,
    });
    expect(normalizeNoteProposal({ kind: "update" })).toBeNull();
    expect(
      normalizeNoteProposal({ kind: "create", content: "x" })
    ).toMatchObject({ noteId: null, questionId: null, title: "未命名笔记" });

    // 应用时按下标找，解析不了的也要占着位置
    const list = normalizeNoteProposals([{ kind: "nope" }, update]);
    expect(list[0]).toBeNull();
    expect(list[1]?.noteId).toBe("9");
  });

  it("describes what a proposal does", () => {
    const proposal = normalizeNoteProposal(update)!;
    expect(describeNoteProposal(proposal)).toBe("修改「两数之和 笔记」· 2 处");
    expect(
      describeNoteProposal({
        ...proposal,
        title: "复盘",
        changes: [{ kind: "rewrite", oldText: "", newText: "x", reason: "" }],
      })
    ).toBe("整理「两数之和 笔记」");
    expect(
      describeNoteProposal({ ...proposal, kind: "create", changes: [] })
    ).toBe("新建笔记「两数之和 笔记」");
  });

  it("explains each preview status and when applying is allowed", () => {
    const preview = (status: NotePreview["status"]): NotePreview => ({
      status,
      proposal: normalizeNoteProposal(update)!,
      title: "t",
      content: "c",
      currentContent: null,
      skipped: 2,
      noteId: "9",
    });
    expect(describePreviewStatus(preview("ready"))).toBe("");
    expect(describePreviewStatus(preview("partial"))).toContain("2 处对不上");
    expect(describePreviewStatus(preview("overwrite"))).toContain("整篇覆盖");
    expect(canApplyPreview(preview("overwrite"))).toBe(true);
    expect(canApplyPreview(preview("stale"))).toBe(false);
    expect(canApplyPreview(preview("missing"))).toBe(false);
    expect(canApplyPreview(preview("applied"))).toBe(false);
  });

  it("loads a preview and applies with the overwrite flag", async () => {
    mockedPreview.mockResolvedValue({
      code: 0,
      data: {
        status: "partial",
        proposal: update,
        content: "新的",
        skipped: 1,
      },
    });
    const preview = await previewNoteProposal("50", 1);
    expect(mockedPreview).toHaveBeenCalledWith("50", 1);
    expect(preview).toMatchObject({
      status: "partial",
      title: "两数之和 笔记",
      content: "新的",
      skipped: 1,
    });

    mockedApply.mockResolvedValue({
      code: 0,
      data: {
        note: { id: "9", title: "两数之和 笔记", content: "新的", version: 4 },
        proposal: { ...update, applied: true },
        skipped: 1,
      },
    });
    const result = await applyNoteProposal("50", 1, true);
    expect(mockedApply).toHaveBeenCalledWith({
      messageId: "50",
      index: 1,
      overwrite: true,
    });
    expect(result.note.version).toBe(4);
    expect(result.proposal.applied).toBe(true);
    expect(result.raw.applied).toBe(true);
  });

  it("turns business errors into NoteServiceError with the code", async () => {
    mockedApply.mockResolvedValue({ code: 40900, message: "对不上了" });
    const error = await applyNoteProposal("50", 0).catch((cause) => cause);
    expect(error).toBeInstanceOf(NoteServiceError);
    expect(error).toMatchObject({ code: 40900, message: "对不上了" });
  });
});
