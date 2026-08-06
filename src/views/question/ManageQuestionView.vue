<template>
  <div id="manageQuestionView">
    <h2 class="page-title">题目管理</h2>
    <div class="page-card">
      <a-table
        :columns="columns"
        :data="dataList"
        :pagination="{
          showTotal: true,
          pageSize: searchParams.pageSize,
          current: searchParams.current,
          total,
        }"
        @page-change="onPageChange"
      >
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
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { Question, QuestionControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { Modal } from "@arco-design/web-vue";
import { useRouter } from "vue-router";

const dataList = ref([]);
const total = ref(0);
const searchParams = ref({ pageSize: 10, current: 1 });

const loadData = async () => {
  const res = await QuestionControllerService.listQuestionByPage(
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

const columns = [
  { title: "ID", dataIndex: "id" },
  { title: "标题", dataIndex: "title" },
  { title: "内容", dataIndex: "content", ellipsis: true },
  { title: "标签", slotName: "tags" },
  { title: "答案", dataIndex: "answer", ellipsis: true },
  { title: "提交数", dataIndex: "submitNum" },
  { title: "通过数", dataIndex: "acceptedNum" },
  { title: "判题配置", dataIndex: "judgeConfig", ellipsis: true },
  { title: "判题用例", dataIndex: "judgeCase", ellipsis: true },
  { title: "用户 id", dataIndex: "userId" },
  { title: "创建时间", dataIndex: "createTime" },
  { title: "操作", slotName: "optional" },
];

const onPageChange = (page: number) => {
  searchParams.value = { ...searchParams.value, current: page };
};

const doDelete = (question: Question) => {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除题目「${question.title}」吗？此操作不可撤销。`,
    okText: "删除",
    cancelText: "取消",
    okButtonProps: { status: "danger" },
    onOk: async () => {
      const res = await QuestionControllerService.deleteQuestion({
        id: question.id,
      });
      if (res.code === 0) {
        message.success("删除成功");
        loadData();
      } else {
        message.error("删除失败");
      }
    },
  });
};

const router = useRouter();

const doUpdate = (question: Question) => {
  router.push({ path: "/update/question", query: { id: question.id } });
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
}

.action-btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 3px 12px;
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
</style>
