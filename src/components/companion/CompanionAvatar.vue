<template>
  <svg
    class="companion-avatar"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- 身体：单色线条，跟着文字颜色走 -->
    <g
      class="line"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <ellipse
        class="fill"
        cx="25"
        cy="58.4"
        rx="3.8"
        ry="2.3"
        stroke-width="2.2"
      />
      <ellipse
        class="fill"
        cx="39"
        cy="58.4"
        rx="3.8"
        ry="2.3"
        stroke-width="2.2"
      />
      <path class="fill" :d="SHELL" stroke="none" />
      <path class="tint" :d="BASE" stroke="none" />
      <path
        d="M10.9 41.5 C18 47 46 47 53.1 41.5"
        fill="none"
        stroke-width="2.4"
      />
      <path :d="SHELL" fill="none" stroke-width="2.8" />
      <!-- 顶上的叶子 -->
      <path
        class="tint"
        d="M32 7 C32.6 3.4 36.4 .9 41 1.8 C39.8 5.6 36.2 7.8 32 7 Z"
        stroke-width="1.9"
      />
      <path d="M33.2 6.2 L38.4 3.2" fill="none" stroke-width="1.4" />
      <!-- 高光 -->
      <path
        class="shine"
        d="M19.5 22.5 C17.2 25.5 16 28.8 15.7 32"
        fill="none"
        stroke-width="2.2"
      />
      <!-- 圆框眼镜 -->
      <circle cx="24.5" cy="33.6" r="6" fill="none" stroke-width="2" />
      <circle cx="39.5" cy="33.6" r="6" fill="none" stroke-width="2" />
      <path
        d="M30.5 32.6 Q32 31.4 33.5 32.6 M18.5 32.6 L13.6 30.8 M45.5 32.6 L50.4 30.8"
        fill="none"
        stroke-width="2"
      />
    </g>
    <!-- 栗底的麻点 -->
    <g class="dots" fill="currentColor">
      <circle
        v-for="([cx, cy], index) in BASE_DOTS"
        :key="index"
        :cx="cx"
        :cy="cy"
        r=".95"
      />
    </g>

    <!-- 腮红：几道细斜线 -->
    <path
      class="blush"
      d="M13.8 42.6 l1.4-2 M16.4 42.6 l1.4-2 M46.2 42.6 l1.4-2 M48.8 42.6 l1.4-2"
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linecap="round"
    />

    <!-- 眉毛 -->
    <g
      v-if="face.brows"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      fill="none"
    >
      <path :d="face.brows[0]" />
      <path :d="face.brows[1]" />
    </g>

    <!-- 眼睛 -->
    <template v-for="(eye, index) in face.eyes" :key="index">
      <path
        v-if="eye.arc"
        :d="eye.arc"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        fill="none"
      />
      <g v-else>
        <ellipse
          :cx="eye.cx"
          :cy="eye.cy"
          :rx="eye.r"
          :ry="(eye.r ?? 0) * 1.18"
          fill="currentColor"
        />
        <circle
          class="fill"
          :cx="(eye.cx ?? 0) + (eye.r ?? 0) * 0.36"
          :cy="(eye.cy ?? 0) - (eye.r ?? 0) * 0.46"
          :r="(eye.r ?? 0) * 0.38"
        />
      </g>
    </template>

    <!-- 嘴 -->
    <path
      v-if="face.mouth === 'open'"
      d="M28.8 38.8 Q32 44.4 35.2 38.8 Z"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
    <circle
      v-else-if="face.mouth === 'o'"
      cx="32"
      cy="41"
      r="2"
      fill="currentColor"
    />
    <path
      v-else
      :d="MOUTHS[face.mouth]"
      stroke="currentColor"
      stroke-width="2.1"
      stroke-linecap="round"
      fill="none"
    />

    <!-- 点缀 -->
    <path
      v-if="face.extra === 'sparkle'"
      d="M52 6.5 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3 z"
      class="fill"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
    <path
      v-else-if="face.extra === 'sweat'"
      d="M50 17.5 C48.1 20.9 48.3 23.1 50 23.9 C51.7 23.1 51.9 20.9 50 17.5 Z"
      class="fill"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
    <text
      v-else-if="face.extra === 'question'"
      x="48"
      y="19"
      font-size="13"
      font-weight="700"
      fill="currentColor"
    >
      ?
    </text>
    <g
      v-else-if="face.extra === 'dots'"
      class="thinking-dots"
      fill="currentColor"
    >
      <circle cx="48" cy="17" r="1.3" />
      <circle cx="52" cy="13.6" r="1.6" />
      <circle cx="56.6" cy="10.8" r="1.9" />
    </g>
    <path
      v-else-if="face.extra === 'heart'"
      d="M51.5 10.5 c-1.8-2.7-5.4-1.3-4.5 1.4 c0.6 1.6 4.5 4.3 4.5 4.3 s3.9-2.7 4.5-4.3 c0.9-2.7-2.7-4.1-4.5-1.4 z"
      class="fill"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
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

const SHELL =
  "M32 7 C26 11 13 20.5 10.5 34 C8.5 46 16 56.5 32 56.5 C48 56.5 55.5 46 53.5 34 C51 20.5 38 11 32 7 Z";
const BASE =
  "M10.9 41.5 C18 47 46 47 53.1 41.5 C52.6 50.5 45 56.5 32 56.5 C19 56.5 11.4 50.5 10.9 41.5 Z";
const BASE_DOTS: Array<[number, number]> = [
  [19.5, 49],
  [25, 51.6],
  [31, 49.6],
  [37, 51.8],
  [43.5, 49.2],
  [28, 54],
  [35, 54.2],
];

const MOUTHS: Record<Exclude<Mouth, "open" | "o">, string> = {
  smile: "M29.6 39.8 Q32 42.2 34.4 39.8",
  grin: "M28.4 39.4 Q32 43.6 35.6 39.4",
  flat: "M30 40.8 H34.4",
  wavy: "M28.4 41 q1.8 -1.6 3.6 0 t3.6 0",
  frown: "M29.4 41.6 Q32 39.2 34.6 41.6",
};

/** 眼睛都在眼镜框里：左框中心 (24.5, 33.6)，右框中心 (39.5, 33.6)，半径 6 */
const OPEN_EYES: [Eye, Eye] = [
  { cx: 24.5, cy: 33.6, r: 2.4 },
  { cx: 39.5, cy: 33.6, r: 2.4 },
];
const HAPPY_EYES: [Eye, Eye] = [
  { arc: "M21.8 34.6 Q24.5 30.8 27.2 34.6" },
  { arc: "M36.8 34.6 Q39.5 30.8 42.2 34.6" },
];
/** 内侧高、外侧低：担心 */
const WORRIED_BROWS: [string, string] = [
  "M19.6 26 L26.4 24.2",
  "M44.4 26 L37.6 24.2",
];
const RAISED_BROWS: [string, string] = [
  "M19.8 25 Q23.6 22.8 27.4 24.8",
  "M36.6 24.8 Q40.4 22.8 44.2 25",
];

const FACES: Record<PetMood, Face> = {
  idle: { eyes: OPEN_EYES, mouth: "smile" },
  thinking: {
    eyes: [
      { cx: 25.6, cy: 32.4, r: 2.2 },
      { cx: 40.6, cy: 32.4, r: 2.2 },
    ],
    mouth: "flat",
    extra: "dots",
  },
  excited: { eyes: HAPPY_EYES, mouth: "open", extra: "sparkle" },
  proud: {
    eyes: HAPPY_EYES,
    mouth: "grin",
    brows: RAISED_BROWS,
    extra: "sparkle",
  },
  surprised: {
    eyes: [
      { cx: 24.5, cy: 33.6, r: 3 },
      { cx: 39.5, cy: 33.6, r: 3 },
    ],
    mouth: "o",
    brows: [
      "M19.6 23.6 Q23.6 21.2 27.6 23.4",
      "M36.4 23.4 Q40.4 21.2 44.4 23.6",
    ],
  },
  thoughtful: {
    eyes: [
      { cx: 23.4, cy: 33, r: 2.2 },
      { cx: 38.4, cy: 33, r: 2.2 },
    ],
    mouth: "flat",
    brows: ["M19.8 25.6 L27 25.2", "M36.6 25 Q40.2 22.8 43.8 25.2"],
  },
  sympathetic: {
    eyes: OPEN_EYES,
    mouth: "frown",
    brows: WORRIED_BROWS,
    extra: "heart",
  },
  encouraging: { eyes: OPEN_EYES, mouth: "grin", brows: RAISED_BROWS },
  playful: {
    eyes: [
      { cx: 24.5, cy: 33.6, r: 2.4 },
      { arc: "M36.8 34.2 Q39.5 31.6 42.2 34.2" },
    ],
    mouth: "grin",
  },
  nervous: {
    eyes: OPEN_EYES,
    mouth: "wavy",
    brows: WORRIED_BROWS,
    extra: "sweat",
  },
  confused: {
    eyes: [
      { cx: 24.5, cy: 33.8, r: 1.9 },
      { cx: 39.5, cy: 33.4, r: 2.8 },
    ],
    mouth: "wavy",
    brows: ["M20 25.6 L27 25.6", "M36.6 23.8 Q40.4 22 44.2 24.2"],
    extra: "question",
  },
};

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
  color: var(--ink);
}

/* 身体和眼睛高光的填充色跟着所在面板走，外面可以用 --mascot-fill 覆盖 */
.fill {
  fill: var(--mascot-fill, var(--panel));
}

.tint {
  fill: currentColor;
  fill-opacity: 0.12;
}

.shine {
  opacity: 0.35;
}

.dots {
  opacity: 0.45;
}

.blush {
  opacity: 0.5;
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
