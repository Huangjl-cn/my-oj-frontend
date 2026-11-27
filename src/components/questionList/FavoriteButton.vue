<template>
  <button
    :class="['icon-btn', 'favorite-btn', size, tipClass, { on: favorite }]"
    type="button"
    :data-tip="favorite ? '取消收藏' : '收藏'"
    :aria-label="favorite ? '取消收藏' : '收藏'"
    :aria-pressed="favorite"
    @click.prevent.stop="toggle"
  >
    <AppIcon :name="favorite ? 'star-filled' : 'star'" :size="iconSize" />
  </button>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, defineProps, PropType } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { useFavorites } from "@/composables/useFavorites";
import { ApiId } from "@/services/apiId";

/**
 * 星标：点一下收藏 / 取消收藏（先改界面，失败了改回来并提示）。
 * 放在链接里面也行：点击不会触发外面的跳转。
 */
const props = defineProps({
  questionId: { type: [String, Number] as PropType<ApiId>, required: true },
  size: { type: String as PropType<"sm" | "md">, default: "md" },
  /** 悬停提示的方向，按放的位置给 */
  tipClass: { type: String, default: "tip-down" },
});

const favorites = useFavorites();
const favorite = computed(() => favorites.isFavorite(props.questionId));
const iconSize = computed(() => (props.size === "sm" ? 16 : 18));

const toggle = async () => {
  try {
    const next = await favorites.toggle(props.questionId);
    message.success(next ? "已收藏" : "已取消收藏");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "收藏失败");
  }
};
</script>

<style scoped>
.favorite-btn.sm {
  width: 30px;
  height: 30px;
}

.favorite-btn.on {
  color: var(--favorite);
  background: transparent;
}

.favorite-btn.on:hover {
  background: color-mix(in srgb, var(--favorite) 12%, transparent);
}
</style>
