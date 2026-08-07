<template>
  <div id="questionSubmitView">
    <header class="page-heading">
      <span class="page-kicker">SUBMISSION ARCHIVE</span>
      <h2 class="page-title">浏览题目提交</h2>
    </header>
    <div class="page-card">
      <div class="filter-section">
        <a-form :model="searchParams" layout="inline">
          <a-form-item field="questionId" label="题号">
            <a-input
              v-model="searchParams.questionId"
              placeholder="按题号搜索"
            />
          </a-form-item>
          <a-form-item field="language" label="语言">
            <a-select
              v-model="searchParams.language"
              placeholder="选择编程语言"
              allow-clear
            >
              <a-option
                v-for="language in languageOptions"
                :key="language.value"
                :value="language.value"
              >
                {{ language.text }}
              </a-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="doSubmit">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>
      <a-table
        row-key="id"
        :columns="columns"
        :data="dataList"
        :expandable="expandable"
        table-layout-fixed
        :pagination="{
          showTotal: true,
          pageSize: searchParams.pageSize,
          current: searchParams.current,
          total,
        }"
        @page-change="onPageChange"
      >
        <template #submitId="{ record }">
          <span class="table-id" :title="String(record.id ?? '')">
            {{ record.id ?? "--" }}
          </span>
        </template>
        <template #user="{ record }">
          <UserIdentity :user-id="record.userId" />
        </template>
        <template #language="{ record }">
          <span class="language-name">
            {{ getLanguageText(record.language) }}
          </span>
        </template>
        <template #judgeInfo="{ record }">
          <div class="judge-summary">
            <strong
              :class="['judge-result', getJudgeResultPresentation(record).tone]"
            >
              {{ getJudgeSummary(record).title }}
            </strong>
            <span v-if="getJudgeSummary(record).preview">
              {{ getJudgeSummary(record).preview }}
            </span>
          </div>
        </template>
        <template #status="{ record }">
          <span :class="['status-badge', `status-${record.status}`]">
            {{
              record.status === 0
                ? "待判题"
                : record.status === 1
                ? "提交中"
                : record.status === 2
                ? "完成"
                : record.status === 3
                ? "失败"
                : "未知"
            }}
          </span>
        </template>
        <template #executionTime="{ record }">
          <span class="judge-metric">
            {{ formatJudgeTime(record.judgeInfo?.time) }}
          </span>
        </template>
        <template #memory="{ record }">
          <span class="judge-metric">
            {{ formatJudgeMemory(record.judgeInfo?.memory) }}
          </span>
        </template>
        <template #createTime="{ record }">
          <span class="time">{{ formatDateTime(record.createTime) }}</span>
        </template>
        <template #questionId="{ record }">
          <span class="table-id" :title="String(record.questionId ?? '')">
            {{ record.questionId ?? "--" }}
          </span>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { h, onMounted, ref, watchEffect } from "vue";

import SubmissionDiagnosticPanel from "@/components/question/SubmissionDiagnosticPanel.vue";
import UserIdentity from "@/components/user/UserIdentity.vue";
import {
  QuestionSubmitQueryRequest,
  QuestionSubmitVO,
} from "../../../generated";
import {
  formatJudgeMemory,
  getJudgeResultPresentation,
  listQuestionSubmissions,
  splitJudgeMessage,
} from "@/services/questionSubmit";
import {
  getSupportedLanguageOptions,
  LanguageOption,
} from "@/services/questionStarterCode";
import { formatDateTime } from "@/utils/dateTime";

const formatJudgeTime = (time?: number) => (time == null ? "--" : `${time} ms`);

const dataList = ref<QuestionSubmitVO[]>([]);
const total = ref(0);
const languageOptions = ref<LanguageOption[]>([]);
const searchParams = ref<QuestionSubmitQueryRequest>({
  questionId: undefined,
  language: undefined,
  pageSize: 10,
  current: 1,
});

const loadData = async () => {
  const res = await listQuestionSubmissions({
    ...searchParams.value,
    sortField: "createTime",
    sortOrder: "descend",
  });
  if (res.code === 0) {
    dataList.value = res.data?.records ?? [];
    total.value = Number(res.data?.total ?? 0);
  } else {
    message.error("加载失败，" + res.message);
  }
};

watchEffect(() => {
  loadData();
});

onMounted(async () => {
  try {
    languageOptions.value = await getSupportedLanguageOptions();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "加载编程语言失败");
  }
});

const columns = [
  { title: "用户", slotName: "user", width: 155 },
  { title: "提交 ID", slotName: "submitId", width: 90 },
  { title: "语言", slotName: "language", width: 95 },
  { title: "判题信息", slotName: "judgeInfo", width: 245 },
  { title: "判题状态", slotName: "status", width: 76, align: "center" },
  { title: "运行时间", slotName: "executionTime", width: 76 },
  { title: "内存占用", slotName: "memory", width: 76 },
  { title: "题目 ID", slotName: "questionId", width: 95 },
  { title: "提交时间", slotName: "createTime", width: 105 },
];

const expandable = {
  title: "详情",
  width: 40,
  expandedRowRender: (record: QuestionSubmitVO) =>
    h(SubmissionDiagnosticPanel, { submission: record }),
};

const getLanguageText = (language?: string) =>
  languageOptions.value.find(({ value }) => value === language)?.text ||
  language ||
  "--";

const getJudgeSummary = (submission: QuestionSubmitVO) => {
  const presentation = getJudgeResultPresentation(submission);
  const parts = splitJudgeMessage(presentation.message);
  return {
    title: parts.title || presentation.label,
    preview: parts.details.split(/\r?\n/).find(Boolean) || "",
  };
};

const onPageChange = (page: number) => {
  searchParams.value = { ...searchParams.value, current: page };
};
const doSubmit = () => {
  searchParams.value = { ...searchParams.value, current: 1 };
};
</script>

<style scoped>
#questionSubmitView {
  animation: claude-fade-up 0.4s ease-out;
  padding: var(--space-lg);
}

.page-heading {
  margin-bottom: var(--space-lg);
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

.page-card {
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
}

.page-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
  opacity: 0.3;
}

.filter-section {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--hairline-soft);
  background: var(--surface-soft);
}

.filter-section .arco-form {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin: 0;
}

.filter-section :deep(.arco-form-item-label) {
  color: var(--muted) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-section :deep(.arco-form-item) {
  margin-bottom: 0 !important;
}

.filter-section :deep(.arco-btn-primary) {
  height: 36px;
  padding: 0 18px;
  font-size: 13px;
}

.judge-summary {
  min-width: 0;
}

.judge-result {
  display: block;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.judge-summary > span {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: var(--muted);
  font-family: var(--font-code);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.judge-result.passed {
  color: var(--success);
}

.judge-result.failed {
  color: var(--error);
}

.judge-result.pending {
  color: var(--muted);
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.status-2 {
  background: var(--surface-soft);
  color: var(--ink);
}

.status-3 {
  background: rgba(198, 69, 69, 0.1);
  color: var(--error);
}

.status-0,
.status-1,
.status-undefined {
  background: var(--surface-soft);
  color: var(--muted);
}

.time {
  font-size: 13px;
  color: var(--muted-soft);
  white-space: nowrap;
}

.judge-metric {
  color: var(--body-strong);
  font-family: var(--font-code);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.table-id {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: var(--body-strong);
  font-family: var(--font-code);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.language-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: var(--body-strong);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.arco-table-th),
:deep(.arco-table-td) {
  padding-right: 12px !important;
  padding-left: 12px !important;
  vertical-align: middle;
}

:deep(.arco-table-th .arco-table-cell) {
  white-space: nowrap;
}

:deep(.arco-table-th:first-child),
:deep(.arco-table-td:first-child) {
  padding-left: 16px !important;
}

:deep(.arco-table-container),
:deep(.arco-table-body) {
  max-width: 100%;
  overflow: hidden !important;
}

:deep(.arco-table-element) {
  width: 100% !important;
  min-width: 0 !important;
}

:deep(.arco-table-tr:not(.arco-table-tr-expand) .arco-table-td) {
  height: 72px;
}

:deep(.arco-table-tr-expand > .arco-table-td) {
  padding: 0;
  background: var(--surface-soft) !important;
}

:deep(.arco-table-tr-expand:hover > .arco-table-td) {
  background: var(--surface-cream-strong) !important;
}
</style>
