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
    <div v-if="submission.code" class="submission-code">
      <h3>提交代码</h3>
      <CodeBlock
        :code="submission.code"
        :language="submission.language ?? ''"
      />
    </div>
    <div v-if="messageParts.title" class="diagnostic-content">
      <strong :class="presentation.tone">{{ messageParts.title }}</strong>
      <pre v-if="messageParts.details">{{ messageParts.details }}</pre>
    </div>
    <p v-else class="diagnostic-empty">暂无判题诊断</p>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

import CodeBlock from "@/components/editor/CodeBlock.vue";
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

.submission-code {
  margin-bottom: 14px;
}

.submission-code h3 {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.submission-code pre {
  max-height: 360px;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  color: var(--on-dark);
  background: var(--surface-dark);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  font: 12px/1.65 var(--font-code);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
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

.diagnostic-content strong.passed {
  color: var(--success);
}

.diagnostic-content strong.failed {
  color: var(--error);
}

.diagnostic-content strong.pending {
  color: var(--accent-amber);
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
