<template>
  <div
    :class="['resizer', { dragging }]"
    role="separator"
    aria-orientation="vertical"
    :aria-label="label"
    tabindex="0"
    :title="`${label}（拖动调整宽度，双击恢复）`"
    @pointerdown="start"
    @dblclick="emit('reset')"
    @keydown="onKeydown"
  >
    <i />
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, onBeforeUnmount, ref } from "vue";

defineProps({
  label: { type: String, required: true },
});

const emit = defineEmits<{
  /** 开始拖动 */
  (event: "start"): void;
  /** 相对开始拖动时横向移动了多少像素 */
  (event: "move", dx: number): void;
  (event: "end"): void;
  (event: "reset"): void;
  /** 键盘左右键：每次 ±step 像素 */
  (event: "nudge", dx: number): void;
}>();

const KEY_STEP = 24;
const dragging = ref(false);
let startX = 0;

const onMove = (event: PointerEvent) => emit("move", event.clientX - startX);

const stop = () => {
  if (!dragging.value) return;
  dragging.value = false;
  document.body.classList.remove("pane-resizing");
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", stop);
  window.removeEventListener("pointercancel", stop);
  emit("end");
};

const start = (event: PointerEvent) => {
  if (event.button !== 0) return;
  event.preventDefault();
  startX = event.clientX;
  dragging.value = true;
  // 拖动时整页不选中文字、鼠标一直是左右箭头（经过编辑器也不变）
  document.body.classList.add("pane-resizing");
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  emit("start");
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowLeft") emit("nudge", -KEY_STEP);
  else if (event.key === "ArrowRight") emit("nudge", KEY_STEP);
  else return;
  event.preventDefault();
};

onBeforeUnmount(stop);
</script>

<style scoped>
.resizer {
  position: relative;
  display: grid;
  place-items: center;
  cursor: col-resize;
  touch-action: none;
  outline: none;
}

.resizer i {
  width: 4px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--line-strong);
  opacity: 0;
  transition: opacity var(--motion-fast) ease, height var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.resizer:hover i,
.resizer:focus-visible i,
.resizer.dragging i {
  opacity: 1;
}

.resizer.dragging i,
.resizer:focus-visible i {
  height: 64px;
  background: var(--ink);
}
</style>

<style>
body.pane-resizing,
body.pane-resizing * {
  cursor: col-resize !important;
  user-select: none !important;
}
</style>
