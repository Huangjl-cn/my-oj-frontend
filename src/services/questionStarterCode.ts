import {
  QuestionControllerService,
  QuestionStarterCodeSaveRequest,
  QuestionStarterCodeVO,
  SupportedLanguageVO,
} from "../../generated";
import { ApiId, toGeneratedApiId } from "@/services/apiId";

export type LanguageOption = {
  text: string;
  value: string;
};

export type StarterCodeMap = Record<string, string>;

export const getLanguageText = (
  language: string | undefined,
  options: LanguageOption[],
  emptyText = "--"
) =>
  options.find(({ value }) => value === language)?.text ||
  language ||
  emptyText;

export class StarterCodeServiceError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = "StarterCodeServiceError";
  }
}

const requireText = (value: string | undefined, field: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new StarterCodeServiceError(`语言配置缺少 ${field}`);
  }
  return normalized;
};

export const normalizeLanguageOptions = (
  languages?: SupportedLanguageVO[]
): LanguageOption[] => {
  if (!languages?.length) {
    throw new StarterCodeServiceError("后端未配置支持的编程语言");
  }

  const values = new Set<string>();
  return languages.map((language) => {
    const text = requireText(language.text, "text");
    const value = requireText(language.value, "value");
    if (values.has(value)) {
      throw new StarterCodeServiceError(`后端返回了重复语言：${value}`);
    }
    values.add(value);
    return { text, value };
  });
};

export const normalizeStarterCodeList = (
  templates: QuestionStarterCodeVO[] | undefined,
  languages: LanguageOption[]
): StarterCodeMap => {
  const supportedValues = new Set(languages.map(({ value }) => value));
  const result: StarterCodeMap = {};

  for (const template of templates ?? []) {
    const language = requireText(template.language, "language");
    if (!supportedValues.has(language)) {
      throw new StarterCodeServiceError(`模板包含未支持的语言：${language}`);
    }
    if (language in result) {
      throw new StarterCodeServiceError(`模板语言重复：${language}`);
    }
    if (typeof template.starterCode !== "string") {
      throw new StarterCodeServiceError(`模板缺少代码：${language}`);
    }
    result[language] = template.starterCode;
  }

  const missing = languages
    .map(({ value }) => value)
    .filter((value) => !(value in result));
  if (missing.length) {
    throw new StarterCodeServiceError(
      `模板配置不完整，缺少：${missing.join("、")}`
    );
  }

  return result;
};

let languageOptionsRequest: Promise<LanguageOption[]> | undefined;

export const getSupportedLanguageOptions = () => {
  if (!languageOptionsRequest) {
    languageOptionsRequest = QuestionControllerService.getSupportedLanguages()
      .then((response) => {
        if (response.code !== 0) {
          throw new StarterCodeServiceError(
            response.message || "加载编程语言失败",
            response.code
          );
        }
        return normalizeLanguageOptions(response.data);
      })
      .catch((error) => {
        languageOptionsRequest = undefined;
        throw error;
      });
  }
  return languageOptionsRequest;
};

export const getQuestionStarterCode = async (
  questionId: ApiId,
  language: string
) => {
  const response = await QuestionControllerService.getQuestionStarterCode(
    toGeneratedApiId(questionId),
    language
  );
  if (response.code !== 0) {
    throw new StarterCodeServiceError(
      response.message || "初始代码模板配置异常",
      response.code
    );
  }
  if (
    response.data?.language !== language ||
    typeof response.data.starterCode !== "string"
  ) {
    throw new StarterCodeServiceError("初始代码模板响应不完整");
  }
  return response.data.starterCode;
};

export const getQuestionStarterCodeMap = async (
  questionId: ApiId,
  languages: LanguageOption[]
) => {
  const response = await QuestionControllerService.listQuestionStarterCode(
    toGeneratedApiId(questionId)
  );
  if (response.code !== 0) {
    throw new StarterCodeServiceError(
      response.message || "初始代码模板配置异常",
      response.code
    );
  }
  return normalizeStarterCodeList(response.data, languages);
};

export const buildStarterCodeList = (
  templates: StarterCodeMap,
  languages: LanguageOption[]
): QuestionStarterCodeSaveRequest[] =>
  languages.map(({ value }) => ({
    language: value,
    starterCode: templates[value] ?? "",
  }));
