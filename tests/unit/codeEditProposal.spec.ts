import {
  describeProposal,
  isProposalBase,
  resolveProposal,
} from "@/services/codeEditProposal";
import { CodeEditProposal } from "@/services/companion";

vi.mock("../../generated", () => ({ OpenAPI: { BASE: "/api" } }));

const original = "int a = in.nextInt();\nint b = in.nextInt();\nprint(a + b)\n";

const proposal: CodeEditProposal = {
  baseHash: "hash-of-original",
  edits: [
    {
      kind: "replace",
      oldText: "print(a + b)",
      newText: "print(a + b);",
      startLine: 3,
      reason: "少了分号",
    },
    {
      kind: "replace",
      oldText: "int a = in.nextInt();\nint b = in.nextInt();",
      newText: "long a = in.nextLong();\nlong b = in.nextLong();",
      startLine: 1,
      reason: "会溢出",
    },
  ],
  resultCode:
    "long a = in.nextLong();\nlong b = in.nextLong();\nprint(a + b);\n",
};

describe("code edit proposal", () => {
  it("uses the result code directly when the code has not changed", () => {
    const resolution = resolveProposal(original, proposal, true);

    expect(resolution).toEqual({
      code: proposal.resultCode,
      applied: 2,
      failed: [],
      needsOverwriteConfirm: false,
    });
  });

  it("re-applies each edit on code the user changed in the meantime", () => {
    const changed = "// 我加了一行注释\n" + original.replace(/\n/g, "\r\n");

    const resolution = resolveProposal(changed, proposal, false);

    expect(resolution.applied).toBe(2);
    expect(resolution.failed).toEqual([]);
    expect(resolution.code).toBe(
      "// 我加了一行注释\nlong a = in.nextLong();\nlong b = in.nextLong();\nprint(a + b);\n"
    );
  });

  it("skips edits whose original text is gone or ambiguous", () => {
    const changed = "print(a + b)\nprint(a + b)\nint a = in.nextInt();\n";

    const resolution = resolveProposal(changed, proposal, false);

    expect(resolution.applied).toBe(0);
    expect(resolution.failed).toHaveLength(2);
    expect(resolution.code).toBe(changed);
  });

  it("asks before overwriting changed code with a rewrite", () => {
    const rewrite: CodeEditProposal = {
      baseHash: "h",
      edits: [{ kind: "rewrite", newText: "new code", startLine: 1 }],
      resultCode: "new code",
    };

    expect(resolveProposal("other", rewrite, false)).toMatchObject({
      code: "new code",
      needsOverwriteConfirm: true,
    });
    expect(describeProposal(rewrite)).toBe("整体替换为参考代码");
  });

  it("compares with the code that was sent when it is known", async () => {
    await expect(isProposalBase("a", proposal, "a")).resolves.toBe(true);
    await expect(isProposalBase("b", proposal, "a")).resolves.toBe(false);
  });

  it("describes edits by their starting lines", () => {
    expect(describeProposal(proposal)).toBe("2 处修改（第 1、3 行）");
  });
});
