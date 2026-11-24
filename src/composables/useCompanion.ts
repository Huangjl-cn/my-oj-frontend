import {
  computed,
  reactive,
  Ref,
  ref,
  shallowRef,
  UnwrapNestedRefs,
  watch,
} from "vue";

import { ApiId } from "@/services/apiId";
import {
  isProposalBase,
  ProposalResolution,
  resolveProposal,
} from "@/services/codeEditProposal";
import {
  CodeEditProposal,
  CodeSnapshot,
  CompanionCompaction,
  CompanionMessage,
  CompanionSession,
  compactCompanionMemory,
  ContextUsage,
  describeCompanionError,
  getCompanionSession,
  HintStep,
  isKeyProblem,
  listCompanionMessages,
  reactToSubmission,
  requestHint,
  setHintLevel,
} from "@/services/companion";
import { streamCompanion } from "@/services/companionStream";
import { instantMoodForJudge, PetMood } from "@/constants/companionMoods";

/** 提示阶梯里普通提示的最高一级，第 5 级是「看答案」，走单独的入口 */
export const MAX_HINT_LEVEL = 4;

export type CompanionBusy = "chat" | "hint" | "solution" | "compact" | null;

export interface StreamingReply {
  type: "chat" | "solution";
  text: string;
  thinking: string;
}

export interface CodePreview {
  proposal: CodeEditProposal;
  resolution: ProposalResolution;
}

export interface JudgedSubmission {
  id: ApiId;
  status?: number;
  tone: "passed" | "failed" | "pending";
}

export interface UseCompanionOptions {
  questionId: Ref<ApiId | null | undefined>;
  /** 登录后才有陪练 */
  enabled: Ref<boolean>;
  /** 编辑器当前状态，每次请求时现取 */
  getSnapshot: () => CodeSnapshot;
  /** 把应用修改后的代码写回编辑器，返回是否成功 */
  applyCode: (code: string) => boolean;
}

const isPersistedId = (id: ApiId) => /^\d+$/.test(String(id));

/**
 * 一道题上的陪练状态：会话、消息、流式回答、代码修改预览和桌宠的心情。
 * 切题时整体重置；进行中的流式请求会被取消（后端照常写完并保存这条回答）。
 */
export const useCompanion = (options: UseCompanionOptions) => {
  const session = ref<CompanionSession | null>(null);
  const loading = ref(false);
  const loadError = ref("");
  const messages = ref<CompanionMessage[]>([]);
  const hasMore = ref(false);
  const loadingMore = ref(false);
  const busy = ref<CompanionBusy>(null);
  const streaming = ref<StreamingReply | null>(null);
  const lastError = ref("");
  const preview = shallowRef<CodePreview | null>(null);
  const panelOpen = ref(false);
  const settingsOpen = ref(false);
  const pet = reactive({
    mood: "idle" as PetMood,
    intensity: 1,
    bubble: "",
    /** 每次变化都会重播动画 */
    beat: 0,
  });

  let generation = 0;
  let localSeq = 0;
  let abortController: AbortController | undefined;
  /** 每条修改建议对应的请求原文，用来判断代码在这期间有没有变 */
  const sentCodes = new WeakMap<CodeEditProposal, string>();

  const track = computed(() => session.value?.hintTrack ?? "idea");
  const steps = computed<HintStep[]>(
    () => session.value?.hintSteps?.[track.value] ?? []
  );
  const level = computed(() => session.value?.hintLevel ?? 0);
  const isDirectMode = computed(() => session.value?.hintMode === "direct");
  const nextStep = computed(() =>
    level.value < MAX_HINT_LEVEL ? steps.value[level.value + 1] : undefined
  );
  const contextUsage = computed<ContextUsage | undefined>(
    () => session.value?.contextUsage
  );

  const setMood = (mood: PetMood, intensity = 1) => {
    pet.mood = mood;
    pet.intensity = Math.min(3, Math.max(1, intensity));
    pet.beat += 1;
  };

  const say = (text: string) => {
    pet.bubble = panelOpen.value ? "" : text;
  };

  const abortStream = () => {
    abortController?.abort();
    abortController = undefined;
  };

  const reset = () => {
    abortStream();
    session.value = null;
    messages.value = [];
    hasMore.value = false;
    busy.value = null;
    streaming.value = null;
    lastError.value = "";
    loadError.value = "";
    preview.value = null;
    pet.bubble = "";
    setMood("idle");
  };

  const load = async () => {
    const questionId = options.questionId.value;
    const current = ++generation;
    reset();
    if (!options.enabled.value || questionId == null) return;
    loading.value = true;
    try {
      const result = await getCompanionSession(questionId);
      if (current !== generation) return;
      session.value = result;
      messages.value = result.messages ?? [];
      hasMore.value = !!result.hasMoreMessages;
    } catch (error) {
      if (current === generation) loadError.value = describeCompanionError(error);
    } finally {
      if (current === generation) loading.value = false;
    }
  };

  /** 重新拉会话和最近消息（自动整理记忆后，消息列表会多出一条整理笔记） */
  const refresh = async () => {
    const questionId = options.questionId.value;
    const current = generation;
    if (questionId == null) return;
    try {
      const result = await getCompanionSession(questionId);
      if (current !== generation) return;
      session.value = result;
      messages.value = result.messages ?? [];
      hasMore.value = !!result.hasMoreMessages;
    } catch {
      // 刷新失败不影响已有内容
    }
  };

  watch([options.questionId, options.enabled], () => void load(), {
    immediate: true,
  });

  const loadMore = async () => {
    const questionId = options.questionId.value;
    const oldest = messages.value.find((message) => isPersistedId(message.id));
    if (questionId == null || !oldest || loadingMore.value) return;
    const current = generation;
    loadingMore.value = true;
    try {
      const older = await listCompanionMessages(questionId, oldest.id);
      if (current !== generation) return;
      messages.value = [...older, ...messages.value];
      hasMore.value = older.length > 0;
    } catch (error) {
      lastError.value = describeCompanionError(error);
    } finally {
      loadingMore.value = false;
    }
  };

  const pushMessage = (message: CompanionMessage) => {
    if (messages.value.some((item) => String(item.id) === String(message.id))) {
      return;
    }
    messages.value = [...messages.value, message];
  };

  const handleFailure = (error: unknown) => {
    lastError.value = describeCompanionError(error);
    if (isKeyProblem(error)) settingsOpen.value = true;
    setMood("confused", 1);
  };

  const updateSession = (patch: Partial<CompanionSession>) => {
    if (session.value) session.value = { ...session.value, ...patch };
  };

  // region 代码修改预览

  const openPreview = async (proposal: CodeEditProposal) => {
    const currentCode = options.getSnapshot().code;
    const baseMatches = await isProposalBase(
      currentCode,
      proposal,
      sentCodes.get(proposal)
    );
    preview.value = {
      proposal,
      resolution: resolveProposal(currentCode, proposal, baseMatches),
    };
  };

  const closePreview = () => {
    preview.value = null;
  };

  const applyPreview = () => {
    const current = preview.value;
    if (!current || current.resolution.applied === 0) return false;
    const applied = options.applyCode(current.resolution.code);
    if (applied) preview.value = null;
    return applied;
  };

  const receiveProposal = (proposal: CodeEditProposal, sentCode: string) => {
    sentCodes.set(proposal, sentCode);
    void openPreview(proposal);
  };

  // endregion

  // region 对话、提示、看答案

  const runStream = async (
    type: StreamingReply["type"],
    body: { message?: string },
    snapshot: CodeSnapshot
  ) => {
    const questionId = options.questionId.value;
    if (questionId == null) return false;
    const current = generation;
    abortStream();
    const controller = new AbortController();
    abortController = controller;
    busy.value = type;
    lastError.value = "";
    streaming.value = { type, text: "", thinking: "" };
    setMood("thinking");
    let proposal: CodeEditProposal | undefined;
    try {
      const done = await streamCompanion(
        type === "chat" ? "/companion/chat" : "/companion/solution",
        { questionId, snapshot, ...body },
        {
          onThinking: (text) => {
            if (streaming.value) streaming.value.thinking += text;
          },
          onDelta: (text) => {
            if (streaming.value) streaming.value.text += text;
          },
          onEdits: (edits) => {
            proposal = edits;
          },
        },
        controller.signal
      );
      if (current !== generation) return true;
      const reply = streaming.value as StreamingReply | null;
      pushMessage({
        id: done.messageId,
        role: "assistant",
        type,
        hintLevel: type === "solution" ? done.hintLevel : null,
        hintTrack: done.hintTrack,
        content: reply?.text ?? "",
        codeEdits: proposal ?? null,
      });
      updateSession({
        hintTrack: done.hintTrack,
        hintLevel: done.hintLevel,
        contextUsage: done.contextUsage,
      });
      setMood(type === "solution" ? "proud" : "encouraging", 1);
      if (proposal) receiveProposal(proposal, snapshot.code);
      if (done.compacted) void refresh();
      return true;
    } catch (error) {
      if (controller.signal.aborted || current !== generation) return false;
      handleFailure(error);
      return false;
    } finally {
      if (current === generation) {
        busy.value = null;
        streaming.value = null;
      }
      if (abortController === controller) abortController = undefined;
    }
  };

  /** 发一条消息；失败时返回 false，调用方可以把输入框内容还原 */
  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy.value) return false;
    const snapshot = options.getSnapshot();
    const local: CompanionMessage = {
      id: `local-${++localSeq}`,
      role: "user",
      type: "chat",
      content,
    };
    pushMessage(local);
    const ok = await runStream("chat", { message: content }, snapshot);
    if (!ok) {
      messages.value = messages.value.filter((item) => item.id !== local.id);
    }
    return ok;
  };

  const showSolution = async () => {
    if (busy.value) return false;
    return runStream("solution", {}, options.getSnapshot());
  };

  const askHint = async (targetLevel?: number) => {
    const questionId = options.questionId.value;
    if (questionId == null || busy.value) return false;
    const current = generation;
    const snapshot = options.getSnapshot();
    busy.value = "hint";
    lastError.value = "";
    setMood("thinking");
    try {
      const hint = await requestHint(questionId, snapshot, targetLevel);
      if (current !== generation) return true;
      pushMessage({
        id: hint.messageId,
        role: "assistant",
        type: "hint",
        hintLevel: hint.hintLevel,
        hintTrack: hint.hintTrack,
        content: hint.message,
        codeEdits: hint.codeEdits ?? null,
      });
      updateSession({
        hintLevel: hint.hintLevel,
        effectiveLevel: Math.max(
          hint.hintLevel,
          session.value?.effectiveLevel ?? 0
        ),
        hintTrack: hint.hintTrack,
        contextUsage: hint.contextUsage,
      });
      setMood("encouraging", 1);
      if (hint.codeEdits) receiveProposal(hint.codeEdits, snapshot.code);
      return true;
    } catch (error) {
      if (current === generation) handleFailure(error);
      return false;
    } finally {
      if (current === generation) busy.value = null;
    }
  };

  /** 把提示进度调回某一级（0 表示从头自己做），不会生成新的提示 */
  const changeLevel = async (target: number) => {
    const questionId = options.questionId.value;
    if (questionId == null || busy.value) return;
    const current = generation;
    try {
      const state = await setHintLevel(questionId, target);
      if (current !== generation) return;
      updateSession({
        hintLevel: state.hintLevel,
        effectiveLevel: state.effectiveLevel,
        hintTrack: state.hintTrack,
      });
      setMood(target === 0 ? "playful" : "thoughtful", 1);
    } catch (error) {
      if (current === generation) handleFailure(error);
    }
  };

  const compact = async (): Promise<CompanionCompaction | undefined> => {
    const questionId = options.questionId.value;
    if (questionId == null || busy.value) return undefined;
    const current = generation;
    busy.value = "compact";
    lastError.value = "";
    try {
      const result = await compactCompanionMemory(questionId);
      if (current !== generation) return undefined;
      updateSession({ contextUsage: result.contextUsage });
      if (result.compacted) await refresh();
      return result;
    } catch (error) {
      if (current === generation) handleFailure(error);
      return undefined;
    } finally {
      if (current === generation) busy.value = null;
    }
  };

  // endregion

  // region 提交后的反应

  /** 判题出了终态时调用：先按结果立刻播动作，再换成陪练的反应 */
  const onJudged = async (submission: JudgedSubmission) => {
    if (!session.value) return;
    const current = generation;
    setMood(instantMoodForJudge(submission.tone, submission.status), 2);
    try {
      const reaction = await reactToSubmission(submission.id);
      if (current !== generation) return;
      setMood(reaction.mood, reaction.moodIntensity);
      say(reaction.message);
      pushMessage({
        id: reaction.messageId,
        role: "assistant",
        type: "reaction",
        mood: reaction.mood,
        moodIntensity: reaction.moodIntensity,
        hintTrack: reaction.hintTrack,
        submissionId: reaction.submissionId,
        content: reaction.message,
      });
      updateSession({ hintTrack: reaction.hintTrack });
    } catch {
      if (current === generation) setMood("idle");
    }
  };

  // endregion

  const openPanel = () => {
    panelOpen.value = true;
    pet.bubble = "";
  };

  const closePanel = () => {
    panelOpen.value = false;
  };

  const dismissBubble = () => {
    pet.bubble = "";
  };

  const setSettingsOpen = (open: boolean) => {
    settingsOpen.value = open;
  };

  return {
    session,
    loading,
    loadError,
    messages,
    hasMore,
    loadingMore,
    busy,
    streaming,
    lastError,
    preview,
    panelOpen,
    settingsOpen,
    pet,
    track,
    steps,
    level,
    isDirectMode,
    nextStep,
    contextUsage,
    load,
    loadMore,
    send,
    askHint,
    showSolution,
    changeLevel,
    compact,
    onJudged,
    openPreview,
    closePreview,
    applyPreview,
    openPanel,
    closePanel,
    dismissBubble,
    setSettingsOpen,
    setMood,
  };
};

export type CompanionController = ReturnType<typeof useCompanion>;

/** 视图里用 reactive() 包一层，模板和子组件里直接读值 */
export type CompanionState = UnwrapNestedRefs<CompanionController>;
