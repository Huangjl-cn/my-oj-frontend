<template>
  <Editor
    :value="value"
    :mode="mode"
    :plugins="plugins"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import { Editor, Viewer } from "@bytemd/vue-next";
import { ref, withDefaults, defineProps } from "vue";

interface Props {
  value: string;
  mode?: string;
  handleChange: (v: string) => void;
}

const plugins = [gfm(), highlight()];

const props = withDefaults(defineProps<Props>(), {
  value: () => "",
  mode: () => "split",
  handleChange: (v: string) => {
    console.log(v);
  },
});
</script>

<style>
.bytemd {
  border: 1px solid var(--hairline) !important;
  border-radius: var(--radius-md) !important;
  height: 400px !important;
  min-height: 300px;
}

.bytemd .bytemd-toolbar {
  background: var(--surface-soft) !important;
  border-bottom: 1px solid var(--hairline) !important;
  border-radius: var(--radius-md) var(--radius-md) 0 0 !important;
}

.bytemd .bytemd-toolbar-icon {
  color: var(--muted) !important;
}

.bytemd .bytemd-toolbar-icon:hover {
  color: var(--ink) !important;
  background: var(--surface-card) !important;
}

.bytemd .bytemd-body {
  background: var(--canvas) !important;
}

.bytemd .bytemd-editor {
  background: var(--canvas) !important;
}

.bytemd .bytemd-editor .CodeMirror {
  background: var(--canvas) !important;
  color: var(--ink) !important;
  font-family: var(--font-code) !important;
  font-size: 14px !important;
}

.bytemd .bytemd-preview {
  background: var(--canvas) !important;
}

.bytemd .bytemd-preview .markdown-body {
  font-family: var(--font-body) !important;
  color: var(--body) !important;
}

.bytemd .bytemd-status {
  background: var(--surface-soft) !important;
  border-top: 1px solid var(--hairline) !important;
  border-radius: 0 0 var(--radius-md) var(--radius-md) !important;
  color: var(--muted) !important;
  font-family: var(--font-body) !important;
  font-size: 12px !important;
}

.bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:last-child {
  display: none;
}
</style>
