<template>
  <div id="manageQuestionView">
    <h2 class="page-title">{{ pageTitle }}</h2>
    <div class="page-card">
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
        <template #id="{ record }">
          <span class="table-id" :title="String(record.id ?? '')">
            {{ record.id ?? "--" }}
          </span>
        </template>
        <template #tags="{ record }">
          <span v-if="record.tags" class="tag-list">
            <span
              v-for="(tag, i) in typeof record.tags === 'string'
                ? JSON.parse(record.tags)
                : record.tags"
              :key="i"
              class="tag"
              >{{ tag }}</span
            >
          </span>
        </template>
        <template #userId="{ record }">
          <span class="table-id" :title="String(record.userId ?? '')">
            {{ record.userId ?? "--" }}
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
import { toGeneratedApiId } from "@/services/apiId";
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
const dataList = ref<QuestionListRecord[]>([]);
const total = ref(0);
const searchParams = ref({ pageSize: 10, current: 1 });
const showDeleteDialog = ref(false);
const pendingDeleteQuestion = ref<QuestionListRecord | null>(null);

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
  { title: "ID", slotName: "id", width: 130 },
  {
    title: "标题",
    dataIndex: "title",
    width: 180,
    ellipsis: true,
    tooltip: true,
  },
  { title: "标签", slotName: "tags", width: 120 },
  { title: "提交数", dataIndex: "submitNum", width: 60, align: "center" },
  { title: "通过数", dataIndex: "acceptedNum", width: 60, align: "center" },
  { title: "创建者 ID", slotName: "userId", width: 130 },
  { title: "创建时间", slotName: "createTime", width: 130 },
  { title: "操作", slotName: "optional", width: 130 },
];

const myQuestionColumns = [
  { title: "ID", slotName: "id", width: 130 },
  {
    title: "标题",
    dataIndex: "title",
    width: 180,
    ellipsis: true,
    tooltip: true,
  },
  { title: "标签", slotName: "tags", width: 120 },
  { title: "提交数", dataIndex: "submitNum", width: 60, align: "center" },
  { title: "通过数", dataIndex: "acceptedNum", width: 60, align: "center" },
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
  transition: all 0.15s;
  line-height: 1.4;
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
  background: var(--surface-cream-strong) !important;
}
</style>
