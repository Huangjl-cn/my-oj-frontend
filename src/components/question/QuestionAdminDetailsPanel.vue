<template>
  <section class="question-details">
    <article class="details-main">
      <span class="section-label">题目概览</span>
      <h2>{{ question.title || "未命名题目" }}</h2>
      <p class="content-preview">{{ question.content || "暂无内容" }}</p>
    </article>

    <dl class="judge-metrics">
      <div>
        <dt>时间限制</dt>
        <dd>{{ judgeConfig.timeLimit ?? "--" }} <small>ms</small></dd>
      </div>
      <div>
        <dt>内存限制</dt>
        <dd>{{ formatJudgeMemory(judgeConfig.memoryLimit) }}</dd>
      </div>
      <div>
        <dt>堆栈限制</dt>
        <dd>{{ formatJudgeMemory(judgeConfig.stackLimit) }}</dd>
      </div>
      <div>
        <dt>测试用例</dt>
        <dd>{{ judgeCaseCount }} <small>个</small></dd>
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
  grid-template-columns: minmax(280px, 1fr) minmax(520px, 1.2fr);
  align-items: center;
  gap: 36px;
  padding: 20px 28px;
  background: transparent;
}

.details-main {
  min-width: 0;
  padding-left: 18px;
  border-left: 3px solid var(--primary);
}

.section-label {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.details-main h2 {
  margin: 3px 0 6px;
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 500;
}

.content-preview {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--body);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.judge-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  overflow: hidden;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
}

.judge-metrics > div {
  min-width: 0;
  padding: 8px 16px;
}

.judge-metrics > div + div {
  border-left: 1px solid var(--hairline-soft);
}

.judge-metrics dt {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

.judge-metrics dd {
  margin: 7px 0 0;
  color: var(--ink);
  font-family: var(--font-code);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.judge-metrics small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .question-details {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .judge-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-left: 0;
  }

  .judge-metrics > div:nth-child(3) {
    border-left: 0;
  }
}
</style>
