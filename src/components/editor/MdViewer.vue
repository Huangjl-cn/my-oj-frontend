<template>
  <div ref="viewerRoot" class="markdown-viewer">
    <Viewer :value="props.value" :plugins="plugins" />
  </div>
</template>

<script setup lang="ts">
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import { Viewer } from "@bytemd/vue-next";
import "bytemd/dist/index.css";
import "highlight.js/styles/atom-one-dark.css";
import {
  defineProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  withDefaults,
} from "vue";

import { copyText } from "@/utils/copyText";

interface Props {
  value: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: () => "",
});

const plugins = [gfm(), highlight()];

const viewerRoot = ref<HTMLElement | null>(null);
const copyTimers = new WeakMap<
  HTMLButtonElement,
  ReturnType<typeof setTimeout>
>();

const enhanceCodeBlocks = async () => {
  await nextTick();
  const root = viewerRoot.value;
  if (!root) return;

  root.querySelectorAll<HTMLPreElement>("pre").forEach((pre) => {
    if (pre.dataset.copyReady === "true") return;
    const code = pre.querySelector("code");
    if (!code) return;

    pre.dataset.copyReady = "true";
    const wrapper = document.createElement("div");
    wrapper.className = "markdown-code-block";
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement("button");
    button.className = "markdown-code-copy";
    button.type = "button";
    button.title = "复制代码";
    button.setAttribute("aria-label", "复制代码");
    button.textContent = "复制";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const success = await copyText(code.textContent ?? "");
      button.textContent = success ? "已复制" : "复制失败";
      button.classList.toggle("copied", success);
      button.classList.toggle("failed", !success);
      if (!success) button.disabled = false;
      const timer = copyTimers.get(button);
      if (timer) clearTimeout(timer);
      copyTimers.set(
        button,
        setTimeout(() => {
          button.textContent = "复制";
          button.disabled = false;
          button.classList.remove("copied", "failed");
          copyTimers.delete(button);
        }, 1600)
      );
    });
    wrapper.appendChild(button);
  });
};

watch(
  () => props.value,
  () => {
    void enhanceCodeBlocks();
  },
  { flush: "post" }
);

onMounted(() => {
  void enhanceCodeBlocks();
});

onBeforeUnmount(() => {
  const root = viewerRoot.value;
  root
    ?.querySelectorAll<HTMLButtonElement>(".markdown-code-copy")
    .forEach((button) => {
      const timer = copyTimers.get(button);
      if (timer) clearTimeout(timer);
      copyTimers.delete(button);
    });
});
</script>

<style>
.markdown-body {
  font-family: var(--font-body) !important;
  color: var(--body) !important;
  line-height: 1.55 !important;
}

.markdown-code-block {
  position: relative;
  margin: 16px 0;
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
  margin: 0 !important;
  padding-top: 42px !important;
  background: var(--surface-dark) !important;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--hairline) !important;
}

.markdown-code-copy {
  position: absolute;
  top: 9px;
  right: 10px;
  z-index: 1;
  min-height: 25px;
  padding: 3px 9px;
  color: var(--on-dark-soft);
  background: var(--surface-dark-elevated);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 11px;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease;
}

.markdown-code-copy:hover {
  color: var(--on-dark);
  background: var(--surface-dark);
  border-color: rgba(255, 255, 255, 0.24);
}

.markdown-code-copy.copied {
  color: var(--success);
  background: rgba(93, 184, 114, 0.12);
  border-color: rgba(93, 184, 114, 0.28);
  animation: code-copy-confirmed 420ms ease-out;
}

.markdown-code-copy.failed {
  color: var(--error);
  background: rgba(198, 69, 69, 0.12);
  border-color: rgba(198, 69, 69, 0.28);
}

.markdown-code-copy:disabled {
  cursor: default;
}

@keyframes code-copy-confirmed {
  0% {
    transform: scale(0.96);
  }
  55% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .markdown-code-copy.copied {
    animation: none;
  }
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
