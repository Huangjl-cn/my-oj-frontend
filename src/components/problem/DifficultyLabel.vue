<template>
  <span v-if="difficulty" :class="['difficulty', difficulty]">
    {{ DIFFICULTY_LABELS[difficulty] }}
  </span>
</template>

<script setup lang="ts">
import { defineProps, PropType } from "vue";

import { Difficulty, DIFFICULTY_LABELS } from "@/utils/difficulty";

defineProps({
  difficulty: { type: String as PropType<Difficulty>, default: undefined },
});
</script>

<style scoped>
.difficulty {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
}

.difficulty::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.easy {
  color: var(--easy);
}

.medium {
  color: var(--medium);
}

.hard {
  color: var(--hard);
}
</style>
