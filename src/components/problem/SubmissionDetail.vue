<template>
  <section class="detail">
    <p v-if="tab.loading" class="hint">正在加载提交详情…</p>
    <p v-else-if="tab.error" class="hint error">{{ tab.error }}</p>
    <template v-else-if="tab.detail">
      <header>
        <span :class="['verdict', presentation.tone]">
          {{ presentation.label }}
        </span>
        <span class="lang">{{
          getLanguageText(tab.detail.language, languageOptions)
        }}</span>
        <time class="num">{{ formatDateTime(tab.detail.createTime) }}</time>
      </header>

      <div class="metrics">
        <div>
          <span>用时</span>
          <strong class="num"
            >{{ tab.detail.judgeInfo?.time ?? "--" }} ms</strong
          >
        </div>
        <div>
          <span>内存</span>
          <strong class="num">{{
            formatJudgeMemory(tab.detail.judgeInfo?.memory)
          }}</strong>
        </div>
      </div>

      <SubmissionRankRings
        v-if="presentation.tone === 'passed'"
        :rank="tab.rank"
        :loading="tab.rankLoading"
        :error="tab.rankError"
        comparison-label="超过同语言提交"
      />

      <div v-if="presentation.message" class="block">
        <h3>判题信息</h3>
        <div class="diagnostic">
          <strong :class="presentation.tone">{{ messageParts.title }}</strong>
          <pre v-if="messageParts.details">{{ messageParts.details }}</pre>
        </div>
      </div>

      <div class="block">
        <h3>代码</h3>
        <CodeBlock
          :code="tab.detail.code || ''"
          :language="tab.detail.language ?? ''"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, defineProps, PropType } from "vue";

import SubmissionRankRings from "@/components/question/SubmissionRankRings.vue";
import { SubmissionTab } from "@/composables/problem/useMySubmissions";
import {
  formatJudgeMemory,
  getJudgeResultPresentation,
  splitJudgeMessage,
} from "@/services/questionSubmit";
import {
  getLanguageText,
  LanguageOption,
} from "@/services/questionStarterCode";
import { formatDateTime } from "@/utils/dateTime";

const CodeBlock = defineAsyncComponent(
  () => import("@/components/editor/CodeBlock.vue")
);

const props = defineProps({
  tab: { type: Object as PropType<SubmissionTab>, required: true },
  languageOptions: {
    type: Array as PropType<LanguageOption[]>,
    default: () => [],
  },
});

const presentation = computed(() =>
  getJudgeResultPresentation(props.tab.detail ?? undefined)
);
const messageParts = computed(() =>
  splitJudgeMessage(presentation.value.message)
);
</script>

<style scoped>
.detail {
  display: grid;
  gap: 18px;
  padding: 22px 24px 30px;
}

.hint {
  margin: 0;
  color: var(--muted);
}

.hint.error {
  color: var(--danger);
}

header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.verdict {
  font-size: 20px;
  font-weight: 700;
}

.verdict.passed,
.diagnostic .passed {
  color: var(--success);
}

.verdict.failed,
.diagnostic .failed {
  color: var(--danger);
}

.verdict.pending {
  color: var(--muted);
}

.lang {
  color: var(--ink);
  font-weight: 500;
}

header time {
  margin-left: auto;
  color: var(--faint);
  font-size: 12.5px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metrics div {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.metrics span {
  color: var(--faint);
  font-size: 12px;
}

.metrics strong {
  color: var(--ink);
  font-size: 18px;
  font-weight: 600;
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

.diagnostic {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.diagnostic pre {
  margin: 0;
  color: var(--ink);
  font: 12.5px/1.6 var(--font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
