import { onBeforeUnmount, Ref, watch } from "vue";

/**
 * 弹层打开时，点到 root 外面或按 Esc 就关掉。
 */
export const useDismissable = (
  root: Ref<HTMLElement | null>,
  open: Ref<boolean>
) => {
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (root.value && target && !root.value.contains(target)) {
      open.value = false;
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") open.value = false;
  };

  const detach = () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeydown);
  };

  watch(open, (value) => {
    if (value) {
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeydown);
    } else {
      detach();
    }
  });

  onBeforeUnmount(detach);
};
