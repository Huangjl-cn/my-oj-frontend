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
  font-family: var(--font-sans) !important;
  color: var(--body) !important;
  line-height: 1.8 !important;
}

.markdown-code-block {
  position: relative;
  margin: 16px 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  color: var(--ink) !important;
  letter-spacing: -0.01em !important;
}

.markdown-body code {
  font-family: var(--font-mono) !important;
  font-size: 12.5px !important;
  background: var(--fill) !important;
  color: var(--ink) !important;
  padding: 2px 6px !important;
  border-radius: 6px !important;
}

.markdown-body pre {
  margin: 0 !important;
  padding: 14px 16px !important;
  background: var(--code-surface) !important;
  border: none !important;
  border-radius: 14px !important;
}

/* 复制按钮平时藏起来，鼠标移到代码块上才出现 */
.markdown-code-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  min-height: 26px;
  padding: 3px 10px;
  color: var(--muted);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease;
}

.markdown-code-block:hover .markdown-code-copy,
.markdown-code-copy:focus-visible,
.markdown-code-copy.copied,
.markdown-code-copy.failed {
  opacity: 1;
}

.markdown-code-copy:hover {
  color: var(--ink);
  border-color: var(--line-strong);
}

.markdown-code-copy.copied {
  color: var(--success);
  animation: code-copy-confirmed 420ms ease-out;
}

.markdown-code-copy.failed {
  color: var(--danger);
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

/* 代码块跟着主题：正文用 --code-ink，token 颜色在 styles/code.css */
.markdown-body pre code {
  color: var(--code-ink) !important;
  background: transparent !important;
  padding: 0 !important;
  font-family: var(--font-mono) !important;
  font-size: 13px !important;
  line-height: 1.65 !important;
}

.markdown-body table {
  border-collapse: collapse !important;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid var(--line) !important;
  padding: 8px 12px !important;
}

.markdown-body table th {
  background: var(--fill) !important;
  font-weight: 600 !important;
}
</style>
