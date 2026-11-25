import type * as Monaco from "monaco-editor";

/**
 * 编辑器配色：和 styles/code.css 里的 --sx-* 一致（Monaco 用不了 CSS 变量），
 * 背景和面板同色，编辑器看起来就是面板的一部分。
 */
export const MONACO_THEMES = {
  light: "myoj-light",
  dark: "myoj-dark",
} as const;

const rules = (
  colors: Record<string, string>
): Monaco.editor.ITokenThemeRule[] => [
  { token: "keyword", foreground: colors.keyword },
  { token: "type", foreground: colors.type },
  { token: "type.identifier", foreground: colors.type },
  { token: "string", foreground: colors.string },
  { token: "number", foreground: colors.number },
  { token: "comment", foreground: colors.comment, fontStyle: "italic" },
  { token: "annotation", foreground: colors.function },
  { token: "tag", foreground: colors.tag },
];

let defined = false;

export const defineMonacoThemes = (monaco: typeof Monaco) => {
  if (defined) return;
  defined = true;
  monaco.editor.defineTheme(MONACO_THEMES.light, {
    base: "vs",
    inherit: true,
    rules: rules({
      keyword: "8250df",
      type: "953800",
      string: "0a3069",
      number: "0550ae",
      comment: "8c959f",
      function: "6639ba",
      tag: "116329",
    }),
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#1f2328",
      "editorLineNumber.foreground": "#b4b4bb",
      "editorLineNumber.activeForeground": "#18181b",
      "editor.lineHighlightBackground": "#f4f4f5",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#e4e4e7",
      "editor.inactiveSelectionBackground": "#ececee",
      "editorCursor.foreground": "#18181b",
      "editorIndentGuide.background": "#ececee",
      "editorIndentGuide.activeBackground": "#d6d6da",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#e9e9eb",
      "scrollbarSlider.background": "#d6d6da99",
      "scrollbarSlider.hoverBackground": "#a1a1aa99",
    },
  });
  monaco.editor.defineTheme(MONACO_THEMES.dark, {
    base: "vs-dark",
    inherit: true,
    rules: rules({
      keyword: "ff7b72",
      type: "ffa657",
      string: "a5d6ff",
      number: "79c0ff",
      comment: "6e7681",
      function: "d2a8ff",
      tag: "7ee787",
    }),
    colors: {
      "editor.background": "#141416",
      "editor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#4a4a52",
      "editorLineNumber.activeForeground": "#ededef",
      "editor.lineHighlightBackground": "#1c1c1f",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#34343a",
      "editor.inactiveSelectionBackground": "#232327",
      "editorCursor.foreground": "#ededef",
      "editorIndentGuide.background": "#232327",
      "editorIndentGuide.activeBackground": "#34343a",
      "editorWidget.background": "#1c1c1f",
      "editorWidget.border": "#232327",
      "scrollbarSlider.background": "#34343a99",
      "scrollbarSlider.hoverBackground": "#6b6b7399",
    },
  });
};
