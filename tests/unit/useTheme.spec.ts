import { useTheme } from "@/composables/useTheme";

describe("useTheme", () => {
  it("toggles the document theme and persists the selection", () => {
    const { isDark, toggleTheme } = useTheme();

    if (isDark.value) toggleTheme();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.body.hasAttribute("arco-theme")).toBe(false);

    toggleTheme();
    expect(isDark.value).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.body.getAttribute("arco-theme")).toBe("dark");
    expect(localStorage.getItem("myoj-theme")).toBe("dark");

    toggleTheme();
    expect(isDark.value).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.body.hasAttribute("arco-theme")).toBe(false);
    expect(localStorage.getItem("myoj-theme")).toBe("light");
  });
});
