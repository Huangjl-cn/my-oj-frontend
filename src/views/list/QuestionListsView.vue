<template>
  <div class="page">
    <section class="panel page-head">
      <div>
        <h1>题单</h1>
        <p class="head-sub">
          收藏的题和自己整理的题单都在这里，做题时上一题 / 下一题会按题单走。
        </p>
      </div>
      <div class="head-end">
        <button class="btn primary sm" type="button" @click="formOpen = true">
          <AppIcon name="plus" :size="16" />
          新建题单
        </button>
      </div>
    </section>

    <div class="lists-body">
      <p v-if="error" class="panel load-error" role="alert">
        {{ error }}
        <button type="button" @click="load">重试</button>
      </p>

      <section class="panel group">
        <header class="group-head">
          <h2>我的题单</h2>
          <span class="count num">{{ mine.length }}</span>
        </header>
        <div :class="['cards', { loading }]">
          <router-link
            v-for="card in mine"
            :key="card.id"
            class="card"
            :to="`/lists/${card.id}`"
          >
            <span :class="['card-icon', card.type]">
              <AppIcon
                :name="card.type === 'favorite' ? 'star-filled' : 'layers'"
                :size="18"
              />
            </span>
            <span class="card-title">{{ card.title }}</span>
            <span v-if="card.description" class="card-desc">{{
              card.description
            }}</span>
            <span class="card-progress">
              <span class="bar" aria-hidden="true">
                <i
                  :style="{
                    width: barWidth(card.solvedCount, card.questionCount),
                  }"
                />
              </span>
              <span class="num">
                {{
                  card.questionCount
                    ? `已通过 ${card.solvedCount} / ${card.questionCount}`
                    : "还没有题"
                }}
              </span>
            </span>
          </router-link>
        </div>
      </section>

      <section class="panel group">
        <header class="group-head">
          <h2>官方题单</h2>
          <span class="count num">{{ official.length }}</span>
        </header>
        <div v-if="official.length" :class="['cards', { loading }]">
          <router-link
            v-for="card in official"
            :key="card.id"
            class="card"
            :to="`/lists/${card.id}`"
          >
            <span class="card-icon official">
              <AppIcon name="layers" :size="18" />
            </span>
            <span class="card-title">{{ card.title }}</span>
            <span v-if="card.description" class="card-desc">{{
              card.description
            }}</span>
            <span class="card-progress">
              <span class="bar" aria-hidden="true">
                <i
                  :style="{
                    width: barWidth(card.solvedCount, card.questionCount),
                  }"
                />
              </span>
              <span class="num">
                {{
                  card.questionCount
                    ? `已通过 ${card.solvedCount} / ${card.questionCount}`
                    : "还没有题"
                }}
              </span>
            </span>
          </router-link>
        </div>
        <p v-else-if="!loading" class="empty">
          {{
            isAdmin
              ? "还没有官方题单，新建题单时打开「官方题单」就是给所有人的"
              : "还没有官方题单"
          }}
        </p>
      </section>
    </div>

    <ListFormDialog
      v-model:visible="formOpen"
      :can-create-official="isAdmin"
      :submitting="saving"
      :server-error="saveError"
      @submit="create"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import ListFormDialog from "@/components/questionList/ListFormDialog.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { barWidth } from "@/services/learningStats";
import {
  createList,
  ListForm,
  loadMyLists,
  loadOfficialLists,
  QuestionListCard,
} from "@/services/questionList";

const store = useStore();
const router = useRouter();
const isAdmin = computed(() =>
  checkAccess(store.state.user.loginUser, ACCESS_ENUM.ADMIN)
);

const mine = ref<QuestionListCard[]>([]);
const official = ref<QuestionListCard[]>([]);
const loading = ref(false);
const error = ref("");
const formOpen = ref(false);
const saving = ref(false);
const saveError = ref("");

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    [mine.value, official.value] = await Promise.all([
      loadMyLists(),
      loadOfficialLists(),
    ]);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "题单没加载出来";
  } finally {
    loading.value = false;
  }
};

const create = async (form: ListForm) => {
  saving.value = true;
  saveError.value = "";
  try {
    const id = await createList(form);
    formOpen.value = false;
    message.success("题单建好了，去题库或做题页把题加进来");
    void router.push(`/lists/${id}`);
  } catch (cause) {
    saveError.value = cause instanceof Error ? cause.message : "新建题单失败";
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.lists-body {
  display: grid;
  align-content: start;
  gap: 14px;
  padding-bottom: 20px;
}

.group {
  display: grid;
  gap: 14px;
  padding: 20px 22px 22px;
}

.group-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.group-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.group-head .count {
  color: var(--faint);
  font-size: 13px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  transition: opacity var(--motion-fast) ease;
}

.cards.loading {
  opacity: 0.55;
}

.card {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 6px;
  min-height: 150px;
  padding: 16px 16px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
  transition: border-color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.card:hover,
.card:focus-visible {
  border-color: var(--line-strong);
  background: var(--fill);
  outline: none;
}

.card-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  border-radius: var(--radius-sm);
  background: var(--fill);
  color: var(--body);
}

.card:hover .card-icon {
  background: var(--panel);
}

.card-icon.favorite {
  color: var(--favorite);
}

.card-title {
  overflow: hidden;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.card-desc {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-progress {
  display: grid;
  gap: 6px;
  align-self: end;
  margin-top: 8px;
  color: var(--faint);
  font-size: 12.5px;
}

.bar {
  display: block;
  height: 5px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--fill-strong);
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--success);
}

.empty {
  margin: 0;
  color: var(--faint);
  font-size: 13px;
}

.load-error {
  margin: 0;
  padding: 14px 20px;
  color: var(--body);
  font-size: 13.5px;
}

.load-error button {
  margin-left: 8px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
</style>
