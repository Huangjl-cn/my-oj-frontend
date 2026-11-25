<template>
  <section class="diagnostic-panel">
    <div v-if="messageParts.title" class="block">
      <h3>判题信息</h3>
      <div class="diagnostic-content">
        <strong :class="presentation.tone">{{ messageParts.title }}</strong>
        <pre v-if="messageParts.details">{{ messageParts.details }}</pre>
      </div>
    </div>
    <div v-if="submission.code" class="block">
      <h3>代码</h3>
      <CodeBlock
        :code="submission.code"
        :language="submission.language ?? ''"
      />
    </div>
    <p v-if="!messageParts.title && !submission.code" class="diagnostic-empty">
      没有判题信息
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

import CodeBlock from "@/components/editor/CodeBlock.vue";
import {
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
  display: grid;
  gap: 18px;
}

.block {
  display: grid;
  gap: 8px;
}

h3 {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.diagnostic-content {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.diagnostic-content strong {
  font-size: 13.5px;
}

.diagnostic-content .passed {
  color: var(--success);
}

.diagnostic-content .failed {
  color: var(--danger);
}

.diagnostic-content .pending {
  color: var(--muted);
}

.diagnostic-content pre {
  max-height: 260px;
  margin: 0;
  overflow: auto;
  color: var(--ink);
  font: 12.5px/1.6 var(--font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}

.diagnostic-empty {
  margin: 0;
  color: var(--muted);
}
</style>
