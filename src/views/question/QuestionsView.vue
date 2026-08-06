<template>
  <div id="questionsView">
    <div :class="['workspace', { 'sidebar-collapsed': isSidebarCollapsed }]">
      <!-- ===== Sidebar ===== -->
      <aside id="question-sidebar" class="sidebar">
        <div class="sidebar-header">
          <h2>题库</h2>
          <span class="problem-count">{{ total }} 题</span>
        </div>
        <div class="sidebar-search">
          <input
            class="search-input"
            v-model="searchParams.title"
            placeholder="搜索题目..."
            @input="onSearchInput"
          />
        </div>
        <div class="filter-bar">
          <span
            :class="['filter-chip', { active: activeFilter === 'all' }]"
            @click="onFilterChange('all')"
            >全部</span
          >
          <span
            :class="['filter-chip', { active: activeFilter === 'easy' }]"
            @click="onFilterChange('easy')"
            >简单</span
          >
          <span
            :class="['filter-chip', { active: activeFilter === 'medium' }]"
            @click="onFilterChange('medium')"
            >中等</span
          >
          <span
            :class="['filter-chip', { active: activeFilter === 'hard' }]"
            @click="onFilterChange('hard')"
            >困难</span
          >
        </div>
        <div class="problem-list">
          <div
            v-for="item in dataList"
            :key="item.id"
            :class="['problem-item', { active: selectedId === item.id }]"
            @click="onSelectQuestion(item)"
          >
            <span class="problem-status pending"></span>
            <div class="problem-info">
              <div class="problem-name">{{ item.title }}</div>
              <div class="problem-meta">
                <span
                  v-for="(tag, i) in typeof item.tags === 'string'
                    ? JSON.parse(item.tags || '[]')
                    : item.tags || []"
                  :key="i"
                  :class="['difficulty', getDifficultyClass(tag)]"
                  >{{ tag }}</span
                >
              </div>
            </div>
          </div>
        </div>
        <div class="pagination-bar">
          <a-pagination
            showTotal
            :pageSize="searchParams.pageSize"
            :current="searchParams.current"
            :total="total"
            @change="onPageChange"
          />
        </div>
      </aside>

      <button
        class="sidebar-toggle"
        type="button"
        :class="{ collapsed: isSidebarCollapsed }"
        :aria-label="isSidebarCollapsed ? '展开题库' : '收起题库'"
        :aria-expanded="!isSidebarCollapsed"
        aria-controls="question-sidebar"
        :title="isSidebarCollapsed ? '展开题库' : '收起题库'"
        @click="isSidebarCollapsed = !isSidebarCollapsed"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <!-- ===== Main Content ===== -->
      <main class="main-content">
        <template v-if="currentQuestion">
          <!-- Description -->
          <div class="description-panel">
            <div class="tabs-row">
              <button
                :class="['tab-btn', { active: activeTab === 'question' }]"
                @click="activeTab = 'question'"
              >
                题目
              </button>
              <button
                :class="['tab-btn', { active: activeTab === 'solution' }]"
                :disabled="!canViewSolution"
                @click="openSolution"
              >
                题解
              </button>
              <button
                :class="['tab-btn', { active: activeTab === 'submissions' }]"
                @click="activeTab = 'submissions'"
              >
                我的提交
              </button>
              <button
                v-for="detailTab in mySubmissionDetailTabs"
                :key="detailTab.key"
                :class="[
                  'tab-btn',
                  'detail-tab',
                  { active: activeTab === detailTab.key },
                ]"
                @click="activeTab = detailTab.key"
              >
                <span class="detail-tab-label">{{ detailTab.label }}</span>
                <IconClose
                  class="detail-tab-close"
                  :title="`关闭${detailTab.label}`"
                  @click.stop="closeMySubmissionDetail(detailTab.key)"
                />
              </button>
            </div>
            <div class="question-reading-area">
              <div v-if="activeTab === 'question'">
                <header class="question-heading">
                  <h1 class="problem-title">{{ currentQuestion.title }}</h1>
                  <div class="problem-header">
                    <span
                      class="tag"
                      v-for="(tag, i) of currentQuestion.tags"
                      :key="i"
                      >{{ tag }}</span
                    >
                  </div>
                </header>
                <div class="problem-section problem-content">
                  <MdViewer :value="currentQuestion.content || ''" />
                </div>
                <section class="limits-section" aria-labelledby="limits-title">
                  <h2 id="limits-title" class="section-label">运行限制</h2>
                  <div class="limits-strip">
                    <div class="limit-item">
                      <span class="limit-label">时间</span>
                      <strong class="limit-value">
                        {{ currentQuestion.judgeConfig?.timeLimit ?? 0 }} ms
                      </strong>
                    </div>
                    <div class="limit-item">
                      <span class="limit-label">内存</span>
                      <strong class="limit-value">
                        {{
                          formatJudgeMemory(
                            currentQuestion.judgeConfig?.memoryLimit
                          )
                        }}
                      </strong>
                    </div>
                    <div class="limit-item">
                      <span class="limit-label">堆栈</span>
                      <strong class="limit-value">
                        {{
                          formatJudgeMemory(
                            currentQuestion.judgeConfig?.stackLimit
                          )
                        }}
                      </strong>
                    </div>
                  </div>
                </section>
              </div>
              <div v-else-if="activeTab === 'solution'">
                <div v-if="questionSolution" class="problem-section">
                  <MdViewer :value="questionSolution" />
                </div>
                <div v-else class="empty-hint">
                  {{ canViewSolution ? "题解加载中..." : "请登录后查看题解" }}
                </div>
              </div>
              <section
                v-else-if="activeTab === 'submissions'"
                class="my-submissions"
              >
                <header class="submission-section-header">
                  <div>
                    <h2>我的提交</h2>
                    <p>按提交时间从新到旧排列</p>
                  </div>
                  <button
                    class="icon-action"
                    type="button"
                    title="刷新提交记录"
                    aria-label="刷新提交记录"
                    :disabled="mySubmissionsLoading"
                    @click="loadMySubmissions"
                  >
                    <IconRefresh />
                  </button>
                </header>
                <div v-if="mySubmissionsLoading" class="empty-hint">
                  正在加载提交记录...
                </div>
                <div v-else-if="mySubmissionsError" class="empty-hint error">
                  {{ mySubmissionsError }}
                </div>
                <div v-else-if="!mySubmissions.length" class="empty-hint">
                  暂无提交记录
                </div>
                <div v-else class="submission-list">
                  <button
                    v-for="submission in mySubmissions"
                    :key="submission.id"
                    class="submission-row"
                    type="button"
                    @click="openMySubmissionDetail(submission)"
                  >
                    <span
                      :class="[
                        'submission-result',
                        getSubmissionPresentation(submission).tone,
                      ]"
                    >
                      {{ getSubmissionPresentation(submission).label }}
                    </span>
                    <span class="submission-language">
                      {{ getLanguageText(submission.language) }}
                    </span>
                    <span class="submission-metric">
                      {{ submission.judgeInfo?.time ?? "--" }} ms
                    </span>
                    <span class="submission-metric">
                      {{ formatJudgeMemory(submission.judgeInfo?.memory) }}
                    </span>
                    <time class="submission-time">
                      {{ formatSubmissionTime(submission.createTime) }}
                    </time>
                  </button>
                </div>
                <a-pagination
                  v-if="mySubmissionsTotal > mySubmissionsPageSize"
                  class="submission-pagination"
                  :current="mySubmissionsCurrent"
                  :page-size="mySubmissionsPageSize"
                  :total="mySubmissionsTotal"
                  @change="onMySubmissionsPageChange"
                />
              </section>
              <section v-else class="submission-detail">
                <div
                  v-if="activeSubmissionDetailTab?.loading"
                  class="empty-hint"
                >
                  正在加载提交详情...
                </div>
                <div
                  v-else-if="activeSubmissionDetailTab?.error"
                  class="empty-hint error"
                >
                  {{ activeSubmissionDetailTab.error }}
                </div>
                <template v-else-if="activeSubmissionDetailTab?.detail">
                  <header class="submission-detail-header">
                    <div>
                      <span
                        :class="[
                          'submission-result',
                          mySubmissionDetailPresentation.tone,
                        ]"
                      >
                        {{ mySubmissionDetailPresentation.label }}
                      </span>
                      <strong>
                        {{
                          getLanguageText(
                            activeSubmissionDetailTab.detail.language
                          )
                        }}
                      </strong>
                    </div>
                    <time>
                      {{
                        formatSubmissionTime(
                          activeSubmissionDetailTab.detail.createTime
                        )
                      }}
                    </time>
                  </header>
                  <div class="submission-detail-metrics">
                    <div>
                      <span>执行时间</span>
                      <strong>
                        {{
                          activeSubmissionDetailTab.detail.judgeInfo?.time ??
                          "--"
                        }}
                        ms
                      </strong>
                    </div>
                    <div>
                      <span>内存消耗</span>
                      <strong>
                        {{
                          formatJudgeMemory(
                            activeSubmissionDetailTab.detail.judgeInfo?.memory
                          )
                        }}
                      </strong>
                    </div>
                  </div>
                  <div class="submission-detail-block">
                    <h3>提交代码</h3>
                    <pre>{{ activeSubmissionDetailTab.detail.code || "" }}</pre>
                  </div>
                  <div
                    v-if="mySubmissionDetailPresentation.message"
                    class="submission-detail-block"
                  >
                    <h3>判题信息</h3>
                    <div class="submission-diagnostic">
                      <strong>{{ mySubmissionMessageParts.title }}</strong>
                      <pre v-if="mySubmissionMessageParts.details">{{
                        mySubmissionMessageParts.details
                      }}</pre>
                    </div>
                  </div>
                </template>
              </section>
            </div>
          </div>

          <!-- Editor -->
          <div class="editor-panel">
            <div class="editor-toolbar">
              <select
                v-model="form.language"
                class="lang-selector"
                :disabled="languageLoading || starterCodeLoading"
                @change="onLanguageChange"
              >
                <option
                  v-for="language in languageOptions"
                  :key="language.value"
                  :value="language.value"
                >
                  {{ language.text }}
                </option>
              </select>
              <div class="editor-actions">
                <button
                  class="btn-reset-code"
                  type="button"
                  :disabled="!activeTemplate || starterCodeLoading"
                  @click="requestResetStarterCode"
                >
                  初始化代码
                </button>
                <button
                  class="btn-submit"
                  type="button"
                  :disabled="
                    starterCodeLoading || !!starterCodeError || !form.language
                  "
                  @click="doSubmit"
                >
                  提交
                </button>
              </div>
            </div>
            <div class="editor-body">
              <CodeEditor
                :value="form.code as string"
                :language="form.language"
                :handle-change="changeCode"
              />
            </div>
          </div>

          <!-- Results -->
          <div v-if="showResult" :class="['results-panel', resultStatusClass]">
            <div class="results-header">
              <div :class="['results-status', resultStatusClass]">
                <!-- Pending/Submitting -->
                <svg
                  v-if="resultPresentation.tone === 'pending'"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <circle cx="7" cy="4" r="1" fill="currentColor" />
                </svg>
                <!-- Passed -->
                <svg
                  v-else-if="resultPresentation.tone === 'passed'"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M4.5 7L6.5 9L9.5 5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <!-- Failed -->
                <svg
                  v-else
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M5 5l4 4M9 5l-4 4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                {{ resultPresentation.label }}
              </div>
              <div class="result-actions">
                <div class="result-stats">
                  <div class="result-stat">
                    <span class="result-stat-label">执行时间</span>
                    <strong class="result-stat-value">
                      {{
                        submitResult?.judgeInfo?.time != null
                          ? submitResult.judgeInfo.time + " ms"
                          : "--"
                      }}
                    </strong>
                  </div>
                  <div class="result-stat">
                    <span class="result-stat-label">内存消耗</span>
                    <strong class="result-stat-value">
                      {{ formatJudgeMemory(submitResult?.judgeInfo?.memory) }}
                    </strong>
                  </div>
                </div>
                <button
                  v-if="resultPresentation.message"
                  class="result-toggle"
                  type="button"
                  :class="{ collapsed: isResultDetailsCollapsed }"
                  :aria-expanded="!isResultDetailsCollapsed"
                  aria-controls="judge-result-details"
                  :aria-label="
                    isResultDetailsCollapsed ? '展开判题详情' : '收起判题详情'
                  "
                  :title="
                    isResultDetailsCollapsed ? '展开判题详情' : '收起判题详情'
                  "
                  @click="isResultDetailsCollapsed = !isResultDetailsCollapsed"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              v-if="resultPresentation.message"
              id="judge-result-details"
              :class="[
                'result-detail-shell',
                { collapsed: isResultDetailsCollapsed },
              ]"
              :aria-hidden="isResultDetailsCollapsed"
            >
              <div class="result-detail-clip">
                <div class="result-detail-content">
                  <div class="result-message-title">
                    {{ resultMessageParts.title }}
                  </div>
                  <div
                    v-if="resultMessageParts.details"
                    class="result-message-details"
                  >
                    {{ resultMessageParts.details }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <p>选择一个题目开始做题</p>
        </div>
      </main>
    </div>

    <ConfirmDialog
      v-model:visible="showResetDialog"
      title="恢复初始代码"
      :message="`当前 ${currentLanguageText} 草稿将被后端模板覆盖，此操作不可撤销。`"
      confirm-text="恢复初始代码"
      @confirm="confirmResetStarterCode"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { IconClose, IconRefresh } from "@arco-design/web-vue/es/icon";
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useStore } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import MdViewer from "@/components/editor/MdViewer.vue";
import { ApiId, toGeneratedApiId } from "@/services/apiId";
import {
  getQuestionDraft,
  removeQuestionDraft,
  saveQuestionDraft,
} from "@/services/questionDraft";
import {
  getQuestionStarterCode,
  getSupportedLanguageOptions,
  LanguageOption,
  StarterCodeServiceError,
} from "@/services/questionStarterCode";
import {
  formatJudgeMemory,
  getJudgeResultPresentation,
  listMyQuestionSubmissions,
  requestMyQuestionSubmit,
  splitJudgeMessage,
} from "@/services/questionSubmit";
import { createQuestionSubmitPoller } from "@/services/questionSubmitPolling";
import {
  QuestionControllerService,
  QuestionQueryRequest,
  QuestionSubmitAddRequest,
  QuestionSubmitSummaryVO,
  QuestionSubmitVO,
  QuestionVO,
} from "../../../generated";

const CodeEditor = defineAsyncComponent(
  () => import("@/components/editor/CodeEditor.vue")
);

type PageChange = number | { current?: number };
type QuestionTab =
  | "question"
  | "solution"
  | "submissions"
  | `submission-detail:${string}`;

type SubmissionDetailTab = {
  key: `submission-detail:${string}`;
  id: ApiId;
  label: string;
  detail: QuestionSubmitVO | null;
  loading: boolean;
  error: string;
};

const store = useStore();

// ===== Sidebar =====
const isSidebarCollapsed = ref(false);
const selectedId = ref<ApiId | null>(null);
const activeFilter = ref("all");
const dataList = ref<QuestionVO[]>([]);
const total = ref(0);
const searchParams = ref<QuestionQueryRequest>({
  title: "",
  tags: [],
  pageSize: 8,
  current: 1,
});

const loadData = async () => {
  const res = await QuestionControllerService.listQuestionVoByPage(
    searchParams.value
  );
  if (res.code === 0) {
    dataList.value = res.data.records ?? [];
    total.value = res.data.total ?? 0;
  } else {
    message.error("加载失败，" + res.message);
  }
};

watch(
  searchParams,
  () => {
    loadData();
  },
  { deep: true }
);
onMounted(async () => {
  await Promise.all([loadData(), loadLanguageOptions()]);
});

const onFilterChange = (filter: string) => {
  activeFilter.value = filter;
  searchParams.value = {
    ...searchParams.value,
    tags: filter === "all" ? [] : [filter],
    current: 1,
  };
};

const onPageChange = (page: PageChange) => {
  const current = typeof page === "number" ? page : page.current;
  if (current == null) return;
  searchParams.value = { ...searchParams.value, current };
};
const onSearchInput = () => {
  searchParams.value = { ...searchParams.value, current: 1 };
};

const getDifficultyClass = (tag: string) => {
  const l = tag.toLowerCase();
  if (l === "easy" || l === "简单") return "easy";
  if (l === "medium" || l === "中等") return "medium";
  if (l === "hard" || l === "困难") return "hard";
  return "easy";
};

// ===== Question & Editor =====
const currentQuestion = ref<QuestionVO | null>(null);
const activeTab = ref<QuestionTab>("question");
const questionSolution = ref("");
const submitResult = ref<QuestionSubmitVO | null>(null);
const showResult = ref(false);
const isResultDetailsCollapsed = ref(false);
const languageOptions = ref<LanguageOption[]>([]);
const languageLoading = ref(false);
const starterCodeLoading = ref(false);
const starterCodeError = ref("");
const activeTemplate = ref("");
const loadedLanguage = ref("");
const showResetDialog = ref(false);
const mySubmissions = ref<QuestionSubmitSummaryVO[]>([]);
const mySubmissionsCurrent = ref(1);
const mySubmissionsPageSize = 10;
const mySubmissionsTotal = ref(0);
const mySubmissionsLoading = ref(false);
const mySubmissionsError = ref("");
const mySubmissionDetailTabs = ref<SubmissionDetailTab[]>([]);
const mySubmissionDetailPollers = new Map<
  string,
  ReturnType<typeof createQuestionSubmitPoller>
>();
const templateCache = new Map<string, string>();
let questionGeneration = 0;
let templateGeneration = 0;
let draftTimer: ReturnType<typeof setTimeout> | undefined;

const currentLanguageText = computed(
  () =>
    languageOptions.value.find(({ value }) => value === loadedLanguage.value)
      ?.text || loadedLanguage.value
);

const canViewSolution = computed(() =>
  checkAccess(store.state.user.loginUser, ACCESS_ENUM.USER)
);

const resultPresentation = computed(() =>
  getJudgeResultPresentation(submitResult.value || undefined)
);
const resultStatusClass = computed(() => resultPresentation.value.tone);
const resultMessageParts = computed(() =>
  splitJudgeMessage(resultPresentation.value.message)
);
const activeSubmissionDetailTab = computed(() =>
  mySubmissionDetailTabs.value.find(({ key }) => key === activeTab.value)
);
const mySubmissionDetailPresentation = computed(() =>
  getJudgeResultPresentation(
    activeSubmissionDetailTab.value?.detail || undefined
  )
);
const mySubmissionMessageParts = computed(() =>
  splitJudgeMessage(mySubmissionDetailPresentation.value.message)
);

const submissionTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const getLanguageText = (language?: string) =>
  languageOptions.value.find(({ value }) => value === language)?.text ||
  language ||
  "--";

const formatSubmissionTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : submissionTimeFormatter.format(date);
};

const getSubmissionPresentation = (submission: QuestionSubmitSummaryVO) =>
  getJudgeResultPresentation(submission);

const loadMySubmissions = async () => {
  const questionId = currentQuestion.value?.id;
  if (questionId == null) return;
  mySubmissionsLoading.value = true;
  mySubmissionsError.value = "";
  try {
    const response = await listMyQuestionSubmissions({
      questionId,
      current: mySubmissionsCurrent.value,
      pageSize: mySubmissionsPageSize,
    });
    if (currentQuestion.value?.id !== questionId) return;
    if (response.code !== 0) {
      throw new Error(response.message || "加载提交记录失败");
    }
    mySubmissions.value = response.data?.records ?? [];
    mySubmissionsTotal.value = Number(response.data?.total ?? 0);
  } catch (error) {
    if (currentQuestion.value?.id !== questionId) return;
    mySubmissions.value = [];
    mySubmissionsTotal.value = 0;
    mySubmissionsError.value =
      error instanceof Error ? error.message : "加载提交记录失败";
  } finally {
    if (currentQuestion.value?.id === questionId) {
      mySubmissionsLoading.value = false;
    }
  }
};

const onMySubmissionsPageChange = (page: PageChange) => {
  const current = typeof page === "number" ? page : page.current;
  if (current == null) return;
  mySubmissionsCurrent.value = current;
  void loadMySubmissions();
};

const polling = createQuestionSubmitPoller({
  onUpdate: (submission) => {
    submitResult.value = submission;
    if (submission.status === 2 || submission.status === 3) {
      isResultDetailsCollapsed.value = false;
      void loadMySubmissions();
    }
  },
  onTimeout: () => {
    message.warning("判题等待超时，请稍后在提交记录中查看结果");
  },
  onError: () => undefined,
});

const updateSubmissionDetailTab = (
  key: string,
  changes: Partial<SubmissionDetailTab>
) => {
  const index = mySubmissionDetailTabs.value.findIndex(
    (tab) => tab.key === key
  );
  if (index === -1) return;
  mySubmissionDetailTabs.value[index] = {
    ...mySubmissionDetailTabs.value[index],
    ...changes,
  };
};

const createSubmissionDetailPoller = (key: string) =>
  createQuestionSubmitPoller({
    request: requestMyQuestionSubmit,
    onUpdate: (submission) => {
      updateSubmissionDetailTab(key, {
        detail: submission,
        loading: false,
        error: "",
      });
      if (submission.status === 2 || submission.status === 3) {
        void loadMySubmissions();
      }
    },
    onTimeout: () => {
      updateSubmissionDetailTab(key, {
        loading: false,
        error: "判题等待超时，请稍后刷新提交记录",
      });
    },
    onError: (error) => {
      updateSubmissionDetailTab(key, {
        loading: false,
        error: error instanceof Error ? error.message : "加载提交详情失败",
      });
    },
  });

const openMySubmissionDetail = (submission: QuestionSubmitSummaryVO) => {
  if (submission.id == null) return;
  const idText = String(submission.id);
  const key = `submission-detail:${idText}` as const;
  const existingTab = mySubmissionDetailTabs.value.find(
    (tab) => tab.key === key
  );
  if (existingTab) {
    activeTab.value = existingTab.key;
    return;
  }

  mySubmissionDetailTabs.value.push({
    key,
    id: submission.id,
    label: `提交 #${idText.slice(-6)}`,
    detail: null,
    loading: true,
    error: "",
  });
  activeTab.value = key;

  const poller = createSubmissionDetailPoller(key);
  mySubmissionDetailPollers.set(key, poller);
  poller.start(submission.id);
};

const closeMySubmissionDetail = (key: string) => {
  mySubmissionDetailPollers.get(key)?.stop();
  mySubmissionDetailPollers.delete(key);
  mySubmissionDetailTabs.value = mySubmissionDetailTabs.value.filter(
    (tab) => tab.key !== key
  );
  if (activeTab.value === key) activeTab.value = "submissions";
};

const clearMySubmissionDetailTabs = () => {
  for (const poller of mySubmissionDetailPollers.values()) poller.stop();
  mySubmissionDetailPollers.clear();
  mySubmissionDetailTabs.value = [];
};

const form = ref<QuestionSubmitAddRequest>({
  language: "",
  code: "",
});

const loadLanguageOptions = async () => {
  if (languageOptions.value.length) return languageOptions.value;
  languageLoading.value = true;
  try {
    languageOptions.value = await getSupportedLanguageOptions();
    if (
      !form.value.language ||
      !languageOptions.value.some(({ value }) => value === form.value.language)
    ) {
      form.value.language = languageOptions.value[0]?.value || "";
    }
    return languageOptions.value;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "加载编程语言失败");
    return [];
  } finally {
    languageLoading.value = false;
  }
};

const getDraftKey = (questionId: ApiId, language: string) => ({
  userId: store.state.user.loginUser?.id ?? "anonymous",
  questionId,
  language,
});

const persistCurrentDraft = () => {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = undefined;
  const questionId = currentQuestion.value?.id;
  if (questionId == null || !loadedLanguage.value) return;

  const key = getDraftKey(questionId, loadedLanguage.value);
  const code = form.value.code || "";
  if (code === activeTemplate.value) {
    removeQuestionDraft(key);
  } else {
    saveQuestionDraft(key, code);
  }
};

const scheduleDraftSave = () => {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(persistCurrentDraft, 300);
};

const clearTemplateCacheForQuestion = (questionId: ApiId) => {
  const prefix = `${questionId}:`;
  for (const key of templateCache.keys()) {
    if (key.startsWith(prefix)) templateCache.delete(key);
  }
};

const activateLanguage = async (language: string) => {
  const questionId = currentQuestion.value?.id;
  if (questionId == null || !language) return;

  const generation = ++templateGeneration;
  const cacheKey = `${questionId}:${language}`;
  starterCodeLoading.value = true;
  starterCodeError.value = "";
  form.value.code = "";

  try {
    let template = templateCache.get(cacheKey);
    if (template == null) {
      template = await getQuestionStarterCode(questionId, language);
      templateCache.set(cacheKey, template);
    }
    if (generation !== templateGeneration) return;

    activeTemplate.value = template;
    loadedLanguage.value = language;
    form.value.language = language;
    form.value.code =
      getQuestionDraft(getDraftKey(questionId, language)) ?? template;
  } catch (error) {
    if (generation !== templateGeneration) return;
    templateCache.delete(cacheKey);
    activeTemplate.value = "";
    loadedLanguage.value = language;
    form.value.code = "";
    starterCodeError.value =
      error instanceof StarterCodeServiceError && error.code === 40400
        ? "初始代码模板配置异常"
        : error instanceof Error
        ? error.message
        : "加载初始代码失败";
    message.error(starterCodeError.value);
  } finally {
    if (generation === templateGeneration) starterCodeLoading.value = false;
  }
};

const onLanguageChange = () => {
  persistCurrentDraft();
  void activateLanguage(form.value.language || "");
};

const onSelectQuestion = async (item: QuestionVO) => {
  if (item.id == null) return;
  persistCurrentDraft();
  const generation = ++questionGeneration;
  currentQuestion.value = null;
  await loadLanguageOptions();
  if (generation !== questionGeneration || !form.value.language) return;

  selectedId.value = item.id;
  clearTemplateCacheForQuestion(item.id);
  templateGeneration += 1;
  stopPolling();
  showResult.value = false;
  submitResult.value = null;
  isResultDetailsCollapsed.value = false;
  activeTab.value = "question";
  clearMySubmissionDetailTabs();
  mySubmissionsCurrent.value = 1;
  mySubmissions.value = [];
  mySubmissionsTotal.value = 0;
  mySubmissionsError.value = "";
  questionSolution.value = "";
  starterCodeError.value = "";
  activeTemplate.value = "";
  loadedLanguage.value = "";
  form.value.code = "";

  const res = await QuestionControllerService.getQuestionVoById(item.id);
  if (generation !== questionGeneration) return;
  if (res.code === 0) {
    currentQuestion.value = res.data;
    void loadMySubmissions();
    await activateLanguage(form.value.language);
  } else {
    currentQuestion.value = null;
    clearTemplateCacheForQuestion(item.id);
    message.error("加载失败");
  }
};

const openSolution = () => {
  if (!canViewSolution.value) return;
  activeTab.value = "solution";
  if (!questionSolution.value) void loadSolution();
};

const loadSolution = async () => {
  if (!currentQuestion.value?.id) return;
  const res = await QuestionControllerService.getQuestionSolution(
    toGeneratedApiId(currentQuestion.value.id)
  );
  if (res.code === 0) {
    questionSolution.value = res.data?.answer || "暂无题解";
  } else if (res.code === 40400) {
    questionSolution.value = "题目不存在或已删除";
  } else {
    questionSolution.value = "无法加载题解";
    message.error(res.message || "题解加载失败");
  }
};

const doSubmit = async () => {
  if (
    !currentQuestion.value?.id ||
    !form.value.language ||
    starterCodeLoading.value ||
    starterCodeError.value
  )
    return;
  persistCurrentDraft();
  stopPolling();
  const res = await QuestionControllerService.doQuestionSubmit({
    ...form.value,
    questionId: currentQuestion.value.id,
  });
  if (res.code === 0) {
    message.success("提交成功");
    showResult.value = true;
    isResultDetailsCollapsed.value = false;
    submitResult.value = { id: res.data, status: 0 };
    void loadMySubmissions();
    startPolling(res.data);
  } else {
    message.error("提交失败，" + res.message);
  }
};

const startPolling = (submitId: ApiId) => polling.start(submitId);
const stopPolling = () => polling.stop();

const changeCode = (value: string) => {
  form.value.code = value;
  scheduleDraftSave();
};

const resetStarterCode = () => {
  const questionId = currentQuestion.value?.id;
  if (questionId == null || !loadedLanguage.value) return;
  removeQuestionDraft(getDraftKey(questionId, loadedLanguage.value));
  form.value.code = activeTemplate.value;
};

const requestResetStarterCode = () => {
  if (form.value.code === activeTemplate.value) {
    resetStarterCode();
    return;
  }
  showResetDialog.value = true;
};

const confirmResetStarterCode = () => {
  resetStarterCode();
  showResetDialog.value = false;
};

onBeforeUnmount(() => {
  persistCurrentDraft();
  questionGeneration += 1;
  templateGeneration += 1;
  stopPolling();
  clearMySubmissionDetailTabs();
});
</script>

<style scoped>
#questionsView {
  animation: claude-fade-up 0.4s ease-out;
  flex: 1;
  display: flex;
  min-height: 0;
}

.workspace {
  --sidebar-width: 300px;
  display: flex;
  width: 100%;
  overflow: hidden;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  position: relative;
}

/* ===== Sidebar ===== */
.sidebar {
  width: var(--sidebar-width);
  min-width: 0;
  flex: 0 0 var(--sidebar-width);
  background: var(--surface-soft);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  border-right: 1px solid var(--hairline);
  transition: width 480ms cubic-bezier(0.22, 1, 0.36, 1),
    flex-basis 480ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease,
    transform 480ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease;
  will-change: width, flex-basis, transform;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  left: var(--sidebar-width);
  z-index: 20;
  width: 28px;
  height: 64px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: 0 6px 6px 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transform: translateY(-50%);
  transition: left 480ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms ease,
    background 150ms ease;
}

.sidebar-toggle:hover {
  color: var(--primary);
  background: var(--surface-soft);
}

.sidebar-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -3px;
}

.sidebar-toggle svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sidebar-toggle.collapsed svg {
  transform: rotate(180deg);
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.problem-count {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-soft);
}

.sidebar-search {
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  height: 36px;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: var(--primary);
}

.search-input::placeholder {
  color: var(--muted-soft);
}

.filter-bar {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  background: var(--canvas);
  color: var(--muted);
  border: 1px solid var(--hairline);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip:hover {
  border-color: var(--muted-soft);
  color: var(--ink);
}

.filter-chip.active {
  background: var(--primary);
  color: var(--on-primary);
  border-color: var(--primary);
}

.problem-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
}

.problem-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  cursor: pointer;
  background: var(--surface-card);
  border: 1px solid var(--hairline-soft);
  border-left: 3px solid transparent;
  margin-bottom: 6px;
  border-radius: 6px;
  transition: background 150ms ease, border-color 150ms ease;
}

.problem-item:hover {
  background: var(--surface-cream-strong);
  border-color: var(--hairline);
}

.problem-item.active {
  background: var(--surface-cream-strong);
  border-color: var(--hairline);
  border-left-color: var(--primary);
}

.problem-status {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
}

.problem-status.solved {
  background: var(--success);
  color: #fff;
}

.problem-status.attempted {
  background: var(--warning);
  color: #fff;
}

.problem-status.pending {
  border: 2px solid var(--hairline);
}

.problem-info {
  flex: 1;
  min-width: 0;
}

.problem-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.problem-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.difficulty {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.difficulty.easy {
  color: var(--success);
  background: rgba(93, 184, 114, 0.12);
}

.difficulty.medium {
  color: var(--accent-amber);
  background: rgba(232, 165, 90, 0.12);
}

.difficulty.hard {
  color: var(--error);
  background: rgba(198, 69, 69, 0.12);
}

.pagination-bar {
  padding: 8px 12px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

/* ===== Main Content ===== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--surface-soft);
  min-width: 0;
  position: relative;
}

/* Description */
.description-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  overflow-y: auto;
  padding: 0 36px 32px;
  border-bottom: 1px solid var(--hairline);
  border-right: 1px solid transparent;
  background: var(--surface-soft);
  min-height: 0;
  transition: left 480ms cubic-bezier(0.22, 1, 0.36, 1),
    width 480ms cubic-bezier(0.22, 1, 0.36, 1),
    height 480ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease;
  will-change: left, width, height;
}

.tabs-row {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 8px;
  overflow: hidden;
  margin: 0 -36px 24px;
  padding: 12px 36px;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-overlay);
  backdrop-filter: blur(8px);
}

.tab-btn {
  flex: 0 0 auto;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 150ms ease;
}

.tab-btn:hover {
  color: var(--ink);
  background: var(--surface-card);
}

.tab-btn.active {
  color: var(--ink);
  background: var(--surface-card);
}

.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.question-reading-area {
  width: 100%;
  max-width: 840px;
  min-height: calc(100% - 76px);
  margin: 0 auto;
  padding: 30px 32px 32px;
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  transition: max-width 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

.question-heading {
  padding-bottom: 24px;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--surface-cream-strong);
}

.problem-title {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 32px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: 0;
  margin: 0 0 10px;
  line-height: 1.2;
}

.problem-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--surface-cream-strong);
  color: var(--body);
  border: 1px solid transparent;
  letter-spacing: 0;
}

.problem-section {
  margin-bottom: 28px;
}

.problem-section h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* MdViewer content styling */
.problem-section :deep(p) {
  font-size: 16px;
  color: var(--body);
  line-height: 1.8;
  margin: 0 0 14px;
}

.problem-section :deep(h1),
.problem-section :deep(h2),
.problem-section :deep(h3),
.problem-section :deep(h4) {
  color: var(--ink);
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.4;
  margin: 26px 0 12px;
}

.problem-section :deep(h1) {
  font-size: 28px;
}

.problem-section :deep(h2) {
  font-size: 24px;
}

.problem-section :deep(h3),
.problem-section :deep(h4) {
  font-size: 20px;
}

.problem-section :deep(code) {
  color: var(--primary);
  background: var(--surface-cream-strong);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.problem-section :deep(pre),
.problem-section :deep(pre.hljs),
.problem-section :deep(.hljs) {
  background: var(--surface-cream-strong) !important;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  overflow-x: auto;
  margin: var(--space-sm) 0;
}

.problem-section :deep(pre code),
.problem-section :deep(code.hljs) {
  color: var(--body);
  background: transparent !important;
  padding: 0;
  font-size: 13px;
}

.problem-section :deep(ul),
.problem-section :deep(ol) {
  padding-left: 20px;
  font-size: 14px;
  color: var(--body);
  line-height: 1.7;
}

.problem-section :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding-left: var(--space-md);
  margin: var(--space-sm) 0;
  color: var(--muted);
  font-style: italic;
}

.problem-section :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.problem-section :deep(th),
.problem-section :deep(td) {
  border: 1px solid var(--hairline);
  padding: 6px 12px;
  text-align: left;
}

.problem-section :deep(th) {
  background: var(--surface-cream-strong);
  font-weight: 500;
  color: var(--body-strong);
}

.limits-section {
  margin-top: 34px;
}

.section-label {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.limits-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  background: var(--surface-cream-strong);
  border: 0;
  border-radius: var(--radius-md);
}

.limit-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 13px 15px;
}

.limit-item + .limit-item {
  border-left: 1px solid var(--surface-card);
}

.limit-label {
  color: var(--muted);
  font-size: 12px;
}

.limit-value {
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.empty-hint {
  color: var(--muted);
  font-size: 14px;
  padding: 32px 0;
  text-align: center;
}

.empty-hint.error {
  color: var(--error);
}

.detail-tab {
  flex: 1 1 140px;
  min-width: 0;
  max-width: 180px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding-right: 8px;
  padding-left: 8px;
}

.detail-tab-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-tab-close {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: var(--muted-soft);
  border-radius: 50%;
}

.detail-tab-close:hover {
  color: var(--error);
}

.submission-section-header,
.submission-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--hairline);
}

.submission-section-header h2 {
  margin: 0 0 3px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
}

.submission-section-header p,
.submission-detail-header time {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.icon-action {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.icon-action:hover {
  color: var(--primary);
  background: var(--surface-soft);
}

.icon-action:disabled {
  cursor: wait;
  opacity: 0.5;
}

.submission-list {
  margin-top: 4px;
}

.submission-row {
  width: 100%;
  display: grid;
  grid-template-columns: 86px minmax(130px, 1fr) 88px 96px 120px;
  align-items: center;
  gap: 12px;
  padding: 13px 10px;
  color: var(--body);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--hairline-soft);
  font-family: var(--font-body);
  text-align: left;
  cursor: pointer;
}

.submission-row:hover {
  background: var(--surface-soft);
}

.submission-result {
  font-size: 13px;
  font-weight: 600;
}

.submission-result.pending {
  color: var(--accent-amber);
}

.submission-result.passed {
  color: var(--success);
}

.submission-result.failed {
  color: var(--error);
}

.submission-language {
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submission-metric,
.submission-time {
  color: var(--muted);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  white-space: nowrap;
}

.submission-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.submission-detail-header > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.submission-detail-header strong {
  color: var(--ink);
  font-size: 14px;
}

.submission-detail-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 18px 0 22px;
  overflow: hidden;
  background: var(--surface-cream-strong);
  border-radius: var(--radius-md);
}

.submission-detail-metrics > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 15px;
}

.submission-detail-metrics > div + div {
  border-left: 1px solid var(--surface-card);
}

.submission-detail-metrics span,
.submission-detail-block h3 {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.submission-detail-metrics strong {
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
}

.submission-detail-block {
  margin-top: 22px;
}

.submission-detail-block h3 {
  margin: 0 0 9px;
}

.submission-detail-block > pre,
.submission-diagnostic {
  margin: 0;
  padding: 16px;
  overflow: auto;
  color: var(--on-dark);
  background: var(--surface-dark);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.submission-diagnostic strong {
  color: var(--on-dark);
  font-weight: 600;
}

.submission-diagnostic pre {
  margin: 8px 0 0;
  color: var(--on-dark-soft);
  font: inherit;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

/* Editor */
.editor-panel {
  position: absolute;
  top: 40%;
  left: 0;
  width: 100%;
  height: 60%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: top 480ms cubic-bezier(0.22, 1, 0.36, 1),
    left 480ms cubic-bezier(0.22, 1, 0.36, 1),
    width 480ms cubic-bezier(0.22, 1, 0.36, 1),
    height 480ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: top, left, width, height;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--surface-dark);
  flex-shrink: 0;
}

.lang-selector {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--on-dark);
  background: var(--surface-dark-elevated);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  outline: none;
  min-width: 180px;
  height: 30px;
}

.lang-selector:disabled {
  cursor: wait;
  opacity: 0.6;
}

.editor-actions {
  display: flex;
  gap: 6px;
}

.btn-submit,
.btn-reset-code {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  height: 30px;
  padding: 4px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.btn-submit {
  background: var(--primary);
  color: var(--on-primary);
  border: 1px solid var(--primary);
}

.btn-reset-code {
  color: var(--on-dark-soft);
  background: transparent;
  border: 1px solid #3d3d3d;
}

.btn-submit:hover {
  background: var(--primary-active);
}

.btn-reset-code:hover {
  color: var(--on-dark);
  border-color: #666;
  background: var(--surface-dark-elevated);
}

.btn-submit:disabled,
.btn-reset-code:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.editor-body {
  flex: 1;
  min-height: 0;
}

.editor-body :deep(#code-editor) {
  height: 100% !important;
  min-height: 200px !important;
  width: 100% !important;
  overflow: hidden !important;
  contain: strict !important;
}

/* Results */
.results-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid var(--hairline);
  background: var(--canvas);
  z-index: 10;
  transition: left 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 8px 14px 8px 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.results-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}

.results-status.pending {
  color: var(--accent-amber);
}

.results-status.passed {
  color: var(--success);
}

.results-status.failed {
  color: var(--error);
}

.result-actions,
.result-stats,
.result-stat {
  display: flex;
  align-items: center;
}

.result-actions {
  gap: 14px;
  margin-left: auto;
}

.result-stats {
  gap: 24px;
}

.result-stat {
  gap: 7px;
  white-space: nowrap;
}

.result-stat-label {
  color: var(--muted-soft);
  font-size: 11px;
}

.result-stat-value {
  color: var(--ink);
  font-family: Consolas, "Courier New", monospace;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.result-toggle {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: color 150ms ease, background 150ms ease, border-color 150ms ease;
}

.result-toggle:hover {
  color: var(--ink);
  background: var(--surface-soft);
  border-color: var(--hairline);
}

.result-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.result-toggle svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.result-toggle.collapsed svg {
  transform: rotate(180deg);
}

.result-detail-shell {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease;
}

.result-detail-shell.collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
}

.result-detail-clip {
  min-height: 0;
  overflow: hidden;
}

.result-detail-content {
  max-height: 240px;
  overflow: auto;
  padding: 14px 20px 16px;
  border-top: 1px solid var(--hairline-soft);
  background: var(--surface-soft);
}

.result-message-title {
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.results-panel.failed .result-message-title {
  color: var(--error);
}

.results-panel.passed .result-message-title {
  color: var(--success);
}

.result-message-details {
  margin-top: 8px;
  color: var(--body);
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-soft);
  font-size: 14px;
}

@media (max-width: 1024px) {
  .workspace {
    --sidebar-width: 260px;
  }

  .sidebar {
    width: var(--sidebar-width);
  }
  .description-panel {
    padding: 0 24px 28px;
  }

  .tabs-row {
    margin-right: -24px;
    margin-left: -24px;
    padding-right: 24px;
    padding-left: 24px;
  }

  .question-reading-area {
    padding: 26px 24px 28px;
  }
}

@media (min-width: 769px) {
  .workspace.sidebar-collapsed .sidebar {
    width: 0;
    flex-basis: 0;
    opacity: 0;
    transform: translateX(-24px);
    border-right-color: transparent;
    pointer-events: none;
  }

  .workspace.sidebar-collapsed .sidebar-toggle {
    left: 0;
  }

  .workspace.sidebar-collapsed .description-panel {
    width: 50%;
    height: 100%;
    border-right: 1px solid var(--hairline);
    border-bottom-color: transparent;
  }

  .workspace.sidebar-collapsed .question-reading-area {
    max-width: 760px;
  }

  .workspace.sidebar-collapsed .editor-panel {
    top: 0;
    left: 50%;
    width: 50%;
    height: 100%;
  }

  .workspace.sidebar-collapsed .results-panel {
    left: 50%;
  }
}

@media (max-width: 768px) {
  .workspace {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    min-width: 0;
    flex-basis: auto;
    max-height: 35vh;
    border-right: none;
    border-bottom: 1px solid var(--hairline);
  }

  .sidebar-toggle {
    display: none;
  }
  #questionsView {
    margin: calc(-1 * var(--space-md));
  }

  .limits-strip {
    grid-template-columns: 1fr;
  }

  .limit-item + .limit-item {
    border-top: 1px solid var(--surface-card);
    border-left: 0;
  }
}
</style>
