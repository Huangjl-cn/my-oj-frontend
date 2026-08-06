<template>
  <section class="diagnostic-panel">
    <header>
      <span :class="['diagnostic-result', presentation.tone]">
        {{ presentation.label }}
      </span>
      <span class="diagnostic-metrics">
        {{ submission.judgeInfo?.time ?? "--" }} ms
        <span aria-hidden="true">·</span>
        {{ formatJudgeMemory(submission.judgeInfo?.memory) }}
      </span>
    </header>
    <div v-if="messageParts.title" class="diagnostic-content">
      <strong>{{ messageParts.title }}</strong>
      <pre v-if="messageParts.details">{{ messageParts.details }}</pre>
    </div>
    <p v-else class="diagnostic-empty">暂无判题诊断</p>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

import {
  formatJudgeMemory,
  getJudgeResultPresentation,
  splitJudgeMessage,
} from "@/services/questionSubmit";
import { QuestionSubmitVO } from "../../../generated";

const props = defineProps<{
  submission: QuestionSubmitVO;
}>();

const presentation = computed(() =>
  getJudgeResultPresentation(props.submission)
);
const messageParts = computed(() =>
  splitJudgeMessage(presentation.value.message)
);
</script>

<style scoped>
.diagnostic-panel {
  padding: 18px 22px;
  background: transparent;
}

.diagnostic-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.diagnostic-result {
  font-size: 13px;
  font-weight: 600;
}

.diagnostic-result.passed {
  color: var(--success);
}

.diagnostic-result.failed {
  color: var(--error);
}

.diagnostic-result.pending {
  color: var(--accent-amber);
}

.diagnostic-metrics {
  color: var(--muted);
  font-family: var(--font-code);
  font-size: 12px;
  white-space: nowrap;
}

.diagnostic-content {
  padding: 14px 16px;
  color: var(--on-dark);
  background: var(--surface-dark);
  border-radius: var(--radius-md);
  font-family: var(--font-code);
  font-size: 12px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.diagnostic-content strong {
  font-weight: 600;
}

.diagnostic-content pre {
  margin: 8px 0 0;
  color: var(--on-dark-soft);
  font: inherit;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.diagnostic-empty {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
</style>
