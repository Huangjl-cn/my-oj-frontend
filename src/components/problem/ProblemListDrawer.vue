<template>
  <div class="drawer" role="dialog" aria-label="题目列表">
    <header>
      <strong v-if="context?.listId" class="list-title">
        <router-link :to="`/lists/${context.listId}`" title="打开题单">
          {{ context.listTitle || "题单" }}
        </router-link>
      </strong>
      <strong v-else>题目列表</strong>
      <span v-if="context" class="count num">{{ context.total }}</span>
      <button
        class="icon-btn tip-down"
        type="button"
        data-tip="关闭"
        aria-label="关闭题目列表"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </header>

    <div :class="['items', { stale: loading }]">
      <button
        v-for="item in context?.items ?? []"
        :key="String(item.id)"
        :class="['item', { on: String(item.id) === String(currentId) }]"
        type="button"
        @click="item.id != null && emit('go', item.id)"
      >
        <ProblemStatusIcon :status="statusOf(item.id)" />
        <span class="title">{{ item.title }}</span>
        <DifficultyLabel :difficulty="getDifficulty(item.tags)" />
      </button>
      <p v-if="!loading && !context?.items.length" class="hint">
        {{ failed ? "题目没加载出来" : "没有题目" }}
      </p>
    </div>

    <UiPagination
      v-if="context && !context.listId"
      class="pager"
      :current="context.page"
      :total="context.total"
      :page-size="context.pageSize"
      @change="loadPage"
    />
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, onMounted, PropType, ref } from "vue";

import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import ProblemStatusIcon from "@/components/problem/ProblemStatusIcon.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import { useMyProgress } from "@/composables/useMyProgress";
import { ApiId } from "@/services/apiId";
import {
  getProblemListContext,
  loadProblemListPage,
  ProblemListContext,
} from "@/services/problemNavigation";
import { getDifficulty } from "@/utils/difficulty";

defineProps({
  currentId: {
    type: [String, Number] as PropType<ApiId | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (event: "go", id: ApiId): void;
  (event: "close"): void;
}>();

const { statusOf } = useMyProgress();
const context = ref<ProblemListContext | null>(getProblemListContext());
const loading = ref(false);
const failed = ref(false);

const loadPage = async (page: number) => {
  loading.value = true;
  failed.value = false;
  try {
    const loaded = await loadProblemListPage(page);
    if (loaded) context.value = loaded;
    else failed.value = true;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
};

// 直接打开题目链接时没有题库页留下的列表，用默认顺序的第一页
onMounted(() => {
  if (!context.value) void loadPage(1);
});
</script>

<style scoped>
.drawer {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  animation: drawer-in var(--motion-standard) var(--ease-drawer);
}

header {
  height: 54px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 18px;
  border-bottom: 1px solid var(--line);
}

header strong {
  color: var(--ink);
  font-size: 15px;
}

.list-title {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.list-title a {
  color: inherit;
  text-decoration: none;
}

.list-title a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.count {
  color: var(--faint);
  font-size: 13px;
}

header .icon-btn {
  margin-left: auto;
}

.items {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 8px;
  transition: opacity var(--motion-fast) ease;
}

.items.stale {
  opacity: 0.55;
}

.item {
  width: 100%;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.item:hover,
.item:focus-visible {
  background: var(--fill);
}

.item.on {
  background: var(--fill-strong);
}

.title {
  overflow: hidden;
  color: var(--ink);
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item.on .title {
  font-weight: 700;
}

.hint {
  margin: 0;
  padding: 24px 12px;
  color: var(--muted);
}

.pager {
  flex: none;
  padding: 10px 0 12px;
  border-top: 1px solid var(--line);
}

@keyframes drawer-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer {
    animation: none;
  }
}
</style>
