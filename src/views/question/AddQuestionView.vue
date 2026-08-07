<template>
  <div id="addQuestionView">
    <div class="form-wrapper">
      <header class="page-heading">
        <span class="page-kicker">
          {{ updatePage ? "EDIT PROBLEM" : "CREATE PROBLEM" }}
        </span>
        <h2 class="page-title">
          {{ updatePage ? "更新题目" : "创建题目" }}
        </h2>
      </header>
      <a-form :model="form" label-align="left">
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <a-form-item field="title" label="标题">
            <a-input v-model="form.title" placeholder="请输入标题" />
          </a-form-item>
          <a-form-item field="tags" label="标签">
            <a-input-tag
              v-model="form.tags"
              placeholder="请选择标签"
              allow-clear
            />
          </a-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">题目内容</h3>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="content" label="描述">
                <MdEditor
                  :value="form.content"
                  :handle-change="onContentChange"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="answer" label="答案">
                <MdEditor
                  :value="form.answer"
                  :handle-change="onAnswerChange"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">判题配置</h3>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item field="judgeConfig.timeLimit" label="时间限制(ms)">
                <a-input-number
                  v-model="form.judgeConfig.timeLimit"
                  placeholder="时间限制"
                  mode="button"
                  min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="judgeConfig.memoryLimit" label="内存限制(KB)">
                <a-input-number
                  v-model="form.judgeConfig.memoryLimit"
                  placeholder="内存限制"
                  mode="button"
                  min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="judgeConfig.stackLimit" label="堆栈限制(KB)">
                <a-input-number
                  v-model="form.judgeConfig.stackLimit"
                  placeholder="堆栈限制"
                  mode="button"
                  min="0"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">测试用例</h3>
          <div
            v-for="(judgeCaseItem, index) of form.judgeCase"
            :key="index"
            class="test-case-card"
          >
            <div class="test-case-header">
              <span class="test-case-label">用例 {{ index + 1 }}</span>
              <button class="delete-btn" @click="handleDelete(index)">
                删除
              </button>
            </div>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item :field="`input-${index}`" label="输入">
                  <a-input
                    v-model="judgeCaseItem.input"
                    placeholder="测试输入"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :field="`output-${index}`" label="输出">
                  <a-input
                    v-model="judgeCaseItem.output"
                    placeholder="测试输出"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </div>
          <button class="add-case-btn" @click="handleAdd">
            + 新增测试用例
          </button>
        </div>

        <div class="form-section">
          <div class="starter-section-header">
            <h3 class="section-title">初始代码模板</h3>
            <label v-if="!updatePage" class="starter-toggle">
              <span>自定义模板</span>
              <a-switch v-model="starterCodeEnabled" size="small" />
            </label>
          </div>

          <div v-if="starterCodeLoadError" class="starter-code-alert">
            <div>
              <strong>模板配置异常</strong>
              <span>{{ starterCodeLoadError }}</span>
            </div>
            <button
              v-if="updatePage && languageOptions.length"
              class="repair-template-btn"
              type="button"
              @click="repairStarterCodes"
            >
              使用后端默认模板重建
            </button>
          </div>

          <div
            v-if="starterCodeEnabled && languageOptions.length"
            class="starter-code-workspace"
          >
            <div class="starter-language-tabs" role="tablist">
              <button
                v-for="language in languageOptions"
                :key="language.value"
                :class="[
                  'starter-language-tab',
                  { active: activeStarterLanguage === language.value },
                ]"
                type="button"
                role="tab"
                :aria-selected="activeStarterLanguage === language.value"
                @click="activeStarterLanguage = language.value"
              >
                {{ language.text }}
              </button>
            </div>
            <div class="starter-code-editor">
              <CodeEditor
                :value="starterCodes[activeStarterLanguage] || ''"
                :language="activeStarterLanguage"
                :handle-change="onStarterCodeChange"
              />
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button
            class="claude-btn-primary"
            type="button"
            :disabled="starterCodeLoading || languageLoading"
            @click="doSubmit"
          >
            {{ updatePage ? "更新" : "提交" }}
          </button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import CodeEditor from "@/components/editor/CodeEditor.vue";
import MdEditor from "@/components/editor/MdEditor.vue";
import { ApiId, parseRouteApiId, toGeneratedApiId } from "@/services/apiId";
import {
  buildStarterCodeList,
  getQuestionStarterCodeMap,
  getSupportedLanguageOptions,
  LanguageOption,
  StarterCodeMap,
  StarterCodeServiceError,
} from "@/services/questionStarterCode";
import {
  JudgeCase,
  JudgeConfig,
  QuestionControllerService,
} from "../../../generated";

interface QuestionForm {
  id?: ApiId;
  title: string;
  tags: string[];
  answer: string;
  content: string;
  judgeConfig: JudgeConfig;
  judgeCase: JudgeCase[];
}

const createDefaultForm = (): QuestionForm => ({
  title: "",
  tags: [],
  answer: "",
  content: "",
  judgeConfig: {
    memoryLimit: 1000,
    stackLimit: 1000,
    timeLimit: 1000,
  },
  judgeCase: [{ input: "", output: "" }],
});

function parseJson<T>(value: string | undefined, fallback: T): T {
  return value ? (JSON.parse(value) as T) : fallback;
}

const route = useRoute();
const router = useRouter();
const updatePage = route.path.includes("update");
const form = ref<QuestionForm>(createDefaultForm());
const languageOptions = ref<LanguageOption[]>([]);
const languageLoading = ref(false);
const starterCodeLoading = ref(false);
const starterCodeEnabled = ref(false);
const starterCodeDirty = ref(false);
const starterCodeLoadError = ref("");
const starterCodes = ref<StarterCodeMap>({});
const activeStarterLanguage = ref("");

const createEmptyStarterCodeMap = () =>
  Object.fromEntries(
    languageOptions.value.map(({ value }) => [value, ""])
  ) as StarterCodeMap;

const loadLanguageOptions = async () => {
  languageLoading.value = true;
  try {
    languageOptions.value = await getSupportedLanguageOptions();
    activeStarterLanguage.value = languageOptions.value[0]?.value || "";
    starterCodes.value = createEmptyStarterCodeMap();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "加载编程语言失败");
  } finally {
    languageLoading.value = false;
  }
};

const loadStarterCodes = async (questionId: ApiId) => {
  starterCodeLoading.value = true;
  starterCodeLoadError.value = "";
  try {
    starterCodes.value = await getQuestionStarterCodeMap(
      questionId,
      languageOptions.value
    );
    starterCodeEnabled.value = true;
    starterCodeDirty.value = false;
  } catch (error) {
    starterCodeEnabled.value = false;
    starterCodeLoadError.value =
      error instanceof StarterCodeServiceError && error.code === 40400
        ? "题目的语言模板缺失或不完整"
        : error instanceof Error
        ? error.message
        : "加载初始代码模板失败";
    message.error(starterCodeLoadError.value);
  } finally {
    starterCodeLoading.value = false;
  }
};

const loadData = async () => {
  const id = parseRouteApiId(route.query.id);
  if (id == null) return;

  const res = await QuestionControllerService.getQuestionById(
    toGeneratedApiId(id)
  );
  if (res.code === 0 && res.data) {
    const defaults = createDefaultForm();
    form.value = {
      id: res.data.id,
      title: res.data.title ?? "",
      answer: res.data.answer ?? "",
      content: res.data.content ?? "",
      tags: parseJson(res.data.tags, defaults.tags),
      judgeCase: parseJson(res.data.judgeCase, defaults.judgeCase),
      judgeConfig: parseJson(res.data.judgeConfig, defaults.judgeConfig),
    };
    await loadStarterCodes(id);
  } else {
    message.error("加载失败，" + res.message);
  }
};

onMounted(async () => {
  await loadLanguageOptions();
  if (updatePage) await loadData();
});

watch(starterCodeEnabled, (enabled) => {
  if (enabled && !Object.keys(starterCodes.value).length) {
    starterCodes.value = createEmptyStarterCodeMap();
  }
});

const onStarterCodeChange = (value: string) => {
  if (!activeStarterLanguage.value) return;
  starterCodes.value[activeStarterLanguage.value] = value;
  starterCodeDirty.value = true;
};

const repairStarterCodes = () => {
  starterCodes.value = createEmptyStarterCodeMap();
  starterCodeEnabled.value = true;
  starterCodeDirty.value = true;
  starterCodeLoadError.value = "";
};

const doSubmit = async () => {
  const starterCodeList =
    starterCodeEnabled.value && (!updatePage || starterCodeDirty.value)
      ? buildStarterCodeList(starterCodes.value, languageOptions.value)
      : undefined;

  if (updatePage) {
    const res = await QuestionControllerService.editQuestion({
      ...form.value,
      id: form.value.id == null ? undefined : toGeneratedApiId(form.value.id),
      starterCodeList,
    });
    if (res.code === 0) {
      message.success("更新成功");
      router.push(
        route.query.from === "my" ? "/my/question" : "/manage/question"
      );
    } else message.error("更新失败，" + res.message);
  } else {
    const res = await QuestionControllerService.addQuestion({
      ...form.value,
      starterCodeList,
    });
    if (res.code === 0) {
      message.success("创建成功");
      router.push("/questions");
    } else message.error("创建失败，" + res.message);
  }
};

const handleAdd = () => {
  form.value.judgeCase.push({ input: "", output: "" });
};
const handleDelete = (index: number) => {
  form.value.judgeCase.splice(index, 1);
};
const onContentChange = (value: string) => {
  form.value.content = value;
};
const onAnswerChange = (value: string) => {
  form.value.answer = value;
};
</script>

<style scoped>
#addQuestionView {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
  animation: claude-fade-up 0.4s ease-out;
}

.form-wrapper {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
}

/* Make description/answer labels compact inside 50% columns */
.arco-col-12 .arco-form-item-label-col {
  flex: 0 0 auto !important;
  padding-right: 4px !important;
}

.arco-col-12 .arco-form-item-wrapper-col {
  flex: 1 !important;
}

.page-heading {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--hairline);
}

.page-kicker {
  color: var(--primary);
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 500;
}

.page-title {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 2px 0 0;
}

.form-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--hairline);
}

.arco-form-item {
  margin-bottom: var(--space-md);
}

.arco-form-item-label {
  color: var(--muted) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  flex-shrink: 0 !important;
  width: auto !important;
  min-width: 60px !important;
  padding-right: 12px !important;
}

/* Fix input-tag width issue */
.arco-input-tag {
  width: 100% !important;
  min-width: 0 !important;
}

.arco-input-tag input {
  width: 100% !important;
  min-width: 60px !important;
}

/* Fix input-number width */
.arco-input-number {
  width: 100% !important;
}

/* Make form item content fill remaining space */
.arco-form-item-content {
  flex: 1 !important;
  overflow: hidden;
}

.test-case-card {
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.test-case-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.test-case-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--body);
}

.delete-btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--error);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 2px 10px;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}

.delete-btn:hover {
  background: rgba(198, 69, 69, 0.08);
  border-color: var(--error);
}

.add-case-btn {
  width: 100%;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background: transparent;
  border: 1px dashed var(--hairline);
  border-radius: var(--radius-sm);
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.add-case-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.starter-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  border-bottom: 1px solid var(--hairline);
}

.starter-section-header .section-title {
  flex: 1;
  margin-bottom: 0;
  border-bottom: 0;
}

.starter-toggle {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 2px 0 10px;
  color: var(--muted);
  font-size: 13px;
}

.starter-code-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: var(--space-md);
  padding: 12px 14px;
  background: rgba(198, 69, 69, 0.08);
  border-left: 3px solid var(--error);
}

.starter-code-alert > div {
  display: grid;
  gap: 3px;
}

.starter-code-alert strong {
  color: var(--error);
  font-size: 13px;
}

.starter-code-alert span {
  color: var(--muted);
  font-size: 12px;
}

.repair-template-btn {
  flex-shrink: 0;
  height: 32px;
  padding: 0 12px;
  color: var(--error);
  background: transparent;
  border: 1px solid var(--error);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.repair-template-btn:hover {
  background: rgba(198, 69, 69, 0.08);
}

.starter-code-workspace {
  margin-top: var(--space-md);
  overflow: hidden;
  background: var(--surface-dark);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
}

.starter-language-tabs {
  display: flex;
  gap: 4px;
  padding: 8px;
  overflow-x: auto;
  border-bottom: 1px solid #333;
}

.starter-language-tab {
  flex: 0 0 auto;
  height: 30px;
  padding: 0 12px;
  color: var(--on-dark-soft);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.starter-language-tab:hover {
  color: var(--on-dark);
  background: var(--surface-dark-elevated);
}

.starter-language-tab.active {
  color: var(--on-dark);
  background: var(--surface-dark-elevated);
  border-color: #444;
}

.starter-code-editor :deep(#code-editor) {
  width: 100% !important;
  height: 380px !important;
  min-height: 320px !important;
}

.form-footer {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}

.claude-btn-primary {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  height: 40px;
  padding: 0 32px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.claude-btn-primary:hover {
  background: var(--primary-active);
}

.claude-btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 768px) {
  #addQuestionView {
    padding: var(--space-md) 0;
  }
  .form-wrapper {
    padding: var(--space-md);
  }
}
</style>
