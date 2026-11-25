<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="ICONS[name]"
  />
</template>

<script setup lang="ts">
import { defineProps, PropType } from "vue";

import { AppIconName, ICONS } from "@/components/ui/icons";

defineProps({
  name: { type: String as PropType<AppIconName>, required: true },
  size: { type: Number, default: 18 },
  strokeWidth: { type: Number, default: 1.8 },
});
</script>

<style scoped>
.app-icon {
  display: block;
  flex: none;
}
</style>
