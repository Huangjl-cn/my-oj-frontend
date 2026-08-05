export const SUPPORTED_LANGUAGES = [
  "java",
  "cpp",
  "go",
  "python",
  "javascript",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
