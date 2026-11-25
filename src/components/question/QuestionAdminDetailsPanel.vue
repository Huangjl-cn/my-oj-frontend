<template>
  <section class="question-details">
    <p class="content-preview">{{ question.content || "暂无内容" }}</p>
    <dl class="judge-metrics">
      <div>
        <dt>时间限制</dt>
        <dd class="num">{{ judgeConfig.timeLimit ?? "--" }} ms</dd>
      </div>
      <div>
        <dt>内存限制</dt>
        <dd class="num">{{ formatJudgeMemory(judgeConfig.memoryLimit) }}</dd>
      </div>
      <div>
        <dt>栈限制</dt>
        <dd class="num">{{ formatJudgeMemory(judgeConfig.stackLimit) }}</dd>
      </div>
      <div>
        <dt>测试用例</dt>
        <dd class="num">{{ judgeCaseCount }} 个</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

import { formatJudgeMemory } from "@/services/questionSubmit";
import { JudgeCaseConfig, JudgeConfig, Question } from "../../../generated";

const props = defineProps<{
  question: Question;
}>();

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const judgeConfig = computed(() =>
  parseJson<JudgeConfig>(props.question.judgeConfig, {})
);
const judgeCaseConfig = computed(() =>
  parseJson<JudgeCaseConfig>(props.question.judgeCase, {})
);
const judgeCaseCount = computed(() => judgeCaseConfig.value.cases?.length ?? 0);
</script>

<style scoped>
.question-details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.content-preview {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.judge-metrics {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 0 28px;
  margin: 0;
}

.judge-metrics dt {
  color: var(--faint);
  font-size: 12px;
  white-space: nowrap;
}

.judge-metrics dd {
  margin: 4px 0 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .question-details {
    grid-template-columns: 1fr;
  }

  .judge-metrics {
    grid-template-columns: repeat(2, auto);
    gap: 12px 28px;
    justify-content: start;
  }
}
</style>
