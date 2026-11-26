import { reactive, readonly } from "vue";

export interface FlightRect {
  x: number;
  y: number;
  size: number;
}

/**
 * 打开、收起陪练面板时，鸭鸭从编辑器上飞进面板标题（或飞回来）。
 * 飞的过程中起点和终点的鸭鸭都藏起来，只显示飞着的那只，落地后终点那只再出现。
 */
const state = reactive({
  active: false,
  /** 每次起飞加一，同一时间只认最新的一次 */
  id: 0,
  from: null as FlightRect | null,
  to: null as FlightRect | null,
});

let onLand: (() => void) | undefined;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** 从 from 飞到 to，落地时调用 land；系统设置了减少动画就直接落地 */
const fly = (from: FlightRect, to: FlightRect, land?: () => void) => {
  if (prefersReducedMotion()) {
    land?.();
    return;
  }
  state.from = from;
  state.to = to;
  state.active = true;
  state.id += 1;
  onLand = land;
};

/** 飞完了（由负责画飞行动画的组件调用） */
const finish = (id: number) => {
  if (id !== state.id) return;
  state.active = false;
  const land = onLand;
  onLand = undefined;
  land?.();
};

export const useDuckFlight = () => ({ flight: readonly(state), fly, finish });

/** 把元素的位置换成飞行用的方块（取宽高里大的那个当边长） */
export const toFlightRect = (
  rect: { left: number; top: number; width: number; height: number } | null
): FlightRect | null =>
  rect && rect.width > 0
    ? {
        x: rect.left,
        y: rect.top,
        size: Math.max(rect.width, rect.height),
      }
    : null;
