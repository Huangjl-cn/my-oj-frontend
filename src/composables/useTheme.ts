import { computed, ref } from "vue";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "myoj-theme";
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
const theme = ref<Theme>(storedTheme === "dark" ? "dark" : "light");

const applyTheme = (nextTheme: Theme) => {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  if (nextTheme === "dark") {
    document.body.setAttribute("arco-theme", "dark");
  } else {
    document.body.removeAttribute("arco-theme");
  }
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
};

applyTheme(theme.value);

export const useTheme = () => {
  const isDark = computed(() => theme.value === "dark");

  const toggleTheme = () => {
    theme.value = isDark.value ? "light" : "dark";
    applyTheme(theme.value);
  };

  return { isDark, theme, toggleTheme };
};
