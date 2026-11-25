<template>
  <nav v-if="pageCount > 1" class="pager" aria-label="分页">
    <button
      class="pager-btn"
      type="button"
      aria-label="上一页"
      :disabled="current <= 1"
      @click="go(current - 1)"
    >
      <AppIcon name="chevron-left" :size="16" />
    </button>
    <template v-for="(page, index) in pages" :key="index">
      <span v-if="page === 0" class="pager-gap">…</span>
      <button
        v-else
        :class="['pager-btn', 'num', { on: page === current }]"
        type="button"
        :aria-current="page === current ? 'page' : undefined"
        @click="go(page)"
      >
        {{ page }}
      </button>
    </template>
    <button
      class="pager-btn"
      type="button"
      aria-label="下一页"
      :disabled="current >= pageCount"
      @click="go(current + 1)"
    >
      <AppIcon name="chevron-right" :size="16" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, required: true },
});

const emit = defineEmits<{
  (event: "change", page: number): void;
}>();

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize))
);

/** 页码列表，0 表示省略号；最多显示 7 个位置 */
const pages = computed(() => {
  const count = pageCount.value;
  const current = props.current;
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 1, count - 4));
  const end = Math.min(count - 1, Math.max(current + 1, 5));
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return [
    1,
    ...(start > 2 ? [0] : []),
    ...middle,
    ...(end < count - 1 ? [0] : []),
    count,
  ];
});

const go = (page: number) => {
  if (page < 1 || page > pageCount.value || page === props.current) return;
  emit("change", page);
};
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.pager-btn {
  min-width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0 6px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 13.5px;
  cursor: pointer;
}

.pager-btn:hover:not(:disabled) {
  background: var(--fill);
  color: var(--ink);
}

.pager-btn:disabled {
  cursor: default;
  opacity: 0.35;
}

.pager-btn.on {
  background: var(--primary);
  color: var(--on-primary);
  font-weight: 600;
}

.pager-gap {
  min-width: 20px;
  color: var(--faint);
  text-align: center;
}
</style>
