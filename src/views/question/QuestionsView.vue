<template>
  <div id="questionsView">
    <div class="workspace">
      <!-- ===== Sidebar ===== -->
      <aside class="sidebar">
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
            @page-change="onPageChange"
          />
        </div>
      </aside>

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
                :class="['tab-btn', { active: activeTab === 'answer' }]"
                @click="activeTab = 'answer'"
                :disabled="!canViewAnswer"
              >
                答案
              </button>
            </div>
            <div v-if="activeTab === 'question'">
              <h1 class="problem-title">{{ currentQuestion.title }}</h1>
              <div class="problem-header">
                <span
                  class="tag"
                  v-for="(tag, i) of currentQuestion.tags"
                  :key="i"
                  >{{ tag }}</span
                >
              </div>
              <div class="problem-section">
                <MdViewer :value="currentQuestion.content || ''" />
              </div>
              <div class="problem-section">
                <h3>限制</h3>
                <ul class="constraints">
                  <li>
                    时间限制:
                    {{ currentQuestion.judgeConfig?.timeLimit ?? 0 }}ms
                  </li>
                  <li>
                    内存限制:
                    {{ currentQuestion.judgeConfig?.memoryLimit ?? 0 }}KB
                  </li>
                  <li>
                    堆栈限制:
                    {{ currentQuestion.judgeConfig?.stackLimit ?? 0 }}KB
                  </li>
                </ul>
              </div>
            </div>
            <div v-else>
              <div v-if="questionAnswer">
                <MdViewer :value="questionAnswer" />
              </div>
              <div v-else class="empty-hint">
                {{
                  canViewAnswer ? "答案加载中..." : "请先通过本题后再查看答案"
                }}
              </div>
            </div>
          </div>

          <!-- Editor -->
          <div class="editor-panel">
            <div class="editor-toolbar">
              <select v-model="form.language" class="lang-selector">
                <option>java</option>
                <option>cpp</option>
                <option>go</option>
                <option>python</option>
                <option>javascript</option>
              </select>
              <div class="editor-actions">
                <button class="btn-submit" @click="doSubmit">提交</button>
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
          <div v-if="showResult" class="results-panel">
            <div class="results-header">
              <div :class="['results-status', resultStatusClass]">
                <!-- Pending/Submitting -->
                <svg
                  v-if="
                    submitResult?.status === 0 || submitResult?.status === 1
                  "
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
                  v-else-if="submitResult?.judgeInfo?.message === 'Accepted'"
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
                {{
                  getStatusText(submitResult?.status, submitResult?.judgeInfo)
                }}
                <span class="result-muted"
                  >· {{ submitResult?.judgeInfo?.message || "--" }}</span
                >
              </div>
              <div class="result-stats">
                <span
                  >执行时间
                  {{
                    submitResult?.judgeInfo?.time
                      ? submitResult?.judgeInfo?.time + "ms"
                      : "--"
                  }}</span
                >
                <span class="sep">·</span>
                <span
                  >内存消耗
                  {{
                    submitResult?.judgeInfo?.memory
                      ? submitResult?.judgeInfo?.memory + "KB"
                      : "--"
                  }}</span
                >
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
  </div>
</template>

<style scoped>
#questionsView {
  animation: claude-fade-up 0.4s ease-out;
  flex: 1;
  display: flex;
  min-height: 0;
}

.workspace {
  display: flex;
  width: 100%;
  overflow: hidden;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
}

/* ===== Sidebar ===== */
.sidebar {
  width: 300px;
  min-width: 300px;
  background: var(--surface-soft);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  border-right: 1px solid var(--hairline);
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
  padding: 4px 0;
  min-height: 0;
}

.problem-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.1s;
  border-left: 3px solid transparent;
  margin: 0 8px;
  border-radius: 6px;
}

.problem-item:hover {
  background: var(--surface-card);
}

.problem-item.active {
  background: var(--surface-card);
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
  background: var(--canvas);
  min-width: 0;
  position: relative;
}

/* Description */
.description-panel {
  flex: 4;
  overflow-y: auto;
  padding: 28px 36px;
  border-bottom: 1px solid var(--hairline);
  min-height: 0;
}

.tabs-row {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 8px;
}

.tab-btn {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.tab-btn.active {
  color: var(--ink);
}

.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.problem-title {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.3px;
  margin-bottom: 6px;
  line-height: 1.2;
}

.problem-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--surface-soft);
  color: var(--muted);
  border: 1px solid var(--hairline);
  letter-spacing: 0.2px;
}

.problem-section {
  margin-bottom: 20px;
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
  font-size: 14px;
  color: var(--body);
  line-height: 1.7;
}

.problem-section :deep(code) {
  color: var(--primary);
  background: var(--surface-soft);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.problem-section :deep(pre),
.problem-section :deep(pre.hljs),
.problem-section :deep(.hljs) {
  background: var(--surface-soft) !important;
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
  background: var(--surface-soft);
  font-weight: 500;
  color: var(--body-strong);
}

.constraints {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
  padding-left: 20px;
  margin-top: 4px;
}

.constraints li {
  margin-bottom: 3px;
}

.empty-hint {
  color: var(--muted);
  font-size: 14px;
  padding: 32px 0;
  text-align: center;
}

/* Editor */
.editor-panel {
  flex: 6;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
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
  min-width: 100px;
  height: 30px;
}

.editor-actions {
  display: flex;
  gap: 6px;
}

.btn-submit {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  height: 30px;
  padding: 4px 14px;
  border-radius: 6px;
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-submit:hover {
  background: var(--primary-active);
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
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.results-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
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

.result-muted {
  font-weight: 400;
  font-size: 12px;
  color: var(--muted);
}

.result-stats {
  font-size: 12px;
  color: var(--muted-soft);
}

.sep {
  margin: 0 4px;
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
  .sidebar {
    width: 260px;
    min-width: 260px;
  }
  .description-panel {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .workspace {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    min-width: 0;
    max-height: 35vh;
    border-right: none;
    border-bottom: 1px solid var(--hairline);
  }
  #questionsView {
    margin: calc(-1 * var(--space-md));
  }
}
</style>

<script setup lang="ts">
import {
  onMounted,
  ref,
  watchEffect,
  onBeforeUnmount,
  computed,
  defineAsyncComponent,
} from "vue";
import {
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionVO,
  QuestionSubmitVO,
  QuestionQueryRequest,
  JudgeInfo,
} from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import MdViewer from "@/components/MdViewer.vue";

const CodeEditor = defineAsyncComponent(
  () => import("@/components/CodeEditor.vue")
);
import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import { useStore } from "vuex";

const store = useStore();

// ===== Sidebar =====
const selectedId = ref<string | null>(null);
const activeFilter = ref("all");
const dataList = ref([]);
const total = ref(0);
const searchParams = ref<QuestionQueryRequest>({
  title: "",
  tags: [],
  pageSize: 8,
  current: 1,
});

const loadData = async () => {
  const res = await QuestionControllerService.listQuestionVoByPageUsingPost(
    searchParams.value
  );
  if (res.code === 0) {
    dataList.value = res.data.records;
    total.value = res.data.total;
  } else {
    message.error("加载失败，" + res.message);
  }
};

watchEffect(() => {
  loadData();
});
onMounted(() => {
  loadData();
});

const onFilterChange = (filter: string) => {
  activeFilter.value = filter;
  searchParams.value = {
    ...searchParams.value,
    tags: filter === "all" ? [] : [filter],
    current: 1,
  };
};

const onPageChange = (page: number) => {
  searchParams.value = { ...searchParams.value, current: page };
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
const activeTab = ref("question");
const questionAnswer = ref("");
const hasPassedQuestion = ref(false);
const submitResult = ref<QuestionSubmitVO | null>(null);
const showResult = ref(false);

let pollingTimer: any = null;
let pollingStart = 0;
const POLLING_INTERVAL = 3000;
const POLLING_TIMEOUT = 30000;

const canViewAnswer = computed(() => {
  const u = store.state.user.loginUser;
  return checkAccess(u, ACCESS_ENUM.ADMIN) || hasPassedQuestion.value;
});

const resultStatusClass = computed(() => {
  const s = submitResult.value;
  if (!s) return "";
  if (s.status === 0 || s.status === 1) return "pending";
  return s.judgeInfo?.message === "Accepted" ? "passed" : "failed";
});

const form = ref<QuestionSubmitAddRequest>({
  language: "java",
  code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int a = Integer.parseInt(args[0]);
        System.out.print("output the answer");
    }
}`,
});

const onSelectQuestion = async (item: any) => {
  selectedId.value = item.id as string;
  stopPolling();
  showResult.value = false;
  submitResult.value = null;
  activeTab.value = "question";
  hasPassedQuestion.value = false;
  questionAnswer.value = "";

  const res = await QuestionControllerService.getQuestionVoByIdUsingGet(
    item.id as any
  );
  if (res.code === 0) {
    currentQuestion.value = res.data;
    checkAnswerAccess();
  } else {
    message.error("加载失败");
  }
};

const checkAnswerAccess = async () => {
  const u = store.state.user.loginUser;
  if (checkAccess(u, ACCESS_ENUM.ADMIN)) {
    loadAnswer();
    return;
  }
  if (u?.userRole === ACCESS_ENUM.USER) {
    const res =
      await QuestionControllerService.listQuestionSubmitByPageUsingPost({
        questionId: currentQuestion.value?.id,
        userId: u.id,
        pageSize: 100,
        current: 1,
      });
    if (res.code === 0 && res.data.records) {
      const passed = res.data.records.find((s: any) => {
        let j = s.judgeInfo;
        if (typeof j === "string") {
          try {
            j = JSON.parse(j);
          } catch {
            j = {};
          }
        }
        return j?.message === "Accepted";
      });
      hasPassedQuestion.value = !!passed;
      if (passed) loadAnswer();
    }
  }
};

const loadAnswer = async () => {
  if (!currentQuestion.value?.id) return;
  const u = store.state.user.loginUser;
  if (checkAccess(u, ACCESS_ENUM.ADMIN)) {
    const res = await QuestionControllerService.getQuestionByIdUsingGet(
      currentQuestion.value.id as any
    );
    questionAnswer.value =
      res.code === 0 && res.data.answer ? res.data.answer : "暂无答案";
  } else {
    const res = await QuestionControllerService.listQuestionByPageUsingPost({
      id: currentQuestion.value.id,
      pageSize: 1,
      current: 1,
    });
    questionAnswer.value =
      res.code === 0 && res.data.records?.[0]?.answer
        ? res.data.records[0].answer
        : "无法加载答案";
  }
};

const doSubmit = async () => {
  if (!currentQuestion.value?.id) return;
  stopPolling();
  const res = await QuestionControllerService.doQuestionSubmitUsingPost({
    ...form.value,
    questionId: currentQuestion.value.id,
  });
  if (res.code === 0) {
    message.success("提交成功");
    showResult.value = true;
    startPolling(res.data);
  } else {
    message.error("提交失败，" + res.message);
  }
};

const startPolling = (submitId: number) => {
  pollingStart = Date.now();
  const poll = async () => {
    if (Date.now() - pollingStart > POLLING_TIMEOUT) {
      stopPolling();
      return;
    }
    try {
      const res = await QuestionControllerService.getQuestionSubmitByIdUsingGet(
        submitId
      );
      if (res.code === 0) {
        const d = { ...res.data };
        if (typeof d.judgeInfo === "string") {
          try {
            d.judgeInfo = JSON.parse(d.judgeInfo);
          } catch {
            d.judgeInfo = {};
          }
        }
        submitResult.value = d;
        if (d?.status === 2 || d?.status === 3) {
          stopPolling();
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    pollingTimer = setTimeout(poll, POLLING_INTERVAL);
  };
  poll();
};

const stopPolling = () => {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
};

const getStatusText = (status?: number, judgeInfo?: JudgeInfo) => {
  switch (status) {
    case 0:
      return "等待中";
    case 1:
      return "判题中";
    case 2:
      if (judgeInfo?.message === "Accepted") return "通过";
      return judgeInfo?.message || "失败";
    case 3:
      return "失败";
    default:
      return "未知";
  }
};

const changeCode = (value: string) => {
  form.value.code = value;
};

onBeforeUnmount(() => {
  stopPolling();
});
</script>
