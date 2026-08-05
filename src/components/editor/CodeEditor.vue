<template>
  <div
    id="code-editor"
    ref="codeEditorRef"
    style="min-height: 400px; height: 60vh"
  />
</template>

<script setup lang="ts">
import {
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
}

const props = withDefaults(defineProps<Props>(), {
  value: () => "",
  language: () => "java",
  handleChange: () => undefined,
});

const codeEditorRef = ref<HTMLElement | null>(null);
const codeEditor =
  shallowRef<import("monaco-editor").editor.IStandaloneCodeEditor>();
let monaco: typeof import("monaco-editor") | undefined;

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
      editor.setValue(newVal);
    }
  }
);

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
    if (codeEditor.value) {
      props.handleChange(codeEditor.value.getValue());
    }
  });
});

onBeforeUnmount(() => {
  codeEditor.value?.dispose();
});
</script>
