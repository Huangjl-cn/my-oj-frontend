<template>
  <div class="companion-pet" :style="{ '--amp': intensity }">
    <Transition name="pet-bubble">
      <div
        v-if="bubble"
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
      :title="`和${name}聊聊`"
      :aria-label="`打开${name}的陪练面板`"
      @click="emit('open')"
    >
      <span class="pet-breath">
        <span :key="beat" :class="['pet-motion', `motion-${displayMood}`]">
          <CompanionAvatar :mood="displayMood" :size="size" />
        </span>
      </span>
      <span class="pet-shadow" aria-hidden="true"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  defineEmits,
  defineProps,
  onBeforeUnmount,
  ref,
  watch,
  withDefaults,
} from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import { PetMood } from "@/constants/companionMoods";

const props = withDefaults(
  defineProps<{
    mood: PetMood;
    intensity?: number;
    /** 每次变化都重播一次动作 */
    beat?: number;
    bubble?: string;
    name?: string;
    size?: number;
  }>(),
  { intensity: 1, beat: 0, bubble: "", name: "栗子", size: 56 }
);

const emit = defineEmits<{
  (event: "open"): void;
  (event: "dismiss"): void;
}>();

/** 心情表情保持一会儿后回到待机，思考状态由调用方结束 */
const MOOD_HOLD_MS = 12000;
const BUBBLE_MS = 10000;

const displayMood = ref<PetMood>(props.mood);
const hovering = ref(false);
let moodTimer: ReturnType<typeof setTimeout> | undefined;
let bubbleTimer: ReturnType<typeof setTimeout> | undefined;

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

onBeforeUnmount(() => {
  if (moodTimer) clearTimeout(moodTimer);
  if (bubbleTimer) clearTimeout(bubbleTimer);
});
</script>

<style scoped>
.companion-pet {
  --amp: 1;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  pointer-events: none;
}

.pet-button,
.pet-bubble {
  pointer-events: auto;
}

.pet-button {
  position: relative;
  display: grid;
  place-items: center;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
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
  position: relative;
  order: -1;
  max-width: 260px;
  margin-top: 6px;
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
