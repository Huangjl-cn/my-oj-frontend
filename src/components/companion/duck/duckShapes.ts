import { DuckEyes, DuckMouth } from "@/components/companion/duck/duckPoses";

/**
 * 鸭鸭眼睛和嘴的形状。全部输出成 path，模板里一个 v-for 画出来。
 * cls：o 白底黑边、t 细线、f 实心、w 白色（眼睛高光）。
 */
export interface DuckShape {
  d: string;
  cls: "o" | "t" | "f" | "w" | "fs";
  /** 跟着鼠标移动（眼珠） */
  track?: boolean;
  /** 眨眼时压扁 */
  blink?: boolean;
}

const n = (value: number) => Math.round(value * 100) / 100;

/** 椭圆写成 path */
export const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)} ${n(cy)} a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0 a${n(
    rx
  )} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0 Z`;

/** 两只眼睛的中心 */
export const DUCK_EYES: [[number, number], [number, number]] = [
  [50, 48],
  [70, 48],
];

const RX = 2.9;
const RY = 3.7;

const eye = (x: number, y: number, kind: DuckEyes, side: "l" | "r") => {
  const shapes: DuckShape[] = [];
  switch (kind) {
    case "dot":
      shapes.push({
        d: ellipsePath(x, y, RX, RY),
        cls: "f",
        track: true,
        blink: true,
      });
      break;
    case "wide":
      shapes.push(
        {
          d: ellipsePath(x, y, RX * 1.3, RY * 1.3),
          cls: "f",
          track: true,
          blink: true,
        },
        { d: ellipsePath(x + 1.3, y - 1.6, 1.3, 1.3), cls: "w", track: true }
      );
      break;
    case "happy":
      shapes.push({
        d: `M${n(x - 4.2)} ${n(y + 1.4)} Q${x} ${n(y - 4.6)} ${n(x + 4.2)} ${n(
          y + 1.4
        )}`,
        cls: "t",
      });
      break;
    case "closed":
      shapes.push({
        d: `M${n(x - 4.2)} ${n(y - 0.6)} Q${x} ${n(y + 3.6)} ${n(x + 4.2)} ${n(
          y - 0.6
        )}`,
        cls: "t",
      });
      break;
    case "half":
      shapes.push(
        {
          d: `M${n(x - 4.4)} ${n(y - 0.4)} L${n(x + 4.4)} ${n(y - 0.4)}`,
          cls: "t",
        },
        { d: ellipsePath(x, y + 1.4, RX * 0.85, 1.7), cls: "f" }
      );
      break;
    case "x":
      shapes.push({
        d: `M${n(x - 3.4)} ${n(y - 3.4)} L${n(x + 3.4)} ${n(y + 3.4)} M${n(
          x + 3.4
        )} ${n(y - 3.4)} L${n(x - 3.4)} ${n(y + 3.4)}`,
        cls: "t",
      });
      break;
    case "sad": {
      // 眉毛内侧高、外侧低
      const k = side === "l" ? 1 : -1;
      shapes.push(
        {
          d: ellipsePath(x, y + 0.6, RX * 0.92, RY * 0.92),
          cls: "f",
          track: true,
          blink: true,
        },
        {
          d: `M${n(x - 4.6 * k)} ${n(y - 6.2)} L${n(x + 3.6 * k)} ${n(
            y - 8.8
          )}`,
          cls: "t",
        }
      );
      break;
    }
    default:
      break;
  }
  return shapes;
};

export const duckEyeShapes = (kind: DuckEyes): DuckShape[] => {
  const [[lx, ly], [rx, ry]] = DUCK_EYES;
  if (kind === "wink") {
    return [...eye(lx, ly, "happy", "l"), ...eye(rx, ry, "dot", "r")];
  }
  if (kind === "confused") {
    // 一只眼大一只眼小，小的那只上面挑一根眉毛
    return [
      ...eye(lx, ly, "dot", "l"),
      {
        d: ellipsePath(rx, ry + 0.6, 1.9, 2.3),
        cls: "f",
        track: true,
        blink: true,
      },
      {
        d: `M${rx - 4} ${ry - 8} Q${rx} ${n(ry - 10.5)} ${rx + 4} ${n(
          ry - 7.4
        )}`,
        cls: "t",
      },
    ];
  }
  return [...eye(lx, ly, kind, "l"), ...eye(rx, ry, kind, "r")];
};

const BILL =
  "M48.5 60.5 Q60 53.5 71.5 60.5 Q72 68.8 60 69.6 Q48 68.8 48.5 60.5 Z";

const BEAKS: Record<Exclude<DuckMouth, "talk">, DuckShape[]> = {
  calm: [
    { d: BILL, cls: "o" },
    { d: "M50.6 63.2 Q60 65.6 69.4 63.2", cls: "t" },
  ],
  open: [
    { d: "M44 60 Q60 51 76 60 Q60 64 44 60 Z", cls: "o" },
    { d: "M49 64 Q60 66 71 64 Q60 76 49 64 Z", cls: "fs" },
    { d: "M48 65 Q60 77 72 65 Q60 68 48 65 Z", cls: "o" },
  ],
  o: [
    { d: "M46 61 Q60 53 74 61 Q60 63.5 46 61 Z", cls: "o" },
    { d: "M49 64.5 Q60 72 71 64.5 Q60 66.5 49 64.5 Z", cls: "o" },
  ],
  wavy: [
    { d: BILL, cls: "o" },
    { d: "M50.6 64 Q55.3 61.6 60 64 Q64.7 66.4 69.4 63.4", cls: "t" },
  ],
};

/** 嘴（鸭嘴）的形状；talk 是 calm 和 open 交替，交给模板处理 */
export const duckBeakShapes = (kind: Exclude<DuckMouth, "talk">) =>
  BEAKS[kind] ?? BEAKS.calm;
