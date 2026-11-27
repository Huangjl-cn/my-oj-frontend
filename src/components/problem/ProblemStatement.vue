<template>
  <article class="statement">
    <div class="title-row">
      <h1>{{ question.title }}</h1>
      <div v-if="$slots.actions" class="title-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="facts">
      <DifficultyLabel
        v-if="getDifficulty(question.tags)"
        :difficulty="getDifficulty(question.tags)"
      />
      <span
        class="fact tip-down tip-start"
        :data-tip="`通过 ${question.acceptedNum ?? 0} / 提交 ${
          question.submitNum ?? 0
        }`"
      >
        <AppIcon name="pie" :size="15" />
        <span class="num">{{
          formatAcceptanceRate(question.acceptedNum, question.submitNum)
        }}</span>
      </span>
      <span class="fact tip-down tip-start" data-tip="时间限制">
        <AppIcon name="clock" :size="15" />
        <span class="num">{{ question.judgeConfig?.timeLimit ?? 0 }} ms</span>
      </span>
      <span
        class="fact tip-down tip-start"
        :data-tip="`内存限制，栈 ${formatJudgeMemory(
          question.judgeConfig?.stackLimit
        )}`"
      >
        <AppIcon name="chip" :size="15" />
        <span class="num">{{
          formatJudgeMemory(question.judgeConfig?.memoryLimit)
        }}</span>
      </span>
    </div>
    <div v-if="topicTags.length" class="tags">
      <span v-for="tag in topicTags" :key="tag" class="tag">{{ tag }}</span>
    </div>

    <div class="content">
      <MdViewer :value="question.content || ''" />
    </div>

    <footer class="author">
      <UserAvatar
        :avatar="question.userVO?.userAvatar"
        :name="question.userVO?.userName || '出题人'"
        :size="22"
      />
      <span>{{ question.userVO?.userName || "未知作者" }}</span>
      <time :datetime="question.createTime">
        {{ formatDateTime(question.createTime).slice(0, 10) }}
      </time>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, defineProps, PropType } from "vue";

import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UserAvatar from "@/components/user/UserAvatar.vue";
import { formatAcceptanceRate } from "@/services/questionProgress";
import { formatJudgeMemory } from "@/services/questionSubmit";
import { formatDateTime } from "@/utils/dateTime";
import { getDifficulty, getTopicTags } from "@/utils/difficulty";
import { QuestionVO } from "../../../generated";

const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

const props = defineProps({
  question: { type: Object as PropType<QuestionVO>, required: true },
});

const topicTags = computed(() => getTopicTags(props.question.tags));
</script>

<style scoped>
.statement {
  padding: 26px 26px 34px;
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.title-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  margin-top: 1px;
}

h1 {
  min-width: 0;
  margin: 0;
  color: var(--ink);
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 18px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 13px;
}

.fact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
  font-size: 12.5px;
}

.content {
  margin-top: 22px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12.5px;
}

.author time {
  margin-left: auto;
  color: var(--faint);
}
</style>
