<template>
  <div ref="rootRef" class="rail-menu">
    <button
      :class="['rail-btn', { on: active || open }]"
      type="button"
      :data-tip="open || noTip ? undefined : label"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <slot name="trigger">
        <AppIcon v-if="icon" :name="icon" :size="21" />
      </slot>
    </button>

    <div v-if="open" class="menu" role="menu" :aria-label="label">
      <div v-if="$slots.header" class="menu-head"><slot name="header" /></div>
      <button
        v-for="item in items"
        :key="item.label"
        :class="['menu-item', { danger: item.danger }]"
        type="button"
        role="menuitem"
        @click="choose(item)"
      >
        <AppIcon :name="item.icon" :size="17" />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType, ref, watch } from "vue";
import { useRouter } from "vue-router";

import AppIcon from "@/components/ui/AppIcon.vue";
import { AppIconName } from "@/components/ui/icons";
import { RailMenuItem } from "@/components/layout/railMenu";
import { useDismissable } from "@/composables/useDismissable";

defineProps({
  label: { type: String, required: true },
  icon: { type: String as PropType<AppIconName>, default: undefined },
  items: { type: Array as PropType<RailMenuItem[]>, default: () => [] },
  /** 当前页面属于这个菜单 */
  active: { type: Boolean, default: false },
  /** 不显示悬停的文字提示（外面有自己的悬停卡片时） */
  noTip: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (event: "toggle", open: boolean): void;
}>();

const router = useRouter();
const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
useDismissable(rootRef, open);
watch(open, (value) => emit("toggle", value));

const choose = (item: RailMenuItem) => {
  open.value = false;
  if (item.action) item.action();
  else if (item.to) void router.push(item.to);
};
</script>

<style scoped>
.rail-menu {
  position: relative;
}

.menu {
  position: absolute;
  z-index: 70;
  left: calc(100% + 12px);
  bottom: 0;
  min-width: 200px;
  padding: 6px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-float);
  animation: menu-in var(--motion-fast) var(--ease-out);
}

.menu-head {
  padding: 8px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--line);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--body);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
  background: var(--fill);
  color: var(--ink);
}

.menu-item.danger {
  color: var(--danger);
}

@keyframes menu-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
}

@media (max-width: 720px) {
  .menu {
    left: auto;
    right: 0;
    bottom: calc(100% + 12px);
  }
}
</style>
