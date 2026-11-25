<template>
  <section class="mine">
    <header>
      <h2>我的提交</h2>
      <button
        class="icon-btn tip-down"
        type="button"
        data-tip="刷新"
        aria-label="刷新提交记录"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <AppIcon name="refresh" :size="17" />
      </button>
    </header>

    <p v-if="loading && !items.length" class="hint">正在加载…</p>
    <p v-else-if="error" class="hint error">{{ error }}</p>
    <div v-else-if="!items.length" class="hint empty">
      <CompanionAvatar :size="44" mood="encouraging" />
      还没有提交过，写好了点右上角的提交
    </div>
    <div v-else :class="['rows', { stale: loading }]">
      <button
        v-for="item in items"
        :key="String(item.id)"
        class="row"
        type="button"
        @click="emit('open', item)"
      >
        <span :class="['verdict', presentation(item).tone]">
          {{ presentation(item).label }}
        </span>
        <span class="lang">{{
          getLanguageText(item.language, languageOptions)
        }}</span>
        <span class="metric num">{{ item.judgeInfo?.time ?? "--" }} ms</span>
        <span class="metric num">{{
          formatJudgeMemory(item.judgeInfo?.memory)
        }}</span>
        <time class="num">{{ formatSubmissionTime(item.createTime) }}</time>
      </button>
    </div>

    <UiPagination
      class="pager"
      :current="page"
      :total="total"
      :page-size="pageSize"
      @change="emit('page', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType } from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import {
  formatJudgeMemory,
  getJudgeResultPresentation,
} from "@/services/questionSubmit";
import {
  getLanguageText,
  LanguageOption,
} from "@/services/questionStarterCode";
import { QuestionSubmitSummaryVO } from "../../../generated";

defineProps({
  items: {
    type: Array as PropType<QuestionSubmitSummaryVO[]>,
    required: true,
  },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  page: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  languageOptions: {
    type: Array as PropType<LanguageOption[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (event: "open", submission: QuestionSubmitSummaryVO): void;
  (event: "refresh"): void;
  (event: "page", page: number): void;
}>();

const presentation = (item: QuestionSubmitSummaryVO) =>
  getJudgeResultPresentation(item);

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const formatSubmissionTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : timeFormatter.format(date);
};
</script>

<style scoped>
.mine {
  padding: 18px 12px 20px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 14px;
  margin-bottom: 8px;
}

h2 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
}

.hint {
  margin: 0;
  padding: 28px 14px;
  color: var(--muted);
  font-size: 13.5px;
}

.hint.error {
  color: var(--danger);
}

.hint.empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.rows {
  transition: opacity var(--motion-fast) ease;
}

.rows.stale {
  opacity: 0.55;
}

.row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(64px, 1fr) minmax(60px, 0.9fr) 64px 72px 96px;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--body);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.row + .row {
  box-shadow: 0 -1px 0 var(--line);
}

.row:hover,
.row:focus-visible {
  background: var(--fill);
  box-shadow: none;
}

.row:hover + .row {
  box-shadow: none;
}

.verdict {
  font-weight: 600;
}

.verdict.passed {
  color: var(--success);
}

.verdict.failed {
  color: var(--danger);
}

.verdict.pending {
  color: var(--muted);
}

.metric,
time {
  color: var(--muted);
}

time {
  text-align: right;
}

.pager {
  padding-top: 12px;
}

@media (max-width: 1280px) {
  .row {
    grid-template-columns: minmax(64px, 1fr) minmax(56px, 0.9fr) 64px 92px;
  }

  .row .metric:nth-of-type(4) {
    display: none;
  }
}
</style>
