<template>
  <div id="questionSubmitView">
    <h2 class="page-title">浏览题目提交</h2>
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
        :columns="columns"
        :data="dataList"
        :scroll="{ x: 1200 }"
        :pagination="{
          showTotal: true,
          pageSize: searchParams.pageSize,
          current: searchParams.current,
          total,
        }"
        @page-change="onPageChange"
      >
        <template #judgeInfo="{ record }">
          <span
            :class="['judge-result', getJudgeResultPresentation(record).tone]"
          >
            {{ record.judgeInfo?.message || "--" }}
          </span>
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
          <span class="time">{{ formatTime(record.createTime) }}</span>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import {
  QuestionSubmitQueryRequest,
  QuestionSubmitVO,
} from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import {
  formatJudgeMemory,
  getJudgeResultPresentation,
  listQuestionSubmissions,
} from "@/services/questionSubmit";
import {
  getSupportedLanguageOptions,
  LanguageOption,
} from "@/services/questionStarterCode";

const formatJudgeTime = (time?: number) => (time == null ? "--" : `${time} ms`);

const formatTime = (t: string) => {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

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
    dataList.value = res.data.records;
    total.value = res.data.total;
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
  { title: "提交号", dataIndex: "id", width: 100 },
  { title: "编程语言", dataIndex: "language", width: 100 },
  { title: "判题信息", slotName: "judgeInfo" },
  { title: "判题状态", slotName: "status", width: 100 },
  { title: "运行时间", slotName: "executionTime", width: 110 },
  { title: "内存占用", slotName: "memory", width: 120 },
  { title: "题目 ID", dataIndex: "questionId", width: 100 },
  { title: "提交者 ID", dataIndex: "userId", width: 110 },
  { title: "创建时间", slotName: "createTime", width: 160 },
];

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

.page-title {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-lg) 0;
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

.judge-result {
  display: block;
  font-size: 13px;
  font-weight: 500;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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
}

.judge-metric {
  color: var(--body-strong);
  font-family: var(--font-code);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
