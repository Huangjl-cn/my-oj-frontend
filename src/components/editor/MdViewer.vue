<template>
  <Viewer :value="value" :plugins="plugins" />
</template>

<script setup lang="ts">
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import { Viewer } from "@bytemd/vue-next";
import "bytemd/dist/index.css";
import "highlight.js/styles/atom-one-dark.css";
import { withDefaults, defineProps } from "vue";

interface Props {
  value: string;
}

const plugins = [gfm(), highlight()];

withDefaults(defineProps<Props>(), {
  value: () => "",
});
</script>

<style>
.markdown-body {
  font-family: var(--font-body) !important;
  color: var(--body) !important;
  line-height: 1.55 !important;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-family: var(--font-display) !important;
  font-weight: 400 !important;
  color: var(--ink) !important;
  letter-spacing: -0.02em !important;
}

.markdown-body code {
  font-family: var(--font-code) !important;
  font-size: 13px !important;
  background: var(--surface-soft) !important;
  color: var(--ink) !important;
  padding: 2px 6px !important;
  border-radius: var(--radius-sm) !important;
}

.markdown-body pre {
  background: var(--surface-dark) !important;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--hairline) !important;
}

.markdown-body pre code {
  background: transparent !important;
  font-family: var(--font-code) !important;
  font-size: 13px !important;
}

.markdown-body table {
  border-collapse: collapse !important;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid var(--hairline) !important;
  padding: 8px 12px !important;
}

.markdown-body table th {
  background: var(--surface-soft) !important;
  font-weight: 500 !important;
}
</style>
