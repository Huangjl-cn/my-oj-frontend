<template>
  <div class="page">
    <section class="panel page-head">
      <template v-if="viewContext === 'submission-detail'">
        <button
          class="icon-btn tip-down"
          type="button"
          data-tip="返回"
          aria-label="返回列表"
          @click="closeDetailView"
        >
          <AppIcon name="chevron-left" :size="20" />
        </button>
        <h1>提交详情</h1>
      </template>
      <template v-else-if="viewContext === 'detail'">
        <button
          class="icon-btn tip-down"
          type="button"
          data-tip="返回"
          aria-label="返回题目列表"
          @click="closeDetailView"
        >
          <AppIcon name="chevron-left" :size="20" />
        </button>
        <h1>
          {{ selectedQuestionTitle || "这道题" }} 的提交
          <span class="count num">{{ total }}</span>
        </h1>
        <div class="head-end">
          <router-link class="btn sm" :to="`/problem/${selectedQuestionId}`">
            <AppIcon name="pen-square" :size="16" />
            去做这道题
          </router-link>
        </div>
      </template>
      <template v-else>
        <h1>
          提交记录
          <span class="count num">{{ total }}</span>
        </h1>
        <div class="head-end">
          <UiSegmented
            :model-value="viewMode"
            :options="VIEW_OPTIONS"
            label="查看方式"
            @update:model-value="switchViewTo"
          />
        </div>
      </template>
    </section>

    <!-- ===== 一条提交的详情 ===== -->
    <section
      v-if="viewContext === 'submission-detail' && selectedSubmission"
      class="panel detail"
    >
      <header class="detail-head">
        <span
          :class="[
            'verdict-text',
            'big',
            getSubmissionPresentation(selectedSubmission).tone,
          ]"
        >
          {{ getSubmissionPresentation(selectedSubmission).label }}
        </span>
        <router-link
          class="detail-problem"
          :to="`/problem/${selectedSubmission.questionId}`"
        >
          {{ getSubmissionTitle(selectedSubmission) }}
        </router-link>
        <span class="detail-meta">
          <UserIdentity
            :user="submitterOf(selectedSubmission)"
            :user-id="selectedSubmission.userId"
            :size="24"
            compact
          />
          <time class="cell-faint num">{{
            formatDateTime(selectedSubmission.createTime)
          }}</time>
        </span>
      </header>
      <div class="metrics">
        <div>
          <span>语言</span>
          <strong>{{ getLanguageText(selectedSubmission.language) }}</strong>
        </div>
        <div>
          <span>用时</span>
          <strong class="num">{{
            formatTime(selectedSubmission.judgeInfo?.time)
          }}</strong>
        </div>
        <div>
          <span>内存</span>
          <strong class="num">{{
            formatJudgeMemory(selectedSubmission.judgeInfo?.memory)
          }}</strong>
        </div>
      </div>
      <SubmissionRankRings
        v-if="getSubmissionPresentation(selectedSubmission).tone === 'passed'"
        :rank="submissionRank"
        :loading="rankLoading"
        :error="rankError"
        comparison-label="超过的同语言提交"
      />
      <SubmissionDiagnosticPanel :submission="selectedSubmission" />
    </section>

    <!-- ===== 列表 ===== -->
    <section v-else class="panel list-panel">
      <div class="list-toolbar">
        <template v-if="viewContext === 'all'">
          <UiInput
            v-model="allFilters.questionQuery"
            icon="book"
            placeholder="题目名称或 ID"
            clearable
          />
          <UiInput
            v-model="allFilters.userQuery"
            icon="user"
            placeholder="提交者昵称或 ID"
            clearable
          />
          <UiSelect
            v-model="allFilters.judgeResult"
            class="narrow"
            :options="RESULT_OPTIONS"
            placeholder="全部状态"
            aria-label="判题结果"
          />
          <UiSelect
            v-model="allFilters.language"
            class="narrow"
            :options="languageSelectOptions"
            placeholder="全部语言"
            aria-label="编程语言"
          />
          <UiSelect
            v-model="allFilters.sortField"
            class="narrow"
            :options="SORT_OPTIONS"
            aria-label="排序"
          />
        </template>
        <template v-else-if="viewContext === 'group'">
          <UiInput
            v-model="groupFilters.questionQuery"
            icon="search"
            placeholder="在这一页里找题目"
            clearable
          />
        </template>
        <template v-else>
          <UiInput
            v-model="detailFilters.userQuery"
            icon="user"
            placeholder="提交者昵称或 ID"
            clearable
          />
          <UiSelect
            v-model="detailFilters.judgeResult"
            class="narrow"
            :options="RESULT_OPTIONS"
            placeholder="全部状态"
            aria-label="判题结果"
          />
          <UiSelect
            v-model="detailFilters.language"
            class="narrow"
            :options="languageSelectOptions"
            placeholder="全部语言"
            aria-label="编程语言"
          />
          <UiSelect
            v-model="detailFilters.sortField"
            class="narrow"
            :options="SORT_OPTIONS"
            aria-label="排序"
          />
        </template>
        <div class="toolbar-end">
          <button
            class="icon-btn tip-down tip-end"
            type="button"
            data-tip="刷新"
            aria-label="刷新"
            :disabled="loading"
            @click="loadCurrentView"
          >
            <AppIcon name="refresh" :size="17" />
          </button>
        </div>
      </div>

      <div
        :class="[
          'list-rows',
          {
            stale:
              loading &&
              (viewContext === 'group'
                ? groups.length
                : currentSubmissions.length),
          },
        ]"
      >
        <!-- 按题目 -->
        <template v-if="viewContext === 'group'">
          <div v-if="visibleGroups.length" class="list-head cols-group">
            <span>题目</span>
            <span>最近语言</span>
            <span>最快</span>
            <span>最省内存</span>
            <span>最近提交</span>
            <span />
          </div>
          <template
            v-for="group in visibleGroups"
            :key="String(group.questionId)"
          >
            <div
              :class="[
                'list-row',
                'clickable',
                'cols-group',
                { open: isGroupExpanded(group.questionId) },
              ]"
              @click="openQuestionDetail(group)"
            >
              <span class="title-cell">
                <span class="cell-title">{{
                  group.questionTitle || "未命名题目"
                }}</span>
                <span
                  v-if="getTopicTags(group.questionTags).length"
                  class="tag-list"
                >
                  <span
                    v-for="tag in getTopicTags(group.questionTags).slice(0, 2)"
                    :key="tag"
                    class="tag"
                    >{{ tag }}</span
                  >
                </span>
              </span>
              <span class="cell-muted">{{
                getLanguageText(group.latestLanguage)
              }}</span>
              <span class="cell-stat num">
                <AppIcon name="clock" :size="14" />
                {{ formatTime(group.bestTime) }}
              </span>
              <span class="cell-stat num">
                <AppIcon name="chip" :size="14" />
                {{ formatJudgeMemory(group.bestMemory) }}
              </span>
              <time
                class="cell-faint num"
                :title="formatDateTime(group.latestSubmitTime)"
                >{{ relativeTime(group.latestSubmitTime) }}</time
              >
              <span class="row-actions">
                <button
                  v-if="group.latestCode"
                  class="icon-btn tip-up"
                  type="button"
                  :data-tip="
                    isGroupExpanded(group.questionId)
                      ? '收起代码'
                      : '最近的代码'
                  "
                  :aria-expanded="isGroupExpanded(group.questionId)"
                  aria-label="最近提交的代码"
                  @click.stop="toggleGroup(group.questionId)"
                >
                  <AppIcon name="align-left" :size="16" />
                </button>
                <AppIcon name="chevron-right" :size="18" class="go" />
              </span>
            </div>
            <div
              v-if="group.latestCode && isGroupExpanded(group.questionId)"
              class="row-extra"
            >
              <CodeBlock
                :code="group.latestCode"
                :language="group.latestLanguage ?? ''"
              />
            </div>
          </template>
        </template>

        <!-- 一条一条的提交 -->
        <template v-else>
          <div
            v-if="currentSubmissions.length"
            :class="['list-head', submissionCols]"
          >
            <span>结果</span>
            <span v-if="viewContext === 'all'">题目</span>
            <span>提交者</span>
            <span>语言</span>
            <span>用时</span>
            <span>内存</span>
            <span>时间</span>
          </div>
          <button
            v-for="submission in currentSubmissions"
            :key="String(submission.id)"
            :class="['list-row', 'clickable', submissionCols]"
            type="button"
            @click="openSubmissionDetail(submission)"
          >
            <span
              :class="[
                'verdict-text',
                getSubmissionPresentation(submission).tone,
              ]"
              >{{ getSubmissionPresentation(submission).label }}</span
            >
            <span v-if="viewContext === 'all'" class="cell-title">{{
              getSubmissionTitle(submission)
            }}</span>
            <UserIdentity
              :user="submitterOf(submission)"
              :user-id="submission.userId"
              :size="24"
              compact
            />
            <span class="cell-muted">{{
              getLanguageText(submission.language)
            }}</span>
            <span class="cell-stat num">{{
              formatTime(submission.judgeInfo?.time)
            }}</span>
            <span class="cell-stat num">{{
              formatJudgeMemory(submission.judgeInfo?.memory)
            }}</span>
            <time
              class="cell-faint num"
              :title="formatDateTime(submission.createTime)"
              >{{ relativeTime(submission.createTime) }}</time
            >
          </button>
        </template>

        <div
          v-if="
            !loading &&
            (errorMessage ||
              (viewContext === 'group'
                ? !visibleGroups.length
                : !currentSubmissions.length))
          "
          class="list-empty"
        >
          <CompanionAvatar
            :size="56"
            :mood="errorMessage ? 'confused' : 'thoughtful'"
          />
          <p>{{ errorMessage || "还没有符合条件的提交" }}</p>
          <button
            v-if="errorMessage"
            class="btn sm"
            type="button"
            @click="loadCurrentView"
          >
            <AppIcon name="refresh" :size="16" />
            重新加载
          </button>
        </div>
      </div>

      <UiPagination
        class="list-pager"
        :current="currentPage"
        :total="total"
        :page-size="pageSize"
        @change="onPageChange"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import CodeBlock from "@/components/editor/CodeBlock.vue";
import SubmissionRankRings from "@/components/question/SubmissionRankRings.vue";
import SubmissionDiagnosticPanel from "@/components/question/SubmissionDiagnosticPanel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import UiSegmented from "@/components/ui/UiSegmented.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UserIdentity from "@/components/user/UserIdentity.vue";
import { ApiId, parseRouteApiId, toGeneratedApiId } from "@/services/apiId";
import {
  formatJudgeMemory,
  getQuestionSubmitRank,
  getJudgeResultPresentation,
  listQuestionSubmitGroups,
  listQuestionSubmissions,
} from "@/services/questionSubmit";
import {
  getLanguageText as resolveLanguageText,
  getSupportedLanguageOptions,
  LanguageOption,
} from "@/services/questionStarterCode";
import { formatDateTime, formatRelativeTime } from "@/utils/dateTime";
import { getTopicTags } from "@/utils/difficulty";
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
/** "" 表示全部状态 */
type ResultFilter = "" | "accepted" | "failed" | "pending";

const VIEW_OPTIONS = [
  { value: "all", label: "全部提交" },
  { value: "group", label: "按题目" },
];
const RESULT_OPTIONS = [
  { value: "accepted", label: "通过" },
  { value: "failed", label: "没通过" },
  { value: "pending", label: "判题中" },
];
const SORT_OPTIONS = [
  { value: "latest", label: "最新提交" },
  { value: "time", label: "用时最短" },
  { value: "memory", label: "内存最少" },
];

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
/** 按题目看提交时的题目名：从分组里点进来时有，直接打开链接时从第一条提交里取 */
const selectedQuestionTitle = ref("");
const expandedGroupIds = ref<string[]>([]);
let requestGeneration = 0;
let rankRequestId = 0;

const allFilters = reactive({
  questionQuery: "",
  userQuery: "",
  sortField: "latest" as SortField,
  judgeResult: "" as ResultFilter,
  language: "",
});
const groupFilters = reactive({ questionQuery: "" });
const detailFilters = reactive({
  userQuery: "",
  sortField: "latest" as SortField,
  judgeResult: "" as ResultFilter,
  language: "",
});

const languageSelectOptions = computed(() =>
  languageOptions.value.map(({ value, text }) => ({ value, label: text }))
);

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
const submissionCols = computed(() =>
  viewContext.value === "all" ? "cols-all" : "cols-detail"
);
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
      language: allFilters.language || undefined,
      judgeResult: allFilters.judgeResult || undefined,
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
      language: detailFilters.language || undefined,
      judgeResult: detailFilters.judgeResult || undefined,
      ...buildSort(detailFilters.sortField),
    };
    const response = await listQuestionSubmissions(request);
    if (generation !== requestGeneration) return;
    if (response.code !== 0)
      throw new Error(response.message || "加载题目提交记录失败");
    detailSubmissions.value = response.data?.records ?? [];
    total.value = Number(response.data?.total ?? 0);
    if (!selectedQuestionTitle.value && detailSubmissions.value.length) {
      selectedQuestionTitle.value = getSubmissionTitle(
        detailSubmissions.value[0]
      );
    }
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
  selectedQuestionTitle.value = group.questionTitle || "";
  detailPage.value = 1;
  loadDetail();
};

const closeQuestionDetail = () => {
  resetRankState();
  selectedSubmission.value = null;
  selectedQuestionId.value = null;
  selectedQuestionTitle.value = "";
  total.value = 0;
  viewMode.value = "group";
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

// 筛选条件一改就生效；输入框停下来 300ms 再查
let filterTimer: number | undefined;
watch(
  () => [
    allFilters.questionQuery,
    allFilters.userQuery,
    detailFilters.userQuery,
  ],
  () => {
    window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(applyFilters, 300);
  }
);
watch(
  () => [
    allFilters.sortField,
    allFilters.judgeResult,
    allFilters.language,
    detailFilters.sortField,
    detailFilters.judgeResult,
    detailFilters.language,
  ],
  () => applyFilters()
);

const switchViewTo = (value: string) =>
  switchView(value === "group" ? "group" : "all");

const isGroupExpanded = (questionId?: ApiId) =>
  questionId != null && expandedGroupIds.value.includes(String(questionId));

const toggleGroup = (questionId?: ApiId) => {
  if (questionId == null) return;
  const id = String(questionId);
  expandedGroupIds.value = isGroupExpanded(questionId)
    ? expandedGroupIds.value.filter((item) => item !== id)
    : [...expandedGroupIds.value, id];
};

const relativeTime = (value?: string) => {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? "--" : formatRelativeTime(time);
};

const submitterOf = (submission: QuestionSubmitVO) =>
  submission.userVO || {
    id: submission.userId,
    userName: submission.userName,
    userAvatar: submission.userAvatar,
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
.page-head > .icon-btn {
  margin-right: -10px;
}

.list-toolbar .narrow {
  width: 132px;
}

.cols-all {
  grid-template-columns: 88px minmax(0, 1.2fr) minmax(0, 0.9fr) 80px 72px 80px 84px;
}

.cols-detail {
  grid-template-columns: 88px minmax(0, 1fr) 90px 80px 90px 96px;
}

.cols-group {
  grid-template-columns: minmax(0, 1fr) 90px 86px 96px 84px 72px;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.title-cell .cell-title {
  flex: 0 1 auto;
}

.go {
  margin: 0 6px 0 4px;
  color: var(--faint);
}

.list-row.clickable:hover .go {
  color: var(--ink);
}

/* ===== 提交详情 ===== */
.detail {
  display: grid;
  align-content: start;
  gap: 22px;
  padding: 24px 26px 28px;
}

.detail-head {
  display: grid;
  gap: 8px;
}

.verdict-text.big {
  font-size: 24px;
  font-weight: 800;
}

.verdict-text.big::before {
  width: 10px;
  height: 10px;
}

.detail-problem {
  justify-self: start;
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.detail-problem:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metrics div {
  display: grid;
  gap: 2px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.metrics span {
  color: var(--faint);
  font-size: 12px;
}

.metrics strong {
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .cols-all {
    grid-template-columns: 80px minmax(0, 1fr) minmax(0, 0.8fr) 72px 84px;
  }

  .cols-all > :nth-child(4),
  .cols-all > :nth-child(6) {
    display: none;
  }
}

@media (max-width: 720px) {
  .cols-all,
  .cols-detail,
  .cols-group {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .cols-all > :not(:first-child):not(:nth-child(2)),
  .cols-detail > :not(:first-child):not(:last-child),
  .cols-group > :not(.title-cell):not(.row-actions) {
    display: none;
  }

  .metrics {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
