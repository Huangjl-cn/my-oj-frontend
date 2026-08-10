import {
  buildJudgeCaseConfig,
  createJudgeCaseConfigDraft,
  normalizeJudgeTypeOptions,
  validateJudgeCaseConfig,
} from "@/services/questionJudgeCase";
import { JudgeCaseConfig } from "../../generated";

const types = normalizeJudgeTypeOptions([
  {
    value: "INTEGER",
    text: "整数",
    category: "SCALAR",
    dimensions: 0,
  },
  {
    value: "LONG",
    text: "长整数",
    category: "SCALAR",
    dimensions: 0,
  },
  {
    value: "INTEGER_ARRAY",
    text: "整数数组",
    category: "ARRAY",
    dimensions: 1,
    elementType: "INTEGER",
  },
  {
    value: "INTEGER_MATRIX",
    text: "整数矩阵",
    category: "ARRAY",
    dimensions: 2,
    elementType: "INTEGER",
  },
]);

describe("structured judge case adaptation", () => {
  it("uses backend values while preserving display metadata", () => {
    expect(types.map(({ value, text }) => ({ value, text }))).toEqual([
      { value: "INTEGER", text: "整数" },
      { value: "LONG", text: "长整数" },
      { value: "INTEGER_ARRAY", text: "整数数组" },
      { value: "INTEGER_MATRIX", text: "整数矩阵" },
    ]);
  });

  it("preserves long integers as decimal strings during edit and save", () => {
    const config = {
      inputDefinitions: [{ name: "value", type: "LONG" }],
      outputDefinition: { type: "LONG" },
      cases: [
        {
          inputs: ["9223372036854775807"],
          expectedOutput: "-9223372036854775808",
        },
      ],
    } as unknown as JudgeCaseConfig;

    const draft = createJudgeCaseConfigDraft(config, types);
    const request = buildJudgeCaseConfig(draft) as unknown as {
      inputDefinitions: Array<{ name: string; type: string }>;
      cases: Array<{ inputs: unknown[]; expectedOutput: unknown }>;
    };

    expect(request.cases[0]).toEqual({
      inputs: ["9223372036854775807"],
      expectedOutput: "-9223372036854775808",
    });
    expect(request.inputDefinitions[0]).toEqual({
      name: "value",
      type: "LONG",
    });
    expect(request.inputDefinitions[0]).not.toHaveProperty("key");
  });

  it("rejects irregular matrices before sending them to the backend", () => {
    const draft = createJudgeCaseConfigDraft(
      {
        inputDefinitions: [{ name: "matrix", type: "INTEGER_MATRIX" }],
        outputDefinition: { type: "INTEGER" },
        cases: [
          {
            inputs: [[[1, 2], [3]]],
            expectedOutput: 1,
          },
        ],
      } as unknown as JudgeCaseConfig,
      types
    );

    expect(validateJudgeCaseConfig(draft, types)).toContain("matrix");
  });

  it("rejects duplicate parameter names", () => {
    const draft = createJudgeCaseConfigDraft(
      {
        inputDefinitions: [
          { name: "nums", type: "INTEGER_ARRAY" },
          { name: "nums", type: "INTEGER" },
        ],
        outputDefinition: { type: "INTEGER" },
        cases: [
          {
            inputs: [[1, 2], 3],
            expectedOutput: 1,
          },
        ],
      } as unknown as JudgeCaseConfig,
      types
    );

    expect(validateJudgeCaseConfig(draft, types)).toBe("输入参数名称不能重复");
  });
});
