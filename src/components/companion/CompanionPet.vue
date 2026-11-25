<template>
  <span ref="anchorRef" class="pet-anchor" aria-hidden="true">
    <Teleport to="body">
      <div
        :class="[
          'companion-pet',
          { dragging, 'bubble-right': bubbleOnRight, placed: ready },
        ]"
        :style="petStyle"
      >
        <Transition name="pet-bubble">
          <div
            v-if="bubble && !dragging"
            class="pet-bubble"
            role="status"
            @mouseenter="hovering = true"
            @mouseleave="hovering = false"
          >
            <button class="pet-bubble-text" type="button" @click="emit('open')">
              {{ bubble }}
            </button>
            <button
              class="pet-bubble-close"
              type="button"
              aria-label="关闭气泡"
              @click="emit('dismiss')"
            >
              ×
            </button>
          </div>
        </Transition>

        <button
          class="pet-button"
          type="button"
          :title="`和${name}聊聊（按住可以拖动）`"
          :aria-label="`打开${name}的陪练面板`"
          @pointerdown="startGesture($event, 'move')"
          @click="onClick"
        >
          <span class="pet-breath">
            <span :key="beat" :class="['pet-motion', `motion-${displayMood}`]">
              <CompanionAvatar :mood="displayMood" :size="placement.size" />
            </span>
          </span>
          <span class="pet-shadow" aria-hidden="true"></span>
        </button>
        <span
          class="pet-resize"
          title="拖动调整大小，双击恢复默认大小"
          aria-hidden="true"
          @pointerdown.stop="startGesture($event, 'resize')"
          @dblclick="resetSize"
        ></span>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineProps,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  withDefaults,
} from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import { PetMood } from "@/constants/companionMoods";
import {
  clampPetPosition,
  PetPosition,
  usePetPlacement,
} from "@/composables/usePetPlacement";

const props = withDefaults(
  defineProps<{
    mood: PetMood;
    intensity?: number;
    /** 每次变化都重播一次动作 */
    beat?: number;
    bubble?: string;
    name?: string;
  }>(),
  { intensity: 1, beat: 0, bubble: "", name: "栗子" }
);

const emit = defineEmits<{
  (event: "open"): void;
  (event: "dismiss"): void;
}>();

/** 心情表情保持一会儿后回到待机，思考状态由调用方结束 */
const MOOD_HOLD_MS = 12000;
const BUBBLE_MS = 10000;
/** 移动超过这么多像素才算拖动，否则算点击 */
const DRAG_THRESHOLD_PX = 4;
/** 按钮四周的留白 */
const PET_PADDING_PX = 4;

const { placement, moveTo, resizeTo, resetSize, save } = usePetPlacement();

const anchorRef = ref<HTMLElement | null>(null);
const displayMood = ref<PetMood>(props.mood);
const hovering = ref(false);
const dragging = ref(false);
/** 默认位置算出来之前先不显示，避免闪一下 */
const ready = ref(false);
const anchorPosition = ref<PetPosition>({ x: 0, y: 0 });
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
let moodTimer: ReturnType<typeof setTimeout> | undefined;
let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;

const box = computed(() => placement.size + PET_PADDING_PX * 2);

const position = computed(() =>
  clampPetPosition(
    placement.position ?? anchorPosition.value,
    box.value,
    viewport.value
  )
);

const petStyle = computed(() => ({
  "--amp": props.intensity,
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  width: `${box.value}px`,
  height: `${box.value}px`,
}));

/** 栗子在屏幕左半边时，气泡出在右边 */
const bubbleOnRight = computed(
  () => position.value.x + box.value / 2 < viewport.value.width / 2
);

// region 默认位置：编辑器右上角的锚点

const measureAnchor = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
  const rect = anchorRef.value?.getBoundingClientRect();
  if (rect) {
    anchorPosition.value = { x: rect.right - box.value, y: rect.top };
    ready.value = true;
  }
};

onMounted(() => {
  measureAnchor();
  window.addEventListener("resize", measureAnchor);
  const container = anchorRef.value?.offsetParent;
  if (container && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(measureAnchor);
    resizeObserver.observe(container);
  }
});

watch(box, measureAnchor);

// endregion

// region 拖动与缩放

type Gesture = {
  kind: "move" | "resize";
  pointerId: number;
  startX: number;
  startY: number;
  origin: PetPosition;
  originSize: number;
  moved: boolean;
};

let gesture: Gesture | null = null;
/** 拖动结束时浏览器还会补发一次 click，忽略它 */
let suppressClick = false;

const startGesture = (event: PointerEvent, kind: Gesture["kind"]) => {
  if (event.button !== 0) return;
  // 不让浏览器开始选中文字；click 照常触发
  event.preventDefault();
  // 上次拖动松手时如果不在栗子上，浏览器不会补发 click，这里清掉标记
  suppressClick = false;
  gesture = {
    kind,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    origin: { ...position.value },
    originSize: placement.size,
    moved: false,
  };
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", endGesture);
  window.addEventListener("pointercancel", endGesture);
};

const onPointerMove = (event: PointerEvent) => {
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
  gesture.moved = true;
  dragging.value = true;
  event.preventDefault();
  if (gesture.kind === "move") {
    moveTo({ x: gesture.origin.x + dx, y: gesture.origin.y + dy });
  } else {
    // 右下角手柄：以左上角为原点放大缩小
    resizeTo(gesture.originSize + Math.max(dx, dy));
    moveTo(gesture.origin);
  }
};

const endGesture = (event: PointerEvent) => {
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  if (gesture.moved) {
    moveTo(position.value);
    save();
    suppressClick = gesture.kind === "move";
  }
  gesture = null;
  dragging.value = false;
  removeGestureListeners();
};

const removeGestureListeners = () => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", endGesture);
  window.removeEventListener("pointercancel", endGesture);
};

const onClick = () => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  emit("open");
};

// endregion

// region 心情与气泡

watch(
  () => [props.mood, props.beat] as const,
  ([mood]) => {
    displayMood.value = mood;
    if (moodTimer) clearTimeout(moodTimer);
    if (mood !== "idle" && mood !== "thinking") {
      moodTimer = setTimeout(() => {
        displayMood.value = "idle";
      }, MOOD_HOLD_MS);
    }
  }
);

const scheduleBubbleHide = () => {
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    if (hovering.value) {
      scheduleBubbleHide();
    } else {
      emit("dismiss");
    }
  }, BUBBLE_MS);
};

watch(
  () => props.bubble,
  (text) => {
    if (text) scheduleBubbleHide();
    else if (bubbleTimer) clearTimeout(bubbleTimer);
  }
);

// endregion

onBeforeUnmount(() => {
  if (moodTimer) clearTimeout(moodTimer);
  if (bubbleTimer) clearTimeout(bubbleTimer);
  window.removeEventListener("resize", measureAnchor);
  resizeObserver?.disconnect();
  removeGestureListeners();
});
</script>

<style scoped>
.pet-anchor {
  display: block;
  width: 0;
  height: 0;
}

.companion-pet {
  --amp: 1;
  position: fixed;
  z-index: 1500;
  visibility: hidden;
}

.companion-pet.placed {
  visibility: visible;
}

.pet-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.companion-pet.dragging .pet-button {
  cursor: grabbing;
}

.pet-resize {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 14px;
  height: 14px;
  background: var(--canvas);
  border: 2px solid var(--primary);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  cursor: nwse-resize;
  opacity: 0;
  touch-action: none;
  transition: opacity var(--motion-fast) ease;
}

.companion-pet:hover .pet-resize,
.companion-pet:focus-within .pet-resize,
.companion-pet.dragging .pet-resize {
  opacity: 1;
}

@media (hover: none) {
  .pet-resize {
    opacity: 0.8;
  }
}

.pet-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.pet-breath {
  display: block;
  animation: pet-breathe 3.2s ease-in-out infinite;
  transform-origin: 50% 100%;
}

.pet-motion {
  display: block;
  transform-origin: 50% 90%;
}

.pet-shadow {
  width: 60%;
  height: 6px;
  margin-top: -2px;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 50%;
  filter: blur(2px);
}

.pet-bubble {
  position: absolute;
  top: 6px;
  right: calc(100% + 8px);
  width: max-content;
  max-width: 260px;
  padding: 10px 28px 10px 12px;
  color: var(--ink);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.pet-bubble::after {
  content: "";
  position: absolute;
  top: 18px;
  right: -6px;
  width: 10px;
  height: 10px;
  background: var(--surface-card);
  border-top: 1px solid var(--hairline);
  border-right: 1px solid var(--hairline);
  transform: rotate(45deg);
}

.bubble-right .pet-bubble {
  right: auto;
  left: calc(100% + 8px);
}

.bubble-right .pet-bubble::after {
  right: auto;
  left: -6px;
  border-top: none;
  border-right: none;
  border-bottom: 1px solid var(--hairline);
  border-left: 1px solid var(--hairline);
}

.pet-bubble-text {
  padding: 0;
  color: inherit;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
  text-align: left;
  cursor: pointer;
}

.pet-bubble-close {
  position: absolute;
  top: 4px;
  right: 6px;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--muted);
  background: none;
  border: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.pet-bubble-enter-active,
.pet-bubble-leave-active {
  transition: opacity var(--motion-standard) ease,
    transform var(--motion-standard) var(--ease-out);
}

.pet-bubble-enter-from,
.pet-bubble-leave-to {
  opacity: 0;
  transform: translateX(8px) scale(0.96);
}

/* ===== 动作：幅度随 --amp（1-3）变化 ===== */
.motion-thinking {
  animation: pet-sway 2.4s ease-in-out infinite;
}

.motion-excited {
  animation: pet-hop 0.5s var(--ease-out) 3;
}

.motion-proud {
  animation: pet-puff 1.2s var(--ease-out) 1 forwards;
}

.motion-surprised {
  animation: pet-jump 0.6s var(--ease-out) 1;
}

.motion-thoughtful {
  animation: pet-tilt 1.6s var(--ease-out) 1 forwards;
}

.motion-sympathetic {
  animation: pet-droop 1.4s var(--ease-out) 1 forwards;
}

.motion-encouraging {
  animation: pet-nod 0.6s ease-in-out 2;
}

.motion-playful {
  animation: pet-wiggle 0.45s ease-in-out 3;
}

.motion-nervous {
  animation: pet-shake 0.12s linear 8;
}

.motion-confused {
  animation: pet-tilt-both 1.4s ease-in-out 1;
}

@keyframes pet-breathe {
  0%,
  100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.015, 0.975);
  }
}

@keyframes pet-sway {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

@keyframes pet-hop {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  15% {
    transform: translateY(0) scale(1.08, 0.9);
  }
  50% {
    transform: translateY(calc(var(--amp) * -7px)) scale(0.95, 1.06);
  }
}

@keyframes pet-puff {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(calc(1 + var(--amp) * 0.05));
  }
  100% {
    transform: scale(calc(1 + var(--amp) * 0.025));
  }
}

@keyframes pet-jump {
  0%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(calc(var(--amp) * -9px)) scale(1.06);
  }
}

@keyframes pet-tilt {
  to {
    transform: rotate(calc(var(--amp) * -5deg));
  }
}

@keyframes pet-droop {
  to {
    transform: translateY(calc(var(--amp) * 1.5px))
      scale(1, calc(1 - var(--amp) * 0.025));
  }
}

@keyframes pet-nod {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: translateY(calc(var(--amp) * 1.5px))
      rotate(calc(var(--amp) * 4deg));
  }
}

@keyframes pet-wiggle {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(calc(var(--amp) * -6deg));
  }
  75% {
    transform: rotate(calc(var(--amp) * 6deg));
  }
}

@keyframes pet-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(calc(var(--amp) * -1.2px));
  }
  75% {
    transform: translateX(calc(var(--amp) * 1.2px));
  }
}

@keyframes pet-tilt-both {
  0%,
  100% {
    transform: rotate(0);
  }
  30% {
    transform: rotate(calc(var(--amp) * -7deg));
  }
  70% {
    transform: rotate(calc(var(--amp) * 7deg));
  }
}

@media (prefers-reduced-motion: reduce) {
  .pet-breath,
  .pet-motion {
    animation: none !important;
  }
}
</style>
