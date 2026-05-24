<template>
  <div id="addQuestionView">
    <div class="form-wrapper">
      <h2 class="page-title">{{ updatePage ? "更新题目" : "创建题目" }}</h2>
      <a-form :model="form" label-align="left">
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <a-form-item field="title" label="标题">
            <a-input v-model="form.title" placeholder="请输入标题" />
          </a-form-item>
          <a-form-item field="tags" label="标签">
            <a-input-tag
              v-model="form.tags"
              placeholder="请选择标签"
              allow-clear
            />
          </a-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">题目内容</h3>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="content" label="描述">
                <MdEditor
                  :value="form.content"
                  :handle-change="onContentChange"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="answer" label="答案">
                <MdEditor
                  :value="form.answer"
                  :handle-change="onAnswerChange"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">判题配置</h3>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item field="judgeConfig.timeLimit" label="时间限制(ms)">
                <a-input-number
                  v-model="form.judgeConfig.timeLimit"
                  placeholder="时间限制"
                  mode="button"
                  min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="judgeConfig.memoryLimit" label="内存限制(KB)">
                <a-input-number
                  v-model="form.judgeConfig.memoryLimit"
                  placeholder="内存限制"
                  mode="button"
                  min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="judgeConfig.stackLimit" label="堆栈限制(KB)">
                <a-input-number
                  v-model="form.judgeConfig.stackLimit"
                  placeholder="堆栈限制"
                  mode="button"
                  min="0"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">测试用例</h3>
          <div
            v-for="(judgeCaseItem, index) of form.judgeCase"
            :key="index"
            class="test-case-card"
          >
            <div class="test-case-header">
              <span class="test-case-label">用例 {{ index + 1 }}</span>
              <button class="delete-btn" @click="handleDelete(index)">
                删除
              </button>
            </div>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item :field="`input-${index}`" label="输入">
                  <a-input
                    v-model="judgeCaseItem.input"
                    placeholder="测试输入"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :field="`output-${index}`" label="输出">
                  <a-input
                    v-model="judgeCaseItem.output"
                    placeholder="测试输出"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </div>
          <button class="add-case-btn" @click="handleAdd">
            + 新增测试用例
          </button>
        </div>

        <div class="form-footer">
          <button class="claude-btn-primary" @click="doSubmit">
            {{ updatePage ? "更新" : "提交" }}
          </button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
#addQuestionView {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
  animation: claude-fade-up 0.4s ease-out;
}

.form-wrapper {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
}

/* Make description/answer labels compact inside 50% columns */
.arco-col-12 .arco-form-item-label-col {
  flex: 0 0 auto !important;
  padding-right: 4px !important;
}

.arco-col-12 .arco-form-item-wrapper-col {
  flex: 1 !important;
}

.page-title {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--hairline);
}

.form-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--hairline);
}

.arco-form-item {
  margin-bottom: var(--space-md);
}

.arco-form-item-label {
  color: var(--muted) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  flex-shrink: 0 !important;
  width: auto !important;
  min-width: 60px !important;
  padding-right: 12px !important;
}

/* Fix input-tag width issue */
.arco-input-tag {
  width: 100% !important;
  min-width: 0 !important;
}

.arco-input-tag input {
  width: 100% !important;
  min-width: 60px !important;
}

/* Fix input-number width */
.arco-input-number {
  width: 100% !important;
}

/* Make form item content fill remaining space */
.arco-form-item-content {
  flex: 1 !important;
  overflow: hidden;
}

.test-case-card {
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.test-case-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.test-case-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--body);
}

.delete-btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--error);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 2px 10px;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}

.delete-btn:hover {
  background: rgba(198, 69, 69, 0.08);
  border-color: var(--error);
}

.add-case-btn {
  width: 100%;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background: transparent;
  border: 1px dashed var(--hairline);
  border-radius: var(--radius-sm);
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.add-case-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.form-footer {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}

.claude-btn-primary {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  height: 40px;
  padding: 0 32px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.claude-btn-primary:hover {
  background: var(--primary-active);
}

@media (max-width: 768px) {
  #addQuestionView {
    padding: var(--space-md) 0;
  }
  .form-wrapper {
    padding: var(--space-md);
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import MdEditor from "@/components/MdEditor.vue";
import { QuestionControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const updatePage = route.path.includes("update");

let form = ref({
  title: "",
  tags: [],
  answer: "",
  content: "",
  judgeConfig: {
    memoryLimit: 1000,
    stackLimit: 1000,
    timeLimit: 1000,
  },
  judgeCase: [
    {
      input: "",
      output: "",
    },
  ],
});

const loadData = async () => {
  const id = route.query.id;
  if (!id) return;
  const res = await QuestionControllerService.getQuestionByIdUsingGet(
    id as any
  );
  if (res.code === 0) {
    form.value = res.data as any;
    if (!form.value.judgeCase)
      form.value.judgeCase = [{ input: "", output: "" }];
    else form.value.judgeCase = JSON.parse(form.value.judgeCase as any);
    if (!form.value.judgeConfig)
      form.value.judgeConfig = {
        memoryLimit: 1000,
        stackLimit: 1000,
        timeLimit: 1000,
      };
    else form.value.judgeConfig = JSON.parse(form.value.judgeConfig as any);
    if (!form.value.tags) form.value.tags = [];
    else form.value.tags = JSON.parse(form.value.tags as any);
  } else {
    message.error("加载失败，" + res.message);
  }
};

onMounted(() => {
  loadData();
});

const doSubmit = async () => {
  if (updatePage) {
    const res = await QuestionControllerService.updateQuestionUsingPost(
      form.value
    );
    if (res.code === 0) {
      message.success("更新成功");
      router.push("/manage/question");
    } else message.error("更新失败，" + res.message);
  } else {
    const res = await QuestionControllerService.addQuestionUsingPost(
      form.value
    );
    if (res.code === 0) {
      message.success("创建成功");
      router.push("/questions");
    } else message.error("创建失败，" + res.message);
  }
};

const handleAdd = () => {
  form.value.judgeCase.push({ input: "", output: "" });
};
const handleDelete = (index: number) => {
  form.value.judgeCase.splice(index, 1);
};
const onContentChange = (value: string) => {
  form.value.content = value;
};
const onAnswerChange = (value: string) => {
  form.value.answer = value;
};
</script>
