import {
  JudgeCaseConfig,
  QuestionControllerService,
  SupportedJudgeTypeVO,
} from "../../generated";

export type JudgeValue = string | number | boolean | JudgeValue[];

export type JudgeTypeOption = {
  value: string;
  text: string;
  category: string;
  dimensions: number;
  elementType?: string;
};

export type JudgeParameterDraft = {
  key: string;
  name: string;
  type: string;
};

export type JudgeCaseDraft = {
  key: string;
  inputs: JudgeValue[];
  expectedOutput: JudgeValue;
};

export type JudgeCaseConfigDraft = {
  inputDefinitions: JudgeParameterDraft[];
  outputDefinition: { type: string };
  cases: JudgeCaseDraft[];
};

export class JudgeCaseServiceError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = "JudgeCaseServiceError";
  }
}

let draftKey = 0;

const createDraftKey = (prefix: string) => `${prefix}-${++draftKey}`;

const requireText = (value: string | undefined, field: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new JudgeCaseServiceError(`判题类型配置缺少 ${field}`);
  }
  return normalized;
};

export const normalizeJudgeTypeOptions = (
  types?: SupportedJudgeTypeVO[]
): JudgeTypeOption[] => {
  if (!types?.length) {
    throw new JudgeCaseServiceError("后端未配置支持的判题值类型");
  }

  const values = new Set<string>();
  return types.map((type) => {
    const value = requireText(type.value, "value");
    const text = requireText(type.text, "text");
    const category = requireText(type.category, "category");
    const dimensions = type.dimensions;
    if (!Number.isInteger(dimensions) || dimensions == null || dimensions < 0) {
      throw new JudgeCaseServiceError(`判题类型 ${value} 的维度无效`);
    }
    if (values.has(value)) {
      throw new JudgeCaseServiceError(`后端返回了重复判题类型：${value}`);
    }
    values.add(value);
    return {
      value,
      text,
      category,
      dimensions,
      elementType: type.elementType?.trim() || undefined,
    };
  });
};

let judgeTypeOptionsRequest: Promise<JudgeTypeOption[]> | undefined;

export const getSupportedJudgeTypeOptions = () => {
  if (!judgeTypeOptionsRequest) {
    judgeTypeOptionsRequest = QuestionControllerService.getSupportedJudgeTypes()
      .then((response) => {
        if (response.code !== 0) {
          throw new JudgeCaseServiceError(
            response.message || "加载判题值类型失败",
            response.code
          );
        }
        return normalizeJudgeTypeOptions(response.data);
      })
      .catch((error) => {
        judgeTypeOptionsRequest = undefined;
        throw error;
      });
  }
  return judgeTypeOptionsRequest;
};

export const getJudgeTypeOption = (type: string, options: JudgeTypeOption[]) =>
  options.find(({ value }) => value === type);

const createDefaultScalarValue = (type: string): JudgeValue => {
  if (type === "BOOLEAN") return false;
  if (type === "STRING") return "";
  if (type === "LONG") return "0";
  if (type === "INTEGER" || type === "DOUBLE") return 0;
  return "";
};

export const createDefaultJudgeValue = (
  type: string,
  options: JudgeTypeOption[]
): JudgeValue => {
  const option = getJudgeTypeOption(type, options);
  if (!option || option.dimensions === 0) {
    return createDefaultScalarValue(type);
  }

  const elementValue = createDefaultScalarValue(option.elementType || "");
  return option.dimensions === 1 ? [elementValue] : [[elementValue]];
};

export const createJudgeParameterDraft = (
  name: string,
  type: string
): JudgeParameterDraft => ({
  key: createDraftKey("parameter"),
  name,
  type,
});

const normalizeScalarValue = (value: unknown, type: string): JudgeValue => {
  if (type === "BOOLEAN") return typeof value === "boolean" ? value : false;
  if (type === "LONG") return value == null ? "0" : String(value);
  if (type === "STRING") return value == null ? "" : String(value);
  if (type === "INTEGER" || type === "DOUBLE") {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
  return typeof value === "string" || typeof value === "number" ? value : "";
};

export const normalizeJudgeValue = (
  value: unknown,
  type: string,
  options: JudgeTypeOption[]
): JudgeValue => {
  const option = getJudgeTypeOption(type, options);
  if (!option || option.dimensions === 0) {
    return normalizeScalarValue(value, type);
  }

  const values = Array.isArray(value) ? value : [];
  if (option.dimensions === 1) {
    return values.map((item) =>
      normalizeScalarValue(item, option.elementType || "")
    );
  }
  return values.map((row) =>
    Array.isArray(row)
      ? row.map((item) => normalizeScalarValue(item, option.elementType || ""))
      : []
  );
};

export const createDefaultJudgeCaseConfig = (
  options: JudgeTypeOption[]
): JudgeCaseConfigDraft => {
  const type = options[0]?.value || "";
  const inputDefinitions = [createJudgeParameterDraft("arg1", type)];
  return {
    inputDefinitions,
    outputDefinition: { type },
    cases: [
      {
        key: createDraftKey("case"),
        inputs: [createDefaultJudgeValue(type, options)],
        expectedOutput: createDefaultJudgeValue(type, options),
      },
    ],
  };
};

export const createJudgeCaseConfigDraft = (
  config: JudgeCaseConfig | undefined,
  options: JudgeTypeOption[]
): JudgeCaseConfigDraft => {
  if (!config) return createDefaultJudgeCaseConfig(options);

  const fallbackType = options[0]?.value || "";
  const inputDefinitions = (config.inputDefinitions ?? []).map(
    (definition, index) => ({
      key: createDraftKey("parameter"),
      name: definition.name ?? `arg${index + 1}`,
      type: definition.type ?? fallbackType,
    })
  );
  const outputType = config.outputDefinition?.type ?? fallbackType;

  return {
    inputDefinitions,
    outputDefinition: { type: outputType },
    cases: (config.cases ?? []).map((judgeCase) => ({
      key: createDraftKey("case"),
      inputs: inputDefinitions.map((definition, index) =>
        normalizeJudgeValue(judgeCase.inputs?.[index], definition.type, options)
      ),
      expectedOutput: normalizeJudgeValue(
        judgeCase.expectedOutput,
        outputType,
        options
      ),
    })),
  };
};

export const createJudgeCaseDraft = (
  config: JudgeCaseConfigDraft,
  options: JudgeTypeOption[]
): JudgeCaseDraft => ({
  key: createDraftKey("case"),
  inputs: config.inputDefinitions.map(({ type }) =>
    createDefaultJudgeValue(type, options)
  ),
  expectedOutput: createDefaultJudgeValue(
    config.outputDefinition.type,
    options
  ),
});

const isScalarValueValid = (value: JudgeValue, type: string) => {
  if (type === "INTEGER")
    return typeof value === "number" && Number.isInteger(value);
  if (type === "DOUBLE")
    return typeof value === "number" && Number.isFinite(value);
  if (type === "BOOLEAN") return typeof value === "boolean";
  if (type === "LONG")
    return typeof value === "string" && /^-?\d+$/.test(value);
  if (type === "STRING") return typeof value === "string";
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};

const isJudgeValueValid = (
  value: JudgeValue,
  type: string,
  options: JudgeTypeOption[]
) => {
  const option = getJudgeTypeOption(type, options);
  if (!option) return false;
  if (option.dimensions === 0) return isScalarValueValid(value, type);
  if (!Array.isArray(value)) return false;

  if (option.dimensions === 1) {
    return value.every((item) =>
      isScalarValueValid(item, option.elementType || "")
    );
  }

  const rows = value as JudgeValue[][];
  const columnCount = rows[0]?.length ?? 0;
  return rows.every(
    (row) =>
      Array.isArray(row) &&
      row.length === columnCount &&
      row.every((item) => isScalarValueValid(item, option.elementType || ""))
  );
};

export const validateJudgeCaseConfig = (
  config: JudgeCaseConfigDraft,
  options: JudgeTypeOption[]
): string | undefined => {
  if (!config.inputDefinitions.length) return "请至少添加一个输入参数";

  const names = config.inputDefinitions.map(({ name }) => name.trim());
  if (names.some((name) => !name)) return "输入参数名称不能为空";
  if (new Set(names).size !== names.length) return "输入参数名称不能重复";
  if (
    config.inputDefinitions.some(
      ({ type }) => !getJudgeTypeOption(type, options)
    ) ||
    !getJudgeTypeOption(config.outputDefinition.type, options)
  ) {
    return "判题用例包含后端未支持的值类型";
  }
  if (!config.cases.length) return "请至少添加一个测试用例";

  for (let caseIndex = 0; caseIndex < config.cases.length; caseIndex += 1) {
    const judgeCase = config.cases[caseIndex];
    if (judgeCase.inputs.length !== config.inputDefinitions.length) {
      return `用例 ${caseIndex + 1} 的输入参数数量不正确`;
    }
    for (
      let inputIndex = 0;
      inputIndex < config.inputDefinitions.length;
      inputIndex += 1
    ) {
      if (
        !isJudgeValueValid(
          judgeCase.inputs[inputIndex],
          config.inputDefinitions[inputIndex].type,
          options
        )
      ) {
        return `用例 ${caseIndex + 1} 的参数「${
          config.inputDefinitions[inputIndex].name
        }」格式不正确`;
      }
    }
    if (
      !isJudgeValueValid(
        judgeCase.expectedOutput,
        config.outputDefinition.type,
        options
      )
    ) {
      return `用例 ${caseIndex + 1} 的预期输出格式不正确`;
    }
  }
  return undefined;
};

export const buildJudgeCaseConfig = (
  config: JudgeCaseConfigDraft
): JudgeCaseConfig =>
  ({
    inputDefinitions: config.inputDefinitions.map(({ name, type }) => ({
      name: name.trim(),
      type,
    })),
    outputDefinition: { type: config.outputDefinition.type },
    cases: config.cases.map(({ inputs, expectedOutput }) => ({
      inputs,
      expectedOutput,
    })),
  } as unknown as JudgeCaseConfig);
