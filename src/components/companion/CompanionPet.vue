<template>
  <span ref="anchorRef" class="pet-anchor" aria-hidden="true">
    <Teleport to="body">
      <div
        :class="[
          'companion-pet',
          {
            dragging,
            'bubble-right': bubbleOnRight,
            placed: ready,
            'in-flight': flight.active,
          },
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
          ref="buttonRef"
          class="pet-button"
          type="button"
          :title="`和${name}聊聊（按住可以拖动）`"
          :aria-label="`打开${name}的陪练面板`"
          @pointerdown="startGesture($event, 'move')"
          @pointerenter="behavior.hover()"
          @click="onClick"
        >
          <span
            :class="['pet-body', { lifted }]"
            :style="{ transform: `rotate(${tilt.toFixed(2)}deg)` }"
          >
            <CompanionAvatar
              :pose="behavior.pose.value"
              :replay="behavior.poseKey.value"
              :size="placement.size"
              :amp="intensity"
              :look="look"
              lively
            />
          </span>
          <span :class="['pet-shadow', { lifted }]" aria-hidden="true"></span>
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
  defineExpose,
  defineProps,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import { toFlightRect, useDuckFlight } from "@/composables/useDuckFlight";
import { PetBehavior } from "@/composables/usePetBehavior";
import { usePetLook } from "@/composables/usePetLook";
import {
  clampPetPosition,
  PetPosition,
  usePetPlacement,
} from "@/composables/usePetPlacement";

const props = defineProps({
  /** 鸭鸭的行为（做题页创建，和陪练面板标题里的鸭鸭共用一个） */
  behavior: { type: Object as PropType<PetBehavior>, required: true },
  /** 动作幅度 1-3 */
  intensity: { type: Number, default: 1 },
  bubble: { type: String, default: "" },
  name: { type: String, default: "鸭鸭" },
});

const emit = defineEmits<{
  (event: "open"): void;
  (event: "dismiss"): void;
}>();

const BUBBLE_MS = 10000;
/** 移动超过这么多像素才算拖动，否则算点击 */
const DRAG_THRESHOLD_PX = 4;
/** 按钮四周的留白 */
const PET_PADDING_PX = 4;

const { placement, moveTo, resizeTo, resetSize, save } = usePetPlacement();

const anchorRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const hovering = ref(false);
const dragging = ref(false);
/** 默认位置算出来之前先不显示，避免闪一下 */
const ready = ref(false);
const anchorPosition = ref<PetPosition>({ x: 0, y: 0 });
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
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
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  width: `${box.value}px`,
  height: `${box.value}px`,
}));

/** 鸭鸭在屏幕左半边时，气泡出在右边 */
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

// region 行为：姿势由 usePetBehavior 决定

// eslint-disable-next-line vue/no-setup-props-destructure
const behavior = props.behavior;
const { flight } = useDuckFlight();

const LIFTED_POSES = new Set(["grab", "drag", "fly", "dizzydrag"]);
const lifted = computed(() => LIFTED_POSES.has(behavior.pose.value));

// endregion

// region 拖着走时像钟摆：往左拖身体往右甩，松手后自己晃两下停住

const tilt = ref(0);
let tiltVelocity = 0;
let tiltTarget = 0;
let swingFrame = 0;
let lastSwing = 0;
let dragVelocity = 0;
let lastPointer: { x: number; t: number } | null = null;

const swing = (time: number) => {
  const dt = Math.min(48, time - (lastSwing || time));
  lastSwing = time;
  tiltVelocity =
    (tiltVelocity + (tiltTarget - tilt.value) * 0.012 * dt) *
    Math.pow(0.86, dt / 16);
  tilt.value += tiltVelocity * (dt / 16);
  if (!gesture) tiltTarget *= 0.9;
  const settled =
    !gesture && Math.abs(tilt.value) < 0.1 && Math.abs(tiltVelocity) < 0.01;
  if (settled) {
    tilt.value = 0;
    swingFrame = 0;
    lastSwing = 0;
    return;
  }
  swingFrame = requestAnimationFrame(swing);
};

const startSwing = () => {
  if (!swingFrame) swingFrame = requestAnimationFrame(swing);
};

const trackSwing = (event: PointerEvent) => {
  const t = event.timeStamp;
  if (lastPointer) {
    const dt = Math.max(1, t - lastPointer.t);
    const vx = (event.clientX - lastPointer.x) / dt;
    dragVelocity = dragVelocity * 0.7 + vx * 0.3;
    tiltTarget = Math.max(-38, Math.min(38, -dragVelocity * 22));
  }
  lastPointer = { x: event.clientX, t };
  startSwing();
};

// endregion

// region 眼睛跟着鼠标；鼠标、键盘有动静就重置犯困计时

const look = usePetLook(buttonRef, behavior.noteUserActivity);

/** 飞行动画用：鸭鸭（不含留白和影子）在屏幕上的位置 */
defineExpose({
  rect: () =>
    toFlightRect(
      buttonRef.value?.querySelector("svg")?.getBoundingClientRect() ?? null
    ),
});

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
  // 上次拖动松手时如果不在鸭鸭身上，浏览器不会补发 click，这里清掉标记
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
  if (kind === "move") behavior.pressStart();
  else behavior.resizeStart();
  lastPointer = null;
  dragVelocity = 0;
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
    behavior.dragMove(event.clientX, event.clientY);
    trackSwing(event);
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
  if (gesture.kind === "move") behavior.release(gesture.moved);
  else behavior.resizeEnd();
  tiltTarget = 0;
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

// region 气泡

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
  if (bubbleTimer) clearTimeout(bubbleTimer);
  if (swingFrame) cancelAnimationFrame(swingFrame);
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
  position: fixed;
  z-index: 1500;
  visibility: hidden;
}

.companion-pet.placed {
  visibility: visible;
}

/* 正在飞进 / 飞出陪练面板时，只显示飞着的那只 */
.companion-pet.placed.in-flight {
  visibility: hidden;
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

/* 钟摆的支点在头顶附近：像被拎着 */
.pet-body {
  display: block;
  transform-origin: 50% 12%;
  will-change: transform;
}

.pet-body > :deep(svg) {
  transition: translate 0.18s var(--ease-out);
}

.pet-body.lifted > :deep(svg) {
  translate: 0 -6px;
}

.pet-shadow {
  width: 60%;
  height: 6px;
  margin-top: -2px;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 50%;
  filter: blur(2px);
  transition: opacity 0.18s ease, transform 0.18s var(--ease-out);
}

.pet-shadow.lifted {
  opacity: 0.5;
  transform: scale(0.7);
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

@media (prefers-reduced-motion: reduce) {
  .pet-body,
  .pet-body > :deep(svg),
  .pet-shadow {
    transition: none;
  }
}
</style>
