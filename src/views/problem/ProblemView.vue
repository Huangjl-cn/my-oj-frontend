<template>
  <div
    ref="ideRef"
    :class="['ide', { 'with-companion': companionOpen }]"
    :style="gridStyle"
  >
    <!-- ===== 左：题面、题解、提交记录 ===== -->
    <section class="panel pane statement-pane">
      <div class="pane-head">
        <nav class="tabs" role="tablist" aria-label="题目内容">
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'question'"
            :class="{ on: tab === 'question' }"
            @click="tab = 'question'"
          >
            题目
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'solution'"
            :class="{ on: tab === 'solution' }"
            @click="openSolution"
          >
            题解
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'mine' || !!activeDetailTab"
            :class="{ on: tab === 'mine' || !!activeDetailTab }"
            @click="openMine"
          >
            我的提交
            <span
              v-if="submissions.tabs.length"
              class="tab-count num"
              :aria-label="`打开了 ${submissions.tabs.length} 条提交`"
            >
              {{ submissions.tabs.length }}
            </span>
          </button>
          <button
            type="button"
            aria-label="公开提交（在新标签页打开）"
            @click="openPublicSubmissions"
          >
            公开提交
            <AppIcon name="external-link" :size="13" />
          </button>
        </nav>
        <div class="end">
          <button
            :class="['icon-btn', 'tip-down', { on: drawerOpen }]"
            type="button"
            data-tip="题目列表"
            aria-label="题目列表"
            :aria-expanded="drawerOpen"
            @click="drawerOpen = !drawerOpen"
          >
            <AppIcon name="menu" :size="18" />
          </button>
          <button
            class="icon-btn tip-down"
            type="button"
            data-tip="上一题"
            aria-label="上一题"
            :disabled="!neighbors.canPrev || navigating"
            @click="goNeighbor('prev')"
          >
            <AppIcon name="chevron-left" :size="18" />
          </button>
          <button
            class="icon-btn tip-down"
            type="button"
            data-tip="下一题"
            aria-label="下一题"
            :disabled="!neighbors.canNext || navigating"
            @click="goNeighbor('next')"
          >
            <AppIcon name="chevron-right" :size="18" />
          </button>
        </div>
      </div>

      <!-- 打开的提交详情：在「我的提交」下面单独一排，多了就换行 -->
      <div
        v-if="showDetailStrip"
        class="detail-strip"
        role="tablist"
        aria-label="打开的提交"
      >
        <button
          v-for="detailTab in submissions.tabs"
          :key="detailTab.key"
          type="button"
          role="tab"
          :aria-selected="tab === detailTab.key"
          :class="[
            'detail-chip',
            'tip-down',
            'tip-start',
            { on: tab === detailTab.key },
          ]"
          :data-tip="describeDetail(detailTab)"
          @click="tab = detailTab.key"
        >
          <span :class="['chip-dot', detailTone(detailTab)]" />
          <span class="num">{{ detailTab.label }}</span>
          <span
            class="tab-close"
            role="button"
            :aria-label="`关闭提交 ${detailTab.label}`"
            @click.stop="closeDetail(detailTab.key)"
          >
            <AppIcon name="close" :size="12" />
          </span>
        </button>
        <button
          v-if="submissions.tabs.length > 1"
          type="button"
          class="strip-clear"
          @click="closeAllDetails"
        >
          全部关闭
        </button>
      </div>

      <div class="pane-body">
        <template v-if="question">
          <ProblemStatement v-if="tab === 'question'" :question="question">
            <template v-if="isLoggedIn && questionId != null" #actions>
              <FavoriteButton :question-id="questionId" />
              <AddToListMenu :question-id="questionId" />
            </template>
          </ProblemStatement>
          <div v-else-if="tab === 'solution'" class="solution">
            <MdViewer v-if="solution.text" :value="solution.text" />
            <p v-else class="hint">
              {{ solution.loading ? "正在加载题解…" : solution.error }}
            </p>
          </div>
          <MySubmissionList
            v-else-if="tab === 'mine'"
            :items="submissions.items"
            :loading="submissions.loading"
            :error="submissions.error"
            :page="submissions.page"
            :total="submissions.total"
            :page-size="submissions.pageSize"
            :language-options="editor.languageOptions"
            @open="openDetail"
            @refresh="submissions.load()"
            @page="submissions.changePage"
          />
          <SubmissionDetail
            v-else-if="activeDetailTab"
            :tab="activeDetailTab"
            :language-options="editor.languageOptions"
          />
        </template>
        <div v-else-if="loadError" class="missing">
          <CompanionAvatar :size="64" mood="confused" />
          <p>{{ loadError }}</p>
          <router-link class="btn sm" to="/">回到题库</router-link>
        </div>
        <div v-else class="statement-skeleton" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
      </div>

      <ProblemListDrawer
        v-if="drawerOpen"
        :current-id="questionId"
        @go="goTo"
        @close="drawerOpen = false"
      />
    </section>

    <PaneResizer
      label="调整题面宽度"
      @start="statementHandle.start"
      @move="statementHandle.move"
      @end="statementHandle.end"
      @nudge="statementHandle.nudge"
      @reset="statementHandle.reset"
    />

    <!-- ===== 中：代码 ===== -->
    <section class="panel pane editor-pane">
      <div class="pane-head">
        <UiSelect
          size="sm"
          :model-value="editor.language"
          :options="languageSelectOptions"
          aria-label="编程语言"
          :disabled="
            !question || editor.languageLoading || editor.templateLoading
          "
          @update:model-value="onLanguageChange"
        />
        <div class="end">
          <span
            :class="['saved', 'tip-down', { on: editor.draftSaved }]"
            :data-tip="editor.draftSaved ? '草稿已保存在本机' : '还没有改动'"
          >
            <AppIcon name="cloud" :size="18" />
          </span>
          <button
            class="icon-btn tip-down"
            type="button"
            data-tip="格式化 (Ctrl+Alt+L)"
            aria-label="格式化代码"
            :disabled="!editor.ready"
            @click="codeEditorRef?.format()"
          >
            <AppIcon :name="formatted ? 'check' : 'align-left'" :size="18" />
          </button>
          <button
            class="icon-btn tip-down"
            type="button"
            data-tip="恢复初始代码"
            aria-label="恢复初始代码"
            :disabled="!editor.ready || editor.isTemplate"
            @click="resetDialogOpen = true"
          >
            <AppIcon name="undo" :size="18" />
          </button>
          <button
            class="btn primary sm submit"
            type="button"
            :disabled="isLoggedIn && (!editor.ready || judge.submitting)"
            @click="submit"
          >
            <AppIcon
              :name="judge.submitting ? 'spinner' : 'play'"
              :size="14"
              :class="{ spin: judge.submitting }"
            />
            {{ submitText }}
          </button>
        </div>
      </div>

      <CodeEditPreviewBar
        v-if="companion.preview"
        :preview="companion.preview"
        :name="companionName"
        @apply="applyCompanionPreview"
        @cancel="companion.closePreview()"
      />
      <div class="editor-body">
        <CodeEditor
          v-if="question"
          ref="codeEditorRef"
          :value="editor.code"
          :language="editor.language"
          :handle-change="onCodeChange"
          :on-format="onFormatted"
          :preview-code="companion.preview?.resolution.code ?? null"
          @selection-change="editorSelection = $event"
          @ask-selection="selectionAskRef?.expand()"
        />
        <SelectionAskBox
          v-if="companionEnabled && editorSelection && !companion.preview"
          ref="selectionAskRef"
          :selection="editorSelection"
          :name="companionName"
          :busy="!!companion.busy"
          :needs-key="companion.session?.canCallModel === false"
          @ask="askAboutSelection"
          @need-key="openCompanionSettings"
        />
        <p v-if="editor.templateError" class="editor-error">
          {{ editor.templateError }}
        </p>
      </div>

      <VerdictDock v-if="judge.visible" :judge="judge" />

      <CompanionPet
        v-if="
          companionEnabled && question && !companionOpen && !companion.preview
        "
        ref="petRef"
        class="pet-anchor"
        :behavior="duck"
        :intensity="companion.pet.intensity"
        :bubble="companion.pet.bubble"
        :name="companionName"
        @open="companion.openPanel()"
        @dismiss="companion.dismissBubble()"
      />
    </section>

    <!-- ===== 右：陪练 ===== -->
    <PaneResizer
      v-if="companionOpen"
      label="调整陪练宽度"
      @start="companionHandle.start"
      @move="companionHandle.move"
      @end="companionHandle.end"
      @nudge="companionHandle.nudge"
      @reset="companionHandle.reset"
    />
    <CompanionPanel
      v-if="companionOpen"
      ref="panelRef"
      class="companion-pane"
      :companion="companion"
      :duck="duck"
    />
    <DuckFlight />

    <ConfirmDialog
      v-model:visible="resetDialogOpen"
      title="恢复初始代码"
      :message="`当前 ${editor.languageText} 草稿会被初始代码替换，不能撤销。`"
      confirm-text="恢复初始代码"
      @confirm="confirmReset"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { LocationQuery, useRoute, useRouter } from "vue-router";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import CodeEditPreviewBar from "@/components/companion/CodeEditPreviewBar.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import CompanionPanel from "@/components/companion/CompanionPanel.vue";
import CompanionPet from "@/components/companion/CompanionPet.vue";
import DuckFlight from "@/components/companion/DuckFlight.vue";
import { useDuckFlight } from "@/composables/useDuckFlight";
import { PetActivity, usePetBehavior } from "@/composables/usePetBehavior";
import SelectionAskBox from "@/components/companion/SelectionAskBox.vue";
import MySubmissionList from "@/components/problem/MySubmissionList.vue";
import PaneResizer from "@/components/problem/PaneResizer.vue";
import ProblemListDrawer from "@/components/problem/ProblemListDrawer.vue";
import ProblemStatement from "@/components/problem/ProblemStatement.vue";
import AddToListMenu from "@/components/questionList/AddToListMenu.vue";
import FavoriteButton from "@/components/questionList/FavoriteButton.vue";
import SubmissionDetail from "@/components/problem/SubmissionDetail.vue";
import VerdictDock from "@/components/problem/VerdictDock.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import { useJudge } from "@/composables/problem/useJudge";
import {
  SubmissionTab,
  SubmissionTabKey,
  useMySubmissions,
} from "@/composables/problem/useMySubmissions";
import { useProblemEditor } from "@/composables/problem/useProblemEditor";
import { useProblemLayout } from "@/composables/problem/useProblemLayout";
import { useCompanion } from "@/composables/useCompanion";
import { useFavorites } from "@/composables/useFavorites";
import { useMyProgress } from "@/composables/useMyProgress";
import { ApiId, parseRouteApiId, toGeneratedApiId } from "@/services/apiId";
import {
  getNeighbors,
  hasNeighborPage,
  loadNeighborAcrossPage,
} from "@/services/problemNavigation";
import { getQuestionProgressState } from "@/services/questionProgress";
import {
  getJudgeResultPresentation,
  isJudging,
} from "@/services/questionSubmit";
import { formatDateTime } from "@/utils/dateTime";
import { getDifficulty } from "@/utils/difficulty";
import { EditorSelection } from "@/utils/editorSelection";
import {
  QuestionControllerService,
  QuestionSubmitSummaryVO,
  QuestionSubmitVO,
  QuestionVO,
} from "../../../generated";

const CodeEditor = defineAsyncComponent(
  () => import("@/components/editor/CodeEditor.vue")
);
const MdViewer = defineAsyncComponent(
  () => import("@/components/editor/MdViewer.vue")
);

type CodeEditorInstance = {
  format: () => void;
  getCursorInfo: () => {
    cursorLine?: number;
    selectionStartLine?: number;
    selectionEndLine?: number;
  };
  collapseSelection: () => void;
  replaceAll: (code: string) => boolean;
};

type Tab = "question" | "solution" | "mine" | SubmissionTabKey;

/** 上次用的语言，下次打开别的题默认用它 */
const LAST_LANGUAGE_KEY = "myoj:last-language";

const route = useRoute();
const router = useRouter();
const { userId, markStatus, load: loadProgress } = useMyProgress();
const isLoggedIn = computed(() => userId.value != null);
const favorites = useFavorites();

const routeId = parseRouteApiId(route.params.id);
const question = ref<QuestionVO | null>(null);
const questionId = computed<ApiId | null>(() => question.value?.id ?? null);
const loadError = ref("");
const tab = ref<Tab>("question");
const drawerOpen = ref(false);
const codeEditorRef = ref<CodeEditorInstance | null>(null);

const firstText = (value: LocationQuery[string]) =>
  (Array.isArray(value) ? value[0] : value) ?? undefined;

const readLastLanguage = () => {
  try {
    return localStorage.getItem(LAST_LANGUAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

const rememberLanguage = (language: string) => {
  try {
    localStorage.setItem(LAST_LANGUAGE_KEY, language);
  } catch {
    // 记不住也没关系，下次用默认语言
  }
};

// ===== 编辑器 =====
const editor = reactive(
  useProblemEditor({
    questionId,
    userKey: () => userId.value ?? "anonymous",
  })
);

const languageSelectOptions = computed(() =>
  editor.languageOptions.map((option) => ({
    value: option.value,
    label: option.text,
  }))
);

const onLanguageChange = (language: string) => {
  rememberLanguage(language);
  editor.changeLanguage(language);
};

const formatted = ref(false);
let formattedTimer: ReturnType<typeof setTimeout> | undefined;
const onFormatted = () => {
  formatted.value = true;
  if (formattedTimer) clearTimeout(formattedTimer);
  formattedTimer = setTimeout(() => (formatted.value = false), 900);
};

const resetDialogOpen = ref(false);
const confirmReset = () => {
  editor.resetToTemplate();
  resetDialogOpen.value = false;
};

// ===== 进度 =====
const markProgress = (
  submission: Pick<QuestionSubmitSummaryVO, "status" | "judgeInfo">
) => {
  const id = questionId.value;
  const state = getQuestionProgressState(submission);
  if (id == null || state === "unattempted") return;
  markStatus(id, state, getDifficulty(question.value?.tags));
};

// ===== 陪练 =====
const companionEnabled = computed(() => isLoggedIn.value);
const companion = reactive(
  useCompanion({
    questionId,
    enabled: companionEnabled,
    getSnapshot: () => ({
      code: editor.code,
      language: editor.language,
      ...codeEditorRef.value?.getCursorInfo(),
    }),
    applyCode: (code) => codeEditorRef.value?.replaceAll(code) ?? false,
  })
);
const companionName = computed(() => companion.session?.personaName || "鸭鸭");
const companionOpen = computed(
  () => companionEnabled.value && !!question.value && companion.panelOpen
);

// 三块面板的宽度：拖中间的竖条调整，记在本机
const ideRef = ref<HTMLElement | null>(null);
const { gridStyle, statementHandle, companionHandle } = useProblemLayout(
  ideRef,
  companionOpen
);

const editorSelection = ref<EditorSelection | null>(null);
const selectionAskRef = ref<{ expand: () => void } | null>(null);

const askAboutSelection = (text: string) => {
  const selection = editorSelection.value;
  if (!selection) return;
  companion.openPanel();
  // send 会立刻取代码快照，之后再取消选中
  void companion.send(text, {
    startLine: selection.startLine,
    endLine: selection.endLine,
    code: selection.text,
  });
  codeEditorRef.value?.collapseSelection();
  editorSelection.value = null;
};

const openCompanionSettings = () => {
  companion.openPanel();
  companion.setSettingsOpen(true);
};

const applyCompanionPreview = () => {
  if (companion.applyPreview()) message.success("已应用修改，Ctrl+Z 可以撤回");
};

// ===== 提交记录 =====
const submissions = reactive(useMySubmissions({ questionId }));
const activeDetailTab = computed(() =>
  submissions.tabs.find(({ key }) => key === tab.value)
);

const openMine = () => {
  if (!isLoggedIn.value) {
    goLogin();
    return;
  }
  tab.value = "mine";
  if (!submissions.items.length && !submissions.loading) {
    void submissions.load();
  }
};

const openDetail = (submission: QuestionSubmitSummaryVO) => {
  const key = submissions.openTab(submission);
  if (key) tab.value = key;
};

const closeDetail = (key: string) => {
  submissions.closeTab(key);
  if (tab.value === key) tab.value = "mine";
};

const closeAllDetails = () => {
  for (const { key } of [...submissions.tabs]) submissions.closeTab(key);
  tab.value = "mine";
};

/** 看提交列表或某条详情时，下面列出所有打开的提交 */
const showDetailStrip = computed(
  () =>
    submissions.tabs.length > 0 &&
    (tab.value === "mine" || !!activeDetailTab.value)
);

const detailTone = (detailTab: SubmissionTab) =>
  detailTab.detail
    ? getJudgeResultPresentation(detailTab.detail).tone
    : "pending";

const describeDetail = (detailTab: SubmissionTab) => {
  if (!detailTab.detail) return detailTab.loading ? "加载中" : "提交详情";
  const verdict = getJudgeResultPresentation(detailTab.detail).label;
  const time = formatDateTime(detailTab.detail.createTime).slice(5, 16);
  return time ? `${verdict} · ${time}` : verdict;
};

const openPublicSubmissions = () => {
  if (questionId.value == null) return;
  const target = router.resolve({
    path: "/question_submit",
    query: { questionId: String(questionId.value), mode: "group" },
  });
  window.open(target.href, "_blank", "noopener,noreferrer");
};

// ===== 题解 =====
const solution = reactive({ text: "", loading: false, error: "" });

const loadSolution = async () => {
  if (questionId.value == null) return;
  solution.loading = true;
  solution.error = "";
  try {
    const response = await QuestionControllerService.getQuestionSolution(
      toGeneratedApiId(questionId.value)
    );
    if (response.code === 0) {
      solution.text = response.data?.answer || "";
      if (!solution.text) solution.error = "这道题还没有题解";
    } else {
      solution.error =
        response.code === 40400
          ? "题目不存在或已删除"
          : response.message || "题解暂时看不了";
    }
  } catch {
    solution.error = "题解没加载出来，稍后再试";
  } finally {
    solution.loading = false;
  }
};

const openSolution = () => {
  if (!isLoggedIn.value) {
    goLogin();
    return;
  }
  tab.value = "solution";
  if (!solution.text && !solution.loading) void loadSolution();
};

// ===== 判题 =====
/** 判完以后刷新题目上的通过率 */
const refreshQuestionStats = async () => {
  const id = questionId.value;
  if (id == null) return;
  try {
    const response = await QuestionControllerService.getQuestionVoById(
      toGeneratedApiId(id)
    );
    if (response.code === 0 && response.data && question.value?.id === id) {
      question.value = {
        ...question.value,
        submitNum: response.data.submitNum,
        acceptedNum: response.data.acceptedNum,
      };
    }
  } catch {
    // 通过率晚一点更新也没关系
  }
};

const judge = reactive(
  useJudge({
    onUpdate: markProgress,
    onFinished: (submission: QuestionSubmitVO | QuestionSubmitSummaryVO) => {
      const tone = getJudgeResultPresentation(submission).tone;
      // 第一次通过后题解就能看了，下次打开重新取
      if (tone === "passed" && !solution.text) solution.error = "";
      void submissions.load();
      void refreshQuestionStats();
      if (submission.id != null && submission.status != null) {
        void companion.onJudged({
          id: submission.id,
          status: submission.status,
          tone,
        });
      }
    },
  })
);

/** 鸭鸭此刻在忙什么：回答一段段出来时在打字，提交后在等结果 */
const petActivity = computed<PetActivity>(() => {
  if (companion.streaming?.text) return "talking";
  if (judge.submitting) return "judging";
  return null;
});

/** 编辑器里每打一次字加一，鸭鸭会盯着代码看一会儿 */
const typingBeat = ref(0);
const onCodeChange = (value: string) => {
  editor.changeCode(value);
  typingBeat.value += 1;
};

/** 鸭鸭只有一只：编辑器上的桌宠和陪练面板标题里的是同一个，状态连着 */
const duck = usePetBehavior({
  mood: () => companion.pet.mood,
  beat: () => companion.pet.beat,
  activity: () => petActivity.value,
  typingBeat: () => typingBeat.value,
});

// 打开 / 收起陪练面板时，鸭鸭在两个位置之间飞过去。
// 这个回调在页面更新之前执行，起点还在，先量起点；等新位置渲染出来再量终点。
const petRef = ref<InstanceType<typeof CompanionPet> | null>(null);
const panelRef = ref<InstanceType<typeof CompanionPanel> | null>(null);
const { fly } = useDuckFlight();
watch(companionOpen, async (open) => {
  const from = open ? petRef.value?.rect() : panelRef.value?.duckRect();
  if (!from) return;
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const to = open ? panelRef.value?.duckRect() : petRef.value?.rect();
  if (to) fly(from, to, () => duck.land());
});

const goLogin = () => {
  void router.push({
    path: "/user/login",
    query: { redirect: route.fullPath },
  });
};

const submitText = computed(() => {
  if (!isLoggedIn.value) return "登录后提交";
  return judge.submitting ? "判题中" : "提交";
});

const submit = async () => {
  if (!isLoggedIn.value) {
    goLogin();
    return;
  }
  if (questionId.value == null || !editor.ready || judge.submitting) return;
  editor.persistDraft();
  companion.setMood("nervous", 1);
  const submitted = await judge.submit({
    questionId: toGeneratedApiId(questionId.value),
    language: editor.language,
    code: editor.code,
  });
  if (submitted) void submissions.load();
};

// ===== 上一题 / 下一题 =====
const navigating = ref(false);
const neighbors = reactive({
  prev: undefined as ApiId | undefined,
  next: undefined as ApiId | undefined,
  canPrev: false,
  canNext: false,
});

const refreshNeighbors = () => {
  const id = routeId;
  if (id == null) return;
  const found = getNeighbors(id);
  neighbors.prev = found.prev;
  neighbors.next = found.next;
  neighbors.canPrev = found.prev != null || hasNeighborPage(id, "prev");
  neighbors.canNext = found.next != null || hasNeighborPage(id, "next");
};

const goTo = (id: ApiId) => {
  drawerOpen.value = false;
  if (String(id) === String(routeId)) return;
  void router.push(`/problem/${id}`);
};

const goNeighbor = async (direction: "prev" | "next") => {
  const known = direction === "prev" ? neighbors.prev : neighbors.next;
  if (known != null) {
    goTo(known);
    return;
  }
  navigating.value = true;
  try {
    const id = await loadNeighborAcrossPage(direction);
    if (id != null) goTo(id);
  } finally {
    navigating.value = false;
  }
};

// 列表抽屉翻页后，上一题 / 下一题跟着新的一页走
watch(drawerOpen, (open) => {
  if (!open) refreshNeighbors();
});

// ===== 打开题目 =====
const loadQuestion = async () => {
  if (routeId == null) {
    loadError.value = "题目地址不对";
    return;
  }
  try {
    const [response] = await Promise.all([
      QuestionControllerService.getQuestionVoById(toGeneratedApiId(routeId)),
      editor.loadLanguageOptions(),
    ]);
    if (response.code !== 0 || !response.data) {
      loadError.value =
        response.code === 40400
          ? "这道题不存在或已经删除"
          : response.message || "题目没加载出来";
      return;
    }
    question.value = response.data;
  } catch {
    loadError.value = "题目没加载出来，稍后再试";
    return;
  }
  document.title = `${question.value.title} · MyOJ`;
  const language = editor.pickLanguage(
    firstText(route.query.lang),
    readLastLanguage()
  );
  void editor.activateLanguage(language);
  if (isLoggedIn.value) {
    void loadProgress();
    void favorites.load();
    const page = await submissions.load();
    const pending = page.find((item) => isJudging(item.status));
    if (pending) judge.resume(pending);
  }
};

watch(userId, (value, previous) => {
  if (value === previous || !question.value) return;
  submissions.reset();
  if (value != null) void submissions.load();
});

onMounted(() => {
  refreshNeighbors();
  void loadQuestion();
});

onBeforeUnmount(() => {
  editor.dispose();
  judge.stop();
  submissions.reset();
  if (formattedTimer) clearTimeout(formattedTimer);
  document.title = "MyOJ";
});
</script>

<style scoped>
/* 面板之间的 12px 是拖动条；量到宽度后由 useProblemLayout 写行内的列宽 */
.ide {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(300px, 0.72fr) 12px minmax(380px, 1fr);
  padding: 12px 12px 6px 0;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.ide.with-companion {
  grid-template-columns: minmax(300px, 0.72fr) 12px minmax(380px, 1fr) 12px 360px;
}

.pane {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-head {
  height: 54px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 12px;
  border-bottom: 1px solid var(--line);
}

.pane-head .end {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.pane-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* ===== 左侧标签 ===== */
.tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tabs button {
  flex: none;
  height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 13px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.tabs button:hover {
  color: var(--ink);
}

.tabs button.on {
  background: var(--fill);
  color: var(--ink);
  font-weight: 600;
}

.tab-count {
  min-width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--fill-strong);
  color: var(--body);
  font-size: 11.5px;
  font-weight: 600;
}

.detail-strip {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
}

.detail-chip {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 5px 0 10px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--line);
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.detail-chip:hover {
  color: var(--ink);
}

.detail-chip.on {
  background: var(--fill);
  box-shadow: none;
  color: var(--ink);
  font-weight: 600;
}

.chip-dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--faint);
}

.chip-dot.passed {
  background: var(--success);
}

.chip-dot.failed {
  background: var(--danger);
}

.strip-clear {
  margin-left: auto;
  padding: 0 4px;
  border: none;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
}

.strip-clear:hover {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.tab-close {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--faint);
}

.tab-close:hover {
  background: var(--fill-strong);
  color: var(--ink);
}

.solution {
  padding: 22px 26px 30px;
}

.hint {
  margin: 0;
  color: var(--muted);
}

.missing {
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  color: var(--muted);
}

.missing p {
  margin: 0;
}

.statement-skeleton {
  display: grid;
  gap: 14px;
  padding: 28px 26px;
}

.statement-skeleton i {
  height: 14px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  animation: skeleton 1.2s ease-in-out infinite alternate;
}

.statement-skeleton i:first-child {
  width: 46%;
  height: 26px;
}

.statement-skeleton i:nth-child(2) {
  width: 32%;
}

.statement-skeleton i:nth-child(4) {
  width: 84%;
}

@keyframes skeleton {
  to {
    opacity: 0.4;
  }
}

/* ===== 编辑器 ===== */
.saved {
  width: 30px;
  display: grid;
  place-items: center;
  color: var(--line-strong);
  transition: color var(--motion-fast) ease;
}

.saved.on {
  color: var(--faint);
}

.icon-btn:disabled {
  cursor: default;
  opacity: 0.35;
}

.icon-btn:disabled:hover {
  background: transparent;
  color: var(--muted);
}

.submit {
  margin-left: 6px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.editor-body {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* Monaco 内部用 ResizeObserver，容器尺寸要固定住，避免结果条出现时触发循环 */
.editor-body :deep(#code-editor) {
  height: 100% !important;
  min-height: 200px !important;
  width: 100% !important;
  overflow: hidden !important;
  contain: strict !important;
}

.editor-error {
  position: absolute;
  inset: 24px 24px auto;
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--danger);
}

.pet-anchor {
  position: absolute;
  top: 66px;
  right: 22px;
  z-index: 6;
}

/* ===== 陪练 ===== */
.companion-pane {
  min-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .statement-skeleton i,
  .spin {
    animation: none;
  }
}

@media (max-width: 720px) {
  .lang select {
    max-width: 128px;
  }

  .saved {
    display: none;
  }

  .tabs button {
    padding: 0 10px;
  }
}

@media (max-width: 1024px) {
  .ide,
  .ide.with-companion {
    grid-template-columns: minmax(0, 1fr) !important;
    grid-template-rows: minmax(260px, 0.9fr) minmax(360px, 1.1fr);
    gap: 12px;
    padding: 10px;
  }

  .resizer {
    display: none;
  }
}
</style>
