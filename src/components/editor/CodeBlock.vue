<template>
  <div class="code-block">
    <div class="code-block-header">
      <span class="code-block-lang">{{ displayLang }}</span>
    </div>
    <pre
      class="code-block-pre"
      :class="`language-${normalizedLang}`"
    ><code ref="codeEl" class="hljs" v-html="highlighted" /></pre>
  </div>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import { computed, defineProps, withDefaults } from "vue";

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
</script>

<style scoped>
.code-block {
  overflow: hidden;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  font-family: var(--font-code);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: var(--surface-dark-elevated);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.code-block-lang {
  color: #a09d96;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  user-select: none;
}

.code-block-pre {
  max-height: 400px;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  background: var(--surface-dark);
  font: 12px/1.65 var(--font-code);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.code-block-pre code {
  display: block;
  background: transparent;
  padding: 0;
  font: inherit;
  white-space: inherit;
  overflow-wrap: inherit;
}

/* ── atom-one-dark token colors ─────────────────────────── */
.code-block-pre :deep(.hljs-comment),
.code-block-pre :deep(.hljs-quote) {
  color: #5c6370;
  font-style: italic;
}

.code-block-pre :deep(.hljs-doctag),
.code-block-pre :deep(.hljs-keyword),
.code-block-pre :deep(.hljs-formula) {
  color: #c678dd;
}

.code-block-pre :deep(.hljs-section),
.code-block-pre :deep(.hljs-name),
.code-block-pre :deep(.hljs-selector-tag),
.code-block-pre :deep(.hljs-deletion),
.code-block-pre :deep(.hljs-subst) {
  color: #e06c75;
}

.code-block-pre :deep(.hljs-literal) {
  color: #56b6c2;
}

.code-block-pre :deep(.hljs-string),
.code-block-pre :deep(.hljs-regexp),
.code-block-pre :deep(.hljs-addition),
.code-block-pre :deep(.hljs-attribute),
.code-block-pre :deep(.hljs-meta .hljs-string) {
  color: #98c379;
}

.code-block-pre :deep(.hljs-attr),
.code-block-pre :deep(.hljs-variable),
.code-block-pre :deep(.hljs-template-variable),
.code-block-pre :deep(.hljs-type),
.code-block-pre :deep(.hljs-selector-class),
.code-block-pre :deep(.hljs-selector-attr),
.code-block-pre :deep(.hljs-selector-pseudo),
.code-block-pre :deep(.hljs-number) {
  color: #d19a66;
}

.code-block-pre :deep(.hljs-symbol),
.code-block-pre :deep(.hljs-bullet),
.code-block-pre :deep(.hljs-link),
.code-block-pre :deep(.hljs-meta),
.code-block-pre :deep(.hljs-selector-id),
.code-block-pre :deep(.hljs-title) {
  color: #61aeee;
}

.code-block-pre :deep(.hljs-built_in),
.code-block-pre :deep(.hljs-title.class_),
.code-block-pre :deep(.hljs-class .hljs-title) {
  color: #e6c07b;
}

.code-block-pre :deep(.hljs-emphasis) {
  font-style: italic;
}

.code-block-pre :deep(.hljs-strong) {
  font-weight: bold;
}

/* Default text color */
.code-block-pre,
.code-block-pre code {
  color: #abb2bf;
}
</style>
