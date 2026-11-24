<template>
  <svg
    class="companion-avatar"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    role="img"
    :aria-label="ariaLabel"
  >
    <defs>
      <radialGradient :id="shellId" cx="38%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#b27a4f" />
        <stop offset="60%" stop-color="#8a5634" />
        <stop offset="100%" stop-color="#6b3f24" />
      </radialGradient>
    </defs>

    <!-- 栗子壳 -->
    <path d="M32 3.5 l-2.6 5.2 h5.2 z" fill="#6b3f24" />
    <path
      d="M32 7 C21 14 7 24 7 39 C7 52 18.5 59 32 59 C45.5 59 57 52 57 39 C57 24 43 14 32 7 Z"
      :fill="`url(#${shellId})`"
    />
    <path
      d="M9.5 45 C14 54 23 58.5 32 58.5 C41 58.5 50 54 54.5 45 C46 49.5 18 49.5 9.5 45 Z"
      fill="#d9b48a"
    />
    <ellipse cx="23" cy="20" rx="5" ry="3" fill="#fff" opacity="0.22" />

    <!-- 腮红 -->
    <ellipse cx="17.5" cy="40" rx="4" ry="2.4" fill="#f08a7a" opacity="0.45" />
    <ellipse cx="46.5" cy="40" rx="4" ry="2.4" fill="#f08a7a" opacity="0.45" />

    <!-- 眉毛 -->
    <g
      v-if="face.brows"
      stroke="#2b1a10"
      stroke-width="1.8"
      stroke-linecap="round"
      fill="none"
    >
      <path :d="face.brows[0]" />
      <path :d="face.brows[1]" />
    </g>

    <!-- 眼睛 -->
    <g class="eyes">
      <template v-for="(eye, index) in face.eyes" :key="index">
        <path
          v-if="eye.arc"
          :d="eye.arc"
          stroke="#2b1a10"
          stroke-width="2.2"
          stroke-linecap="round"
          fill="none"
        />
        <g v-else>
          <ellipse
            :cx="eye.cx"
            :cy="eye.cy"
            :rx="eye.r"
            :ry="eye.r * 1.2"
            fill="#2b1a10"
          />
          <circle
            :cx="(eye.cx ?? 0) + (eye.r ?? 0) * 0.35"
            :cy="(eye.cy ?? 0) - (eye.r ?? 0) * 0.45"
            :r="(eye.r ?? 0) * 0.38"
            fill="#fff"
          />
        </g>
      </template>
    </g>

    <!-- 嘴 -->
    <ellipse
      v-if="face.mouth === 'open'"
      cx="32"
      cy="43"
      rx="3.6"
      ry="3"
      fill="#5a2a1a"
    />
    <circle
      v-else-if="face.mouth === 'o'"
      cx="32"
      cy="43.5"
      r="2.2"
      fill="#5a2a1a"
    />
    <path
      v-else
      :d="MOUTHS[face.mouth]"
      stroke="#2b1a10"
      stroke-width="2"
      stroke-linecap="round"
      fill="none"
    />

    <!-- 点缀 -->
    <g v-if="face.extra === 'sparkle'" fill="#ffd36b">
      <path
        d="M53 10 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z"
      />
      <path d="M10 14 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1 z" />
    </g>
    <path
      v-else-if="face.extra === 'sweat'"
      d="M50 22 C48 26 48 28.5 50 29.5 C52 28.5 52 26 50 22 Z"
      fill="#8fd0ff"
    />
    <text
      v-else-if="face.extra === 'question'"
      x="49"
      y="17"
      font-size="13"
      font-weight="700"
      fill="#cc785c"
    >
      ?
    </text>
    <g v-else-if="face.extra === 'dots'" class="thinking-dots" fill="#cc785c">
      <circle cx="46" cy="12" r="2" />
      <circle cx="52" cy="9" r="2.4" />
      <circle cx="58.5" cy="7" r="2.8" />
    </g>
    <path
      v-else-if="face.extra === 'heart'"
      d="M52 12 c-2-3-6-1.5-5 1.5 c0.6 1.8 5 4.8 5 4.8 s4.4-3 5-4.8 c1-3-3-4.5-5-1.5 z"
      fill="#f08a7a"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, defineProps, withDefaults } from "vue";

import { COMPANION_MOOD_LABELS, PetMood } from "@/constants/companionMoods";

type Eye = { cx?: number; cy?: number; r?: number; arc?: string };
type Mouth = "smile" | "grin" | "flat" | "wavy" | "frown" | "open" | "o";
type Face = {
  eyes: [Eye, Eye];
  mouth: Mouth;
  brows?: [string, string];
  extra?: "sparkle" | "sweat" | "question" | "dots" | "heart";
};

const props = withDefaults(
  defineProps<{
    mood?: PetMood;
    size?: number;
  }>(),
  { mood: "idle", size: 56 }
);

const MOUTHS: Record<Exclude<Mouth, "open" | "o">, string> = {
  smile: "M28 42 Q32 45.5 36 42",
  grin: "M27 41.5 Q32 47 37 41.5",
  flat: "M29 43 H35",
  wavy: "M27.5 43.5 q1.5 -1.6 3 0 t3 0 t3 0",
  frown: "M28.5 44.5 Q32 41.5 35.5 44.5",
};

const OPEN_EYES: [Eye, Eye] = [
  { cx: 24, cy: 33, r: 2.5 },
  { cx: 40, cy: 33, r: 2.5 },
];
const HAPPY_EYES: [Eye, Eye] = [
  { arc: "M21 34 Q24 30 27 34" },
  { arc: "M37 34 Q40 30 43 34" },
];

const FACES: Record<PetMood, Face> = {
  idle: { eyes: OPEN_EYES, mouth: "smile" },
  thinking: {
    eyes: [
      { cx: 25, cy: 32, r: 2.4 },
      { cx: 41, cy: 32, r: 2.4 },
    ],
    mouth: "flat",
    extra: "dots",
  },
  excited: { eyes: HAPPY_EYES, mouth: "open", extra: "sparkle" },
  proud: {
    eyes: HAPPY_EYES,
    mouth: "grin",
    brows: ["M20 27 Q24 25 28 27", "M36 27 Q40 25 44 27"],
    extra: "sparkle",
  },
  surprised: {
    eyes: [
      { cx: 24, cy: 33, r: 3.4 },
      { cx: 40, cy: 33, r: 3.4 },
    ],
    mouth: "o",
    brows: ["M20 25.5 Q24 23 28 25.5", "M36 25.5 Q40 23 44 25.5"],
  },
  thoughtful: {
    eyes: [
      { cx: 25.5, cy: 31.5, r: 2.3 },
      { cx: 41.5, cy: 31.5, r: 2.3 },
    ],
    mouth: "flat",
    brows: ["M21 27 L28 26", "M36 26 Q40 24.5 44 26.5"],
  },
  sympathetic: {
    eyes: OPEN_EYES,
    mouth: "frown",
    brows: ["M21 27 L27 25.5", "M37 25.5 L43 27"],
    extra: "heart",
  },
  encouraging: {
    eyes: OPEN_EYES,
    mouth: "grin",
    brows: ["M21 27 Q24 26 27 27", "M37 27 Q40 26 43 27"],
  },
  playful: {
    eyes: [{ cx: 24, cy: 33, r: 2.5 }, { arc: "M37 33.5 Q40 31 43 33.5" }],
    mouth: "grin",
  },
  nervous: {
    eyes: OPEN_EYES,
    mouth: "wavy",
    brows: ["M21 26 L27 27.5", "M37 27.5 L43 26"],
    extra: "sweat",
  },
  confused: {
    eyes: [
      { cx: 24, cy: 33, r: 2.1 },
      { cx: 40, cy: 32.5, r: 3 },
    ],
    mouth: "wavy",
    brows: ["M21 27.5 L27 27.5", "M36 25 Q40 23.5 44 25.5"],
    extra: "question",
  },
};

// 同一页面可能有多个头像，渐变 id 不能重复
const shellId = `companion-shell-${Math.random().toString(36).slice(2, 10)}`;

const face = computed(() => FACES[props.mood] ?? FACES.idle);

const ariaLabel = computed(() => {
  if (props.mood === "idle") return "陪练";
  if (props.mood === "thinking") return "陪练正在思考";
  return `陪练：${COMPANION_MOOD_LABELS[props.mood]}`;
});
</script>

<style scoped>
.companion-avatar {
  display: block;
  overflow: visible;
}

.thinking-dots circle {
  animation: companion-dot 1.2s ease-in-out infinite;
}

.thinking-dots circle:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots circle:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes companion-dot {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .thinking-dots circle {
    animation: none;
  }
}
</style>
