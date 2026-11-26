<template>
  <svg
    :class="[
      'companion-avatar',
      `move-${spec.move ?? 'breathe'}`,
      `arms-${spec.arms}`,
      spec.head && `head-${spec.head}`,
      spec.tuft && `tuft-${spec.tuft}`,
      {
        lively,
        restart: restarting,
        blink: blinking,
        dangle: spec.dangle,
        'look-around': spec.look === 'around',
      },
    ]"
    :style="rootStyle"
    :width="size"
    :height="size"
    viewBox="2 12 116 116"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- 线条跟着文字色，填充跟着所在面板（外面可以用 --mascot-fill 覆盖） -->
    <g class="rig">
      <g class="feet">
        <ellipse class="o" cx="48" cy="122" rx="9" ry="4" />
        <ellipse class="o" cx="72" cy="122" rx="9" ry="4" />
      </g>
      <ellipse class="o" cx="60" cy="98" rx="31" ry="23" />

      <g class="head">
        <g class="tuft">
          <path class="l" d="M57 31 Q51 22 56 16 M62 30 Q62 21 68 18" />
        </g>
        <circle class="o" cx="60" cy="53" r="25" />
        <g class="track">
          <path
            v-for="(shape, index) in trackedEyes"
            :key="`t${index}`"
            :d="shape.d"
            :class="[shape.cls, { 'e-open': shape.blink }]"
          />
        </g>
        <path
          v-for="(shape, index) in fixedEyes"
          :key="`e${index}`"
          :d="shape.d"
          :class="shape.cls"
        />
        <template v-if="spec.mouth === 'talk'">
          <g class="talk-a">
            <path
              v-for="(shape, index) in calmBeak"
              :key="`a${index}`"
              :d="shape.d"
              :class="shape.cls"
            />
          </g>
          <g class="talk-b">
            <path
              v-for="(shape, index) in openBeak"
              :key="`b${index}`"
              :d="shape.d"
              :class="shape.cls"
            />
          </g>
        </template>
        <path
          v-for="(shape, index) in beak"
          v-else
          :key="`m${index}`"
          :d="shape.d"
          :class="shape.cls"
        />
      </g>

      <g class="arm arm-l">
        <ellipse
          class="o"
          :cx="SHOULDERS[0][0]"
          :cy="WING_CY"
          :rx="DUCK_WING.width"
          :ry="WING_RY"
        />
      </g>
      <g class="arm arm-r">
        <ellipse
          class="o"
          :cx="SHOULDERS[1][0]"
          :cy="WING_CY"
          :rx="DUCK_WING.width"
          :ry="WING_RY"
        />
      </g>

      <path
        v-if="spec.hold === 'heart'"
        class="o"
        d="M60 105 C48 97 53 88 60 94 C67 88 72 97 60 105 Z"
      />
      <g v-if="spec.hold === 'keyboard'">
        <rect class="o" x="37" y="112" width="46" height="12" rx="3" />
        <path
          class="t"
          d="M45 118 L47 118 M54 118 L56 118 M63 118 L65 118 M72 118 L74 118"
        />
      </g>
    </g>

    <!-- 头顶上的特效 -->
    <g v-if="has('sparkle')" class="fx-sparkle">
      <path class="f" :d="star(14, 30, 7)" />
      <path class="f" :d="star(108, 24, 8)" />
      <path class="f" :d="star(112, 62, 5.5)" />
    </g>
    <g v-if="has('confetti')" class="fx-confetti">
      <template v-for="(piece, index) in CONFETTI" :key="index">
        <rect
          v-if="index % 2"
          class="f"
          :x="piece[0]"
          :y="piece[1]"
          width="4"
          height="7"
          rx="1"
          :style="{ animationDelay: `${piece[2]}s` }"
        />
        <path
          v-else
          class="t"
          :d="`M${piece[0]} ${piece[1]} q3 3 0 6`"
          :style="{ animationDelay: `${piece[2]}s` }"
        />
      </template>
    </g>
    <g v-if="has('zzz')" class="fx-zzz">
      <text x="90" y="28" font-size="12">z</text>
      <text x="99" y="16" font-size="15">z</text>
      <text x="108" y="2" font-size="19">Z</text>
    </g>
    <g v-if="has('question')" class="fx-question">
      <text x="96" y="28" font-size="26">?</text>
      <text x="112" y="16" font-size="15">?</text>
    </g>
    <g v-if="has('exclaim')" class="fx-exclaim">
      <text x="96" y="28" font-size="28">!</text>
    </g>
    <g v-if="has('thought')" class="fx-thought">
      <circle class="o thin" cx="88" cy="24" r="2.6" />
      <circle class="o thin" cx="96" cy="15" r="4" />
      <path
        class="o thin"
        d="M98 0 q-2 -12 10 -12 q4 -8 13 -2 q11 -2 10 9 q6 8 -3 12 q-4 6 -12 2 q-8 5 -13 -1 q-8 0 -5 -8 Z"
      />
      <g class="dots">
        <circle class="f" cx="106" cy="-1" r="2" />
        <circle class="f" cx="113" cy="-1" r="2" />
        <circle class="f" cx="120" cy="-1" r="2" />
      </g>
    </g>
    <g v-if="has('dots')" class="fx-dots">
      <circle class="f" cx="92" cy="24" r="2.4" />
      <circle class="f" cx="100" cy="20" r="2.4" />
      <circle class="f" cx="108" cy="16" r="2.4" />
    </g>
    <path
      v-if="has('sweat')"
      class="o thin fx-sweat"
      d="M90 34 q5 7 0 11 q-5 -4 0 -11 Z"
    />
    <!-- 三颗星绕着头顶转：左右来回、近大远小 -->
    <g v-if="has('dizzy')" class="fx-dizzy">
      <path class="f" :d="star(60, 22, 5)" />
      <path class="f" :d="star(60, 22, 5)" />
      <path class="f" :d="star(60, 22, 5)" />
    </g>
    <path
      v-if="has('blush')"
      class="t blush"
      d="M33 56 l3 -3 M37 57 l3 -3 M80 56 l3 -3 M84 57 l3 -3"
    />
    <g v-if="has('dust')" class="fx-dust">
      <circle class="o thin" cx="30" cy="121" r="5" />
      <circle class="o thin" cx="22" cy="117" r="3.5" />
      <circle class="o thin" cx="90" cy="121" r="5" />
      <circle class="o thin" cx="98" cy="117" r="3.5" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import {
  computed,
  defineProps,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";

import {
  DUCK_SHOULDERS,
  DUCK_WING,
  DuckFx,
  DuckPose,
  duckWingAngles,
  getDuckPose,
} from "@/components/companion/duck/duckPoses";
import {
  duckBeakShapes,
  duckEyeShapes,
} from "@/components/companion/duck/duckShapes";
import { PetMood } from "@/constants/companionMoods";

/**
 * 陪练的形象：线稿小鸭子「鸭鸭」。
 * 静态用法只传 mood；桌宠传 pose（拖拽、睡觉等动作）、lively（身体动起来）和 look（看哪儿）。
 */
const props = defineProps({
  mood: { type: String as PropType<PetMood>, default: "idle" },
  /** 比 mood 优先 */
  pose: { type: String as PropType<DuckPose>, default: undefined },
  size: { type: Number, default: 56 },
  /** 身体动作（跳、晃、压扁）；静态的图标不开 */
  lively: { type: Boolean, default: false },
  /** 眼睛看的方向，-1 到 1；只在待机这类「跟着鼠标」的姿势里生效 */
  look: {
    type: Object as PropType<{ x: number; y: number } | null>,
    default: null,
  },
  /** 动作幅度 1-3 */
  amp: { type: Number, default: 1 },
  /** 变化时重播一次性的动作（跳一下、落地压扁），同一个心情连着来也能再播 */
  replay: { type: Number, default: 0 },
});

const SHOULDERS = DUCK_SHOULDERS;
/** 翅膀是从肩膀垂下来的椭圆，顶端比肩膀高 3 */
const WING_RY = DUCK_WING.length / 2 + 1;
const WING_CY = SHOULDERS[0][1] + DUCK_WING.length / 2 - 2;

const CONFETTI: Array<[number, number, number]> = [
  [18, 8, 0],
  [34, 0, 0.3],
  [52, 10, 0.7],
  [70, 2, 0.15],
  [88, 12, 0.5],
  [104, 4, 0.9],
  [26, 18, 1.1],
  [96, 20, 1.3],
];

const spec = computed(() => getDuckPose(props.pose ?? props.mood));

const eyeShapes = computed(() => duckEyeShapes(spec.value.eyes));
const trackedEyes = computed(() => eyeShapes.value.filter((s) => s.track));
const fixedEyes = computed(() => eyeShapes.value.filter((s) => !s.track));
const calmBeak = duckBeakShapes("calm");
const openBeak = duckBeakShapes("open");
const beak = computed(() =>
  spec.value.mouth === "talk" ? [] : duckBeakShapes(spec.value.mouth)
);

const has = (fx: DuckFx) => !!spec.value.fx?.includes(fx);

/** 四角星 */
const star = (x: number, y: number, r: number) => {
  const k = r * 0.18;
  return `M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${
    y + k
  } ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${
    y - r
  } Z`;
};

const rootStyle = computed(() => {
  const [left, right] = duckWingAngles(spec.value.arms);
  const fixed = Array.isArray(spec.value.look) ? spec.value.look : null;
  const follow = spec.value.track && props.look ? props.look : null;
  const look = fixed ?? (follow ? [follow.x, follow.y] : [0, 0]);
  return {
    "--al": `${left}deg`,
    "--ar": `${right}deg`,
    "--lx": look[0].toFixed(2),
    "--ly": look[1].toFixed(2),
    "--amp": Math.min(3, Math.max(1, props.amp)),
  };
});

const ariaLabel = computed(() =>
  spec.value.label === "待机" ? "陪练鸭鸭" : `陪练鸭鸭：${spec.value.label}`
);

// 重播：先去掉动画，下一帧再加回来
const restarting = ref(false);
watch(
  () => props.replay,
  () => {
    restarting.value = true;
    requestAnimationFrame(() => {
      restarting.value = false;
    });
  }
);

// region 眨眼：每只鸭鸭自己随机眨，偶尔连眨两下

const blinking = ref(false);
let blinkTimer: ReturnType<typeof setTimeout> | undefined;

const blinkOnce = (then: () => void) => {
  blinking.value = true;
  blinkTimer = setTimeout(() => {
    blinking.value = false;
    then();
  }, 130);
};

const scheduleBlink = () => {
  blinkTimer = setTimeout(() => {
    blinkOnce(() => {
      if (Math.random() < 0.2) {
        blinkTimer = setTimeout(() => blinkOnce(scheduleBlink), 140);
      } else {
        scheduleBlink();
      }
    });
  }, 2200 + Math.random() * 3800);
};

onMounted(scheduleBlink);
onBeforeUnmount(() => {
  if (blinkTimer) clearTimeout(blinkTimer);
});

// endregion
</script>

<style scoped>
.companion-avatar {
  display: block;
  overflow: visible;
  color: var(--ink);
  --pet-fill: var(--mascot-fill, var(--panel));
}

.o {
  fill: var(--pet-fill);
  stroke: currentColor;
  stroke-width: 4.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.o.thin {
  stroke-width: 3.2;
}

.l,
.t {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.l {
  stroke-width: 4.6;
}

.t {
  stroke-width: 3;
}

.f {
  fill: currentColor;
}

.fs {
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
}

.w {
  fill: var(--pet-fill);
}

text {
  fill: currentColor;
  font-weight: 800;
}

.blush {
  stroke-width: 2.4;
}

/* ---------- 部件的转轴 ---------- */
.rig,
.head,
.tuft,
.feet,
.arm,
.e-open,
.fx-sparkle > *,
.fx-dust > *,
.fx-exclaim,
.fx-question {
  transform-box: fill-box;
}

.rig {
  transform-origin: 50% 100%;
}

.head {
  transform-origin: 50% 100%;
  transition: transform 0.3s var(--ease-out);
}

.tuft {
  transform-origin: 30% 100%;
  transition: transform 0.26s var(--ease-out);
}

.feet {
  transform-origin: 50% 0;
  transition: transform 0.2s var(--ease-out);
}

.arm {
  /* 椭圆顶端往下 3 就是肩膀 */
  transform-origin: 50% 3px;
  transition: transform 0.22s var(--ease-out);
}

.arm-l {
  transform: rotate(var(--al));
}

.arm-r {
  transform: rotate(var(--ar));
}

.track {
  transform: translate(calc(var(--lx) * 2.6px), calc(var(--ly) * 2.1px));
  transition: transform 0.14s linear;
}

.e-open {
  transform-origin: center;
  transition: transform 0.07s linear;
}

.blink .e-open {
  transform: scaleY(0.12);
}

/* ---------- 姿势 ---------- */
.head-tilt .head {
  transform: rotate(-11deg);
}

.head-tilt-r .head {
  transform: rotate(9deg);
}

.tuft-perk .tuft {
  transform: scale(1.1, 1.25);
}

.tuft-back .tuft {
  transform: rotate(-34deg);
}

.tuft-droop .tuft {
  transform: rotate(28deg) translateY(2px);
}

.tuft-tilt .tuft {
  transform: rotate(22deg);
}

.look-around .track {
  animation: duck-look 2.4s ease-in-out infinite;
}

.talk-a {
  animation: duck-talk-a 0.28s steps(1) infinite;
}

.talk-b {
  animation: duck-talk-b 0.28s steps(1) infinite;
}

/* 翅膀的循环动作：挥手、打字、挥拳、扑腾 */
.arms-wave .arm-r {
  animation: duck-wave 0.5s ease-in-out infinite;
}

.arms-type .arm-l {
  animation: duck-type-l 0.26s linear infinite;
}

.arms-type .arm-r {
  animation: duck-type-r 0.26s linear infinite;
}

.arms-fist .arm-r {
  animation: duck-pump 0.6s ease-in-out infinite;
}

.arms-flap .arm-l {
  animation: duck-flap-l 0.24s ease-in-out infinite;
}

.arms-flap .arm-r {
  animation: duck-flap-r 0.24s ease-in-out infinite;
}

/* ---------- 身体动作：只有桌宠（lively）才动 ---------- */
.lively .rig {
  animation: duck-breathe 3.4s ease-in-out infinite;
}

.lively.move-none .rig {
  animation: none;
}

.lively.move-sleep .rig {
  animation: duck-breathe-slow 4.6s ease-in-out infinite;
}

.lively.move-hop .rig {
  animation: duck-hop 0.5s var(--ease-out) 1;
}

.lively.move-jump .rig {
  animation: duck-jump 1s ease-in-out 3;
}

.lively.move-squash .rig {
  animation: duck-squash 0.5s var(--ease-out) 1;
}

.lively.move-tremble .rig {
  animation: duck-tremble 0.14s linear infinite;
}

.lively.move-sway .rig {
  animation: duck-sway 2.6s ease-in-out infinite;
}

.lively.move-wobble .rig {
  animation: duck-wobble 0.5s ease-in-out infinite;
}

.lively.move-stretch .rig {
  animation: duck-stretch 1.6s ease-in-out infinite;
}

.lively.move-bounce .rig {
  animation: duck-bounce 0.7s ease-in-out 4;
}

.lively.move-puff .rig {
  animation: duck-puff 1.4s ease-in-out infinite;
}

.lively.head-nod .head {
  animation: duck-nod 0.9s ease-in-out infinite;
}

.lively.head-nod-slow .head {
  animation: duck-nod-slow 2.4s ease-in-out infinite;
}

.lively.dangle .feet {
  animation: duck-swing 0.9s ease-in-out infinite;
}

.restart .rig,
.restart .fx-exclaim,
.restart .fx-dust > * {
  animation: none !important;
}

/* ---------- 特效 ---------- */
.fx-sparkle > * {
  transform-origin: center;
  animation: duck-twinkle 1.4s ease-in-out infinite;
}

.fx-sparkle > :nth-child(2) {
  animation-delay: 0.45s;
}

.fx-sparkle > :nth-child(3) {
  animation-delay: 0.9s;
}

.fx-confetti > * {
  animation: duck-fall 1.6s linear infinite;
}

.fx-zzz > * {
  animation: duck-rise 2.4s ease-out infinite;
}

.fx-zzz > :nth-child(2) {
  animation-delay: 0.8s;
}

.fx-zzz > :nth-child(3) {
  animation-delay: 1.6s;
}

.fx-question {
  transform-origin: 30% 100%;
  animation: duck-bob 1s ease-in-out infinite;
}

.fx-exclaim {
  transform-origin: 50% 100%;
  animation: duck-pop 0.35s var(--ease-out) 1 both;
}

.fx-thought .dots > *,
.fx-dots > * {
  animation: duck-dot 1.2s ease-in-out infinite;
}

.fx-thought .dots > :nth-child(2),
.fx-dots > :nth-child(2) {
  animation-delay: 0.2s;
}

.fx-thought .dots > :nth-child(3),
.fx-dots > :nth-child(3) {
  animation-delay: 0.4s;
}

.fx-sweat {
  animation: duck-tremble 0.4s linear infinite;
}

.fx-dizzy > * {
  transform-box: fill-box;
  transform-origin: center;
  animation: duck-orbit 1.1s linear infinite;
}

.fx-dizzy > :nth-child(2) {
  animation-delay: -0.37s;
}

.fx-dizzy > :nth-child(3) {
  animation-delay: -0.73s;
}

.fx-dust > * {
  transform-origin: center;
  animation: duck-puff-out 0.55s var(--ease-out) 1 both;
}

@keyframes duck-breathe {
  0%,
  100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.012, 1.028);
  }
}

@keyframes duck-breathe-slow {
  0%,
  100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.03, 0.97);
  }
}

@keyframes duck-hop {
  0%,
  100% {
    transform: translateY(0);
  }
  35% {
    transform: translateY(calc(var(--amp) * -8px)) scale(0.98, 1.04);
  }
  70% {
    transform: translateY(0) scale(1.06, 0.94);
  }
}

@keyframes duck-jump {
  0%,
  50%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  10%,
  60% {
    transform: translateY(0) scale(1.08, 0.9);
  }
  25%,
  75% {
    transform: translateY(calc(var(--amp) * -9px)) scale(0.95, 1.06);
  }
}

@keyframes duck-squash {
  0% {
    transform: translateY(-6px) scale(0.94, 1.08);
  }
  30% {
    transform: translateY(0) scale(1.16, 0.82);
  }
  60% {
    transform: scale(0.97, 1.05);
  }
  100% {
    transform: scale(1, 1);
  }
}

@keyframes duck-tremble {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-0.9px);
  }
  75% {
    transform: translateX(0.9px);
  }
}

@keyframes duck-sway {
  0%,
  100% {
    transform: rotate(-2.5deg);
  }
  50% {
    transform: rotate(2.5deg);
  }
}

@keyframes duck-wobble {
  0%,
  100% {
    transform: rotate(-7deg);
  }
  50% {
    transform: rotate(7deg);
  }
}

@keyframes duck-stretch {
  0%,
  100% {
    transform: scale(1, 1);
  }
  45%,
  60% {
    transform: scale(0.95, 1.09);
  }
}

@keyframes duck-bounce {
  0%,
  100% {
    transform: translateX(-3px) rotate(-5deg);
  }
  50% {
    transform: translateX(3px) rotate(5deg);
  }
}

@keyframes duck-puff {
  0%,
  100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.05, 1.05) translateY(-1px);
  }
}

@keyframes duck-nod {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(7deg) translateY(1px);
  }
}

@keyframes duck-nod-slow {
  0%,
  100% {
    transform: rotate(0);
  }
  70% {
    transform: rotate(14deg) translateY(3px);
  }
  80% {
    transform: rotate(4deg);
  }
}

@keyframes duck-swing {
  0%,
  100% {
    transform: translateY(7px) rotate(-7deg);
  }
  50% {
    transform: translateY(7px) rotate(7deg);
  }
}

@keyframes duck-look {
  0%,
  100% {
    transform: translate(-2.6px, 0);
  }
  45%,
  55% {
    transform: translate(2.6px, -0.6px);
  }
}

@keyframes duck-talk-a {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@keyframes duck-talk-b {
  0%,
  49% {
    opacity: 0;
  }
  50%,
  100% {
    opacity: 1;
  }
}

@keyframes duck-wave {
  0%,
  100% {
    transform: rotate(var(--ar));
  }
  50% {
    transform: rotate(calc(var(--ar) + 34deg));
  }
}

@keyframes duck-type-l {
  0%,
  100% {
    transform: rotate(var(--al));
  }
  50% {
    transform: rotate(calc(var(--al) - 12deg));
  }
}

@keyframes duck-type-r {
  0%,
  100% {
    transform: rotate(calc(var(--ar) + 12deg));
  }
  50% {
    transform: rotate(var(--ar));
  }
}

@keyframes duck-pump {
  0%,
  100% {
    transform: rotate(var(--ar));
  }
  50% {
    transform: rotate(calc(var(--ar) + 26deg));
  }
}

@keyframes duck-flap-l {
  0%,
  100% {
    transform: rotate(var(--al));
  }
  50% {
    transform: rotate(calc(var(--al) + 38deg));
  }
}

@keyframes duck-flap-r {
  0%,
  100% {
    transform: rotate(var(--ar));
  }
  50% {
    transform: rotate(calc(var(--ar) - 38deg));
  }
}

@keyframes duck-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.4);
  }
  40%,
  60% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes duck-fall {
  0% {
    transform: translateY(-26px) rotate(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translateY(46px) rotate(260deg);
    opacity: 0;
  }
}

@keyframes duck-rise {
  0% {
    transform: translate(0, 6px);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate(6px, -16px);
    opacity: 0;
  }
}

@keyframes duck-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-6deg);
  }
  50% {
    transform: translateY(-4px) rotate(6deg);
  }
}

@keyframes duck-pop {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

@keyframes duck-dot {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}

@keyframes duck-orbit {
  0%,
  100% {
    transform: translate(-24px, 0) scale(0.75);
  }
  25% {
    transform: translate(0, 6px) scale(1);
  }
  50% {
    transform: translate(24px, 0) scale(0.75);
  }
  75% {
    transform: translate(0, -5px) scale(0.5);
  }
}

@keyframes duck-puff-out {
  0% {
    transform: scale(0.4);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.4) translateY(-4px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .companion-avatar *,
  .companion-avatar {
    animation: none !important;
    transition: none !important;
  }
}
</style>
