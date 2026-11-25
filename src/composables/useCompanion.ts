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
  CodeQuote,
  CodeSnapshot,
  CompanionCompaction,
  CompanionConversation,
  CompanionMessage,
  CompanionSession,
  compactCompanionMemory,
  ContextUsage,
  describeCompanionError,
  getCompanionSession,
  HintStep,
  isKeyProblem,
  listCompanionConversations,
  listCompanionMessages,
  reactToSubmission,
  requestHint,
  setHintLevel,
  startCompanionConversation,
  switchCompanionConversation,
} from "@/services/companion";
import { streamCompanion } from "@/services/companionStream";
import { instantMoodForJudge, PetMood } from "@/constants/companionMoods";

/** 用户能直接调到的最高档位，第 5 档是「看答案」，走单独的入口 */
export const MAX_HINT_LEVEL = 4;
export const SOLUTION_LEVEL = 5;

export type CompanionBusy =
  | "chat"
  | "hint"
  | "solution"
  | "compact"
  | "conversation"
  | null;

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

const sameId = (a?: ApiId | null, b?: ApiId | null) =>
  a != null && b != null && String(a) === String(b);

/**
 * 一道题上的陪练状态：会话（档位、当前对话）、消息、流式回答、代码修改预览和桌宠的心情。
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
  const conversations = ref<CompanionConversation[]>([]);
  const conversationsLoading = ref(false);
  const pet = reactive({
    mood: "idle" as PetMood,
    intensity: 1,
    bubble: "",
    /** 每次变化都会重播动画 */
    beat: 0,
  });

  /** 切题、切对话时加一，用来丢弃过期的异步结果 */
  let generation = 0;
  let localSeq = 0;
  let abortController: AbortController | undefined;
  /** 每条修改建议对应的请求原文，用来判断代码在这期间有没有变 */
  const sentCodes = new WeakMap<CodeEditProposal, string>();

  const conversationId = computed(() => session.value?.conversationId);
  const steps = computed<HintStep[]>(() => session.value?.hintSteps ?? []);
  const level = computed(() => session.value?.hintLevel ?? 0);
  const currentStep = computed(() => steps.value[level.value]);
  const isDirectMode = computed(() => session.value?.hintMode === "direct");
  const contextUsage = computed<ContextUsage | undefined>(
    () => session.value?.contextUsage
  );
  /** 当前对话还什么都没说过：这时「新对话」没有意义 */
  const isFreshConversation = computed(
    () => !messages.value.length && !hasMore.value && !streaming.value
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

  const applySession = (result: CompanionSession) => {
    session.value = result;
    messages.value = result.messages ?? [];
    hasMore.value = !!result.hasMoreMessages;
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
    conversations.value = [];
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
      if (current === generation) applySession(result);
    } catch (error) {
      if (current === generation)
        loadError.value = describeCompanionError(error);
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
      if (current === generation) applySession(result);
    } catch {
      // 刷新失败不影响已有内容
    }
  };

  watch([options.questionId, options.enabled], () => void load(), {
    immediate: true,
  });

  const loadMore = async () => {
    const id = conversationId.value;
    const oldest = messages.value.find((message) => isPersistedId(message.id));
    if (id == null || !oldest || loadingMore.value) return;
    const current = generation;
    loadingMore.value = true;
    try {
      const older = await listCompanionMessages(id, oldest.id);
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

  // region 对话

  const loadConversations = async () => {
    const questionId = options.questionId.value;
    if (questionId == null) return;
    const current = generation;
    conversationsLoading.value = true;
    try {
      const list = await listCompanionConversations(questionId);
      if (current === generation) conversations.value = list;
    } catch (error) {
      if (current === generation)
        lastError.value = describeCompanionError(error);
    } finally {
      if (current === generation) conversationsLoading.value = false;
    }
  };

  /** 换成另一段对话：丢弃旧对话上未完成的结果，失败时保持原样 */
  const changeConversation = async (
    request: () => Promise<CompanionSession>
  ) => {
    if (busy.value || !session.value) return false;
    const current = ++generation;
    busy.value = "conversation";
    lastError.value = "";
    conversationsLoading.value = false;
    try {
      const result = await request();
      if (current !== generation) return false;
      applySession(result);
      conversations.value = [];
      return true;
    } catch (error) {
      if (current === generation) handleFailure(error);
      return false;
    } finally {
      if (current === generation) busy.value = null;
    }
  };

  const startConversation = async () => {
    const questionId = options.questionId.value;
    if (questionId == null || isFreshConversation.value) return false;
    const ok = await changeConversation(() =>
      startCompanionConversation(questionId)
    );
    if (ok) setMood("playful", 1);
    return ok;
  };

  const switchConversation = async (id: ApiId) => {
    if (sameId(id, conversationId.value)) return true;
    return changeConversation(() => switchCompanionConversation(id));
  };

  // endregion

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
    body: { message?: string; quote?: CodeQuote },
    snapshot: CodeSnapshot
  ) => {
    const id = conversationId.value;
    if (id == null) return false;
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
        { conversationId: id, snapshot, ...body },
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
        hintLevel: type === "solution" ? SOLUTION_LEVEL : null,
        content: reply?.text ?? "",
        codeEdits: proposal ?? null,
      });
      updateSession({
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

  /**
   * 发一条消息，quote 是选中代码提问时引用的那一段；失败时返回 false，调用方可以把输入框内容还原
   */
  const send = async (text: string, quote?: CodeQuote) => {
    const content = text.trim();
    if (!content || busy.value) return false;
    const snapshot = options.getSnapshot();
    const local: CompanionMessage = {
      id: `local-${++localSeq}`,
      role: "user",
      type: "chat",
      content,
      quote: quote ?? null,
    };
    pushMessage(local);
    const ok = await runStream("chat", { message: content, quote }, snapshot);
    if (!ok) {
      messages.value = messages.value.filter((item) => item.id !== local.id);
    }
    return ok;
  };

  const showSolution = async () => {
    if (busy.value) return false;
    return runStream("solution", {}, options.getSnapshot());
  };

  /** 按当前档位要一条提示，不改变档位 */
  const askHint = async () => {
    const id = conversationId.value;
    if (id == null || busy.value) return false;
    const current = generation;
    const snapshot = options.getSnapshot();
    busy.value = "hint";
    lastError.value = "";
    setMood("thinking");
    try {
      const hint = await requestHint(id, snapshot);
      if (current !== generation) return true;
      pushMessage({
        id: hint.messageId,
        role: "assistant",
        type: "hint",
        hintLevel: hint.hintLevel,
        content: hint.message,
        codeEdits: hint.codeEdits ?? null,
      });
      updateSession({ contextUsage: hint.contextUsage });
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

  /** 调档位（0-4），只改档位，不生成内容 */
  const changeLevel = async (target: number) => {
    const questionId = options.questionId.value;
    if (questionId == null || busy.value || target === level.value) return;
    const current = generation;
    try {
      const state = await setHintLevel(questionId, target);
      if (current !== generation) return;
      updateSession({
        hintLevel: state.hintLevel,
        effectiveLevel: state.effectiveLevel,
      });
      setMood(target < level.value ? "playful" : "thoughtful", 1);
    } catch (error) {
      if (current === generation) handleFailure(error);
    }
  };

  const compact = async (): Promise<CompanionCompaction | undefined> => {
    const id = conversationId.value;
    if (id == null || busy.value) return undefined;
    const current = generation;
    busy.value = "compact";
    lastError.value = "";
    try {
      const result = await compactCompanionMemory(id);
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
      // 反应记在后端的当前对话里；不是正在看的这段（比如另一个标签页切过对话）就不插进列表
      if (!sameId(reaction.conversationId, conversationId.value)) return;
      pushMessage({
        id: reaction.messageId,
        role: "assistant",
        type: "reaction",
        mood: reaction.mood,
        moodIntensity: reaction.moodIntensity,
        submissionId: reaction.submissionId,
        content: reaction.message,
      });
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
    conversations,
    conversationsLoading,
    pet,
    conversationId,
    steps,
    level,
    currentStep,
    isDirectMode,
    contextUsage,
    isFreshConversation,
    load,
    loadMore,
    loadConversations,
    startConversation,
    switchConversation,
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
