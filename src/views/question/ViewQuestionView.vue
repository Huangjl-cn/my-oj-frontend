<template>
  <div id="viewQuestionView">
    <div class="workspace">
      <!-- Description -->
      <div class="description-panel">
        <div class="tabs-row">
          <button
            :class="['tab-btn', { active: activeTab === 'question' }]"
            @click="activeTab = 'question'"
          >
            题目
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'answer' }]"
            @click="activeTab = 'answer'"
            :disabled="!canViewAnswer"
          >
            答案
          </button>
        </div>

        <div v-if="activeTab === 'question'">
          <div v-if="question">
            <h1 class="problem-title">{{ question.title }}</h1>
            <div class="problem-header">
              <span
                class="tag"
                v-for="(tag, index) of question.tags"
                :key="index"
                >{{ tag }}</span
              >
            </div>

            <div class="problem-section">
              <p>{{ question.content || "" }}</p>
            </div>

            <div class="problem-section">
              <h3>限制</h3>
              <ul class="constraints">
                <li>时间限制: {{ question.judgeConfig?.timeLimit ?? 0 }}ms</li>
                <li>
                  内存限制: {{ question.judgeConfig?.memoryLimit ?? 0 }}KB
                </li>
                <li>堆栈限制: {{ question.judgeConfig?.stackLimit ?? 0 }}KB</li>
              </ul>
            </div>
          </div>
          <div v-else class="loading-state">加载中...</div>
        </div>

        <div v-if="activeTab === 'answer'">
          <div v-if="canViewAnswer">
            <div v-if="questionAnswer">
              <MdViewer :value="questionAnswer" />
            </div>
            <div v-else class="loading-state">答案加载中...</div>
          </div>
          <div v-else class="no-access">请先通过本题后再查看答案</div>
        </div>
      </div>

      <!-- Editor -->
      <div class="editor-panel">
        <div class="editor-toolbar">
          <select v-model="form.language" class="lang-selector">
            <option>java</option>
            <option>cpp</option>
            <option>go</option>
            <option>python</option>
            <option>javascript</option>
          </select>
          <div class="editor-actions">
            <button class="btn-submit" @click="doSubmit">提交</button>
          </div>
        </div>
        <div class="editor-body">
          <CodeEditor
            :value="form.code as string"
            :language="form.language"
            :handle-change="changeCode"
          />
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="showResult" class="results-panel">
      <div class="results-header">
        <div
          :class="[
            'results-status',
            submitResult?.judgeInfo?.message === 'Accepted'
              ? 'passed'
              : 'failed',
          ]"
        >
          <svg
            v-if="submitResult?.judgeInfo?.message === 'Accepted'"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="6"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M4.5 7L6.5 9L9.5 5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7"
              cy="7"
              r="6"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M5 5l4 4M9 5l-4 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          {{ getStatusText(submitResult?.status) }}
          <span class="result-muted"
            >· {{ submitResult?.judgeInfo?.message || "--" }}</span
          >
        </div>
        <div class="result-stats">
          <span
            >执行时间
            {{
              submitResult?.judgeInfo?.time
                ? submitResult?.judgeInfo?.time + "ms"
                : "--"
            }}</span
          >
          <span class="sep">·</span>
          <span
            >内存消耗
            {{
              submitResult?.judgeInfo?.memory
                ? submitResult?.judgeInfo?.memory + "KB"
                : "--"
            }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#viewQuestionView {
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: claude-fade-up 0.4s ease-out;
}

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ===== Description ===== */
.description-panel {
  flex: 1;
  overflow-y: auto;
  padding: 28px 36px;
  border-right: 1px solid var(--hairline);
  background: var(--canvas);
}

.tabs-row {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 8px;
}

.tab-btn {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.tab-btn.active {
  color: var(--ink);
}

.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.problem-title {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.3px;
  margin-bottom: 6px;
  line-height: 1.2;
}

.problem-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--surface-soft);
  color: var(--muted);
  border: 1px solid var(--hairline);
  letter-spacing: 0.2px;
}

.problem-section {
  margin-bottom: 20px;
}

.problem-section h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 12px;
}

.problem-section p {
  font-size: 14px;
  color: var(--body);
  line-height: 1.7;
}

.problem-section p code {
  color: var(--primary);
  background: var(--surface-soft);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.constraints {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
  padding-left: 20px;
  margin-top: 4px;
}

.constraints li {
  margin-bottom: 3px;
}

.loading-state,
.no-access {
  color: var(--muted);
  font-size: 14px;
  padding: 32px 0;
  text-align: center;
}

/* ===== Editor ===== */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--canvas);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--surface-dark);
  flex-shrink: 0;
}

.lang-selector {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--on-dark);
  background: var(--surface-dark-elevated);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  outline: none;
  min-width: 100px;
  height: 30px;
}

.editor-actions {
  display: flex;
  gap: 6px;
}

.btn-submit {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  height: 30px;
  padding: 4px 14px;
  border-radius: 6px;
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-submit:hover {
  background: var(--primary-active);
}

.editor-body {
  flex: 1;
  min-height: 0;
}

/* ===== Results ===== */
.results-panel {
  border-top: 1px solid var(--hairline);
  background: var(--canvas);
  flex-shrink: 0;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.results-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.results-status.passed {
  color: var(--success);
}

.results-status.failed {
  color: var(--error);
}

.result-muted {
  font-weight: 400;
  font-size: 12px;
  color: var(--muted);
}

.result-stats {
  font-size: 12px;
  color: var(--muted-soft);
}

.sep {
  margin: 0 4px;
}

@media (max-width: 1024px) {
  .workspace {
    flex-direction: column;
  }

  .description-panel {
    border-right: none;
    border-bottom: 1px solid var(--hairline);
    max-height: 50vh;
    padding: 24px;
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref, defineProps, onBeforeUnmount, computed } from "vue";
import message from "@arco-design/web-vue/es/message";
import CodeEditor from "@/components/CodeEditor.vue";
import MdViewer from "@/components/MdViewer.vue";
import {
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionVO,
  QuestionSubmitVO,
} from "../../../generated";
import { useStore } from "vuex";
import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";

interface Props {
  id: string;
}

const props = defineProps<Props>();

const activeTab = ref("question");
const question = ref<QuestionVO>();
const submitResult = ref<QuestionSubmitVO>();
const showResult = ref(false);
const pollingTimer = ref<any>(null);
const pollingStartTime = ref<number>(0);
const POLLING_INTERVAL = 3000;
const POLLING_TIMEOUT = 30000;

const store = useStore();
const questionAnswer = ref<string>("");
const hasPassedQuestion = ref<boolean>(false);

const canViewAnswer = computed(() => {
  const loginUser = store.state.user.loginUser;
  if (checkAccess(loginUser, ACCESS_ENUM.ADMIN)) return true;
  if (hasPassedQuestion.value) return true;
  return false;
});

const loadData = async () => {
  const res = await QuestionControllerService.getQuestionVoByIdUsingGet(
    props.id as any
  );
  if (res.code === 0) {
    question.value = res.data;
    checkIfUserCanViewAnswer();
  } else {
    message.error("加载失败，" + res.message);
  }
};

const checkIfUserCanViewAnswer = async () => {
  const loginUser = store.state.user.loginUser;
  if (checkAccess(loginUser, ACCESS_ENUM.ADMIN)) {
    loadQuestionAnswer();
    return;
  }
  if (loginUser && loginUser.userRole === ACCESS_ENUM.USER) {
    await checkIfUserPassedQuestion();
    if (hasPassedQuestion.value) loadQuestionAnswer();
  }
};

const checkIfUserPassedQuestion = async () => {
  if (!question.value?.id) return;
  try {
    const res =
      await QuestionControllerService.listQuestionSubmitByPageUsingPost({
        questionId: question.value.id,
        userId: store.state.user.loginUser.id,
        pageSize: 100,
        current: 1,
      });
    if (res.code === 0 && res.data.records) {
      const passed = res.data.records.find((s) => {
        let j = s.judgeInfo;
        if (typeof j === "string") {
          try {
            j = JSON.parse(j);
          } catch (e) {
            console.error(e);
            j = {};
          }
        }
        return j?.message === "Accepted";
      });
      hasPassedQuestion.value = !!passed;
    }
  } catch (e) {
    console.error(e);
  }
};

const loadQuestionAnswer = async () => {
  if (!question.value?.id) return;
  try {
    const u = store.state.user.loginUser;
    if (checkAccess(u, ACCESS_ENUM.ADMIN)) {
      const res = await QuestionControllerService.getQuestionByIdUsingGet(
        props.id as any
      );
      questionAnswer.value =
        res.code === 0 && res.data.answer ? res.data.answer : "暂无答案";
    } else {
      const res = await QuestionControllerService.listQuestionByPageUsingPost({
        id: question.value.id,
        pageSize: 1,
        current: 1,
      });
      questionAnswer.value =
        res.code === 0 && res.data.records?.[0]?.answer
          ? res.data.records[0].answer
          : "无法加载答案";
    }
  } catch (e) {
    console.error(e);
    questionAnswer.value = "```java\n// 答案加载失败\n```";
  }
};

const form = ref<QuestionSubmitAddRequest>({
  language: "java",
  code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int a = Integer.parseInt(args[0]);
        System.out.print("output the answer");
    }
}`,
});

const doSubmit = async () => {
  if (!question.value?.id) return;
  stopPolling();
  const res = await QuestionControllerService.doQuestionSubmitUsingPost({
    ...form.value,
    questionId: question.value.id,
  });
  if (res.code === 0) {
    message.success("提交成功");
    showResult.value = true;
    startPolling(res.data);
  } else {
    message.error("提交失败," + res.message);
  }
};

const startPolling = (submitId: number) => {
  pollingStartTime.value = Date.now();
  const poll = async () => {
    if (Date.now() - pollingStartTime.value > POLLING_TIMEOUT) {
      stopPolling();
      return;
    }
    try {
      const res = await QuestionControllerService.getQuestionSubmitByIdUsingGet(
        submitId
      );
      if (res.code === 0) {
        const d = { ...res.data };
        if (typeof d.judgeInfo === "string") {
          try {
            d.judgeInfo = JSON.parse(d.judgeInfo);
          } catch (e) {
            console.error(e);
            d.judgeInfo = {};
          }
        }
        submitResult.value = d;
        if (d?.status === 2 || d?.status === 3) {
          stopPolling();
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    pollingTimer.value = setTimeout(poll, POLLING_INTERVAL);
  };
  poll();
};

const stopPolling = () => {
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value);
    pollingTimer.value = null;
  }
};

const getStatusText = (status?: number) => {
  switch (status) {
    case 0:
      return "待判题";
    case 1:
      return "提交中";
    case 2:
      return "完成";
    case 3:
      return "失败";
    default:
      return "未知";
  }
};

onMounted(() => {
  loadData();
});
onBeforeUnmount(() => {
  stopPolling();
});

const changeCode = (value: string) => {
  form.value.code = value;
};
</script>
