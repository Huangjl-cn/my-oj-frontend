<template>
  <div class="page">
    <section class="panel page-head">
      <router-link
        class="icon-btn tip-down"
        to="/lists"
        data-tip="全部题单"
        aria-label="返回全部题单"
      >
        <AppIcon name="chevron-left" :size="20" />
      </router-link>
      <div class="head-main">
        <h1>
          <span class="title-text">{{ detail?.list.title ?? "题单" }}</span>
          <span v-if="detail" class="count"
            >{{ detail.questions.length }} 题</span
          >
        </h1>
        <p v-if="detail?.list.description" class="head-sub">
          {{ detail.list.description }}
        </p>
        <p v-else-if="detail?.list.type === 'official'" class="head-sub">
          官方题单
        </p>
      </div>
      <div v-if="detail" class="head-end">
        <span class="progress-text num"
          >已通过 {{ solvedCount }} / {{ detail.questions.length }}</span
        >
        <template
          v-if="detail.list.editable && detail.list.type !== 'favorite'"
        >
          <button
            class="icon-btn tip-down"
            type="button"
            data-tip="编辑"
            aria-label="编辑题单"
            @click="formOpen = true"
          >
            <AppIcon name="edit" :size="17" />
          </button>
          <button
            class="icon-btn tip-down tip-end"
            type="button"
            data-tip="删除题单"
            aria-label="删除题单"
            @click="deleteOpen = true"
          >
            <AppIcon name="trash" :size="17" />
          </button>
        </template>
      </div>
    </section>

    <section class="panel list-panel">
      <p v-if="error" class="list-empty">
        {{ error }}
        <router-link class="btn sm" to="/lists">返回全部题单</router-link>
      </p>
      <template v-else>
        <div
          v-if="detail?.questions.length"
          :class="['rows', { stale: loading }]"
        >
          <div
            v-for="(item, index) in detail.questions"
            :key="item.questionId"
            class="row"
          >
            <span class="index num">{{ index + 1 }}</span>
            <ProblemStatusIcon :status="statusOf(item.questionId)" />
            <router-link
              class="title"
              :to="`/problem/${item.questionId}`"
              @click="rememberList"
            >
              {{ item.title }}
            </router-link>
            <span class="tags">
              <span
                v-for="tag in getTopicTags(item.tags)"
                :key="tag"
                class="tag"
                >{{ tag }}</span
              >
            </span>
            <DifficultyLabel :difficulty="getDifficulty(item.tags)" />
            <span class="rate num">{{
              formatAcceptanceRate(item.acceptedNum, item.submitNum)
            }}</span>
            <span v-if="detail.list.editable" class="actions">
              <button
                class="icon-btn tip-up"
                type="button"
                data-tip="上移"
                :aria-label="`把「${item.title}」上移`"
                :disabled="index === 0 || sorting"
                @click="move(index, -1)"
              >
                <AppIcon name="arrow-up" :size="15" />
              </button>
              <button
                class="icon-btn tip-up"
                type="button"
                data-tip="下移"
                :aria-label="`把「${item.title}」下移`"
                :disabled="index === detail.questions.length - 1 || sorting"
                @click="move(index, 1)"
              >
                <AppIcon name="arrow-down" :size="15" />
              </button>
              <button
                class="icon-btn tip-up tip-end"
                type="button"
                data-tip="移出题单"
                :aria-label="`把「${item.title}」移出题单`"
                @click="remove(item.questionId, item.title)"
              >
                <AppIcon name="close" :size="15" />
              </button>
            </span>
          </div>
        </div>
        <div v-else-if="!loading && detail" class="list-empty">
          <p>
            {{
              detail.list.type === "favorite"
                ? "还没有收藏的题。在题库或做题页点星标就会出现在这里。"
                : "题单里还没有题。在做题页点「加入题单」就能加进来。"
            }}
          </p>
          <router-link class="btn sm primary" to="/">
            <AppIcon name="book" :size="16" />
            去题库
          </router-link>
        </div>
      </template>
    </section>

    <ListFormDialog
      v-model:visible="formOpen"
      :initial="
        detail
          ? { title: detail.list.title, description: detail.list.description }
          : null
      "
      :submitting="saving"
      :server-error="saveError"
      @submit="save"
    />
    <ConfirmDialog
      v-model:visible="deleteOpen"
      title="删除题单"
      :message="`确定删除「${detail?.list.title ?? ''}」吗？题目本身不受影响。`"
      confirm-text="删除"
      tone="danger"
      @confirm="removeList"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, defineProps, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import ProblemStatusIcon from "@/components/problem/ProblemStatusIcon.vue";
import ListFormDialog from "@/components/questionList/ListFormDialog.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { useMyProgress } from "@/composables/useMyProgress";
import { setListContext } from "@/services/problemNavigation";
import { formatAcceptanceRate } from "@/services/questionProgress";
import {
  deleteList,
  ListForm,
  loadListDetail,
  moveQuestion,
  QuestionListDetail,
  removeFromList,
  sortList,
  updateList,
} from "@/services/questionList";
import { getDifficulty, getTopicTags } from "@/utils/difficulty";

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();
const { statusOf, load: loadProgress } = useMyProgress();

const detail = ref<QuestionListDetail | null>(null);
const loading = ref(false);
const error = ref("");
const sorting = ref(false);
const formOpen = ref(false);
const deleteOpen = ref(false);
const saving = ref(false);
const saveError = ref("");

const solvedCount = computed(
  () =>
    detail.value?.questions.filter(
      (item) => statusOf(item.questionId) === "passed"
    ).length ?? 0
);

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    detail.value = await loadListDetail(props.id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "题单没加载出来";
  } finally {
    loading.value = false;
  }
};

/** 从题单点进题目：上一题 / 下一题和题目抽屉按这个题单走 */
const rememberList = () => {
  if (!detail.value) return;
  setListContext(
    detail.value.list.id,
    detail.value.list.title,
    detail.value.questions.map(({ questionId, title, tags }) => ({
      id: questionId,
      title,
      tags,
    }))
  );
};

const move = async (index: number, delta: -1 | 1) => {
  const current = detail.value;
  if (!current || sorting.value) return;
  const previous = current.questions;
  const next = moveQuestion(previous, index, delta);
  if (next === previous) return;
  current.questions = next;
  sorting.value = true;
  try {
    await sortList(
      current.list.id,
      next.map((item) => item.questionId)
    );
  } catch (cause) {
    current.questions = previous;
    message.error(cause instanceof Error ? cause.message : "调整顺序失败");
  } finally {
    sorting.value = false;
  }
};

const remove = async (questionId: string, title: string) => {
  const current = detail.value;
  if (!current) return;
  try {
    await removeFromList(current.list.id, questionId);
    current.questions = current.questions.filter(
      (item) => item.questionId !== questionId
    );
    message.success(`已把「${title}」移出题单`);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "移出题单失败");
  }
};

const save = async (form: ListForm) => {
  const current = detail.value;
  if (!current) return;
  saving.value = true;
  saveError.value = "";
  try {
    await updateList(current.list.id, form);
    current.list.title = form.title;
    current.list.description = form.description;
    formOpen.value = false;
    message.success("已保存");
  } catch (cause) {
    saveError.value = cause instanceof Error ? cause.message : "保存失败";
  } finally {
    saving.value = false;
  }
};

const removeList = async () => {
  const current = detail.value;
  if (!current) return;
  try {
    await deleteList(current.list.id);
    deleteOpen.value = false;
    message.success(`已删除「${current.list.title}」`);
    void router.push("/lists");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "删除失败");
  }
};

onMounted(() => {
  void loadProgress();
  void load();
});
</script>

<style scoped>
.page-head {
  flex-wrap: nowrap;
}

.head-main {
  min-width: 0;
}

.page-head h1 {
  min-width: 0;
}

.title-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.progress-text {
  margin-right: 6px;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
}

.rows {
  display: grid;
  padding: 8px;
  transition: opacity var(--motion-fast) ease;
}

.rows.stale {
  opacity: 0.55;
}

.row {
  display: grid;
  grid-template-columns: 28px 24px minmax(0, 1fr) 200px 64px 64px auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 0 12px;
  border-radius: var(--radius-md);
}

.row + .row {
  box-shadow: 0 -1px 0 var(--line);
}

.row:hover {
  background: var(--fill);
  box-shadow: none;
}

.row:hover + .row {
  box-shadow: none;
}

.index {
  color: var(--faint);
  font-size: 12.5px;
  text-align: right;
}

.title {
  overflow: hidden;
  color: var(--ink);
  font-size: 14.5px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-decoration: none;
}

.title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.tags {
  display: flex;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.rate {
  color: var(--muted);
  font-size: 13px;
  text-align: right;
}

.actions {
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--motion-fast) ease;
}

.row:hover .actions,
.row:focus-within .actions {
  opacity: 1;
}

.actions .icon-btn {
  width: 30px;
  height: 30px;
}

.list-empty {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin: auto;
  padding: 40px 20px;
  color: var(--muted);
  font-size: 13.5px;
  text-align: center;
}

.list-empty p {
  margin: 0;
}

@media (hover: none) {
  .actions {
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: 24px 24px minmax(0, 1fr) 64px auto;
  }

  .tags,
  .rate {
    display: none;
  }
}
</style>
