<template>
  <div class="page">
    <section class="panel page-head">
      <div>
        <h1>题单</h1>
      </div>
      <div class="head-end">
        <button class="btn primary sm" type="button" @click="formOpen = true">
          <AppIcon name="plus" :size="16" />
          新建题单
        </button>
      </div>
    </section>

    <p v-if="error" class="panel load-error" role="alert">
      {{ error }}
      <button type="button" @click="load">重试</button>
    </p>

    <!-- 便当格：收藏是左边的大卡，自建题单在右边两列，官方题单一行四张 -->
    <div :class="['bento', { loading }]">
      <section v-if="favorite" class="panel favorite">
        <div class="fav-top">
          <div class="fav-title">
            <span class="card-icon favorite-icon">
              <AppIcon name="star-filled" :size="18" />
            </span>
            <h2>{{ favorite.title }}</h2>
            <p class="fav-meta num">
              {{ favorite.questionCount }} 题 · 已通过
              {{ favorite.solvedCount }}
            </p>
          </div>
          <svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
            <circle class="ring-track" cx="18" cy="18" r="15" />
            <circle
              class="ring-value"
              cx="18"
              cy="18"
              r="15"
              :stroke-dasharray="`${ringLength} 94.25`"
            />
            <text x="18" y="20.6" text-anchor="middle">{{ percent }}%</text>
          </svg>
        </div>

        <div v-if="!favorite.questionCount" class="fav-empty">
          点题目旁的 <AppIcon name="star" :size="14" /> 收藏
        </div>
        <template v-else>
          <p class="next-label">
            {{ nextUp.length ? "接着做" : "收藏的题都通过了" }}
          </p>
          <ul v-if="nextUp.length" class="next-list">
            <li v-for="item in nextUp" :key="item.questionId">
              <button type="button" @click="openQuestion(item.questionId)">
                <ProblemStatusIcon :status="statusOf(item.questionId)" />
                <span class="next-title">{{ item.title }}</span>
                <DifficultyLabel
                  v-if="getDifficulty(item.tags)"
                  :difficulty="getDifficulty(item.tags)"
                />
              </button>
            </li>
          </ul>
        </template>

        <div class="fav-actions">
          <button
            v-if="nextUp.length"
            class="btn primary sm"
            type="button"
            @click="openQuestion(nextUp[0].questionId)"
          >
            继续做
          </button>
          <router-link class="btn sm" :to="`/lists/${favorite.id}`">
            打开
          </router-link>
        </div>
      </section>

      <div class="mine">
        <router-link
          v-for="card in custom"
          :key="card.id"
          class="panel card"
          :to="`/lists/${card.id}`"
        >
          <span class="card-icon">
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
                  ? `${card.solvedCount} / ${card.questionCount}`
                  : "还没有题"
              }}
            </span>
          </span>
        </router-link>
        <button class="card new-card" type="button" @click="formOpen = true">
          <span class="new-plus"><AppIcon name="plus" :size="20" /></span>
          新建题单
        </button>
      </div>

      <template v-if="official.length || isAdmin">
        <h2 class="section-label">
          官方题单 <span class="num">{{ official.length }}</span>
        </h2>
        <router-link
          v-for="card in official"
          :key="card.id"
          class="panel card official"
          :to="`/lists/${card.id}`"
        >
          <span class="badge">官方</span>
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
                  ? `${card.solvedCount} / ${card.questionCount}`
                  : "还没有题"
              }}
            </span>
          </span>
        </router-link>
        <p v-if="!official.length && !loading" class="official-empty">
          新建时打开「官方题单」，所有人都能看到
        </p>
      </template>
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
import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import ProblemStatusIcon from "@/components/problem/ProblemStatusIcon.vue";
import ListFormDialog from "@/components/questionList/ListFormDialog.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { useMyProgress } from "@/composables/useMyProgress";
import { barWidth } from "@/services/learningStats";
import { setListContext } from "@/services/problemNavigation";
import {
  createList,
  ListForm,
  loadListDetail,
  loadMyLists,
  loadOfficialLists,
  QuestionListCard,
  QuestionListDetail,
} from "@/services/questionList";
import { getDifficulty } from "@/utils/difficulty";

/** 收藏卡里「接着做」列几道 */
const NEXT_COUNT = 3;
const RING = 94.25;

const store = useStore();
const router = useRouter();
const isAdmin = computed(() =>
  checkAccess(store.state.user.loginUser, ACCESS_ENUM.ADMIN)
);
const { statusOf, load: loadProgress } = useMyProgress();

const mine = ref<QuestionListCard[]>([]);
const official = ref<QuestionListCard[]>([]);
const favoriteDetail = ref<QuestionListDetail | null>(null);
const loading = ref(false);
const error = ref("");
const formOpen = ref(false);
const saving = ref(false);
const saveError = ref("");

const favorite = computed(
  () => mine.value.find((card) => card.type === "favorite") ?? null
);
const custom = computed(() =>
  mine.value.filter((card) => card.type !== "favorite")
);

/** 收藏里还没通过的前几道 */
const nextUp = computed(() =>
  (favoriteDetail.value?.questions ?? [])
    .filter((item) => statusOf(item.questionId) !== "passed")
    .slice(0, NEXT_COUNT)
);

const percent = computed(() => {
  const card = favorite.value;
  return card && card.questionCount
    ? Math.round((card.solvedCount / card.questionCount) * 100)
    : 0;
});
const ringLength = computed(
  () => Math.round((percent.value / 100) * RING * 10) / 10
);

const load = async () => {
  loading.value = true;
  error.value = "";
  void loadProgress();
  try {
    [mine.value, official.value] = await Promise.all([
      loadMyLists(),
      loadOfficialLists(),
    ]);
    const card = favorite.value;
    favoriteDetail.value =
      card && card.questionCount ? await loadListDetail(card.id) : null;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "题单没加载出来";
  } finally {
    loading.value = false;
  }
};

/** 从收藏点进题目：上一题 / 下一题按收藏走 */
const openQuestion = (questionId: string) => {
  const detail = favoriteDetail.value;
  if (detail) {
    setListContext(
      detail.list.id,
      detail.list.title,
      detail.questions.map(({ questionId: id, title, tags }) => ({
        id,
        title,
        tags,
      }))
    );
  }
  void router.push(`/problem/${questionId}`);
};

const create = async (form: ListForm) => {
  saving.value = true;
  saveError.value = "";
  try {
    const id = await createList(form);
    formOpen.value = false;
    message.success("建好了，去题库加题吧");
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
/* === 便当格：左边收藏 5 列，右边自建题单 7 列（两列小卡），官方题单一行四张 === */
.bento {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  /* 页面比内容高时各行保持自己的高度，不被拉长 */
  align-content: start;
  gap: 14px;
  padding-bottom: 20px;
  transition: opacity var(--motion-fast) ease;
}

.bento.loading {
  opacity: 0.6;
}

.favorite {
  grid-column: span 5;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 22px;
}

.mine {
  grid-column: span 7;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(150px, 1fr);
  gap: 14px;
}

/* 没有收藏卡（还没加载出来）时自建题单占满 */
.favorite + .mine {
  grid-column: span 7;
}

.mine:first-child {
  grid-column: span 12;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.section-label {
  grid-column: span 12;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 6px 4px 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.section-label .num {
  color: var(--faint);
  font-size: 13px;
  font-weight: 500;
}

.official {
  grid-column: span 3;
}

.official-empty {
  grid-column: span 12;
  margin: 0 4px;
  color: var(--faint);
  font-size: 13px;
}

/* === 收藏卡 === */
.fav-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.fav-title h2 {
  margin: 10px 0 2px;
  color: var(--ink);
  font-size: 19px;
  font-weight: 800;
}

.fav-meta {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.ring {
  width: 104px;
  height: 104px;
  flex: none;
}

.ring circle {
  fill: none;
  stroke-width: 3.2;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.ring-track {
  stroke: var(--fill-strong);
}

.ring-value {
  stroke: var(--ink);
  stroke-linecap: round;
  transition: stroke-dasharray var(--motion-standard) var(--ease-out);
}

.ring text {
  fill: var(--ink);
  font-size: 7.5px;
  font-weight: 800;
}

.fav-empty {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: auto 0;
  color: var(--muted);
  font-size: 13.5px;
}

.next-label {
  margin: 4px 0 -6px;
  color: var(--faint);
  font-size: 12.5px;
}

.next-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.next-list li + li {
  border-top: 1px solid var(--line);
}

.next-list button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 2px;
  border: none;
  background: none;
  color: var(--body);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.next-list button:hover .next-title {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.next-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fav-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.fav-actions a {
  text-decoration: none;
}

/* === 小卡 === */
.card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  color: inherit;
  text-decoration: none;
  transition: border-color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

a.card:hover,
a.card:focus-visible {
  border-color: var(--line-strong);
  background: color-mix(in srgb, var(--fill) 60%, var(--panel));
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

.favorite-icon {
  color: var(--favorite);
}

.badge {
  align-self: flex-start;
  margin-bottom: 4px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--tint-blue) 10%, var(--panel));
  color: var(--tint-blue);
  font-size: 12px;
  line-height: 22px;
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
  margin-top: auto;
  padding-top: 8px;
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

/* 新建：虚线卡，补在自建题单的空位上 */
.new-card {
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1.5px dashed var(--line-strong);
  border-radius: var(--radius-lg);
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 13.5px;
  cursor: pointer;
}

.new-card:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.new-plus {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--fill);
  color: var(--ink);
}

.load-error {
  margin: 0 0 14px;
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

@media (max-width: 1100px) {
  .favorite,
  .favorite + .mine {
    grid-column: span 12;
  }

  .official {
    grid-column: span 6;
  }
}

@media (max-width: 640px) {
  .mine {
    grid-template-columns: minmax(0, 1fr);
  }

  .official {
    grid-column: span 12;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ring-value {
    transition: none;
  }
}
</style>
