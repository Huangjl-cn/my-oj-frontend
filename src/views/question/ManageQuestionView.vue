<template>
  <div id="manageQuestionView">
    <header class="page-heading">
      <span class="page-kicker">{{ pageKicker }}</span>
      <h2 class="page-title">{{ pageTitle }}</h2>
    </header>
    <div class="page-card">
      <a-table
        class="desktop-table"
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
        <template #id="{ record }">
          <span class="table-id" :title="String(record.id ?? '')">
            {{ record.id ?? "--" }}
          </span>
        </template>
        <template #user="{ record }">
          <UserIdentity :user-id="record.userId" />
        </template>
        <template #tags="{ record }">
          <span v-if="getQuestionTags(record).length" class="tag-list">
            <span
              v-for="(tag, i) in getQuestionTags(record)"
              :key="i"
              class="tag"
              >{{ tag }}</span
            >
          </span>
        </template>
        <template #createTime="{ record }">
          <time class="table-time">{{
            formatDateTime(record.createTime)
          }}</time>
        </template>
        <template #updateTime="{ record }">
          <time class="table-time">{{
            formatDateTime(record.updateTime)
          }}</time>
        </template>
        <template #optional="{ record }">
          <span class="action-group">
            <button class="action-btn edit" @click="doUpdate(record)">
              修改
            </button>
            <button class="action-btn delete" @click="doDelete(record)">
              删除
            </button>
          </span>
        </template>
      </a-table>
      <div class="mobile-question-list">
        <article
          v-for="(question, index) in dataList"
          :key="String(question.id ?? index)"
          class="mobile-question-card"
        >
          <header class="mobile-question-header">
            <UserIdentity
              v-if="scope === 'all'"
              :user-id="getQuestionUserId(question)"
              :size="42"
            />
            <span class="mobile-question-id" :title="String(question.id ?? '')">
              #{{ question.id ?? "--" }}
            </span>
          </header>

          <div class="mobile-question-body">
            <h3>{{ question.title || "未命名题目" }}</h3>
            <div v-if="getQuestionTags(question).length" class="tag-list">
              <span
                v-for="(tag, tagIndex) in getQuestionTags(question)"
                :key="tagIndex"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>

            <dl class="mobile-question-stats">
              <div>
                <dt>提交次数</dt>
                <dd>{{ question.submitNum ?? 0 }}</dd>
              </div>
              <div>
                <dt>通过次数</dt>
                <dd>{{ question.acceptedNum ?? 0 }}</dd>
              </div>
            </dl>

            <div class="mobile-question-times">
              <time>创建 {{ formatDateTime(question.createTime) }}</time>
              <time v-if="scope === 'mine'">
                更新 {{ formatDateTime(question.updateTime) }}
              </time>
            </div>
          </div>

          <footer class="mobile-question-actions">
            <button
              v-if="scope === 'all'"
              class="action-btn detail"
              type="button"
              @click="toggleMobileQuestion(question.id)"
            >
              {{
                isMobileQuestionExpanded(question.id) ? "收起详情" : "查看详情"
              }}
            </button>
            <span class="action-group">
              <button
                class="action-btn edit"
                type="button"
                @click="doUpdate(question)"
              >
                修改
              </button>
              <button
                class="action-btn delete"
                type="button"
                @click="doDelete(question)"
              >
                删除
              </button>
            </span>
          </footer>

          <Transition name="mobile-details">
            <QuestionAdminDetailsPanel
              v-if="scope === 'all' && isMobileQuestionExpanded(question.id)"
              :question="getAdminQuestion(question)"
            />
          </Transition>
        </article>
        <p v-if="!dataList.length" class="mobile-empty">暂无题目</p>
        <a-pagination
          class="mobile-pagination"
          :current="searchParams.current"
          :page-size="searchParams.pageSize"
          :total="total"
          simple
          hide-on-single-page
          @change="onPageChange"
        />
      </div>
    </div>
    <ConfirmDialog
      v-model:visible="showDeleteDialog"
      title="删除题目"
      :message="`确定删除题目「${
        pendingDeleteQuestion?.title || ''
      }」吗？此操作不可撤销。`"
      confirm-text="删除题目"
      tone="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, defineProps, h, ref, withDefaults, watchEffect } from "vue";
import { useRouter } from "vue-router";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import QuestionAdminDetailsPanel from "@/components/question/QuestionAdminDetailsPanel.vue";
import UserIdentity from "@/components/user/UserIdentity.vue";
import { ApiId, toGeneratedApiId } from "@/services/apiId";
import { formatDateTime } from "@/utils/dateTime";
import {
  Question,
  QuestionControllerService,
  QuestionVO,
} from "../../../generated";

type QuestionListRecord = Question | QuestionVO;

const props = withDefaults(
  defineProps<{
    scope?: "all" | "mine";
  }>(),
  {
    scope: "all",
  }
);

const pageTitle = computed(() =>
  props.scope === "mine" ? "我的题目" : "题目管理"
);
const pageKicker = computed(() =>
  props.scope === "mine" ? "MY PROBLEMS" : "PROBLEM ADMINISTRATION"
);
const dataList = ref<QuestionListRecord[]>([]);
const total = ref(0);
const searchParams = ref({ pageSize: 10, current: 1 });
const showDeleteDialog = ref(false);
const pendingDeleteQuestion = ref<QuestionListRecord | null>(null);
const expandedMobileQuestionIds = ref<string[]>([]);

const getQuestionTags = (question: QuestionListRecord): string[] => {
  if (Array.isArray(question.tags)) return question.tags;
  if (!question.tags) return [];
  try {
    const tags = JSON.parse(question.tags);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
};

const getQuestionUserId = (question: QuestionListRecord) =>
  "userId" in question
    ? question.userId
    : question.userVO?.id ?? question.userid;

const getAdminQuestion = (question: QuestionListRecord) => question as Question;

const isMobileQuestionExpanded = (questionId?: ApiId) =>
  questionId != null &&
  expandedMobileQuestionIds.value.includes(String(questionId));

const toggleMobileQuestion = (questionId?: ApiId) => {
  if (questionId == null) return;
  const id = String(questionId);
  expandedMobileQuestionIds.value = isMobileQuestionExpanded(questionId)
    ? expandedMobileQuestionIds.value.filter((item) => item !== id)
    : [...expandedMobileQuestionIds.value, id];
};

const loadData = async () => {
  const res =
    props.scope === "mine"
      ? await QuestionControllerService.listMyQuestionVoByPage(
          searchParams.value
        )
      : await QuestionControllerService.listQuestionByPage(searchParams.value);
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

const adminColumns = [
  { title: "用户", slotName: "user", width: 170 },
  { title: "题目 ID", slotName: "id", width: 120 },
  {
    title: "标题",
    dataIndex: "title",
    width: 160,
    ellipsis: true,
    tooltip: true,
  },
  { title: "标签", slotName: "tags", width: 120 },
  { title: "提交次数", dataIndex: "submitNum", width: 70, align: "center" },
  { title: "通过次数", dataIndex: "acceptedNum", width: 70, align: "center" },
  { title: "创建时间", slotName: "createTime", width: 130 },
  { title: "操作", slotName: "optional", width: 112 },
];

const myQuestionColumns = [
  { title: "题目 ID", slotName: "id", width: 130 },
  {
    title: "标题",
    dataIndex: "title",
    width: 180,
    ellipsis: true,
    tooltip: true,
  },
  { title: "标签", slotName: "tags", width: 120 },
  { title: "提交次数", dataIndex: "submitNum", width: 70, align: "center" },
  { title: "通过次数", dataIndex: "acceptedNum", width: 70, align: "center" },
  { title: "创建时间", slotName: "createTime", width: 130 },
  { title: "更新时间", slotName: "updateTime", width: 130 },
  { title: "操作", slotName: "optional", width: 130 },
];

const columns = computed(() =>
  props.scope === "mine" ? myQuestionColumns : adminColumns
);
const expandable = computed(() =>
  props.scope === "all"
    ? {
        title: "详情",
        width: 42,
        expandedRowRender: (record: Question) =>
          h(QuestionAdminDetailsPanel, { question: record }),
      }
    : undefined
);

const onPageChange = (page: number) => {
  searchParams.value = { ...searchParams.value, current: page };
};

const doDelete = (question: QuestionListRecord) => {
  pendingDeleteQuestion.value = question;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (pendingDeleteQuestion.value?.id == null) return;
  const res = await QuestionControllerService.deleteQuestion({
    id: toGeneratedApiId(pendingDeleteQuestion.value.id),
  });
  if (res.code === 0) {
    message.success("删除成功");
    showDeleteDialog.value = false;
    pendingDeleteQuestion.value = null;
    loadData();
  } else {
    message.error("删除失败");
  }
};

const router = useRouter();

const doUpdate = (question: QuestionListRecord) => {
  router.push({
    path: "/update/question",
    query: {
      id: question.id,
      ...(props.scope === "mine" ? { from: "my" } : {}),
    },
  });
};
</script>

<style scoped>
#manageQuestionView {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  animation: page-enter var(--motion-standard) var(--ease-out);
  padding: var(--space-lg) 0;
}

.page-heading {
  width: calc(100% - (var(--space-xl) * 2));
  margin: 0 auto var(--space-lg);
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

.page-card {
  width: calc(100% - (var(--space-xl) * 2));
  margin: 0 auto;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
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

.mobile-question-list {
  display: none;
}

.mobile-details-enter-active,
.mobile-details-leave-active {
  transition: opacity 180ms ease, transform 180ms var(--ease-out);
}

.mobile-details-enter-from,
.mobile-details-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.tag-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.table-id,
.table-time {
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

.table-time {
  color: var(--muted);
}

.tag {
  display: inline-block;
  background: var(--surface-soft);
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

.action-group {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.action-btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 3px 8px;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
  line-height: 1.4;
}

.action-btn:active {
  transform: translateY(1px);
}

.action-btn.edit {
  color: var(--primary);
}

.action-btn.edit:hover {
  background: var(--surface-soft);
  border-color: var(--primary);
}

.action-btn.delete {
  color: var(--error);
}

.action-btn.delete:hover {
  background: rgba(198, 69, 69, 0.08);
  border-color: var(--error);
}

.action-btn.detail {
  color: var(--muted);
}

:deep(.arco-table-th),
:deep(.arco-table-td) {
  padding-right: 12px !important;
  padding-left: 12px !important;
  vertical-align: middle;
}

:deep(.arco-table-th:first-child),
:deep(.arco-table-td:first-child) {
  padding-left: 16px !important;
}

:deep(.arco-table-container),
:deep(.arco-table-body) {
  max-width: 100%;
  overflow: hidden !important;
  background: var(--surface-soft) !important;
}

:deep(.arco-table-td) {
  background: var(--surface-card) !important;
}

:deep(.arco-table-tr:hover .arco-table-td) {
  background: var(--surface-cream-strong) !important;
}

:deep(.arco-table-element) {
  width: 100% !important;
  min-width: 0 !important;
}

:deep(.arco-table-tr:not(.arco-table-tr-expand) .arco-table-td) {
  height: 74px;
}

:deep(.arco-table-tr-expand > .arco-table-td) {
  padding: 0;
  background: var(--surface-soft) !important;
}

:deep(.arco-table-tr-expand:hover > .arco-table-td) {
  background: var(--surface-soft) !important;
}

@media (max-width: 768px) {
  #manageQuestionView {
    padding: 20px 16px 28px;
  }

  .page-heading {
    width: 100%;
    margin-bottom: 18px;
  }

  .page-title {
    font-size: 32px;
  }

  .page-card {
    width: 100%;
    overflow: visible;
    border-radius: var(--radius-md);
  }

  .desktop-table {
    display: none;
  }

  .mobile-question-list {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .mobile-question-card {
    min-width: 0;
    overflow: hidden;
    background: var(--canvas);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-md);
  }

  .mobile-question-header {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    background: var(--surface-soft);
    border-bottom: 1px solid var(--hairline-soft);
  }

  .mobile-question-id {
    min-width: 0;
    overflow: hidden;
    color: var(--muted);
    font-family: var(--font-code);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-question-body {
    padding: 16px 14px;
  }

  .mobile-question-body h3 {
    margin: 0 0 10px;
    color: var(--ink);
    font-size: 17px;
    font-weight: 600;
  }

  .mobile-question-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 16px 0 12px;
    overflow: hidden;
    background: var(--surface-soft);
    border-radius: var(--radius-sm);
  }

  .mobile-question-stats > div {
    padding: 10px 12px;
  }

  .mobile-question-stats > div + div {
    border-left: 1px solid var(--hairline);
  }

  .mobile-question-stats dt {
    color: var(--muted);
    font-size: 10px;
  }

  .mobile-question-stats dd {
    margin: 3px 0 0;
    color: var(--ink);
    font-family: var(--font-code);
    font-size: 13px;
    font-weight: 600;
  }

  .mobile-question-times {
    display: grid;
    gap: 3px;
    color: var(--muted-soft);
    font-family: var(--font-code);
    font-size: 9px;
  }

  .mobile-question-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-top: 1px solid var(--hairline-soft);
  }

  .mobile-question-actions > .action-group {
    margin-left: auto;
  }

  .mobile-question-card :deep(.question-details) {
    padding: 16px 14px;
    border-top: 1px solid var(--hairline-soft);
  }

  .mobile-empty {
    padding: 48px 16px;
    color: var(--muted);
    text-align: center;
  }

  .mobile-pagination {
    display: flex;
    justify-content: center;
    width: 100%;
    min-width: 0;
    padding: 10px 0 8px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-details-enter-active,
  .mobile-details-leave-active {
    transition-duration: 120ms;
  }

  .mobile-details-enter-from,
  .mobile-details-leave-to {
    transform: none;
  }
}
</style>
