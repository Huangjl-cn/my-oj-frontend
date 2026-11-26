import { onBeforeUnmount, onMounted, Ref, ref } from "vue";

export interface PetLook {
  x: number;
  y: number;
}

/** 鼠标离鸭鸭多远时眼睛转到头（像素） */
const REACH_PX = 260;

/**
 * 鸭鸭的眼睛跟着鼠标：返回 -1 到 1 的方向，离得近时转得少。
 * 页面上的鼠标移动、按键都会通知 onActivity（用来重置犯困计时、叫醒）。
 */
export const usePetLook = (
  target: Ref<HTMLElement | null>,
  onActivity?: (point?: { x: number; y: number }) => void
) => {
  const look = ref<PetLook | null>(null);
  let frame = 0;
  let last: PointerEvent | null = null;

  const update = () => {
    frame = 0;
    const event = last;
    const rect = target.value?.getBoundingClientRect();
    if (!event || !rect) return;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height * 0.4);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, distance / REACH_PX);
    look.value = { x: (dx / distance) * reach, y: (dy / distance) * reach };
    onActivity?.({ x: event.clientX, y: event.clientY });
  };

  const onPointerMove = (event: PointerEvent) => {
    last = event;
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onKeydown = () => onActivity?.();

  onMounted(() => {
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("keydown", onKeydown);
  });

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("keydown", onKeydown);
  });

  return look;
};
