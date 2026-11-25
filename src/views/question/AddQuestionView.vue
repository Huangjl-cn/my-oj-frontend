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
          <h3 class="section-title">输入输出定义</h3>
          <div class="definition-layout">
            <section class="definition-panel">
              <header class="definition-header">
                <div>
                  <h4>输入参数</h4>
                  <p>用例输入顺序与这里的参数顺序一致</p>
                </div>
                <button
                  class="definition-command"
                  type="button"
                  @click="handleAddParameter"
                >
                  <IconPlus />
                  添加参数
                </button>
              </header>
              <div
                v-for="(parameter, index) in form.judgeCase.inputDefinitions"
                :key="parameter.key"
                class="parameter-row"
              >
                <span class="parameter-index">{{ index + 1 }}</span>
                <a-input
                  v-model="parameter.name"
                  placeholder="参数名称"
                  allow-clear
                />
                <a-select
                  v-model="parameter.type"
                  placeholder="参数类型"
                  @change="handleInputTypeChange(index)"
                >
                  <a-option
                    v-for="type in judgeTypeOptions"
                    :key="type.value"
                    :value="type.value"
                  >
                    {{ type.text }}
                  </a-option>
                </a-select>
                <div class="parameter-actions">
                  <button
                    class="icon-action"
                    type="button"
                    title="上移参数"
                    :disabled="index === 0"
                    @click="moveParameter(index, -1)"
                  >
                    <IconUp />
                  </button>
                  <button
                    class="icon-action"
                    type="button"
                    title="下移参数"
                    :disabled="
                      index === form.judgeCase.inputDefinitions.length - 1
                    "
                    @click="moveParameter(index, 1)"
                  >
                    <IconDown />
                  </button>
                  <button
                    class="icon-action danger"
                    type="button"
                    title="删除参数"
                    @click="handleDeleteParameter(index)"
                  >
                    <IconDelete />
                  </button>
                </div>
              </div>
              <p
                v-if="!form.judgeCase.inputDefinitions.length"
                class="definition-empty"
              >
                暂无输入参数
              </p>
            </section>

            <section class="definition-panel output-definition">
              <header class="definition-header">
                <div>
                  <h4>输出类型</h4>
                  <p>所有测试用例共用同一种输出类型</p>
                </div>
              </header>
              <a-select
                v-model="form.judgeCase.outputDefinition.type"
                placeholder="选择输出类型"
                @change="handleOutputTypeChange"
              >
                <a-option
                  v-for="type in judgeTypeOptions"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.text }}
                </a-option>
              </a-select>
            </section>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">测试用例</h3>
          <div
            v-for="(judgeCaseItem, index) of form.judgeCase.cases"
            :key="judgeCaseItem.key"
            class="test-case-card"
          >
            <div class="test-case-header">
              <span class="test-case-label">用例 {{ index + 1 }}</span>
              <button
                class="delete-btn"
                type="button"
                @click="handleDeleteCase(index)"
              >
                删除
              </button>
            </div>
            <div class="case-values">
              <section
                v-for="(parameter, inputIndex) in form.judgeCase
                  .inputDefinitions"
                :key="parameter.key"
                class="case-value-block"
              >
                <header class="case-value-heading">
                  <strong>{{
                    parameter.name || `参数 ${inputIndex + 1}`
                  }}</strong>
                  <span>{{ getJudgeTypeText(parameter.type) }}</span>
                </header>
                <JudgeValueEditor
                  v-model="judgeCaseItem.inputs[inputIndex]"
                  :type="parameter.type"
                  :types="judgeTypeOptions"
                />
              </section>
              <section class="case-value-block expected-output">
                <header class="case-value-heading">
                  <strong>预期输出</strong>
                  <span>{{
                    getJudgeTypeText(form.judgeCase.outputDefinition.type)
                  }}</span>
                </header>
                <JudgeValueEditor
                  v-model="judgeCaseItem.expectedOutput"
                  :type="form.judgeCase.outputDefinition.type"
                  :types="judgeTypeOptions"
                />
              </section>
            </div>
          </div>
          <button class="add-case-btn" type="button" @click="handleAddCase">
            + 新增测试用例
          </button>
        </div>

        <div class="form-section">
          <div class="starter-section-header">
            <h3 class="section-title">初始代码模板</h3>
            <button
              v-if="
                updatePage && languageOptions.length && !starterCodeLoadError
              "
              class="sync-template-btn"
              type="button"
              :disabled="starterCodeLoading"
              @click="syncStarterCodesToJudgeCase"
            >
              <IconRefresh />
              按参数同步模板
            </button>
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
              @click="syncStarterCodesToJudgeCase"
            >
              按参数同步模板
            </button>
          </div>

          <Transition name="starter-workspace">
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
          </Transition>
        </div>

        <div class="form-footer">
          <button
            class="claude-btn-primary"
            type="button"
            :disabled="
              starterCodeLoading ||
              languageLoading ||
              judgeTypeLoading ||
              !judgeTypeOptions.length
            "
            @click="doSubmit"
          >
            {{ updatePage ? "更新" : "提交" }}
          </button>
        </div>
      </a-form>
    </div>
  </div>
  <ConfirmDialog
    v-model:visible="showCreateLeaveDialog"
    :title="updatePage ? '离开更新页面' : '离开创建页面'"
    :message="
      updatePage
        ? '离开后，当前尚未提交的题目修改将不会保留。'
        : '离开后，当前尚未提交的题目内容将会丢失。'
    "
    :confirm-text="updatePage ? '离开页面' : '放弃内容'"
    tone="danger"
    @confirm="confirmCreateLeave"
  />
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import {
  IconDelete,
  IconDown,
  IconPlus,
  IconRefresh,
  IconUp,
} from "@arco-design/web-vue/es/icon";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import CodeEditor from "@/components/editor/CodeEditor.vue";
import MdEditor from "@/components/editor/MdEditor.vue";
import JudgeValueEditor from "@/components/question/JudgeValueEditor.vue";
import { ApiId, parseRouteApiId, toGeneratedApiId } from "@/services/apiId";
import {
  buildJudgeCaseConfig,
  createDefaultJudgeCaseConfig,
  createDefaultJudgeValue,
  createJudgeCaseConfigDraft,
  createJudgeCaseDraft,
  createJudgeParameterDraft,
  getJudgeTypeOption,
  getSupportedJudgeTypeOptions,
  JudgeCaseConfigDraft,
  JudgeTypeOption,
  validateJudgeCaseConfig,
} from "@/services/questionJudgeCase";
import {
  buildStarterCodeList,
  clearQuestionStarterCodeCache,
  getQuestionStarterCodeMap,
  getSupportedLanguageOptions,
  LanguageOption,
  StarterCodeMap,
  StarterCodeServiceError,
} from "@/services/questionStarterCode";
import { normalizeJudgeConfig } from "@/services/questionJudgeConfig";
import { clearQuestionDraftsForQuestion } from "@/services/questionDraft";
import { JudgeConfig, QuestionControllerService } from "../../../generated";

interface QuestionForm {
  id?: ApiId;
  title: string;
  tags: string[];
  answer: string;
  content: string;
  judgeConfig: JudgeConfig;
  judgeCase: JudgeCaseConfigDraft;
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
  judgeCase: {
    inputDefinitions: [],
    outputDefinition: { type: "" },
    cases: [],
  },
});

const route = useRoute();
const router = useRouter();
const updatePage = route.path.includes("update");
const form = ref<QuestionForm>(createDefaultForm());
const judgeTypeOptions = ref<JudgeTypeOption[]>([]);
const judgeTypeLoading = ref(false);
const languageOptions = ref<LanguageOption[]>([]);
const languageLoading = ref(false);
const starterCodeLoading = ref(false);
const starterCodeEnabled = ref(false);
const starterCodeDirty = ref(false);
const starterCodeLoadError = ref("");
const starterCodes = ref<StarterCodeMap>({});
const activeStarterLanguage = ref("");
const initialCreateFormSnapshot = ref("");
const showCreateLeaveDialog = ref(false);
const pendingCreateLeavePath = ref("");
let allowCreateLeave = false;

const getCreateFormSnapshot = () =>
  JSON.stringify({
    form: form.value,
    starterCodeEnabled: starterCodeEnabled.value,
    starterCodes: starterCodeEnabled.value ? starterCodes.value : {},
  });

const isCreateFormDirty = computed(
  () =>
    !updatePage &&
    initialCreateFormSnapshot.value !== "" &&
    initialCreateFormSnapshot.value !== getCreateFormSnapshot()
);

const loadJudgeTypeOptions = async () => {
  judgeTypeLoading.value = true;
  try {
    judgeTypeOptions.value = await getSupportedJudgeTypeOptions();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "加载判题类型失败");
  } finally {
    judgeTypeLoading.value = false;
  }
};

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
      tags: res.data.tags ?? defaults.tags,
      judgeCase: createJudgeCaseConfigDraft(
        res.data.judgeCase,
        judgeTypeOptions.value
      ),
      judgeConfig: normalizeJudgeConfig(
        res.data.judgeConfig,
        defaults.judgeConfig
      ),
    };
    await loadStarterCodes(id);
  } else {
    message.error("加载失败，" + res.message);
  }
};

// 更新页面离开前总是确认；创建页面只在填了内容时确认
onBeforeRouteLeave((to) => {
  if (allowCreateLeave || (!updatePage && !isCreateFormDirty.value)) {
    return true;
  }
  pendingCreateLeavePath.value = to.fullPath;
  showCreateLeaveDialog.value = true;
  return false;
});

const confirmCreateLeave = () => {
  if (!pendingCreateLeavePath.value) return;
  const path = pendingCreateLeavePath.value;
  pendingCreateLeavePath.value = "";
  showCreateLeaveDialog.value = false;
  allowCreateLeave = true;
  void router.push(path);
};

onMounted(async () => {
  await Promise.all([loadLanguageOptions(), loadJudgeTypeOptions()]);
  if (updatePage) {
    await loadData();
  } else if (judgeTypeOptions.value.length) {
    form.value.judgeCase = createDefaultJudgeCaseConfig(judgeTypeOptions.value);
  }
  if (!updatePage) {
    initialCreateFormSnapshot.value = getCreateFormSnapshot();
  }
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

const syncStarterCodesToJudgeCase = () => {
  if (!updatePage || !languageOptions.value.length) return;
  starterCodes.value = createEmptyStarterCodeMap();
  starterCodeEnabled.value = true;
  starterCodeDirty.value = true;
  starterCodeLoadError.value = "";
  message.info("已清空模板，提交更新后将按当前参数重新生成");
};

const doSubmit = async () => {
  const judgeCaseError = validateJudgeCaseConfig(
    form.value.judgeCase,
    judgeTypeOptions.value
  );
  if (judgeCaseError) {
    message.warning(judgeCaseError);
    return;
  }

  const starterCodeList =
    starterCodeEnabled.value && (!updatePage || starterCodeDirty.value)
      ? buildStarterCodeList(starterCodes.value, languageOptions.value)
      : undefined;
  const requestBody = {
    title: form.value.title,
    tags: form.value.tags,
    answer: form.value.answer,
    content: form.value.content,
    judgeConfig: form.value.judgeConfig,
    judgeCase: buildJudgeCaseConfig(form.value.judgeCase),
    starterCodeList,
  };

  if (updatePage) {
    const res = await QuestionControllerService.editQuestion({
      ...requestBody,
      id: form.value.id == null ? undefined : toGeneratedApiId(form.value.id),
    });
    if (res.code === 0) {
      if (form.value.id != null) {
        clearQuestionStarterCodeCache(form.value.id);
        clearQuestionDraftsForQuestion(form.value.id);
      }
      allowCreateLeave = true;
      message.success("更新成功");
      router.push(
        route.query.from === "my" ? "/my/question" : "/manage/question"
      );
    } else message.error("更新失败，" + res.message);
  } else {
    const res = await QuestionControllerService.addQuestion(requestBody);
    if (res.code === 0) {
      if (res.data != null) {
        clearQuestionStarterCodeCache(res.data);
        clearQuestionDraftsForQuestion(res.data);
      }
      allowCreateLeave = true;
      message.success("创建成功");
      router.push("/questions");
    } else message.error("创建失败，" + res.message);
  }
};

const getJudgeTypeText = (type: string) =>
  getJudgeTypeOption(type, judgeTypeOptions.value)?.text || type || "未选择";

const handleAddParameter = () => {
  const type = judgeTypeOptions.value[0]?.value;
  if (!type) return;
  const index = form.value.judgeCase.inputDefinitions.length;
  form.value.judgeCase.inputDefinitions.push(
    createJudgeParameterDraft(`arg${index + 1}`, type)
  );
  form.value.judgeCase.cases.forEach((judgeCase) => {
    judgeCase.inputs.push(
      createDefaultJudgeValue(type, judgeTypeOptions.value)
    );
  });
};

const handleDeleteParameter = (index: number) => {
  form.value.judgeCase.inputDefinitions.splice(index, 1);
  form.value.judgeCase.cases.forEach((judgeCase) => {
    judgeCase.inputs.splice(index, 1);
  });
};

const moveParameter = (index: number, offset: -1 | 1) => {
  const targetIndex = index + offset;
  if (
    targetIndex < 0 ||
    targetIndex >= form.value.judgeCase.inputDefinitions.length
  ) {
    return;
  }
  const definitions = form.value.judgeCase.inputDefinitions;
  [definitions[index], definitions[targetIndex]] = [
    definitions[targetIndex],
    definitions[index],
  ];
  form.value.judgeCase.cases.forEach((judgeCase) => {
    [judgeCase.inputs[index], judgeCase.inputs[targetIndex]] = [
      judgeCase.inputs[targetIndex],
      judgeCase.inputs[index],
    ];
  });
};

const handleInputTypeChange = (index: number) => {
  const type = form.value.judgeCase.inputDefinitions[index]?.type;
  if (!type) return;
  form.value.judgeCase.cases.forEach((judgeCase) => {
    judgeCase.inputs[index] = createDefaultJudgeValue(
      type,
      judgeTypeOptions.value
    );
  });
};

const handleOutputTypeChange = () => {
  const type = form.value.judgeCase.outputDefinition.type;
  form.value.judgeCase.cases.forEach((judgeCase) => {
    judgeCase.expectedOutput = createDefaultJudgeValue(
      type,
      judgeTypeOptions.value
    );
  });
};

const handleAddCase = () => {
  form.value.judgeCase.cases.push(
    createJudgeCaseDraft(form.value.judgeCase, judgeTypeOptions.value)
  );
};

const handleDeleteCase = (index: number) => {
  form.value.judgeCase.cases.splice(index, 1);
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
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.form-wrapper {
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
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
  letter-spacing: 0.08em;
}

.page-title {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 2px 0 0;
}

.form-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--hairline);
}

.section-title::before {
  content: "";
  width: 22px;
  height: 2px;
  flex: 0 0 auto;
  background: var(--primary);
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

.arco-input-tag {
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  width: 100% !important;
  min-width: 0 !important;
}

.arco-input-tag input {
  width: auto !important;
  min-width: 120px !important;
  flex: 1 1 120px !important;
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

.definition-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: var(--space-md);
}

.definition-panel {
  min-width: 0;
  padding: var(--space-md);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
}

.definition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: 14px;
}

.definition-header h4 {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}

.definition-header p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 11px;
}

.definition-command {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 11px;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
}

.definition-command:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.parameter-row {
  display: grid;
  grid-template-columns: 24px minmax(110px, 0.8fr) minmax(170px, 1.2fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid var(--hairline-soft);
}

.parameter-index {
  color: var(--muted-soft);
  font-family: var(--font-code);
  font-size: 11px;
  text-align: center;
}

.parameter-actions {
  display: flex;
  gap: 4px;
}

.icon-action {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.icon-action:hover:not(:disabled) {
  color: var(--ink);
  background: var(--surface-soft);
  border-color: var(--hairline);
}

.icon-action.danger:hover:not(:disabled) {
  color: var(--error);
  background: rgba(198, 69, 69, 0.08);
  border-color: rgba(198, 69, 69, 0.24);
}

.icon-action:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.definition-empty {
  margin: 0;
  padding: 18px;
  color: var(--muted-soft);
  border-top: 1px solid var(--hairline-soft);
  font-size: 12px;
  text-align: center;
}

.output-definition :deep(.arco-select-view) {
  width: 100%;
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

.case-values {
  display: grid;
  gap: 18px;
}

.case-value-block {
  min-width: 0;
  padding-top: 14px;
  border-top: 1px solid var(--hairline-soft);
}

.case-value-heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.case-value-heading strong {
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
}

.case-value-heading span {
  color: var(--muted);
  font-size: 10px;
}

.expected-output {
  padding: 14px;
  background: var(--surface-soft);
  border-top: 2px solid var(--primary);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
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
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
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
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
}

.delete-btn:active,
.add-case-btn:active {
  transform: translateY(1px);
}

.starter-workspace-enter-active,
.starter-workspace-leave-active {
  transition: opacity 180ms ease, transform 180ms var(--ease-out);
}

.starter-workspace-enter-from,
.starter-workspace-leave-to {
  opacity: 0;
  transform: translateY(4px);
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

.sync-template-btn {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
}

.sync-template-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.sync-template-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.sync-template-btn:active {
  transform: translateY(1px);
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
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
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
  transition: background-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
}

.repair-template-btn:active,
.claude-btn-primary:not(:disabled):active {
  transform: translateY(1px);
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
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 20px 16px 32px;
  }

  .form-wrapper {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 20px 16px;
    border-radius: var(--radius-md);
  }

  .page-heading {
    margin-bottom: 20px;
    padding-bottom: 18px;
  }

  .page-title {
    font-size: 32px;
  }

  .form-section {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin-bottom: 30px;
  }

  .section-title {
    font-size: 17px;
  }

  :deep(.arco-row) {
    display: block;
    margin-right: 0 !important;
    margin-left: 0 !important;
  }

  :deep(.arco-col-8),
  :deep(.arco-col-12) {
    width: 100%;
    max-width: 100%;
    display: block;
    flex: 0 0 100%;
    padding-right: 0 !important;
    padding-left: 0 !important;
  }

  :deep(.arco-form-item) {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  :deep(.arco-form-item-label-col),
  :deep(.arco-form-item-wrapper-col) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    display: block;
    flex: 0 0 100%;
    margin-left: 0 !important;
    padding-left: 0 !important;
  }

  :deep(.arco-form-item-label) {
    width: 100% !important;
    padding: 0 0 6px !important;
    text-align: left !important;
  }

  :deep(.arco-form-item-content) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .form-section :deep(.bytemd) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: 320px !important;
    min-height: 280px !important;
    overflow: hidden;
  }

  .form-section :deep(.bytemd-preview) {
    display: none;
  }

  .form-section :deep(.bytemd-editor) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    border-right: 0 !important;
  }

  .form-section :deep(.bytemd-toolbar) {
    display: flex;
    width: 100%;
    max-width: 100%;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
  }

  .form-section :deep(.bytemd-toolbar-left),
  .form-section :deep(.bytemd-toolbar-right) {
    float: none;
    flex: 0 0 auto;
  }

  .form-section :deep(.bytemd-body),
  .form-section :deep(.CodeMirror) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }

  .form-section :deep(.bytemd-status) {
    display: flex;
    width: 100%;
    max-width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
  }

  .form-section :deep(.bytemd-status-left),
  .form-section :deep(.bytemd-status-right) {
    float: none;
    flex: 0 0 auto;
  }

  .test-case-card {
    padding: 14px;
  }

  .definition-layout {
    grid-template-columns: 1fr;
  }

  .definition-header {
    align-items: flex-start;
  }

  .parameter-row {
    grid-template-columns: 22px minmax(0, 1fr) auto;
  }

  .parameter-row > :deep(.arco-select) {
    grid-column: 2 / -1;
  }

  .parameter-actions {
    grid-column: 3;
    grid-row: 1;
  }

  .case-value-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .starter-section-header {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .sync-template-btn {
    justify-content: center;
    width: 100%;
  }

  .starter-toggle {
    justify-content: space-between;
  }

  .starter-code-alert {
    align-items: stretch;
    flex-direction: column;
  }

  .repair-template-btn {
    width: 100%;
  }

  .starter-code-editor :deep(#code-editor) {
    height: 320px !important;
    min-height: 280px !important;
  }

  .form-footer {
    padding-top: 18px;
  }

  .claude-btn-primary {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .starter-workspace-enter-active,
  .starter-workspace-leave-active {
    transition-duration: 120ms;
  }

  .starter-workspace-enter-from,
  .starter-workspace-leave-to {
    transform: none;
  }
}
</style>
