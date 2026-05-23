<template>
  <div id="questionsView">
    <a-form class="search-form" :model="searchParams" layout="inline">
      <a-form-item field="title" label="名称" style="min-width: 240px">
        <a-input v-model="searchParams.title" placeholder="请输入名称" />
      </a-form-item>
      <a-form-item field="tags" label="标签" style="min-width: 240px">
        <a-input-tag v-model="searchParams.tags" placeholder="请输入标签" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="doSubmit" class="action-button"
          >提交</a-button
        >
      </a-form-item>
    </a-form>
    <a-divider class="arco-divider" size="0" />
    <div class="table-container">
      <a-table
        :ref="tableRef"
        :columns="columns"
        :data="dataList"
        :pagination="false"
        @page-change="onPageChange"
      >
        <template #tags="{ record }">
          <a-space wrap>
            <a-tag
              v-for="(tag, index) of record.tags"
              :key="index"
              class="tag-item"
              >{{ tag }}
            </a-tag>
          </a-space>
        </template>
        <template #createTime="{ record }">
          {{ moment(record.createTime).format("YYYY-MM-DD HH:mm:ss") }}
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button
              type="primary"
              @click="toQuestionPage(record)"
              class="action-button"
            >
              做题
            </a-button>
          </a-space>
        </template>
      </a-table>
    </div>
    <div class="pagination-container">
      <a-pagination
        showTotal
        :pageSize="searchParams.pageSize"
        :current="searchParams.current"
        :total="total"
        @page-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import {
  Page_Question_,
  Question,
  QuestionControllerService,
  QuestionQueryRequest,
} from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import * as querystring from "querystring";
import { useRouter } from "vue-router";
import moment from "moment";

const tableRef = ref();

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

/**
 * 监听 searchParams 变量，改变时触发页面的重新加载
 */
watchEffect(() => {
  loadData();
});

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  loadData();
});

// {id: "1", title: "A+ D", content: "新的题目内容", tags: "["二叉树"]", answer: "新的答案", submitNum: 0,…}

const columns = [
  {
    title: "题号",
    dataIndex: "id",
  },
  {
    title: "题目名称",
    dataIndex: "title",
  },
  {
    title: "标签",
    slotName: "tags",
  },
  {
    title: "创建时间",
    slotName: "createTime",
  },
  {
    slotName: "optional",
  },
];

const onPageChange = (page: number) => {
  searchParams.value = {
    ...searchParams.value,
    current: page,
  };
};

const router = useRouter();

/**
 * 跳转到做题页面
 * @param question
 */
const toQuestionPage = (question: Question) => {
  router.push({
    path: `/view/question/${question.id}`,
  });
};

/**
 * 确认搜索，重新加载数据
 */
const doSubmit = () => {
  // 这里需要重置搜索页号
  searchParams.value = {
    ...searchParams.value,
    current: 1,
  };
};
</script>

<style scoped>
#questionsView {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  position: relative;
  z-index: 1;
}

/* 搜索表单样式 */
.search-form {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
  transition: all var(--transition-normal);
  animation: fadeIn var(--transition-normal) ease-out;
}

.search-form:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--border-light);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
}

/* 分割线样式 */
.arco-divider {
  margin: var(--spacing-lg) 0;
  border-color: var(--border-color) !important;
}

/* 表格容器样式 */
.table-container {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all var(--transition-normal);
  animation: fadeIn var(--transition-normal) ease-out 0.2s both;
}

.table-container:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--border-light);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
}

/* 表格样式 */
.table-container .arco-table {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.table-container .arco-table-th {
  background-color: rgba(255, 255, 255, 0.7) !important;
  color: var(--text-primary) !important;
  font-weight: 600 !important;
  border-bottom: 1px solid var(--border-color) !important;
  padding: var(--spacing-lg) !important;
}

.table-container .arco-table-td {
  background-color: transparent !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
  padding: var(--spacing-lg) !important;
  transition: all var(--transition-fast) !important;
}

.table-container .arco-table-tr:hover .arco-table-td {
  background-color: var(--hover-color) !important;
  color: var(--text-primary) !important;
}

/* 标签样式 */
.tag-item {
  margin-right: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  transition: all var(--transition-fast) !important;
  font-weight: 500 !important;
}

.tag-item:hover {
  transform: translateY(-1px) !important;
  box-shadow: var(--shadow-sm) !important;
}

/* 按钮样式 */
.action-button {
  transition: all var(--transition-fast) !important;
  font-weight: 500 !important;
  border-radius: var(--border-radius-md) !important;
}

.action-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
}

/* 分页样式 */
.pagination-container {
  margin-top: var(--spacing-xl);
  display: flex;
  justify-content: center;
  animation: fadeIn var(--transition-normal) ease-out 0.4s both;
}

.pagination-container .arco-pagination {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  padding: var(--spacing-md);
  transition: all var(--transition-normal);
}

.pagination-container .arco-pagination:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-light);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  #questionsView {
    padding: var(--spacing-md);
  }

  .search-form {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .arco-form {
    flex-direction: column !important;
    align-items: stretch !important;
  }

  .arco-form-item {
    margin-bottom: var(--spacing-md) !important;
  }

  .table-container .arco-table-th,
  .table-container .arco-table-td {
    padding: var(--spacing-md) !important;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
