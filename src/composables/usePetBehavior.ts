import { getCurrentInstance, onBeforeUnmount, ref, watch } from "vue";

import { DuckPose } from "@/components/companion/duck/duckPoses";
import { PetMood } from "@/constants/companionMoods";

/**
 * 桌宠鸭鸭的行为：决定此刻摆哪个姿势。
 *
 * 优先级从高到低：拖拽 > 落地 / 晕 / 打招呼等短反应 > 睡觉 > 回答中、等判题 >
 * 陪练给的心情（思考中、判题后的反应） > 看你写代码 > 随机小动作 > 待机。
 * 拖拽随时能打断别的状态；短反应播完回到当时该有的状态。
 */

export type PetActivity = "talking" | "judging" | null;

type Interaction = "grab" | "drag" | "fly" | "dizzydrag" | "resize";
type SleepStage = "yawn" | "doze" | "sleep";

export const PET_TIMING = {
  /** 按住超过这么久才算拎起来；之前松手只是点击，不闪「被拎起来」 */
  grabDelay: 180,
  /** 陪练给的心情保持多久 */
  reaction: 6000,
  land: 500,
  dizzy: 1800,
  wave: 1300,
  /** 两次打招呼至少隔这么久 */
  waveCooldown: 6000,
  /** 停手多久后不再盯着代码 */
  watch: 2000,
  idleActionMin: 15000,
  idleActionMax: 25000,
  idleAction: 2600,
  sleepAfter: 60000,
  yawn: 1600,
  doze: 3000,
  startled: 700,
  /** 慢慢拖多久开始「飞」 */
  flyAfter: 1500,
  /** 快速甩累计多久会晕 */
  dizzyAfter: 600,
  /** 瞬时速度超过这个（像素/毫秒）算快 */
  fastSpeed: 1.5,
  /** 「飞」要求的平均速度上限 */
  flySpeed: 1.1,
  /** 睡着后鼠标挪动超过这么远才醒 */
  wakeDistance: 40,
  tick: 200,
} as const;

const IDLE_ACTIONS: DuckPose[] = ["lookaround", "preen", "stretch"];

export interface PetBehaviorOptions {
  mood: () => PetMood;
  /** 每次变化都重播一次心情（同一个心情连着来也要重播） */
  beat: () => number;
  activity: () => PetActivity;
  /** 编辑器里每打一次字加一 */
  typingBeat: () => number;
  now?: () => number;
  random?: () => number;
}

export const usePetBehavior = (options: PetBehaviorOptions) => {
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? Math.random;

  const pose = ref<DuckPose>("idle");
  /** 姿势变了或者同一个反应重播时加一，用来重放一次性的动画 */
  const poseKey = ref(0);

  let interaction: Interaction | null = null;
  let pendingGrab: ReturnType<typeof setTimeout> | undefined;
  let transients: Array<{ pose: DuckPose; ms: number }> = [];
  let transient: { pose: DuckPose; until: number } | null = null;
  let sleepStage: SleepStage | null = null;
  let sleepStageUntil = 0;
  let sleepAnchor: { x: number; y: number } | null = null;
  let moodState: { pose: DuckPose; until: number } | null = null;
  let watchUntil = 0;
  let idleAction: { pose: DuckPose; until: number } | null = null;
  let lastActivity = now();
  let nextIdleAt = lastActivity + PET_TIMING.idleActionMin;
  let lastWave = -Infinity;
  let drag: {
    start: number;
    lastX: number;
    lastY: number;
    lastT: number;
    speed: number;
    fast: number;
  } | null = null;

  const scheduleIdle = (from: number) => {
    nextIdleAt =
      from +
      PET_TIMING.idleActionMin +
      random() * (PET_TIMING.idleActionMax - PET_TIMING.idleActionMin);
  };

  /** 当前没有任何事在发生：可以随机小动作、可以犯困 */
  const isQuiet = (t: number) =>
    !interaction &&
    !transient &&
    !options.activity() &&
    !(moodState && t < moodState.until) &&
    t >= watchUntil;

  const resolve = (): DuckPose => {
    const t = now();
    if (interaction) return interaction;
    if (transient && t < transient.until) return transient.pose;
    if (sleepStage) return sleepStage;
    const activity = options.activity();
    if (activity) return activity;
    if (moodState && t < moodState.until) return moodState.pose;
    if (t < watchUntil) return "watch";
    if (idleAction && t < idleAction.until) return idleAction.pose;
    return "idle";
  };

  const update = (replay = false) => {
    const next = resolve();
    if (next !== pose.value || replay) {
      pose.value = next;
      poseKey.value += 1;
    }
  };

  const nextTransient = () => {
    const step = transients.shift();
    transient = step ? { pose: step.pose, until: now() + step.ms } : null;
  };

  const play = (steps: Array<{ pose: DuckPose; ms: number }>) => {
    transients = steps.slice();
    nextTransient();
    update(true);
  };

  const wake = (startle: boolean) => {
    if (!sleepStage) return;
    const deep = sleepStage !== "yawn";
    sleepStage = null;
    sleepAnchor = null;
    // 刚醒先别马上做小动作
    scheduleIdle(now());
    if (startle && deep) play([{ pose: "startled", ms: PET_TIMING.startled }]);
  };

  const touch = () => {
    lastActivity = now();
    scheduleIdle(lastActivity);
  };

  const tick = () => {
    const t = now();
    if (transient && t >= transient.until) nextTransient();
    if (moodState && t >= moodState.until) moodState = null;
    if (idleAction && t >= idleAction.until) idleAction = null;

    if (sleepStage && sleepStage !== "sleep" && t >= sleepStageUntil) {
      sleepStage = sleepStage === "yawn" ? "doze" : "sleep";
      sleepStageUntil = t + PET_TIMING.doze;
    }
    if (!sleepStage && isQuiet(t)) {
      if (t - lastActivity >= PET_TIMING.sleepAfter) {
        sleepStage = "yawn";
        sleepStageUntil = t + PET_TIMING.yawn;
        sleepAnchor = null;
        idleAction = null;
      } else if (!idleAction && t >= nextIdleAt) {
        const choice = IDLE_ACTIONS[Math.floor(random() * IDLE_ACTIONS.length)];
        idleAction = { pose: choice, until: t + PET_TIMING.idleAction };
        scheduleIdle(t);
      }
    }
    update();
  };

  const timer = setInterval(tick, PET_TIMING.tick);

  // region 外部输入：心情、正在做的事、打字

  watch(
    () => [options.mood(), options.beat()] as const,
    ([mood]) => {
      if (mood === "idle") {
        moodState = null;
      } else {
        wake(false);
        touch();
        moodState = {
          pose: mood,
          // 「思考中」由调用方结束，其他心情播一会儿
          until: mood === "thinking" ? Infinity : now() + PET_TIMING.reaction,
        };
      }
      update(true);
    },
    { immediate: true }
  );

  watch(
    () => options.activity(),
    (activity) => {
      if (activity) {
        wake(false);
        touch();
      }
      update();
    }
  );

  watch(
    () => options.typingBeat(),
    () => {
      wake(true);
      touch();
      watchUntil = now() + PET_TIMING.watch;
      update();
    }
  );

  // endregion

  // region 拖拽和悬停

  const pressStart = () => {
    wake(false);
    touch();
    if (pendingGrab) clearTimeout(pendingGrab);
    pendingGrab = setTimeout(() => {
      pendingGrab = undefined;
      if (!interaction) {
        interaction = "grab";
        update();
      }
    }, PET_TIMING.grabDelay);
  };

  const dragMove = (x: number, y: number) => {
    const t = now();
    if (pendingGrab) {
      clearTimeout(pendingGrab);
      pendingGrab = undefined;
    }
    if (!drag) {
      drag = { start: t, lastX: x, lastY: y, lastT: t, speed: 0, fast: 0 };
      interaction = "drag";
      update();
      return;
    }
    const dt = Math.max(1, t - drag.lastT);
    const instant = Math.hypot(x - drag.lastX, y - drag.lastY) / dt;
    drag.speed = drag.speed * 0.7 + instant * 0.3;
    // 来回甩时平均速度会互相抵消，快不快看瞬时速度
    drag.fast =
      instant > PET_TIMING.fastSpeed
        ? drag.fast + dt
        : Math.max(0, drag.fast - dt * 0.6);
    drag.lastX = x;
    drag.lastY = y;
    drag.lastT = t;
    if (interaction !== "dizzydrag") {
      if (drag.fast > PET_TIMING.dizzyAfter) interaction = "dizzydrag";
      else if (
        t - drag.start > PET_TIMING.flyAfter &&
        drag.speed < PET_TIMING.flySpeed &&
        drag.fast < 200
      )
        interaction = "fly";
      else if (interaction === "fly" && drag.speed >= PET_TIMING.flySpeed)
        interaction = "drag";
    }
    update();
  };

  /** 松手；moved 为 false 说明只是点了一下 */
  const release = (moved: boolean) => {
    if (pendingGrab) {
      clearTimeout(pendingGrab);
      pendingGrab = undefined;
    }
    const was = interaction;
    interaction = null;
    drag = null;
    touch();
    if (was === "dizzydrag") {
      play([
        { pose: "land", ms: PET_TIMING.land },
        { pose: "dizzy", ms: PET_TIMING.dizzy },
      ]);
    } else if (moved || was === "grab") {
      play([{ pose: "land", ms: PET_TIMING.land }]);
    } else {
      update();
    }
  };

  const resizeStart = () => {
    wake(false);
    touch();
    interaction = "resize";
    update();
  };

  const resizeEnd = () => {
    interaction = null;
    touch();
    play([{ pose: "land", ms: PET_TIMING.land }]);
  };

  /** 飞到新位置后落地 */
  const land = () => {
    touch();
    play([{ pose: "land", ms: PET_TIMING.land }]);
  };

  const hover = () => {
    const t = now();
    touch();
    if (sleepStage || interaction || transient) return;
    if (t - lastWave < PET_TIMING.waveCooldown) return;
    if (resolve() !== "idle") return;
    lastWave = t;
    play([{ pose: "wave", ms: PET_TIMING.wave }]);
  };

  // endregion

  /** 页面上的鼠标移动、按键：重置犯困计时；睡着时挪得够远才醒 */
  const noteUserActivity = (point?: { x: number; y: number }) => {
    if (sleepStage && sleepStage !== "yawn" && point) {
      if (!sleepAnchor) sleepAnchor = point;
      const distance = Math.hypot(
        point.x - sleepAnchor.x,
        point.y - sleepAnchor.y
      );
      if (distance < PET_TIMING.wakeDistance) return;
    }
    if (sleepStage) wake(true);
    lastActivity = now();
    update();
  };

  const dispose = () => {
    clearInterval(timer);
    if (pendingGrab) clearTimeout(pendingGrab);
  };

  if (getCurrentInstance()) onBeforeUnmount(dispose);

  return {
    pose,
    poseKey,
    pressStart,
    dragMove,
    release,
    resizeStart,
    resizeEnd,
    hover,
    land,
    noteUserActivity,
    dispose,
    /** 测试用：立刻按当前时间推进一次 */
    tick,
  };
};

export type PetBehavior = ReturnType<typeof usePetBehavior>;
