<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    class="obsidian-icon"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a78bfa" />
        <stop offset="1" stop-color="#6d28d9" />
      </linearGradient>
    </defs>
    <!-- 一块多面的紫色晶石，和 Obsidian 的图标同一个意思 -->
    <path
      :fill="`url(#${gradientId})`"
      d="M9 2.2 15.8 5l3.9 8.2-4.1 8.4-7 .4-4.2-6.7 1.9-8.5z"
    />
    <path
      fill="#fff"
      fill-opacity=".28"
      d="M9 2.2 6.3 6.8 4.4 15.3l4.2 6.7 2-8.7z"
    />
    <path fill="#000" fill-opacity=".12" d="m15.8 5 3.9 8.2-4.1 8.4-5-7.6z" />
  </svg>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

defineProps({
  size: { type: Number, default: 18 },
});

const gradientId = `obsidian-${Math.random().toString(36).slice(2, 8)}`;
</script>

<style scoped>
.obsidian-icon {
  flex: none;
  display: block;
}
</style>
