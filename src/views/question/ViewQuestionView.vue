<template>
  <div id="viewQuestionView">
    <a-row :gutter="[24, 24]">
      <a-col :md="12" :xs="24">
        <a-tabs default-active-key="question">
          <a-tab-pane key="question" title="题目">
            <a-card v-if="question" :title="question.title">
              <a-descriptions
                title="判题条件"
                :column="{ xs: 1, md: 2, lg: 3 }"
              >
                <a-descriptions-item label="时间限制">
                  {{ question.judgeConfig.timeLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="内存限制">
                  {{ question.judgeConfig.memoryLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="堆栈限制">
                  {{ question.judgeConfig.stackLimit ?? 0 }}
                </a-descriptions-item>
              </a-descriptions>
              <MdViewer :value="question.content || ''" />
              <template #extra>
                <a-space wrap>
                  <a-tag
                    v-for="(tag, index) of question.tags"
                    :key="index"
                    color="green"
                    >{{ tag }}
                  </a-tag>
                </a-space>
              </template>
            </a-card>
          </a-tab-pane>
          <a-tab-pane key="comment" title="评论" disabled> 评论区</a-tab-pane>
          <a-tab-pane key="answer" title="答案">
            <div v-if="canViewAnswer">
              <div v-if="questionAnswer">
                <MdViewer :value="questionAnswer" />
              </div>
              <div v-else>答案加载中...</div>
            </div>
            <div v-else>暂时无法查看答案</div>
          </a-tab-pane>
        </a-tabs>
      </a-col>
      <a-col :md="12" :xs="24">
        <a-form :model="form" layout="inline">
          <a-form-item
            field="language"
            label="编程语言"
            style="min-width: 240px"
          >
            <a-select
              v-model="form.language"
              :style="{ width: '320px' }"
              placeholder="选择编程语言"
            >
              <a-option>java</a-option>
              <a-option>cpp</a-option>
              <a-option>go</a-option>
              <a-option>python</a-option>
              <a-option>javascript</a-option>
            </a-select>
          </a-form-item>
        </a-form>
        <CodeEditor
          :value="form.code as string"
          :language="form.language"
          :handle-change="changeCode"
        />
        <a-divider size="0" />
        <a-button type="primary" style="min-width: 200px" @click="doSubmit">
          提交代码
        </a-button>

        <!-- 提交结果显示区域 -->
        <a-divider size="0" v-if="showResult" />
        <a-card v-if="showResult" title="提交结果" :bordered="false">
          <a-descriptions :column="{ xs: 1, md: 2, lg: 3 }">
            <a-descriptions-item label="提交ID">
              {{ submitResult?.id || "--" }}
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="getStatusColor(submitResult?.status)">
                {{ getStatusText(submitResult?.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="判题结果">
              <span
                :style="{
                  color: getJudgeInfoColor(submitResult?.judgeInfo?.message),
                }"
              >
                {{ submitResult?.judgeInfo?.message || "--" }}
              </span>
            </a-descriptions-item>
            <a-descriptions-item label="执行时间">
              {{
                submitResult?.judgeInfo?.time
                  ? submitResult?.judgeInfo?.time + "ms"
                  : "--"
              }}
            </a-descriptions-item>
            <a-descriptions-item label="内存消耗">
              {{
                submitResult?.judgeInfo?.memory
                  ? submitResult?.judgeInfo?.memory + "KB"
                  : "--"
              }}
            </a-descriptions-item>
            <a-descriptions-item label="编程语言">
              {{ submitResult?.language || "--" }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  watchEffect,
  withDefaults,
  defineProps,
  onBeforeUnmount,
  computed,
} from "vue";
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

const props = withDefaults(defineProps<Props>(), {
  id: () => "",
});

const question = ref<QuestionVO>();
const submitResult = ref<QuestionSubmitVO>();
const showResult = ref(false);
const pollingTimer = ref<any>(null);
const pollingStartTime = ref<number>(0);
const POLLING_INTERVAL = 3000; // 3秒轮询间隔
const POLLING_TIMEOUT = 30000; // 30秒超时时间

const store = useStore();
const questionAnswer = ref<string>("");
const hasPassedQuestion = ref<boolean>(false);
const isCheckingPassedStatus = ref<boolean>(false);

// 计算属性：是否可以查看答案
const canViewAnswer = computed(() => {
  const loginUser = store.state.user.loginUser;

  // 1. 管理员直接查看
  if (checkAccess(loginUser, ACCESS_ENUM.ADMIN)) {
    return true;
  }

  // 2. 普通用户已经通过题目
  if (hasPassedQuestion.value) {
    return true;
  }

  return false;
});

const loadData = async () => {
  const res = await QuestionControllerService.getQuestionVoByIdUsingGet(
    props.id as any
  );
  if (res.code === 0) {
    question.value = res.data;
    // 检查用户是否可以通过题目查看答案
    checkIfUserCanViewAnswer();
  } else {
    message.error("加载失败，" + res.message);
  }
};

/**
 * 检查用户是否可以通过题目查看答案
 */
const checkIfUserCanViewAnswer = async () => {
  const loginUser = store.state.user.loginUser;

  // 如果是管理员，直接加载答案
  if (checkAccess(loginUser, ACCESS_ENUM.ADMIN)) {
    loadQuestionAnswer();
    return;
  }

  // 如果是普通用户，检查是否通过题目
  if (loginUser && loginUser.userRole === ACCESS_ENUM.USER) {
    await checkIfUserPassedQuestion();
    if (hasPassedQuestion.value) {
      loadQuestionAnswer();
    }
  }
};

/**
 * 检查用户是否通过题目
 */
const checkIfUserPassedQuestion = async () => {
  if (!question.value?.id) return;

  isCheckingPassedStatus.value = true;
  try {
    // 查询用户的提交记录
    const res =
      await QuestionControllerService.listQuestionSubmitByPageUsingPost({
        questionId: question.value.id,
        userId: store.state.user.loginUser.id,
        pageSize: 100, // 获取足够多的记录来检查
        current: 1,
      });

    if (res.code === 0 && res.data.records) {
      // 检查是否有通过的提交（judgeInfo.message === "Accepted"）
      const passedSubmission = res.data.records.find((submission) => {
        let judgeInfo = submission.judgeInfo;
        // 处理judgeInfo字段：如果是字符串，解析为对象
        if (typeof judgeInfo === "string") {
          try {
            judgeInfo = JSON.parse(judgeInfo);
          } catch (error) {
            console.error("解析judgeInfo失败:", error);
            judgeInfo = {};
          }
        }
        return judgeInfo?.message === "Accepted";
      });

      hasPassedQuestion.value = !!passedSubmission;
    }
  } catch (error) {
    console.error("检查用户通过状态失败:", error);
  } finally {
    isCheckingPassedStatus.value = false;
  }
};

/**
 * 加载题目答案
 */
const loadQuestionAnswer = async () => {
  if (!question.value?.id) return;

  try {
    const loginUser = store.state.user.loginUser;

    // 管理员使用获取完整题目信息的接口
    if (checkAccess(loginUser, ACCESS_ENUM.ADMIN)) {
      const res = await QuestionControllerService.getQuestionByIdUsingGet(
        question.value.id as any
      );
      if (res.code === 0 && res.data.answer) {
        questionAnswer.value = res.data.answer;
      } else {
        questionAnswer.value = "暂无答案";
      }
    } else {
      // 普通用户通过题目后，使用替代方案获取答案
      // 方案1：尝试使用其他可能包含答案的接口
      await loadAnswerForNormalUser();
    }
  } catch (error) {
    console.error("加载题目答案失败:", error);
    message.error("加载答案失败");
  }
};

/**
 * 为普通用户加载答案（替代方案）
 */
const loadAnswerForNormalUser = async () => {
  if (!question.value?.id) return;

  try {
    // 方案1：尝试使用题目列表接口，可能包含答案信息
    const res = await QuestionControllerService.listQuestionByPageUsingPost({
      id: question.value.id,
      pageSize: 1,
      current: 1,
    });

    if (res.code === 0 && res.data.records && res.data.records.length > 0) {
      const questionData = res.data.records[0];
      if (questionData.answer) {
        questionAnswer.value = questionData.answer;
        return;
      }
    }

    // 方案2：如果上述方法不行，显示提示信息
    questionAnswer.value =
      "```java\n// 恭喜您通过了本题！\n// 由于系统限制，普通用户无法直接查看标准答案\n// 建议您参考自己的通过代码作为参考答案\n// 或者联系管理员获取标准答案\n```";
  } catch (error) {
    console.error("为普通用户加载答案失败:", error);
    questionAnswer.value =
      "```java\n// 答案加载失败\n// 请稍后重试或联系管理员\n```";
  }
};

const form = ref<QuestionSubmitAddRequest>({
  language: "java",
  code: `import java.util.*;

public class Main { 
    public static void main(String[] args) { 
        //获取参数方式 
        int a = Integer.parseInt(args[0]); 
        //输出答案 
        System.out.print("output the answer"); 
    } 
}`,
});

/**
 * 提交代码
 */
const doSubmit = async () => {
  if (!question.value?.id) {
    return;
  }

  // 停止之前的轮询
  stopPolling();

  const res = await QuestionControllerService.doQuestionSubmitUsingPost({
    ...form.value,
    questionId: question.value.id,
  });
  if (res.code === 0) {
    message.success("提交成功");
    showResult.value = true;
    // 开始轮询获取提交结果
    startPolling(res.data);
  } else {
    message.error("提交失败," + res.message);
  }
};

/**
 * 开始轮询获取提交结果
 */
const startPolling = async (submitId: number) => {
  pollingStartTime.value = Date.now();

  const poll = async () => {
    // 检查是否超时
    if (Date.now() - pollingStartTime.value > POLLING_TIMEOUT) {
      stopPolling();
      message.error("获取提交结果超时");
      return;
    }

    try {
      // 使用新的接口直接通过ID获取提交结果
      const res = await QuestionControllerService.getQuestionSubmitByIdUsingGet(
        submitId
      );

      if (res.code === 0) {
        // 处理judgeInfo字段：如果是字符串，解析为对象
        const resultData = { ...res.data };
        if (typeof resultData.judgeInfo === "string") {
          try {
            resultData.judgeInfo = JSON.parse(resultData.judgeInfo);
          } catch (error) {
            console.error("解析judgeInfo失败:", error);
            resultData.judgeInfo = {};
          }
        }

        submitResult.value = resultData;

        // 详细的调试输出，查看返回的数据结构
        console.log("=== 提交结果数据 ===");
        console.log("完整数据:", resultData);
        console.log("状态:", resultData?.status);
        console.log("判题信息对象:", resultData?.judgeInfo);
        console.log("判题结果:", resultData?.judgeInfo?.message);
        console.log("执行时间:", resultData?.judgeInfo?.time);
        console.log("内存消耗:", resultData?.judgeInfo?.memory);
        console.log("=== 调试结束 ===");

        // 如果状态是最终状态（2:完成, 3:未完成），停止轮询
        if (resultData?.status === 2 || resultData?.status === 3) {
          stopPolling();
          return;
        }
        // 状态为0（待判题）或1（提交中）时继续轮询
      }
    } catch (error) {
      console.error("轮询获取提交结果失败:", error);
    }

    // 继续轮询（只有在状态为1时才设置下一次轮询）
    pollingTimer.value = setTimeout(poll, POLLING_INTERVAL);
  };

  // 开始第一次轮询
  poll();
};

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value);
    pollingTimer.value = null;
  }
};

/**
 * 获取状态文本
 */
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

/**
 * 获取状态颜色
 */
const getStatusColor = (status?: number) => {
  switch (status) {
    case 0:
      return "blue";
    case 1:
      return "orange";
    case 2:
      return "green";
    case 3:
      return "red";
    default:
      return "gray";
  }
};

/**
 * 获取判题结果颜色
 */
const getJudgeInfoColor = (message?: string) => {
  if (message === "Accepted") {
    return "#00b42a"; // 绿色
  }
  return "#f53f3f"; // 红色
};

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  loadData();
});

/**
 * 页面卸载时，停止轮询
 */
onBeforeUnmount(() => {
  stopPolling();
});

const changeCode = (value: string) => {
  form.value.code = value;
};
</script>

<style>
#viewQuestionView {
  max-width: 1400px;
  margin: 0 auto;
}

#viewQuestionView .arco-space-horizontal .arco-space-item {
  margin-bottom: 0 !important;
}
</style>
