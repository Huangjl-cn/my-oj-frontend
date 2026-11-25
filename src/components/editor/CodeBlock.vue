<template>
  <div class="code-block">
    <div class="code-block-header">
      <span class="code-block-lang">{{ displayLang }}</span>
      <button
        :class="[
          'code-copy-button',
          copyState,
          { confirmed: copyState === 'copied' },
        ]"
        type="button"
        :disabled="!code || copyState === 'copied'"
        :aria-label="copyLabel"
        :title="copyLabel"
        @click="copyCode"
      >
        <IconCheck v-if="copyState === 'copied'" />
        <IconCopy v-else />
        <span>{{ copyLabel }}</span>
      </button>
    </div>
    <pre
      class="code-block-pre"
      :class="`language-${normalizedLang}`"
    ><code ref="codeEl" class="hljs" v-html="highlighted" /></pre>
  </div>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import { IconCheck, IconCopy } from "@arco-design/web-vue/es/icon";
import { computed, defineProps, onBeforeUnmount, ref, withDefaults } from "vue";

import { copyText } from "@/utils/copyText";

// Register only the languages the app supports (matches Monaco config)
import cpp from "highlight.js/lib/languages/cpp";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("go", go);

// Aliases so backend values like "c++" or "golang" still match
hljs.registerAliases("c++", { languageName: "cpp" });
hljs.registerAliases("golang", { languageName: "go" });
hljs.registerAliases("js", { languageName: "javascript" });
hljs.registerAliases("ts", { languageName: "typescript" });

interface Props {
  code: string;
  language?: string;
}

const props = withDefaults(defineProps<Props>(), {
  code: "",
  language: "",
});

const LANG_LABELS: Record<string, string> = {
  java: "Java",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  cpp: "C++",
  go: "Go",
};

const normalizedLang = computed(() => {
  const lang = (props.language ?? "").toLowerCase().trim();
  const aliases: Record<string, string> = {
    "c++": "cpp",
    golang: "go",
    js: "javascript",
    ts: "typescript",
  };
  return aliases[lang] ?? lang;
});

const displayLang = computed(
  () => LANG_LABELS[normalizedLang.value] ?? props.language ?? "Code"
);

const copyState = ref<"idle" | "copied" | "failed">("idle");
let copyStateTimer: ReturnType<typeof setTimeout> | undefined;

const copyLabel = computed(() => {
  if (copyState.value === "copied") return "已复制";
  if (copyState.value === "failed") return "复制失败";
  return "复制";
});

const copyCode = async () => {
  const success = await copyText(props.code);
  copyState.value = success ? "copied" : "failed";
  if (copyStateTimer) clearTimeout(copyStateTimer);
  copyStateTimer = setTimeout(() => {
    copyState.value = "idle";
    copyStateTimer = undefined;
  }, 1600);
};

const highlighted = computed(() => {
  const code = props.code;
  if (!code) return "";
  const lang = normalizedLang.value;
  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    // Fallback: escape HTML and return plain
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
});

onBeforeUnmount(() => {
  if (copyStateTimer) clearTimeout(copyStateTimer);
});
</script>

<style scoped>
.code-block {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--code-surface);
  font-family: var(--font-mono);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 0 14px;
}

.code-block-lang {
  color: var(--faint);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  user-select: none;
}

.code-copy-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 26px;
  padding: 3px 10px;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: 12px;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.code-copy-button :deep(svg) {
  width: 13px;
  height: 13px;
}

.code-copy-button:hover:not(:disabled) {
  color: var(--ink);
  background: var(--panel);
}

.code-copy-button.copied {
  color: var(--success);
  animation: code-copy-confirmed 420ms ease-out;
}

.code-copy-button.failed {
  color: var(--danger);
}

.code-copy-button:disabled {
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
  .code-copy-button.copied {
    animation: none;
  }
}

/* token 颜色在 styles/code.css，跟着主题走 */
.code-block-pre {
  max-height: 400px;
  margin: 0;
  padding: 8px 16px 14px;
  overflow: auto;
  color: var(--code-ink);
  font: 12.5px/1.65 var(--font-mono);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.code-block-pre code {
  display: block;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  white-space: inherit;
  overflow-wrap: inherit;
}
</style>
