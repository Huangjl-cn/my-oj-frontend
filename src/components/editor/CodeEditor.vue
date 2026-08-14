<template>
  <div class="code-editor-shell">
    <div
      id="code-editor"
      ref="codeEditorRef"
      style="min-height: 400px; height: 60vh"
    />
    <Transition name="format-hint">
      <div v-if="formatHint" class="format-hint">{{ formatHint }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  defineExpose,
  defineProps,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  withDefaults,
} from "vue";

interface Props {
  value: string;
  language?: string;
  handleChange: (v: string) => void;
  onFormat?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  value: () => "",
  language: () => "java",
  handleChange: () => undefined,
  onFormat: () => undefined,
});

const codeEditorRef = ref<HTMLElement | null>(null);
const codeEditor =
  shallowRef<import("monaco-editor").editor.IStandaloneCodeEditor>();
let monaco: typeof import("monaco-editor") | undefined;
let syncingValue = false;

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
});

onBeforeUnmount(() => {
  if (formatHintTimer) clearTimeout(formatHintTimer);
  codeEditor.value?.dispose();
});

defineExpose({ format });
</script>

<style scoped>
.code-editor-shell {
  position: relative;
  width: 100%;
  height: 100%;
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
