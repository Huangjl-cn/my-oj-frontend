<template>
  <span
    v-if="status"
    :class="['status', status]"
    :data-tip="STATUS_LABELS[status]"
    :aria-label="STATUS_LABELS[status]"
    role="img"
  >
    <AppIcon :name="STATUS_ICONS[status]" :size="20" />
  </span>
  <span v-else class="status" aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { defineProps, PropType } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import { AppIconName } from "@/components/ui/icons";
import { ProblemStatus } from "@/composables/useMyProgress";

defineProps({
  status: { type: String as PropType<ProblemStatus>, default: undefined },
});

const STATUS_LABELS: Record<ProblemStatus, string> = {
  passed: "已通过",
  failed: "没通过",
  judging: "判题中",
};

const STATUS_ICONS: Record<ProblemStatus, AppIconName> = {
  passed: "check-circle",
  failed: "x-circle",
  judging: "spinner",
};
</script>

<style scoped>
.status {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
}

.passed {
  color: var(--success);
}

.failed {
  color: var(--danger);
}

.judging {
  color: var(--muted);
}

.judging :deep(svg) {
  animation: status-spin 1s linear infinite;
}

@keyframes status-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .judging :deep(svg) {
    animation: none;
  }
}
</style>
