<template>
  <div class="page">
    <section class="panel page-head">
      <h1>
        {{ pageTitle }}
        <span class="count num">{{ total }}</span>
      </h1>
      <div class="head-end">
        <router-link class="btn primary sm" to="/add/question">
          <AppIcon name="plus" :size="16" />
          创建题目
        </router-link>
      </div>
    </section>

    <section class="panel list-panel">
      <div class="list-toolbar">
        <UiInput
          v-model="keyword"
          icon="search"
          placeholder="搜索题目"
          clearable
        />
        <div class="toolbar-end">
          <button
            class="icon-btn tip-down tip-end"
            type="button"
            data-tip="刷新"
            aria-label="刷新"
            :disabled="loading"
            @click="loadData"
          >
            <AppIcon name="refresh" :size="17" />
          </button>
        </div>
      </div>

      <div :class="['list-rows', { stale: loading && dataList.length }]">
        <div v-if="dataList.length" :class="['list-head', columnsClass]">
          <span>题目</span>
          <span v-if="scope === 'all'">出题人</span>
          <span>难度</span>
          <span>提交</span>
          <span>通过</span>
          <span>{{ scope === "mine" ? "更新" : "创建" }}</span>
          <span />
        </div>
        <template v-for="question in dataList" :key="String(question.id)">
          <div
            :class="[
              'list-row',
              columnsClass,
              { open: isExpanded(question.id) },
            ]"
          >
            <div class="title-cell">
              <router-link
                class="cell-title"
                :to="`/problem/${question.id}`"
                :title="question.title"
              >
                {{ question.title || "未命名题目" }}
              </router-link>
              <span v-if="topicTags(question).length" class="tag-list">
                <span v-for="tag in topicTags(question)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </span>
            </div>
            <UserIdentity
              v-if="scope === 'all'"
              :user-id="getQuestionUserId(question)"
              :size="26"
              compact
            />
            <DifficultyLabel :difficulty="getDifficulty(tagsOf(question))" />
            <span class="cell-stat num">{{ question.submitNum ?? 0 }}</span>
            <span class="cell-stat num">{{ question.acceptedNum ?? 0 }}</span>
            <time class="cell-faint num">{{
              formatDate(
                scope === "mine" ? question.updateTime : question.createTime
              )
            }}</time>
            <span class="row-actions">
              <button
                v-if="scope === 'all'"
                class="icon-btn tip-up"
                type="button"
                :data-tip="isExpanded(question.id) ? '收起' : '判题配置'"
                :aria-expanded="isExpanded(question.id)"
                aria-label="判题配置"
                @click="toggleExpanded(question.id)"
              >
                <AppIcon
                  name="chevron-down"
                  :size="16"
                  :class="['chevron', { open: isExpanded(question.id) }]"
                />
              </button>
              <button
                class="icon-btn tip-up"
                type="button"
                data-tip="修改"
                aria-label="修改题目"
                @click="doUpdate(question)"
              >
                <AppIcon name="edit" :size="16" />
              </button>
              <button
                class="icon-btn danger tip-up tip-end"
                type="button"
                data-tip="删除"
                aria-label="删除题目"
                @click="doDelete(question)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </span>
          </div>
          <div
            v-if="scope === 'all' && isExpanded(question.id)"
            class="row-extra"
          >
            <QuestionAdminDetailsPanel :question="getAdminQuestion(question)" />
          </div>
        </template>

        <div v-if="!dataList.length && !loading" class="list-empty">
          <CompanionAvatar :size="56" mood="thoughtful" />
          <p>{{ keyword ? "没有找到这道题" : emptyText }}</p>
          <router-link v-if="!keyword" class="btn sm" to="/add/question">
            <AppIcon name="plus" :size="16" />
            创建题目
          </router-link>
        </div>
      </div>

      <UiPagination
        class="list-pager"
        :current="searchParams.current"
        :total="total"
        :page-size="searchParams.pageSize"
        @change="onPageChange"
      />
    </section>

    <ConfirmDialog
      v-model:visible="showDeleteDialog"
      title="删除题目"
      :message="`确定删除「${
        pendingDeleteQuestion?.title || ''
      }」吗？题目和它的提交记录都会删掉，不能撤销。`"
      confirm-text="删除题目"
      tone="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, defineProps, ref, watch, withDefaults } from "vue";
import { useRouter } from "vue-router";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import QuestionAdminDetailsPanel from "@/components/question/QuestionAdminDetailsPanel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import UserIdentity from "@/components/user/UserIdentity.vue";
import { ApiId, toGeneratedApiId } from "@/services/apiId";
import { formatDateTime } from "@/utils/dateTime";
import { getDifficulty, getTopicTags } from "@/utils/difficulty";
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

const router = useRouter();
const pageTitle = computed(() =>
  props.scope === "mine" ? "我的题目" : "题目管理"
);
const emptyText = computed(() =>
  props.scope === "mine" ? "还没有出过题" : "题库还是空的"
);
const columnsClass = computed(() =>
  props.scope === "mine" ? "cols-mine" : "cols-all"
);
const dataList = ref<QuestionListRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const keyword = ref("");
const searchParams = ref({ pageSize: 10, current: 1, title: "" });
const showDeleteDialog = ref(false);
const pendingDeleteQuestion = ref<QuestionListRecord | null>(null);
const expandedIds = ref<string[]>([]);

/** 管理接口返回的 tags 是 JSON 字符串，普通接口返回数组 */
const tagsOf = (question: QuestionListRecord): string[] => {
  if (Array.isArray(question.tags)) return question.tags;
  if (!question.tags) return [];
  try {
    const tags = JSON.parse(question.tags);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
};
const topicTags = (question: QuestionListRecord) =>
  getTopicTags(tagsOf(question)).slice(0, 3);

const getQuestionUserId = (question: QuestionListRecord) => {
  if ("userId" in question) return question.userId;
  // 没有 userId 的是 QuestionVO：作者 id 在 userVO 里，或者是小写的 userid
  const vo = question as QuestionVO;
  return vo.userVO?.id ?? vo.userid;
};

const getAdminQuestion = (question: QuestionListRecord) => question as Question;

const formatDate = (value?: string) => formatDateTime(value).slice(0, 10);

const isExpanded = (questionId?: ApiId) =>
  questionId != null && expandedIds.value.includes(String(questionId));

const toggleExpanded = (questionId?: ApiId) => {
  if (questionId == null) return;
  const id = String(questionId);
  expandedIds.value = isExpanded(questionId)
    ? expandedIds.value.filter((item) => item !== id)
    : [...expandedIds.value, id];
};

let loadGeneration = 0;
const loadData = async () => {
  const generation = ++loadGeneration;
  loading.value = true;
  try {
    const request = {
      ...searchParams.value,
      title: searchParams.value.title || undefined,
    };
    const res =
      props.scope === "mine"
        ? await QuestionControllerService.listMyQuestionVoByPage(request)
        : await QuestionControllerService.listQuestionByPage(request);
    if (generation !== loadGeneration) return;
    if (res.code === 0) {
      dataList.value = res.data?.records ?? [];
      total.value = Number(res.data?.total ?? 0);
    } else {
      message.error(`加载失败，${res.message || "请稍后重试"}`);
    }
  } catch {
    if (generation === loadGeneration) message.error("加载失败，请稍后重试");
  } finally {
    if (generation === loadGeneration) loading.value = false;
  }
};

watch(searchParams, loadData, { deep: true, immediate: true });

let keywordTimer: number | undefined;
watch(keyword, (value) => {
  window.clearTimeout(keywordTimer);
  keywordTimer = window.setTimeout(() => {
    searchParams.value = {
      ...searchParams.value,
      title: value.trim(),
      current: 1,
    };
  }, 300);
});

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
    message.success("已删除");
    showDeleteDialog.value = false;
    pendingDeleteQuestion.value = null;
    void loadData();
  } else {
    message.error(`删除失败，${res.message || "请稍后重试"}`);
  }
};

const doUpdate = (question: QuestionListRecord) => {
  void router.push({
    path: "/update/question",
    query: {
      id: question.id,
      ...(props.scope === "mine" ? { from: "my" } : {}),
    },
  });
};
</script>

<style scoped>
.cols-all {
  grid-template-columns: minmax(0, 1fr) 150px 64px 56px 56px 96px 112px;
}

.cols-mine {
  grid-template-columns: minmax(0, 1fr) 64px 56px 56px 96px 80px;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.title-cell .cell-title {
  flex: 0 1 auto;
  text-decoration: none;
}

.title-cell .cell-title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.title-cell .tag-list {
  flex: 0 1 auto;
}

.chevron {
  transition: transform var(--motion-fast) ease;
}

.chevron.open {
  transform: rotate(180deg);
}

@media (max-width: 1100px) {
  .cols-all {
    grid-template-columns: minmax(0, 1fr) 64px 56px 56px 112px;
  }

  .cols-all > :nth-child(2),
  .cols-all > :nth-child(6) {
    display: none;
  }

  .title-cell .tag-list {
    display: none;
  }
}

@media (max-width: 720px) {
  .cols-all,
  .cols-mine {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .list-row > :not(.title-cell):not(.row-actions) {
    display: none;
  }
}
</style>
