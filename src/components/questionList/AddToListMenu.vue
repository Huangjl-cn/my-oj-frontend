<template>
  <div ref="rootRef" class="add-menu">
    <button
      :class="['icon-btn', 'tip-down', 'tip-end', { on: open }]"
      type="button"
      :data-tip="open ? undefined : '加入题单'"
      aria-label="加入题单"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <AppIcon name="list-plus" :size="18" />
    </button>

    <div v-if="open" class="menu" role="menu" aria-label="加入题单">
      <p class="menu-title">加入题单</p>
      <p v-if="loading" class="hint">加载中…</p>
      <p v-else-if="error" class="hint">
        {{ error }}
        <button class="link" type="button" @click="refresh">重试</button>
      </p>
      <template v-else>
        <button
          v-for="list in lists"
          :key="list.id"
          class="menu-item"
          type="button"
          role="menuitemcheckbox"
          :aria-checked="contains.has(list.id)"
          :disabled="busy.has(list.id)"
          @click="toggleList(list)"
        >
          <span :class="['check', { on: contains.has(list.id) }]">
            <AppIcon v-if="contains.has(list.id)" name="check" :size="13" />
          </span>
          <span class="name">{{ list.title }}</span>
          <span class="count num">{{ list.questionCount }}</span>
        </button>
        <p v-if="!lists.length" class="hint">还没有自己的题单，在下面建一个</p>
      </template>

      <form class="new" @submit.prevent="createAndAdd">
        <input
          v-model="newTitle"
          class="new-input"
          maxlength="40"
          placeholder="新建题单，回车加入"
          aria-label="新题单的标题"
        />
        <button
          class="icon-btn"
          type="submit"
          :disabled="!newTitle.trim() || creating"
          aria-label="新建题单并把这道题加进去"
        >
          <AppIcon name="plus" :size="16" />
        </button>
      </form>
      <router-link class="manage" to="/lists">管理我的题单</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { defineProps, PropType, ref, watch } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { useDismissable } from "@/composables/useDismissable";
import { ApiId } from "@/services/apiId";
import {
  addToList,
  createList,
  loadListIdsContaining,
  loadMyLists,
  QuestionListCard,
  removeFromList,
} from "@/services/questionList";

/** 做题页的「加入题单」：勾选自己的题单（收藏由星标管，不在这里），也可以直接新建一个 */
const props = defineProps({
  questionId: { type: [String, Number] as PropType<ApiId>, required: true },
});

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
useDismissable(rootRef, open);

const lists = ref<QuestionListCard[]>([]);
const contains = ref<Set<string>>(new Set());
const busy = ref<Set<string>>(new Set());
const loading = ref(false);
const error = ref("");
const newTitle = ref("");
const creating = ref(false);

const refresh = async () => {
  loading.value = true;
  error.value = "";
  try {
    const [mine, containing] = await Promise.all([
      loadMyLists(),
      loadListIdsContaining(props.questionId),
    ]);
    lists.value = mine.filter((list) => list.type !== "favorite");
    contains.value = new Set(containing);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "题单没加载出来";
  } finally {
    loading.value = false;
  }
};

watch(open, (value) => {
  if (value) void refresh();
});

const setBusy = (id: string, on: boolean) => {
  const next = new Set(busy.value);
  if (on) next.add(id);
  else next.delete(id);
  busy.value = next;
};

const toggleList = async (list: QuestionListCard) => {
  const inList = contains.value.has(list.id);
  setBusy(list.id, true);
  try {
    if (inList) await removeFromList(list.id, props.questionId);
    else await addToList(list.id, props.questionId);
    const next = new Set(contains.value);
    if (inList) next.delete(list.id);
    else next.add(list.id);
    contains.value = next;
    list.questionCount += inList ? -1 : 1;
    message.success(
      inList ? `已从「${list.title}」移出` : `已加入「${list.title}」`
    );
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败");
  } finally {
    setBusy(list.id, false);
  }
};

const createAndAdd = async () => {
  const title = newTitle.value.trim();
  if (!title || creating.value) return;
  creating.value = true;
  try {
    const id = await createList({ title, description: "" });
    await addToList(id, props.questionId);
    newTitle.value = "";
    message.success(`已新建「${title}」并加入`);
    await refresh();
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "新建题单失败");
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.add-menu {
  position: relative;
}

.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 40;
  width: 260px;
  display: grid;
  gap: 2px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-float);
  animation: menu-in var(--motion-fast) var(--ease-out);
}

.menu-title {
  margin: 2px 8px 6px;
  color: var(--muted);
  font-size: 12.5px;
}

.menu-item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--body);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
  background: var(--fill);
  color: var(--ink);
  outline: none;
}

.menu-item:disabled {
  opacity: 0.6;
  cursor: default;
}

.check {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 1.5px solid var(--line-strong);
  border-radius: 5px;
}

.check.on {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--panel);
}

.name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.count {
  color: var(--faint);
  font-size: 12px;
}

.hint {
  margin: 4px 8px 8px;
  color: var(--faint);
  font-size: 13px;
}

.link {
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.new {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}

.new-input {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--fill);
  color: var(--ink);
  font: inherit;
  font-size: 13.5px;
}

.new-input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.new .icon-btn {
  width: 34px;
  height: 34px;
}

.manage {
  margin: 6px 8px 2px;
  color: var(--muted);
  font-size: 12.5px;
  text-decoration: none;
}

.manage:hover {
  color: var(--ink);
}

@keyframes menu-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu {
    animation: none;
  }
}
</style>
