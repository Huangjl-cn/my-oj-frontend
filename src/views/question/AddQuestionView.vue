<template>
  <div class="page question-editor">
    <section class="panel page-head editor-head">
      <h1>{{ updatePage ? "编辑题目" : "创建题目" }}</h1>
      <nav class="section-nav" aria-label="跳到">
        <button
          v-for="section in SECTIONS"
          :key="section.id"
          type="button"
          @click="scrollToSection(section.id)"
        >
          {{ section.label }}
        </button>
      </nav>
      <div class="head-end">
        <button
          class="btn primary sm"
          type="button"
          :disabled="
            saving ||
            starterCodeLoading ||
            languageLoading ||
            judgeTypeLoading ||
            !judgeTypeOptions.length
          "
          @click="doSubmit"
        >
          <AppIcon :name="saving ? 'spinner' : 'check'" :size="16" />
          {{ updatePage ? "保存修改" : "发布题目" }}
        </button>
      </div>
    </section>

    <!-- ===== 基本信息 ===== -->
    <section id="section-basic" class="panel form-panel">
      <h2>基本信息</h2>
      <p class="form-hint">标题、难度和知识点会显示在题库列表里。</p>
      <div class="basic-grid">
        <label class="field title-field">
          <span class="field-label">标题</span>
          <UiInput v-model="form.title" placeholder="比如：两数之和" />
        </label>
        <div class="field">
          <span class="field-label">难度</span>
          <UiSegmented
            :model-value="difficulty"
            :options="DIFFICULTY_OPTIONS"
            label="难度"
            @update:model-value="setDifficulty"
          />
        </div>
        <label class="field topics-field">
          <span class="field-label">知识点</span>
          <UiTagInput
            v-model="topicTags"
            placeholder="输入后回车，比如：数组、哈希表"
          />
        </label>
      </div>
    </section>

    <!-- ===== 题面 ===== -->
    <section id="section-content" class="panel form-panel">
      <header class="section-head">
        <div>
          <h2>题面</h2>
          <p class="form-hint">支持 Markdown</p>
        </div>
        <UiSegmented
          v-model="contentTab"
          :options="CONTENT_TABS"
          label="编辑哪一部分"
        />
      </header>
      <div class="md-area">
        <MdEditor
          v-if="contentTab === 'content'"
          key="content"
          :value="form.content"
          :handle-change="onContentChange"
        />
        <MdEditor
          v-else
          key="answer"
          :value="form.answer"
          :handle-change="onAnswerChange"
        />
      </div>
    </section>

    <!-- ===== 判题 ===== -->
    <section id="section-judge" class="panel form-panel">
      <h2>判题</h2>
      <p class="form-hint">运行限制、参数和输出</p>

      <div class="limits">
        <label class="field">
          <span class="field-label">时间限制</span>
          <UiNumberInput
            v-model="form.judgeConfig.timeLimit"
            :min="0"
            integer
            unit="ms"
          />
        </label>
        <label class="field">
          <span class="field-label">内存限制</span>
          <UiNumberInput
            v-model="form.judgeConfig.memoryLimit"
            :min="0"
            integer
            unit="KB"
          />
        </label>
        <label class="field">
          <span class="field-label">栈限制</span>
          <UiNumberInput
            v-model="form.judgeConfig.stackLimit"
            :min="0"
            integer
            unit="KB"
          />
        </label>
      </div>

      <div class="io-grid">
        <div class="io-block">
          <header class="io-head">
            <h3>输入参数</h3>
            <span class="field-hint">用例里的输入按这个顺序</span>
            <button
              class="btn sm add-btn"
              type="button"
              :disabled="!judgeTypeOptions.length"
              @click="handleAddParameter"
            >
              <AppIcon name="plus" :size="15" />
              加一个
            </button>
          </header>
          <div
            v-for="(parameter, index) in form.judgeCase.inputDefinitions"
            :key="parameter.key"
            class="parameter-row"
          >
            <span class="parameter-index num">{{ index + 1 }}</span>
            <UiInput v-model="parameter.name" placeholder="参数名" />
            <UiSelect
              :model-value="parameter.type"
              :options="judgeTypeSelectOptions"
              aria-label="参数类型"
              @update:model-value="setInputType(index, $event)"
            />
            <span class="row-actions">
              <button
                class="icon-btn"
                type="button"
                aria-label="上移"
                title="上移"
                :disabled="index === 0"
                @click="moveParameter(index, -1)"
              >
                <AppIcon name="arrow-up" :size="15" />
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label="下移"
                title="下移"
                :disabled="index === form.judgeCase.inputDefinitions.length - 1"
                @click="moveParameter(index, 1)"
              >
                <AppIcon name="arrow-up" :size="15" class="flip" />
              </button>
              <button
                class="icon-btn danger"
                type="button"
                aria-label="删除参数"
                title="删除"
                @click="handleDeleteParameter(index)"
              >
                <AppIcon name="trash" :size="15" />
              </button>
            </span>
          </div>
          <p v-if="!form.judgeCase.inputDefinitions.length" class="empty-hint">
            还没有输入参数
          </p>
        </div>

        <div class="io-block">
          <header class="io-head">
            <h3>输出类型</h3>
            <span class="field-hint">所有用例共用</span>
          </header>
          <UiSelect
            :model-value="form.judgeCase.outputDefinition.type"
            :options="judgeTypeSelectOptions"
            placeholder="选择输出类型"
            aria-label="输出类型"
            @update:model-value="setOutputType"
          />
        </div>
      </div>
    </section>

    <!-- ===== 测试用例 ===== -->
    <section id="section-cases" class="panel form-panel">
      <header class="section-head">
        <div>
          <h2>
            测试用例
            <span class="count num">{{ form.judgeCase.cases.length }}</span>
          </h2>
          <p class="form-hint">每个用例填好全部输入和预期输出。</p>
        </div>
        <button class="btn sm" type="button" @click="handleAddCase">
          <AppIcon name="plus" :size="15" />
          加一个用例
        </button>
      </header>

      <div class="cases">
        <article
          v-for="(judgeCaseItem, index) of form.judgeCase.cases"
          :key="judgeCaseItem.key"
          class="case-card"
        >
          <header class="case-head">
            <strong class="num">用例 {{ index + 1 }}</strong>
            <button
              class="icon-btn danger"
              type="button"
              aria-label="删除用例"
              title="删除用例"
              @click="handleDeleteCase(index)"
            >
              <AppIcon name="trash" :size="15" />
            </button>
          </header>
          <div class="case-values">
            <section
              v-for="(parameter, inputIndex) in form.judgeCase.inputDefinitions"
              :key="parameter.key"
              class="case-value"
            >
              <span class="case-label">
                <b>{{ parameter.name || `参数 ${inputIndex + 1}` }}</b>
                {{ getJudgeTypeText(parameter.type) }}
              </span>
              <JudgeValueEditor
                v-model="judgeCaseItem.inputs[inputIndex]"
                :type="parameter.type"
                :types="judgeTypeOptions"
              />
            </section>
            <section class="case-value expected">
              <span class="case-label">
                <b>预期输出</b>
                {{ getJudgeTypeText(form.judgeCase.outputDefinition.type) }}
              </span>
              <JudgeValueEditor
                v-model="judgeCaseItem.expectedOutput"
                :type="form.judgeCase.outputDefinition.type"
                :types="judgeTypeOptions"
              />
            </section>
          </div>
        </article>
        <p v-if="!form.judgeCase.cases.length" class="empty-hint">
          还没有测试用例
        </p>
      </div>
    </section>

    <!-- ===== 初始代码 ===== -->
    <section id="section-starter" class="panel form-panel">
      <header class="section-head">
        <div>
          <h2>初始代码</h2>
          <p class="form-hint">
            {{ updatePage ? "编辑器里的初始代码" : "不填就按参数自动生成" }}
          </p>
        </div>
        <button
          v-if="updatePage && languageOptions.length && !starterCodeLoadError"
          class="btn sm"
          type="button"
          :disabled="starterCodeLoading"
          @click="syncStarterCodesToJudgeCase"
        >
          <AppIcon name="refresh" :size="15" />
          按参数重新生成
        </button>
        <label v-if="!updatePage" class="switch-label">
          自定义
          <UiSwitch v-model="starterCodeEnabled" label="自定义初始代码" />
        </label>
      </header>

      <div v-if="starterCodeLoadError" class="starter-alert">
        <span> <b>模板有问题：</b>{{ starterCodeLoadError }} </span>
        <button
          v-if="updatePage && languageOptions.length"
          class="btn sm"
          type="button"
          @click="syncStarterCodesToJudgeCase"
        >
          按参数重新生成
        </button>
      </div>

      <div
        v-if="starterCodeEnabled && languageOptions.length"
        class="starter-workspace"
      >
        <div class="language-tabs" role="tablist" aria-label="语言">
          <button
            v-for="language in languageOptions"
            :key="language.value"
            :class="{ on: activeStarterLanguage === language.value }"
            type="button"
            role="tab"
            :aria-selected="activeStarterLanguage === language.value"
            @click="activeStarterLanguage = language.value"
          >
            {{ language.text }}
          </button>
        </div>
        <div class="starter-editor">
          <CodeEditor
            :value="starterCodes[activeStarterLanguage] || ''"
            :language="activeStarterLanguage"
            :handle-change="onStarterCodeChange"
          />
        </div>
      </div>
    </section>

    <ConfirmDialog
      v-model:visible="showCreateLeaveDialog"
      :title="updatePage ? '不保存就离开？' : '放弃这道题？'"
      :message="
        updatePage ? '还没保存的修改会丢掉。' : '已经填写的内容会丢掉。'
      "
      :confirm-text="updatePage ? '离开' : '放弃'"
      tone="danger"
      @confirm="confirmCreateLeave"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import CodeEditor from "@/components/editor/CodeEditor.vue";
import MdEditor from "@/components/editor/MdEditor.vue";
import JudgeValueEditor from "@/components/question/JudgeValueEditor.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiNumberInput from "@/components/ui/UiNumberInput.vue";
import UiSegmented from "@/components/ui/UiSegmented.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";
import UiTagInput from "@/components/ui/UiTagInput.vue";
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
import {
  Difficulty,
  DIFFICULTY_LABELS,
  difficultyOfTag,
  getDifficulty,
} from "@/utils/difficulty";
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
const saving = ref(false);

// ===== 页面上方的分区导航 =====
const SECTIONS = [
  { id: "section-basic", label: "基本信息" },
  { id: "section-content", label: "题面" },
  { id: "section-judge", label: "判题" },
  { id: "section-cases", label: "测试用例" },
  { id: "section-starter", label: "初始代码" },
];
const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// ===== 难度和知识点：都存在 tags 里，难度单独用一组按钮选 =====
const DIFFICULTY_OPTIONS = [
  { value: "", label: "不标" },
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];
const difficulty = computed(() => getDifficulty(form.value.tags) ?? "");
const setDifficulty = (value: string) => {
  const topics = form.value.tags.filter((tag) => !difficultyOfTag(tag));
  form.value.tags = value
    ? [DIFFICULTY_LABELS[value as Difficulty], ...topics]
    : topics;
};
const topicTags = computed({
  get: () => form.value.tags.filter((tag) => !difficultyOfTag(tag)),
  set: (tags: string[]) => {
    const difficultyTag = form.value.tags.find((tag) => difficultyOfTag(tag));
    form.value.tags = [
      ...(difficultyTag ? [difficultyTag] : []),
      ...tags.filter((tag) => !difficultyOfTag(tag)),
    ];
  },
});

// 题目描述和参考题解共用一个编辑区，用两个按钮切换
const contentTab = ref("content");
const CONTENT_TABS = [
  { value: "content", label: "题目描述" },
  { value: "answer", label: "参考题解" },
];

const judgeTypeSelectOptions = computed(() =>
  judgeTypeOptions.value.map(({ value, text }) => ({ value, label: text }))
);

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
  if (saving.value) return;
  if (!form.value.title.trim()) {
    message.warning("先给题目起个标题");
    scrollToSection("section-basic");
    return;
  }
  const judgeCaseError = validateJudgeCaseConfig(
    form.value.judgeCase,
    judgeTypeOptions.value
  );
  if (judgeCaseError) {
    message.warning(judgeCaseError);
    return;
  }
  saving.value = true;
  try {
    await submitQuestion();
  } finally {
    saving.value = false;
  }
};

const submitQuestion = async () => {
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
      message.success("已保存");
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
      message.success("题目已发布");
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

const setInputType = (index: number, type: string) => {
  const parameter = form.value.judgeCase.inputDefinitions[index];
  if (!parameter || parameter.type === type) return;
  parameter.type = type;
  handleInputTypeChange(index);
};

const setOutputType = (type: string) => {
  if (form.value.judgeCase.outputDefinition.type === type) return;
  form.value.judgeCase.outputDefinition.type = type;
  handleOutputTypeChange();
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
div.page.question-editor {
  grid-template-rows: none;
  padding-bottom: 20px;
}

/* 标题栏滚动时贴在顶部，随时能保存 */
.editor-head {
  position: sticky;
  top: 12px;
  z-index: 20;
  padding-top: 16px;
  padding-bottom: 16px;
}

.section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.section-nav button {
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 13.5px;
  cursor: pointer;
}

.section-nav button:hover {
  background: var(--fill);
  color: var(--ink);
}

.form-panel {
  scroll-margin-top: 96px;
}

.form-panel h2 .count {
  margin-left: 6px;
  color: var(--faint);
  font-size: 14px;
  font-weight: 500;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
}

.section-head .form-hint {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13.5px;
}

/* ===== 基本信息 ===== */
.basic-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px 20px;
}

.topics-field {
  grid-column: 1 / -1;
}

/* ===== 题面 ===== */
.md-area :deep(.bytemd) {
  height: 520px !important;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-md) !important;
  overflow: hidden;
}

/* ===== 判题 ===== */
.limits {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 220px));
  gap: 14px;
}

.io-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 22px;
}

.io-block {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 14px 14px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg);
}

.io-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
}

.io-head h3 {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.field-hint {
  color: var(--faint);
  font-size: 12.5px;
}

.add-btn {
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.parameter-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.parameter-row :deep(.ui-input),
.parameter-row :deep(.ui-select-trigger),
.io-block :deep(.ui-select-trigger) {
  background: var(--panel);
}

.parameter-index {
  color: var(--faint);
  font-size: 13px;
  text-align: center;
}

.flip {
  transform: rotate(180deg);
}

.empty-hint {
  margin: 0;
  padding: 14px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-md);
  color: var(--faint);
  font-size: 13px;
  text-align: center;
}

/* ===== 测试用例 ===== */
.cases {
  display: grid;
  gap: 12px;
}

.case-card {
  display: grid;
  gap: 12px;
  padding: 14px 16px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg);
}

.case-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.case-head strong {
  color: var(--ink);
  font-size: 14px;
}

.case-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.case-value {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--panel);
}

.case-value.expected {
  box-shadow: inset 0 0 0 1px var(--line-strong);
}

.case-label {
  color: var(--faint);
  font-size: 12.5px;
}

.case-label b {
  margin-right: 6px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
}

/* ===== 初始代码 ===== */
.switch-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--body);
  font-size: 13.5px;
}

.starter-alert {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--warning) 10%, transparent);
  color: var(--body);
  font-size: 13.5px;
}

.starter-workspace {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.language-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid var(--line);
}

.language-tabs button {
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
}

.language-tabs button:hover {
  color: var(--ink);
}

.language-tabs button.on {
  background: var(--fill);
  color: var(--ink);
  font-weight: 600;
}

.starter-editor {
  height: 380px;
}

.starter-editor :deep(#code-editor) {
  width: 100% !important;
  height: 380px !important;
}

@media (max-width: 900px) {
  .editor-head {
    position: static;
  }

  .basic-grid,
  .io-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .limits {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
