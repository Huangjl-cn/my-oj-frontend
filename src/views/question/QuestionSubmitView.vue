<template>
  <div id="questionSubmitView">
    <div class="archive-shell">
      <aside class="archive-side-controls">
        <nav class="view-switcher" role="tablist" aria-label="提交展示模式">
          <button
            class="view-tab"
            :class="{
              active: viewMode === 'all' && selectedQuestionId == null,
            }"
            type="button"
            role="tab"
            :aria-selected="viewMode === 'all' && selectedQuestionId == null"
            aria-label="全部提交"
            title="全部提交"
            @click="switchView('all')"
          >
            全部
          </button>
          <button
            class="view-tab"
            :class="{
              active: viewMode === 'group' && selectedQuestionId == null,
            }"
            type="button"
            role="tab"
            :aria-selected="viewMode === 'group' && selectedQuestionId == null"
            aria-label="按题目"
            title="按题目"
            @click="switchView('group')"
          >
            题目
          </button>
        </nav>

        <div
          v-if="viewContext === 'submission-detail' || viewContext === 'detail'"
          class="detail-back-row"
        >
          <button
            class="detail-back-button"
            type="button"
            :aria-label="
              viewContext === 'detail' ? '返回题目列表' : '返回提交列表'
            "
            :title="viewContext === 'detail' ? '返回题目列表' : '返回提交列表'"
            @click="closeDetailView"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14 5-7 7 7 7" />
            </svg>
          </button>
        </div>
      </aside>

      <div class="archive-main">
        <header class="page-heading">
          <span class="page-kicker">SUBMISSION ARCHIVE</span>
          <h2 class="page-title">浏览题目提交</h2>
          <p class="page-lede">按题目、提交者和执行表现整理公开判题记录。</p>
        </header>
        <section
          v-if="selectedSubmission == null"
          class="filter-panel"
          aria-label="提交筛选"
        >
          <form class="filter-grid" @submit.prevent="applyFilters">
            <template v-if="viewContext === 'all'">
              <div class="filter-field">
                <span>题目</span>
                <a-input
                  v-model="allFilters.questionQuery"
                  allow-clear
                  placeholder="题目 ID / 名称"
                />
              </div>
              <div class="filter-field">
                <span>提交者</span>
                <a-input
                  v-model="allFilters.userQuery"
                  allow-clear
                  placeholder="用户 ID / 昵称"
                />
              </div>
              <div class="filter-field">
                <span>排序</span>
                <a-select v-model="allFilters.sortField">
                  <a-option value="latest">最新提交</a-option>
                  <a-option value="time">运行时间：快到慢</a-option>
                  <a-option value="memory">内存占用：低到高</a-option>
                </a-select>
              </div>
              <div class="filter-field">
                <span>提交状态</span>
                <a-select v-model="allFilters.judgeResult">
                  <a-option value="all">全部状态</a-option>
                  <a-option value="accepted">通过</a-option>
                  <a-option value="failed">未通过</a-option>
                  <a-option value="pending">判题中</a-option>
                </a-select>
              </div>
              <div class="filter-field">
                <span>编程语言</span>
                <a-select
                  v-model="allFilters.language"
                  allow-clear
                  placeholder="全部语言"
                >
                  <a-option
                    v-for="language in languageOptions"
                    :key="language.value"
                    :value="language.value"
                  >
                    {{ language.text }}
                  </a-option>
                </a-select>
              </div>
            </template>

            <template v-else-if="viewContext === 'group'">
              <div class="filter-field group-search-field">
                <span>定位题目</span>
                <a-input
                  v-model="groupFilters.questionQuery"
                  allow-clear
                  placeholder="输入题目 ID 或名称"
                />
              </div>
            </template>

            <template v-else>
              <div class="filter-field">
                <span>提交者</span>
                <a-input
                  v-model="detailFilters.userQuery"
                  allow-clear
                  placeholder="用户 ID / 昵称"
                />
              </div>
              <div class="filter-field">
                <span>排序</span>
                <a-select v-model="detailFilters.sortField">
                  <a-option value="latest">最新提交</a-option>
                  <a-option value="time">运行时间：快到慢</a-option>
                  <a-option value="memory">内存占用：低到高</a-option>
                </a-select>
              </div>
              <div class="filter-field">
                <span>提交状态</span>
                <a-select v-model="detailFilters.judgeResult">
                  <a-option value="all">全部状态</a-option>
                  <a-option value="accepted">通过</a-option>
                  <a-option value="failed">未通过</a-option>
                  <a-option value="pending">判题中</a-option>
                </a-select>
              </div>
              <div class="filter-field">
                <span>编程语言</span>
                <a-select
                  v-model="detailFilters.language"
                  allow-clear
                  placeholder="全部语言"
                >
                  <a-option
                    v-for="language in languageOptions"
                    :key="language.value"
                    :value="language.value"
                  >
                    {{ language.text }}
                  </a-option>
                </a-select>
              </div>
            </template>
            <a-button class="filter-submit" type="primary" html-type="submit">
              搜索
            </a-button>
          </form>
        </section>

        <section class="archive-content" aria-live="polite">
          <div v-if="loading" class="archive-empty">正在加载提交记录...</div>
          <div v-else-if="errorMessage" class="archive-empty error">
            {{ errorMessage }}
          </div>

          <div
            v-else-if="
              viewContext === 'submission-detail' && selectedSubmission
            "
            class="submission-detail"
          >
            <header class="submission-detail-header">
              <div class="submission-detail-meta">
                <UserIdentity
                  :user="
                    selectedSubmission.userVO || {
                      id: selectedSubmission.userId,
                      userName: selectedSubmission.userName,
                      userAvatar: selectedSubmission.userAvatar,
                    }
                  "
                  :user-id="selectedSubmission.userId"
                  :size="54"
                />
                <div>
                  <span class="content-kicker">SUBMISSION</span>
                  <h4>{{ getSubmissionTitle(selectedSubmission) }}</h4>
                  <p>
                    #{{ selectedSubmission.id ?? "--" }} ·
                    {{ formatDateTime(selectedSubmission.createTime) }}
                  </p>
                </div>
              </div>
              <div
                :class="[
                  'detail-result',
                  getSubmissionPresentation(selectedSubmission).tone,
                ]"
              >
                {{ getSubmissionPresentation(selectedSubmission).label }}
              </div>
            </header>
            <div class="detail-overview">
              <div>
                <span>编程语言</span>
                <strong>{{
                  getLanguageText(selectedSubmission.language)
                }}</strong>
              </div>
              <div>
                <span>运行时间</span>
                <strong>{{
                  formatTime(selectedSubmission.judgeInfo?.time)
                }}</strong>
              </div>
              <div>
                <span>内存占用</span>
                <strong>{{
                  formatJudgeMemory(selectedSubmission.judgeInfo?.memory)
                }}</strong>
              </div>
            </div>
            <SubmissionRankRings
              v-if="
                getSubmissionPresentation(selectedSubmission).tone === 'passed'
              "
              :rank="submissionRank"
              :loading="rankLoading"
              :error="rankError"
              comparison-label="超过同语言提交"
            />
            <SubmissionDiagnosticPanel :submission="selectedSubmission" />
          </div>

          <div v-else-if="viewContext === 'group'" class="group-list">
            <article
              v-for="group in visibleGroups"
              :key="String(group.questionId)"
              class="group-card"
            >
              <header class="group-card-header">
                <div class="group-title">
                  <h4>
                    {{
                      group.questionTitle || `题目 #${group.questionId ?? "--"}`
                    }}
                  </h4>
                  <span>
                    #{{ group.questionId ?? "--" }}
                    <template v-if="group.questionTags?.length">
                      · {{ group.questionTags.join(" · ") }}
                    </template>
                  </span>
                </div>
                <span class="group-latest">最近提交</span>
              </header>
              <div class="group-metrics">
                <div>
                  <span>最近使用语言</span>
                  <strong>{{ getLanguageText(group.latestLanguage) }}</strong>
                </div>
                <div>
                  <span>最佳运行时间</span>
                  <strong>{{ formatTime(group.bestTime) }}</strong>
                </div>
                <div>
                  <span>最低内存占用</span>
                  <strong>{{ formatJudgeMemory(group.bestMemory) }}</strong>
                </div>
              </div>
              <div v-if="group.latestCode" class="group-code-preview">
                <span>最近提交代码</span>
                <CodeBlock
                  :code="group.latestCode"
                  :language="group.latestLanguage ?? ''"
                />
              </div>
              <footer class="group-card-footer">
                <time>{{ formatDateTime(group.latestSubmitTime) }}</time>
                <button type="button" @click="openQuestionDetail(group)">
                  查看该题提交
                  <span aria-hidden="true">→</span>
                </button>
              </footer>
            </article>
            <p v-if="!visibleGroups.length" class="archive-empty">
              暂无符合条件的题目记录
            </p>
          </div>

          <div v-else class="submission-list">
            <article
              v-for="submission in currentSubmissions"
              :key="String(submission.id)"
              class="submission-card"
              :class="getSubmissionPresentation(submission).tone"
            >
              <header class="submission-card-header">
                <UserIdentity
                  :user="
                    submission.userVO || {
                      id: submission.userId,
                      userName: submission.userName,
                      userAvatar: submission.userAvatar,
                    }
                  "
                  :user-id="submission.userId"
                  :size="42"
                />
                <div class="submission-result-block">
                  <span class="result-label">判题结果</span>
                  <strong>{{
                    getSubmissionPresentation(submission).label
                  }}</strong>
                </div>
              </header>
              <div class="submission-card-body">
                <div class="submission-problem">
                  <span class="card-label">题目</span>
                  <strong>{{ getSubmissionTitle(submission) }}</strong>
                  <span class="card-subtitle"
                    >#{{ submission.questionId ?? "--" }}</span
                  >
                </div>
                <div class="submission-diagnostic">
                  <span class="card-label">判题信息</span>
                  <strong>{{ getJudgeSummary(submission).title }}</strong>
                  <span v-if="getJudgeSummary(submission).preview">
                    {{ getJudgeSummary(submission).preview }}
                  </span>
                </div>
                <span class="language-pill">
                  {{ getLanguageText(submission.language) }}
                </span>
                <div class="submission-metrics">
                  <span
                    ><small>运行时间</small
                    ><strong>{{
                      formatTime(submission.judgeInfo?.time)
                    }}</strong></span
                  >
                  <span
                    ><small>内存占用</small
                    ><strong>{{
                      formatJudgeMemory(submission.judgeInfo?.memory)
                    }}</strong></span
                  >
                </div>
                <time class="submission-time">{{
                  formatDateTime(submission.createTime)
                }}</time>
              </div>
              <button
                class="details-toggle"
                type="button"
                @click="openSubmissionDetail(submission)"
              >
                查看提交详情
                <span aria-hidden="true">→</span>
              </button>
            </article>
            <p v-if="!currentSubmissions.length" class="archive-empty">
              暂无符合条件的提交记录
            </p>
          </div>

          <a-pagination
            v-if="!loading && total > 0 && viewContext !== 'submission-detail'"
            class="archive-pagination"
            :current="currentPage"
            :page-size="pageSize"
            :total="total"
            show-total
            @change="onPageChange"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

import CodeBlock from "@/components/editor/CodeBlock.vue";
import SubmissionRankRings from "@/components/question/SubmissionRankRings.vue";
import SubmissionDiagnosticPanel from "@/components/question/SubmissionDiagnosticPanel.vue";
import UserIdentity from "@/components/user/UserIdentity.vue";
import { ApiId, parseRouteApiId, toGeneratedApiId } from "@/services/apiId";
import {
  formatJudgeMemory,
  getQuestionSubmitRank,
  getJudgeResultPresentation,
  listQuestionSubmitGroups,
  listQuestionSubmissions,
  splitJudgeMessage,
} from "@/services/questionSubmit";
import {
  getLanguageText as resolveLanguageText,
  getSupportedLanguageOptions,
  LanguageOption,
} from "@/services/questionStarterCode";
import { formatDateTime } from "@/utils/dateTime";
import {
  QuestionSubmitArchiveQueryRequest,
  QuestionSubmitGroupQueryRequest,
  QuestionSubmitGroupVO,
  QuestionSubmitRankVO,
  QuestionSubmitVO,
} from "../../../generated";

type ViewMode = "all" | "group";
type ViewContext = ViewMode | "detail" | "submission-detail";
type SortField = "latest" | "time" | "memory";
type ResultFilter = "all" | "accepted" | "failed" | "pending";

const route = useRoute();
const viewMode = ref<ViewMode>("all");
const selectedQuestionId = ref<ApiId | null>(null);
const selectedSubmission = ref<QuestionSubmitVO | null>(null);
const submissionRank = ref<QuestionSubmitRankVO>();
const rankLoading = ref(false);
const rankError = ref("");
const loading = ref(false);
const errorMessage = ref("");
const total = ref(0);
const pageSize = 10;
const allPage = ref(1);
const groupPage = ref(1);
const detailPage = ref(1);
const allSubmissions = ref<QuestionSubmitVO[]>([]);
const detailSubmissions = ref<QuestionSubmitVO[]>([]);
const groups = ref<QuestionSubmitGroupVO[]>([]);
const languageOptions = ref<LanguageOption[]>([]);
let requestGeneration = 0;
let rankRequestId = 0;

const allFilters = reactive({
  questionQuery: "",
  userQuery: "",
  sortField: "latest" as SortField,
  judgeResult: "all" as ResultFilter,
  language: undefined as string | undefined,
});
const groupFilters = reactive({ questionQuery: "" });
const detailFilters = reactive({
  userQuery: "",
  sortField: "latest" as SortField,
  judgeResult: "all" as ResultFilter,
  language: undefined as string | undefined,
});

const viewContext = computed<ViewContext>(() =>
  selectedSubmission.value != null
    ? "submission-detail"
    : selectedQuestionId.value == null
    ? viewMode.value
    : "detail"
);
const currentPage = computed(() => {
  if (viewContext.value === "group") return groupPage.value;
  if (viewContext.value === "detail") return detailPage.value;
  return allPage.value;
});
const currentSubmissions = computed(() =>
  viewContext.value === "detail"
    ? detailSubmissions.value
    : allSubmissions.value
);

const visibleGroups = computed(() => {
  const keyword = groupFilters.questionQuery.trim().toLocaleLowerCase("zh-CN");
  if (!keyword) return groups.value;
  return groups.value.filter((group) => {
    const title = (group.questionTitle || "").toLocaleLowerCase("zh-CN");
    return (
      title.includes(keyword) ||
      String(group.questionId ?? "").includes(keyword)
    );
  });
});

const parseIdInput = (value: string): number | undefined => {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? toGeneratedApiId(trimmed) : undefined;
};

const buildUserQuery = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return {};
  const userId = parseIdInput(trimmed);
  return userId == null ? { userName: trimmed } : { userId };
};

const buildSort = (field: SortField, group = false) => ({
  sortField: group
    ? field === "latest"
      ? "latestSubmitTime"
      : field === "time"
      ? "bestTime"
      : "bestMemory"
    : field === "latest"
    ? "createTime"
    : field === "time"
    ? "judgeTime"
    : "judgeMemory",
  sortOrder: field === "latest" ? "descend" : "ascend",
});

const getLanguageText = (value?: string) =>
  resolveLanguageText(value, languageOptions.value, value || "--");

const getSubmissionTitle = (submission: QuestionSubmitVO) =>
  submission.questionTitle ||
  submission.questionVO?.title ||
  `题目 #${submission.questionId ?? "--"}`;

const getJudgeSummary = (submission: QuestionSubmitVO) => {
  const presentation = getJudgeResultPresentation(submission);
  const parts = splitJudgeMessage(presentation.message);
  return {
    title: parts.title || presentation.label,
    preview: parts.details.split(/\r?\n/).find(Boolean) || "",
  };
};

const getSubmissionPresentation = (submission: QuestionSubmitVO) =>
  getJudgeResultPresentation(submission);

const formatTime = (time?: number) => (time == null ? "--" : `${time} ms`);

const loadAll = async () => {
  const generation = ++requestGeneration;
  loading.value = true;
  errorMessage.value = "";
  try {
    const questionId = parseIdInput(allFilters.questionQuery);
    const request: QuestionSubmitArchiveQueryRequest = {
      current: allPage.value,
      pageSize,
      questionId,
      ...buildUserQuery(allFilters.userQuery),
      language: allFilters.language,
      judgeResult:
        allFilters.judgeResult === "all" ? undefined : allFilters.judgeResult,
      ...buildSort(allFilters.sortField),
    };
    const response = await listQuestionSubmissions(request);
    if (generation !== requestGeneration) return;
    if (response.code !== 0)
      throw new Error(response.message || "加载提交记录失败");
    const records = response.data?.records ?? [];
    const keyword = allFilters.questionQuery.trim().toLocaleLowerCase("zh-CN");
    allSubmissions.value =
      keyword && questionId == null
        ? records.filter((record) =>
            getSubmissionTitle(record)
              .toLocaleLowerCase("zh-CN")
              .includes(keyword)
          )
        : records;
    total.value =
      keyword && questionId == null
        ? allSubmissions.value.length
        : Number(response.data?.total ?? 0);
  } catch (error) {
    if (generation !== requestGeneration) return;
    allSubmissions.value = [];
    total.value = 0;
    errorMessage.value =
      error instanceof Error ? error.message : "加载提交记录失败";
  } finally {
    if (generation === requestGeneration) loading.value = false;
  }
};

const loadGroups = async () => {
  const generation = ++requestGeneration;
  loading.value = true;
  errorMessage.value = "";
  try {
    const request: QuestionSubmitGroupQueryRequest = {
      current: groupPage.value,
      pageSize,
      ...buildUserQuery(""),
      ...buildSort("latest", true),
    };
    const response = await listQuestionSubmitGroups(request);
    if (generation !== requestGeneration) return;
    if (response.code !== 0)
      throw new Error(response.message || "加载题目提交记录失败");
    groups.value = response.data?.records ?? [];
    total.value = Number(response.data?.total ?? groups.value.length);
  } catch (error) {
    if (generation !== requestGeneration) return;
    groups.value = [];
    total.value = 0;
    errorMessage.value =
      error instanceof Error ? error.message : "加载题目提交记录失败";
  } finally {
    if (generation === requestGeneration) loading.value = false;
  }
};

const loadDetail = async () => {
  const questionId = selectedQuestionId.value;
  if (questionId == null) return;
  const generation = ++requestGeneration;
  loading.value = true;
  errorMessage.value = "";
  try {
    const request: QuestionSubmitArchiveQueryRequest = {
      current: detailPage.value,
      pageSize,
      questionId: toGeneratedApiId(questionId),
      ...buildUserQuery(detailFilters.userQuery),
      language: detailFilters.language,
      judgeResult:
        detailFilters.judgeResult === "all"
          ? undefined
          : detailFilters.judgeResult,
      ...buildSort(detailFilters.sortField),
    };
    const response = await listQuestionSubmissions(request);
    if (generation !== requestGeneration) return;
    if (response.code !== 0)
      throw new Error(response.message || "加载题目提交记录失败");
    detailSubmissions.value = response.data?.records ?? [];
    total.value = Number(response.data?.total ?? 0);
  } catch (error) {
    if (generation !== requestGeneration) return;
    detailSubmissions.value = [];
    total.value = 0;
    errorMessage.value =
      error instanceof Error ? error.message : "加载题目提交记录失败";
  } finally {
    if (generation === requestGeneration) loading.value = false;
  }
};

const loadCurrentView = () => {
  if (viewContext.value === "submission-detail") return;
  if (viewContext.value === "all") return void loadAll();
  if (viewContext.value === "group") return void loadGroups();
  return void loadDetail();
};

const switchView = (mode: ViewMode) => {
  resetRankState();
  viewMode.value = mode;
  selectedQuestionId.value = null;
  selectedSubmission.value = null;
  total.value = 0;
  loadCurrentView();
};

const applyFilters = () => {
  if (viewContext.value === "all") allPage.value = 1;
  else if (viewContext.value === "group") groupPage.value = 1;
  else detailPage.value = 1;
  loadCurrentView();
};

const openQuestionDetail = (group: QuestionSubmitGroupVO) => {
  if (group.questionId == null) return;
  resetRankState();
  selectedSubmission.value = null;
  selectedQuestionId.value = group.questionId;
  detailPage.value = 1;
  loadDetail();
};

const closeQuestionDetail = () => {
  resetRankState();
  selectedSubmission.value = null;
  selectedQuestionId.value = null;
  total.value = 0;
  loadGroups();
};

const openSubmissionDetail = (submission: QuestionSubmitVO) => {
  const isPassed = getSubmissionPresentation(submission).tone === "passed";
  selectedSubmission.value = submission;
  if (isPassed) void loadSubmissionRank(submission.id);
  else resetRankState();
};

const closeSubmissionDetail = () => {
  resetRankState();
  selectedSubmission.value = null;
  total.value = 0;
  loadCurrentView();
};

const closeDetailView = () => {
  if (viewContext.value === "detail") closeQuestionDetail();
  else if (viewContext.value === "submission-detail") closeSubmissionDetail();
};

const resetRankState = () => {
  rankRequestId += 1;
  submissionRank.value = undefined;
  rankLoading.value = false;
  rankError.value = "";
};

const loadSubmissionRank = async (submitId?: number) => {
  resetRankState();
  if (submitId == null) return;
  const currentRequest = rankRequestId;
  rankLoading.value = true;
  try {
    const rank = await getQuestionSubmitRank(submitId);
    if (currentRequest !== rankRequestId) return;
    submissionRank.value = rank;
  } catch (error) {
    if (currentRequest !== rankRequestId) return;
    rankError.value = error instanceof Error ? error.message : "排名暂不可用";
  } finally {
    if (currentRequest === rankRequestId) rankLoading.value = false;
  }
};

const onPageChange = (page: number) => {
  if (viewContext.value === "all") allPage.value = page;
  else if (viewContext.value === "group") groupPage.value = page;
  else detailPage.value = page;
  loadCurrentView();
};

onMounted(async () => {
  const routeQuestionId = parseRouteApiId(route.query.questionId);
  if (routeQuestionId != null) {
    viewMode.value = "group";
    selectedQuestionId.value = routeQuestionId;
  }
  try {
    languageOptions.value = await getSupportedLanguageOptions();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "加载编程语言失败");
  }
  loadCurrentView();
});
</script>

<style scoped>
#questionSubmitView {
  width: min(1280px, calc(100% - 2 * var(--space-xl)));
  margin: 0 auto;
  padding: var(--space-xl) 0 var(--space-2xl);
  animation: claude-fade-up var(--motion-standard) var(--ease-out);
}

.page-heading {
  margin-bottom: 0;
}

.page-kicker,
.content-kicker {
  color: var(--primary);
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.11em;
}

.page-title {
  margin: 3px 0 7px;
  color: var(--ink);
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 42px;
  font-weight: 400;
  line-height: 1;
}

.page-lede {
  max-width: 560px;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.archive-shell {
  position: relative;
  margin-top: 0;
}

.archive-main {
  min-width: 0;
}

.archive-side-controls {
  position: fixed;
  top: 50%;
  left: max(14px, calc((100vw - 1280px) / 2 - 72px));
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-50%);
}

.view-switcher {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 58px;
  padding: 5px 0;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.view-tab {
  position: relative;
  width: 100%;
  padding: 14px 3px;
  color: var(--muted);
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.view-tab::after {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: -1px;
  width: 2px;
  background: var(--primary);
  content: "";
  opacity: 0;
  transform: scaleY(0.4);
  transition: opacity 160ms ease, transform 160ms ease;
}

.view-tab:hover,
.view-tab.active {
  color: var(--ink);
}

.view-tab.active::after {
  opacity: 1;
  transform: scaleY(1);
}

.filter-panel {
  margin-top: var(--space-xl);
  padding: var(--space-md);
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(78px, auto);
  align-items: end;
  gap: var(--space-md);
}

.filter-field {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.filter-field > span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
}

.group-search-field {
  max-width: 520px;
}

.filter-submit {
  min-width: 78px;
  height: 36px;
}

.filter-grid :deep(.arco-input-wrapper),
.filter-grid :deep(.arco-select-view) {
  min-height: 36px;
  background: var(--surface-card) !important;
  border-color: var(--hairline) !important;
  border-radius: var(--radius-sm);
}

.archive-content {
  margin-top: var(--space-xl);
}

.detail-back-row {
  display: grid;
  width: 100%;
  margin-top: 18px;
  padding-top: 16px;
  place-items: center;
  border-top: 1px solid var(--hairline);
}

.detail-back-button {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  padding: 0;
  color: var(--primary);
  background: var(--surface-soft);
  border: 1px solid var(--primary);
  border-radius: 50%;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, border-color 160ms ease,
    transform 160ms ease;
}

.detail-back-button svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.detail-back-button:hover {
  color: var(--surface-card);
  background: var(--primary);
  border-color: var(--primary);
  transform: translateX(-2px);
}

.submission-list,
.group-list {
  display: grid;
  gap: var(--space-md);
}

.group-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}

.group-list > .archive-empty {
  grid-column: 1 / -1;
}

.submission-card,
.group-card {
  position: relative;
  overflow: hidden;
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform 180ms ease, box-shadow 180ms ease,
    border-color 180ms ease;
}

.submission-card::before {
  position: absolute;
  inset: 16px auto 16px 0;
  width: 3px;
  background: var(--muted);
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
  content: "";
}

.submission-card.passed::before {
  background: var(--success);
}

.submission-card.failed::before {
  background: var(--error);
}

.submission-card.pending::before {
  background: var(--accent-amber);
}

.submission-card:hover,
.group-card:hover {
  border-color: color-mix(in srgb, var(--primary) 46%, var(--hairline));
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.submission-card-header,
.group-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 17px 22px 14px 28px;
  border-bottom: 1px solid var(--hairline-soft);
}

.submission-result-block {
  display: grid;
  gap: 3px;
  text-align: right;
}

.result-label,
.card-label {
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.submission-result-block strong {
  color: var(--body-strong);
  font-size: 13px;
}

.submission-card.passed .submission-result-block strong {
  color: var(--success);
}

.submission-card.failed .submission-result-block strong {
  color: var(--error);
}

.submission-card.pending .submission-result-block strong {
  color: var(--accent-amber);
}

.submission-card-body {
  display: grid;
  grid-template-columns:
    minmax(160px, 1.1fr) minmax(220px, 1.8fr) auto minmax(190px, 1.1fr)
    auto;
  align-items: center;
  gap: 22px;
  padding: 16px 22px 16px 28px;
}

.submission-problem,
.submission-diagnostic {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.submission-problem strong,
.submission-diagnostic strong,
.submission-diagnostic span:not(.card-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submission-problem strong {
  color: var(--ink);
  font-size: 15px;
}

.card-subtitle,
.submission-diagnostic span:not(.card-label) {
  color: var(--muted);
  font-family: var(--font-code);
  font-size: 10px;
}

.submission-diagnostic strong {
  color: var(--error);
  font-size: 13px;
}

.submission-card.passed .submission-diagnostic strong {
  color: var(--success);
}

.submission-card.pending .submission-diagnostic strong {
  color: var(--accent-amber);
}

.language-pill {
  max-width: 150px;
  padding: 5px 9px;
  overflow: hidden;
  color: var(--body-strong);
  background: var(--surface-soft);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submission-metrics {
  display: flex;
  gap: 18px;
}

.submission-metrics span {
  display: grid;
  gap: 2px;
  min-width: 78px;
}

.submission-metrics small {
  color: var(--muted);
  font-size: 10px;
}

.submission-metrics strong {
  color: var(--body-strong);
  font-family: var(--font-code);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.submission-time,
.group-card-footer time {
  color: var(--muted-soft);
  font-size: 11px;
  white-space: nowrap;
}

.details-toggle {
  width: calc(100% - 50px);
  margin: 0 22px 14px 28px;
  padding: 8px 10px;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}

.details-toggle span {
  display: inline-block;
  margin-left: 6px;
  transition: transform 160ms ease;
}

.details-toggle:hover span {
  transform: translateX(4px);
}

.submission-detail {
  overflow: hidden;
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  animation: claude-fade-up var(--motion-standard) var(--ease-out);
}

.submission-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: 22px 26px;
  border-bottom: 1px solid var(--hairline-soft);
}

.submission-detail-meta {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 80px;
}

.submission-detail-meta > div:last-child {
  min-width: 0;
}

.submission-detail-meta h4 {
  margin: 4px 0 2px;
  overflow: hidden;
  color: var(--ink);
  font-size: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submission-detail-meta p {
  margin: 0;
  color: var(--muted);
  font-family: var(--font-code);
  font-size: 11px;
}

.detail-result {
  flex: 0 0 auto;
  padding: 7px 12px;
  background: var(--surface-soft);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
}

.detail-result.passed {
  color: var(--success);
}

.detail-result.failed {
  color: var(--error);
}

.detail-result.pending {
  color: var(--accent-amber);
}

.detail-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--hairline-soft);
}

.detail-overview > div {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 16px 20px;
}

.detail-overview > div + div {
  border-left: 1px solid var(--hairline-soft);
}

.detail-overview span {
  color: var(--muted);
  font-size: 10px;
}

.detail-overview strong {
  overflow: hidden;
  color: var(--body-strong);
  font-family: var(--font-code);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-code-preview {
  margin: 0 22px 16px;
}

.group-code-preview > span {
  display: block;
  margin-bottom: 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.group-code-preview :deep(.code-block-pre) {
  max-height: 180px;
}

.group-card-header {
  padding-left: 22px;
}

.group-title {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.group-title h4 {
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-title span {
  overflow: hidden;
  color: var(--muted);
  font-family: var(--font-code);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-latest {
  flex: 0 0 auto;
  padding: 5px 9px;
  color: var(--muted);
  background: var(--surface-soft);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 600;
}

.group-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 14px 22px;
  overflow: hidden;
  background: var(--surface-soft);
  border-radius: var(--radius-sm);
}

.group-metrics div {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
}

.group-metrics div + div {
  border-left: 1px solid var(--hairline);
}

.group-metrics span {
  color: var(--muted);
  font-size: 10px;
}

.group-metrics strong {
  overflow: hidden;
  color: var(--body-strong);
  font-family: var(--font-code);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 0 22px 15px;
}

.group-card-footer button {
  padding: 5px 0;
  color: var(--primary);
  background: transparent;
  border: 0;
  font-size: 12px;
  font-weight: 600;
}

.group-card-footer button span {
  margin-left: 5px;
  transition: margin-left 160ms ease;
}

.group-card-footer button:hover span {
  margin-left: 9px;
}

.archive-empty {
  padding: 48px 16px;
  color: var(--muted);
  text-align: center;
}

.archive-empty.error {
  color: var(--error);
}

.archive-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

@media (max-width: 1024px) {
  #questionSubmitView {
    width: min(100% - 2 * var(--space-lg), 860px);
  }

  .filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-submit {
    grid-column: span 1;
  }

  .submission-card-body {
    grid-template-columns: minmax(160px, 1fr) minmax(200px, 1.4fr) auto;
  }

  .submission-metrics {
    grid-column: 1 / span 2;
  }
}

@media (max-width: 680px) {
  #questionSubmitView {
    width: calc(100% - 2 * var(--space-md));
    padding: var(--space-lg) 0 var(--space-xl);
  }

  .page-title {
    font-size: 36px;
  }

  .archive-shell {
    margin-top: 0;
  }

  .archive-side-controls {
    top: 50%;
    left: 8px;
  }

  .view-switcher {
    width: 46px;
    padding: 4px 0;
  }

  .view-tab {
    width: 100%;
    padding: 11px 2px;
  }

  .view-tab::after {
    top: 7px;
    right: auto;
    bottom: 7px;
    left: -1px;
    width: 2px;
    height: auto;
    transform: scaleY(0.4);
  }

  .view-tab.active::after {
    transform: scaleY(1);
  }

  .archive-content {
    margin-top: var(--space-lg);
  }

  .detail-back-row {
    margin-top: 16px;
    padding-top: 14px;
  }

  .detail-back-button {
    width: 48px;
    height: 48px;
  }

  .filter-panel {
    padding: var(--space-sm);
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .group-search-field,
  .filter-submit {
    max-width: none;
    grid-column: auto;
  }

  .submission-detail-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 18px;
  }

  .submission-detail-meta h4 {
    font-size: 17px;
  }

  .detail-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-overview > div:nth-child(odd) {
    border-left: 0;
  }

  .detail-overview > div:nth-child(n + 3) {
    border-top: 1px solid var(--hairline-soft);
  }

  .group-list {
    grid-template-columns: 1fr;
  }

  .submission-card-header,
  .group-card-header {
    padding: 14px 15px 12px 20px;
  }

  .submission-card-body {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    padding: 15px 15px 14px 20px;
  }

  .submission-problem,
  .submission-diagnostic {
    grid-column: 1 / -1;
  }

  .language-pill {
    grid-column: 2;
    grid-row: 3;
    max-width: 140px;
  }

  .submission-metrics {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    margin-top: 2px;
    background: var(--surface-soft);
    border-radius: var(--radius-sm);
  }

  .submission-metrics span {
    padding: 10px 11px;
  }

  .submission-metrics span + span {
    border-left: 1px solid var(--hairline);
  }

  .submission-time {
    grid-column: 1 / -1;
  }

  .details-toggle {
    width: calc(100% - 35px);
    margin: 0 15px 13px 20px;
  }

  .group-card-header {
    align-items: flex-start;
  }

  .group-metrics {
    grid-template-columns: 1fr;
    margin: 12px 15px;
  }

  .group-metrics div + div {
    border-top: 1px solid var(--hairline);
    border-left: 0;
  }

  .group-card-footer {
    padding: 0 15px 14px 20px;
  }

  .archive-pagination {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .view-tab::after,
  .submission-card,
  .group-card,
  .details-toggle span {
    transition-duration: 100ms;
  }
}
</style>
