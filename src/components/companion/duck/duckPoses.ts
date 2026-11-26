import { COMPANION_MOOD_LABELS, PetMood } from "@/constants/companionMoods";

/**
 * 鸭鸭的所有姿势。画法是部件拼起来的（头、呆毛、眼睛、嘴、两只翅膀、脚），
 * 一个姿势就是各部件选哪种样子、翅膀转多少度、整体做什么动作、头上冒什么特效。
 * 坐标系：鸭鸭画在 120×130 的格子里，头顶呆毛在 y≈16，脚底在 y≈126。
 */

export type DuckEyes =
  | "dot"
  | "wide"
  | "happy"
  | "closed"
  | "half"
  | "x"
  | "sad"
  | "wink"
  | "confused";
export type DuckMouth = "calm" | "open" | "o" | "wavy" | "talk";
export type DuckArms =
  | "rest"
  | "up"
  | "out"
  | "startle"
  | "limp"
  | "flap"
  | "wave"
  | "fist"
  | "hips"
  | "chin"
  | "scratch"
  | "type"
  | "hold"
  | "cover";
export type DuckMove =
  | "breathe"
  | "none"
  | "hop"
  | "jump"
  | "squash"
  | "tremble"
  | "sway"
  | "wobble"
  | "stretch"
  | "bounce"
  | "puff"
  | "sleep";
export type DuckFx =
  | "sparkle"
  | "confetti"
  | "zzz"
  | "question"
  | "exclaim"
  | "thought"
  | "dots"
  | "sweat"
  | "dizzy"
  | "blush"
  | "dust";
export type DuckTuft = "up" | "perk" | "back" | "droop" | "tilt";
export type DuckHead = "tilt" | "tilt-r" | "nod" | "nod-slow";

export interface DuckPoseSpec {
  label: string;
  eyes: DuckEyes;
  mouth: DuckMouth;
  arms: DuckArms;
  move?: DuckMove;
  /** 被拎起来时脚悬空晃 */
  dangle?: boolean;
  tuft?: DuckTuft;
  head?: DuckHead;
  /** 手里拿的东西 */
  hold?: "heart" | "keyboard";
  fx?: DuckFx[];
  /** 固定看的方向（-1 到 1），around 是左右张望；不写时看正前方 */
  look?: [number, number] | "around";
  /** 眼睛跟着鼠标 */
  track?: boolean;
}

/** 桌宠自己的状态（拖拽、待机、睡觉等），心情之外的那部分 */
export type DuckAction =
  | "grab"
  | "drag"
  | "fly"
  | "dizzydrag"
  | "land"
  | "dizzy"
  | "wave"
  | "watch"
  | "talking"
  | "judging"
  | "resize"
  | "lookaround"
  | "stretch"
  | "preen"
  | "yawn"
  | "doze"
  | "sleep"
  | "startled";

export type DuckPose = PetMood | DuckAction;

const MOOD_POSES: Record<PetMood, Omit<DuckPoseSpec, "label">> = {
  idle: { eyes: "dot", mouth: "calm", arms: "rest", track: true },
  thinking: {
    eyes: "dot",
    mouth: "calm",
    arms: "chin",
    head: "tilt",
    look: [0.9, -1],
    fx: ["thought"],
  },
  excited: {
    eyes: "happy",
    mouth: "open",
    arms: "up",
    move: "jump",
    tuft: "perk",
    fx: ["confetti", "sparkle"],
  },
  proud: {
    eyes: "happy",
    mouth: "calm",
    arms: "hips",
    move: "puff",
    fx: ["sparkle", "blush"],
  },
  surprised: {
    eyes: "wide",
    mouth: "o",
    arms: "startle",
    move: "hop",
    tuft: "perk",
    fx: ["exclaim"],
  },
  thoughtful: {
    eyes: "dot",
    mouth: "calm",
    arms: "chin",
    head: "tilt",
    look: [-0.85, -0.9],
    fx: ["dots"],
  },
  sympathetic: {
    eyes: "sad",
    mouth: "calm",
    arms: "hold",
    hold: "heart",
    tuft: "droop",
    move: "sway",
  },
  encouraging: {
    eyes: "happy",
    mouth: "open",
    arms: "fist",
    tuft: "perk",
    fx: ["sparkle"],
  },
  playful: {
    eyes: "wink",
    mouth: "open",
    arms: "wave",
    tuft: "tilt",
    move: "bounce",
    fx: ["blush"],
  },
  nervous: {
    eyes: "dot",
    mouth: "wavy",
    arms: "cover",
    look: [0.6, 1],
    move: "tremble",
    fx: ["sweat"],
  },
  confused: {
    eyes: "confused",
    mouth: "wavy",
    arms: "scratch",
    head: "tilt",
    tuft: "tilt",
    fx: ["question"],
  },
};

const ACTION_POSES: Record<DuckAction, DuckPoseSpec> = {
  grab: {
    label: "被拎起来",
    eyes: "wide",
    mouth: "o",
    arms: "flap",
    move: "none",
    dangle: true,
    tuft: "perk",
    fx: ["exclaim"],
  },
  drag: {
    label: "被拖着走",
    eyes: "wide",
    mouth: "o",
    arms: "flap",
    move: "none",
    dangle: true,
    tuft: "back",
  },
  fly: {
    label: "飞起来了",
    eyes: "happy",
    mouth: "open",
    arms: "flap",
    move: "none",
    dangle: true,
    tuft: "back",
    fx: ["sparkle"],
  },
  dizzydrag: {
    label: "被甩晕了",
    eyes: "x",
    mouth: "wavy",
    arms: "limp",
    move: "none",
    dangle: true,
    tuft: "droop",
    fx: ["dizzy"],
  },
  land: {
    label: "落地",
    eyes: "happy",
    mouth: "calm",
    arms: "out",
    move: "squash",
    fx: ["dust"],
  },
  dizzy: {
    label: "晕乎乎",
    eyes: "x",
    mouth: "wavy",
    arms: "limp",
    tuft: "droop",
    move: "wobble",
    fx: ["dizzy"],
  },
  wave: {
    label: "打招呼",
    eyes: "happy",
    mouth: "calm",
    arms: "wave",
    tuft: "perk",
  },
  watch: {
    label: "看你写代码",
    eyes: "dot",
    mouth: "calm",
    arms: "rest",
    head: "nod",
    look: [-0.9, 0.7],
  },
  talking: {
    label: "回答中",
    eyes: "happy",
    mouth: "talk",
    arms: "type",
    hold: "keyboard",
  },
  judging: {
    label: "等判题结果",
    eyes: "dot",
    mouth: "wavy",
    arms: "cover",
    look: [0, 1],
    move: "tremble",
    fx: ["sweat"],
  },
  resize: {
    label: "被拉大缩小",
    eyes: "closed",
    mouth: "o",
    arms: "up",
    move: "none",
    tuft: "perk",
  },
  lookaround: {
    label: "东张西望",
    eyes: "dot",
    mouth: "calm",
    arms: "rest",
    look: "around",
  },
  stretch: {
    label: "伸懒腰",
    eyes: "closed",
    mouth: "o",
    arms: "up",
    move: "stretch",
  },
  preen: {
    label: "理羽毛",
    eyes: "closed",
    mouth: "calm",
    arms: "scratch",
    head: "tilt-r",
  },
  yawn: {
    label: "打哈欠",
    eyes: "closed",
    mouth: "o",
    arms: "up",
    move: "stretch",
  },
  doze: {
    label: "打瞌睡",
    eyes: "half",
    mouth: "calm",
    arms: "rest",
    tuft: "droop",
    head: "nod-slow",
  },
  sleep: {
    label: "睡着了",
    eyes: "closed",
    mouth: "calm",
    arms: "rest",
    tuft: "droop",
    move: "sleep",
    fx: ["zzz"],
  },
  startled: {
    label: "吓醒了",
    eyes: "wide",
    mouth: "o",
    arms: "startle",
    tuft: "perk",
    move: "hop",
    fx: ["exclaim"],
  },
};

const moodLabel = (mood: PetMood) => {
  if (mood === "idle") return "待机";
  if (mood === "thinking") return "思考中";
  return COMPANION_MOOD_LABELS[mood];
};

export const DUCK_POSES: Record<DuckPose, DuckPoseSpec> = {
  ...(Object.fromEntries(
    Object.entries(MOOD_POSES).map(([mood, spec]) => [
      mood,
      { label: moodLabel(mood as PetMood), ...spec },
    ])
  ) as Record<PetMood, DuckPoseSpec>),
  ...ACTION_POSES,
};

export const getDuckPose = (pose: DuckPose | undefined): DuckPoseSpec =>
  (pose && DUCK_POSES[pose]) || DUCK_POSES.idle;

// region 翅膀角度

/** 两边肩膀（翅膀根）的位置和翅膀长度 */
export const DUCK_SHOULDERS: [[number, number], [number, number]] = [
  [36, 84],
  [84, 84],
];
export const DUCK_WING = { length: 27, width: 7.4 } as const;

/** 翅膀要指向的几个位置 */
const ANCHORS = {
  chin: [62, 68],
  mouth: [60, 64],
  kb: [60, 106],
  hold: [60, 100],
  head: [80, 40],
} as const;

/**
 * 翅膀从下垂（0°）转到指向 (tx, ty) 要转的角度；SVG 里顺时针为正，
 * 所以左边翅膀往外抬是正角度、右边是负角度。
 */
export const angleTo = (sx: number, sy: number, tx: number, ty: number) =>
  (Math.atan2(-(tx - sx), ty - sy) * 180) / Math.PI;

const round = (value: number) => Math.round(value * 10) / 10;

/** 左、右翅膀的角度（度） */
export const duckWingAngles = (arms: DuckArms): [number, number] => {
  const [[lx, ly], [rx, ry]] = DUCK_SHOULDERS;
  const toward = (point: readonly [number, number]): [number, number] => [
    round(angleTo(lx, ly, point[0] - 4, point[1])),
    round(angleTo(rx, ry, point[0] + 4, point[1])),
  ];
  const rightTo = (point: readonly [number, number]) =>
    round(angleTo(rx, ry, point[0], point[1]));
  switch (arms) {
    case "up":
      return [150, -150];
    case "out":
      return [96, -96];
    case "startle":
      return [122, -122];
    case "limp":
      return [4, -4];
    case "flap":
      return [70, -70];
    case "wave":
      return [14, -146];
    case "fist":
      return [14, -158];
    case "hips":
      return [36, -36];
    case "chin":
      return [14, rightTo([ANCHORS.chin[0] + 4, ANCHORS.chin[1]])];
    case "scratch":
      return [14, rightTo(ANCHORS.head)];
    case "type":
      return toward(ANCHORS.kb);
    case "hold":
      return toward(ANCHORS.hold);
    case "cover":
      return toward(ANCHORS.mouth);
    default:
      return [14, -14];
  }
};

// endregion
