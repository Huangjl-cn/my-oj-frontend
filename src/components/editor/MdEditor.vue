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
import { Editor } from "@bytemd/vue-next";
import "bytemd/dist/index.css";
import { withDefaults, defineProps } from "vue";

interface Props {
  value: string;
  mode?: string;
  handleChange: (v: string) => void;
}

const plugins = [gfm(), highlight()];

withDefaults(defineProps<Props>(), {
  value: () => "",
  mode: () => "split",
  handleChange: () => undefined,
});
</script>

<style>
.bytemd {
  height: 400px !important;
  min-height: 300px;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-md) !important;
  background: var(--panel) !important;
  color: var(--ink) !important;
}

.bytemd .bytemd-toolbar {
  background: var(--fill) !important;
  border-bottom: 1px solid var(--line) !important;
  border-radius: var(--radius-md) var(--radius-md) 0 0 !important;
}

.bytemd .bytemd-toolbar-icon {
  color: var(--muted) !important;
  border-radius: var(--radius-sm) !important;
}

.bytemd .bytemd-toolbar-icon:hover {
  color: var(--ink) !important;
  background: var(--fill-strong) !important;
}

.bytemd .bytemd-toolbar-icon.bytemd-toolbar-icon-active {
  color: var(--ink) !important;
}

.bytemd .bytemd-body,
.bytemd .bytemd-editor,
.bytemd .bytemd-preview,
.bytemd .bytemd-sidebar {
  background: var(--panel) !important;
}

.bytemd-split .bytemd-preview,
.bytemd .bytemd-sidebar {
  border-left: 1px solid var(--line) !important;
}

.bytemd .bytemd-editor .CodeMirror {
  background: var(--panel) !important;
  color: var(--ink) !important;
  font-family: var(--font-mono) !important;
  font-size: 13.5px !important;
}

.bytemd .CodeMirror-gutters,
.bytemd .CodeMirror-gutter-filler,
.bytemd .CodeMirror-scrollbar-filler {
  background: var(--panel) !important;
  border-color: var(--line) !important;
}

.bytemd .CodeMirror-cursor {
  border-left-color: var(--ink) !important;
}

.bytemd .CodeMirror-selected,
.bytemd .CodeMirror-focused .CodeMirror-selected {
  background: var(--fill-strong) !important;
}

.bytemd .bytemd-preview .markdown-body {
  font-family: var(--font-sans) !important;
  color: var(--body) !important;
}

.bytemd .bytemd-status {
  background: var(--fill) !important;
  border-top: 1px solid var(--line) !important;
  border-radius: 0 0 var(--radius-md) var(--radius-md) !important;
  color: var(--muted) !important;
  font-family: var(--font-sans) !important;
  font-size: 12px !important;
}

.bytemd .bytemd-status-left,
.bytemd .bytemd-status-right {
  background: transparent !important;
  color: inherit !important;
}

.bytemd .bytemd-status input {
  accent-color: var(--primary);
}

.bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:last-child {
  display: none;
}
</style>
