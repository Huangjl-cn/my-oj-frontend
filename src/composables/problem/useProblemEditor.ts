import message from "@arco-design/web-vue/es/message";
import { computed, ref, Ref } from "vue";

import { ApiId } from "@/services/apiId";
import {
  getQuestionDraft,
  removeQuestionDraft,
  saveQuestionDraft,
} from "@/services/questionDraft";
import {
  getCachedStarterCode,
  getLanguageText,
  getQuestionStarterCode,
  getSupportedLanguageOptions,
  LanguageOption,
  removeCachedStarterCode,
  setCachedStarterCode,
  StarterCodeServiceError,
} from "@/services/questionStarterCode";

const DRAFT_SAVE_DELAY_MS = 300;

/**
 * 做题页编辑器的状态：语言、初始代码模板、本地草稿。
 * 草稿在停止输入 300ms 后写入；代码和模板一样时删掉草稿（模板状态 = 没有草稿）。
 */
export const useProblemEditor = (options: {
  questionId: Ref<ApiId | null>;
  /** 草稿按用户区分，没登录时是 "anonymous" */
  userKey: () => ApiId | "anonymous";
}) => {
  const languageOptions = ref<LanguageOption[]>([]);
  const languageLoading = ref(false);
  const language = ref("");
  const code = ref("");
  const template = ref("");
  /** 模板和草稿对应的语言；切换语言时先存旧语言的草稿 */
  const loadedLanguage = ref("");
  const templateLoading = ref(false);
  const templateError = ref("");
  /** 刚刚把草稿写进了本地（编辑器顶上的小勾） */
  const draftSaved = ref(false);
  let generation = 0;
  let draftTimer: ReturnType<typeof setTimeout> | undefined;

  const languageText = computed(() =>
    getLanguageText(loadedLanguage.value, languageOptions.value, "")
  );
  const isTemplate = computed(() => code.value === template.value);
  const ready = computed(
    () =>
      !!language.value &&
      !templateLoading.value &&
      !templateError.value &&
      loadedLanguage.value === language.value
  );

  const draftKey = (questionId: ApiId, lang: string) => ({
    userId: options.userKey(),
    questionId,
    language: lang,
  });

  const loadLanguageOptions = async () => {
    if (languageOptions.value.length) return languageOptions.value;
    languageLoading.value = true;
    try {
      languageOptions.value = await getSupportedLanguageOptions();
      return languageOptions.value;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "加载编程语言失败"
      );
      return [];
    } finally {
      languageLoading.value = false;
    }
  };

  /** 选第一个可用的语言：先看地址栏指定的，再看上一次用的，最后用列表里第一个 */
  const pickLanguage = (...candidates: Array<string | undefined>) => {
    const values = languageOptions.value.map(({ value }) => value);
    return (
      candidates.find((value) => value && values.includes(value)) ??
      values[0] ??
      ""
    );
  };

  const persistDraft = () => {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = undefined;
    const questionId = options.questionId.value;
    if (questionId == null || !loadedLanguage.value || templateError.value) {
      return;
    }
    const key = draftKey(questionId, loadedLanguage.value);
    if (code.value === template.value) {
      removeQuestionDraft(key);
      draftSaved.value = false;
    } else {
      saveQuestionDraft(key, code.value);
      draftSaved.value = true;
    }
  };

  const changeCode = (value: string) => {
    code.value = value;
    draftSaved.value = false;
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(persistDraft, DRAFT_SAVE_DELAY_MS);
  };

  /** 换到某种语言：取模板（有缓存用缓存），有草稿就用草稿 */
  const activateLanguage = async (lang: string) => {
    const questionId = options.questionId.value;
    if (questionId == null || !lang) return;
    const current = ++generation;
    language.value = lang;
    templateLoading.value = true;
    templateError.value = "";
    code.value = "";
    draftSaved.value = false;
    try {
      let starter = getCachedStarterCode(questionId, lang);
      if (starter == null) {
        starter = await getQuestionStarterCode(questionId, lang);
        setCachedStarterCode(questionId, lang, starter);
      }
      if (current !== generation) return;
      template.value = starter;
      loadedLanguage.value = lang;
      const draft = getQuestionDraft(draftKey(questionId, lang));
      code.value = draft ?? starter;
      draftSaved.value = draft != null;
    } catch (error) {
      if (current !== generation) return;
      removeCachedStarterCode(questionId, lang);
      template.value = "";
      loadedLanguage.value = lang;
      templateError.value =
        error instanceof StarterCodeServiceError && error.code === 40400
          ? "初始代码模板配置异常"
          : error instanceof Error
          ? error.message
          : "加载初始代码失败";
      message.error(templateError.value);
    } finally {
      if (current === generation) templateLoading.value = false;
    }
  };

  const changeLanguage = (lang: string) => {
    if (lang === loadedLanguage.value && !templateError.value) return;
    persistDraft();
    void activateLanguage(lang);
  };

  /** 恢复初始代码：删掉草稿，代码换回模板 */
  const resetToTemplate = () => {
    const questionId = options.questionId.value;
    if (questionId == null || !loadedLanguage.value) return;
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = undefined;
    removeQuestionDraft(draftKey(questionId, loadedLanguage.value));
    code.value = template.value;
    draftSaved.value = false;
  };

  /** 离开页面或换题时调用：先存草稿，再让还在路上的模板请求作废 */
  const dispose = () => {
    persistDraft();
    generation += 1;
  };

  return {
    languageOptions,
    languageLoading,
    language,
    code,
    template,
    loadedLanguage,
    languageText,
    templateLoading,
    templateError,
    draftSaved,
    isTemplate,
    ready,
    loadLanguageOptions,
    pickLanguage,
    activateLanguage,
    changeLanguage,
    changeCode,
    persistDraft,
    resetToTemplate,
    dispose,
  };
};

export type ProblemEditor = ReturnType<typeof useProblemEditor>;
