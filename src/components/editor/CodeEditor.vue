<template>
  <div class="code-editor-shell">
    <div
      v-show="previewCode == null"
      id="code-editor"
      ref="codeEditorRef"
      style="min-height: 400px; height: 60vh"
    />
    <div
      v-if="previewCode != null"
      ref="diffEditorRef"
      class="diff-editor"
      aria-label="代码修改预览"
    />
    <Transition name="format-hint">
      <div v-if="formatHint" class="format-hint">{{ formatHint }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  defineEmits,
  defineExpose,
  defineProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  withDefaults,
} from "vue";

import { EditorSelection, selectedLineRange } from "@/utils/editorSelection";

interface Props {
  value: string;
  language?: string;
  handleChange: (v: string) => void;
  onFormat?: () => void;
  /** 不为 null 时进入对比预览：左边（或上方）是当前代码，右边是这份代码，只读 */
  previewCode?: string | null;
}

type EditorCursorInfo = {
  cursorLine?: number;
  selectionStartLine?: number;
  selectionEndLine?: number;
};

const props = withDefaults(defineProps<Props>(), {
  value: () => "",
  language: () => "java",
  handleChange: () => undefined,
  onFormat: () => undefined,
  previewCode: null,
});

const emit = defineEmits<{
  /** 选中的内容或它的位置变了；没有选中（或选区滚出可见区域）时为 null */
  (event: "selection-change", selection: EditorSelection | null): void;
  /** 有选区时按了 Ctrl+I */
  (event: "ask-selection"): void;
}>();

/** 拖选过程中选区一直在变，停下来一会儿再通知 */
const SELECTION_SETTLE_MS = 120;

const codeEditorRef = ref<HTMLElement | null>(null);
const diffEditorRef = ref<HTMLElement | null>(null);
const codeEditor =
  shallowRef<import("monaco-editor").editor.IStandaloneCodeEditor>();
let monaco: typeof import("monaco-editor") | undefined;
let syncingValue = false;
let diffEditor:
  | import("monaco-editor").editor.IStandaloneDiffEditor
  | undefined;
let diffModels: import("monaco-editor").editor.ITextModel[] = [];

/** 宽度够时左右对比，否则上下（内联）对比 */
const SIDE_BY_SIDE_MIN_WIDTH = 900;

const disposeDiffEditor = () => {
  diffEditor?.dispose();
  diffEditor = undefined;
  diffModels.forEach((model) => model.dispose());
  diffModels = [];
};

const openDiffEditor = async (modifiedCode: string) => {
  await nextTick();
  const container = diffEditorRef.value;
  if (!monaco || !container) return;
  disposeDiffEditor();
  const language =
    codeEditor.value?.getModel()?.getLanguageId() ?? props.language;
  const original = monaco.editor.createModel(
    codeEditor.value?.getValue() ?? props.value,
    language
  );
  const modified = monaco.editor.createModel(modifiedCode, language);
  diffModels = [original, modified];
  diffEditor = monaco.editor.createDiffEditor(container, {
    automaticLayout: true,
    readOnly: true,
    originalEditable: false,
    renderSideBySide: container.clientWidth >= SIDE_BY_SIDE_MIN_WIDTH,
    enableSplitViewResizing: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    theme: "vs-dark",
  });
  diffEditor.setModel({ original, modified });
};

watch(
  () => props.previewCode,
  (code) => {
    if (code == null) {
      disposeDiffEditor();
      // 预览期间代码编辑器是隐藏的，回来后重新聚焦
      void nextTick(() => codeEditor.value?.focus());
    } else {
      void openDiffEditor(code);
    }
  }
);

watch(
  () => props.language,
  () => {
    const model = codeEditor.value?.getModel();
    if (model && monaco) {
      monaco.editor.setModelLanguage(model, props.language);
    }
  }
);

watch(
  () => props.value,
  (newVal) => {
    const editor = codeEditor.value;
    if (editor && editor.getValue() !== newVal) {
      syncingValue = true;
      editor.setValue(newVal);
      syncingValue = false;
    }
  }
);

// Monaco 内置格式化器仅覆盖 javascript / typescript，其余语言无 provider
const FORMATTABLE_LANGUAGES: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
};

let selectionTimer: ReturnType<typeof setTimeout> | undefined;

const publishSelection = () => {
  const editor = codeEditor.value;
  const model = editor?.getModel();
  const selection = editor?.getSelection();
  if (!editor || !model || !selection || selection.isEmpty()) {
    emit("selection-change", null);
    return;
  }
  const text = model.getValueInRange(selection);
  const end = editor.getScrolledVisiblePosition(selection.getEndPosition());
  const layout = editor.getLayoutInfo();
  if (!text.trim() || !end || end.top < 0 || end.top > layout.height) {
    emit("selection-change", null);
    return;
  }
  emit("selection-change", {
    ...selectedLineRange(
      selection.startLineNumber,
      selection.endLineNumber,
      selection.endColumn
    ),
    text,
    anchor: { top: end.top, bottom: end.top + end.height, left: end.left },
    view: { width: layout.width, height: layout.height },
  });
};

const scheduleSelection = () => {
  if (selectionTimer) clearTimeout(selectionTimer);
  selectionTimer = setTimeout(publishSelection, SELECTION_SETTLE_MS);
};

const formatHint = ref("");
let formatHintTimer: ReturnType<typeof setTimeout> | undefined;

const showFormatHint = (message: string) => {
  formatHint.value = message;
  if (formatHintTimer) clearTimeout(formatHintTimer);
  formatHintTimer = setTimeout(() => {
    formatHint.value = "";
    formatHintTimer = undefined;
  }, 2200);
};

const format = () => {
  const editor = codeEditor.value;
  if (!editor) return;
  const language = editor.getModel()?.getLanguageId() ?? props.language;
  if (!(language in FORMATTABLE_LANGUAGES)) {
    showFormatHint(`暂不支持 ${language} 格式化`);
    return;
  }
  editor.getAction("editor.action.formatDocument")?.run();
  props.onFormat();
};

onMounted(async () => {
  if (!codeEditorRef.value) {
    return;
  }
  monaco = await import("monaco-editor");
  codeEditor.value = monaco.editor.create(codeEditorRef.value, {
    value: props.value,
    language: props.language,
    automaticLayout: true,
    colorDecorators: true,
    minimap: {
      enabled: true,
    },
    readOnly: false,
    theme: "vs-dark",
  });

  codeEditor.value.onDidChangeModelContent(() => {
    if (codeEditor.value && !syncingValue) {
      props.handleChange(codeEditor.value.getValue());
    }
  });

  // Ctrl+Alt+L: format document
  codeEditor.value.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyL,
    format
  );

  codeEditor.value.onDidChangeCursorSelection(scheduleSelection);
  codeEditor.value.onDidScrollChange(scheduleSelection);
  // Ctrl+I：就选中的代码提问（只在有选区时生效）
  codeEditor.value.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
    () => emit("ask-selection"),
    "editorHasSelection"
  );
});

/** 光标所在行和选中的行范围（没有选中内容时不返回选区），行号从 1 开始 */
const getCursorInfo = (): EditorCursorInfo => {
  const editor = codeEditor.value;
  if (!editor) return {};
  const selection = editor.getSelection();
  const hasSelection = selection != null && !selection.isEmpty();
  return {
    cursorLine: editor.getPosition()?.lineNumber,
    selectionStartLine: hasSelection ? selection.startLineNumber : undefined,
    selectionEndLine: hasSelection ? selection.endLineNumber : undefined,
  };
};

/** 取消选中，光标停在选区末尾 */
const collapseSelection = () => {
  const editor = codeEditor.value;
  const selection = editor?.getSelection();
  if (!editor || !selection || selection.isEmpty()) return;
  const end = selection.getEndPosition();
  editor.setPosition(end);
};

/** 整体替换代码，作为一次编辑进入撤销栈（Ctrl+Z 可以撤回） */
const replaceAll = (code: string) => {
  const editor = codeEditor.value;
  const model = editor?.getModel();
  if (!editor || !model) return false;
  editor.pushUndoStop();
  editor.executeEdits("companion", [
    { range: model.getFullModelRange(), text: code, forceMoveMarkers: true },
  ]);
  editor.pushUndoStop();
  return true;
};

onBeforeUnmount(() => {
  if (formatHintTimer) clearTimeout(formatHintTimer);
  if (selectionTimer) clearTimeout(selectionTimer);
  disposeDiffEditor();
  codeEditor.value?.dispose();
});

defineExpose({ format, getCursorInfo, collapseSelection, replaceAll });
</script>

<style scoped>
.code-editor-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.diff-editor {
  position: absolute;
  inset: 0;
}

.format-hint {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  padding: 5px 14px;
  color: var(--on-dark-soft);
  background: var(--surface-dark-elevated);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

.format-hint-enter-active,
.format-hint-leave-active {
  transition: opacity 200ms ease;
}

.format-hint-enter-from,
.format-hint-leave-to {
  opacity: 0;
}
</style>
