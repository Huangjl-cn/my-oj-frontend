import { reactive, readonly } from "vue";

/**
 * 栗子在屏幕上的位置和大小：用户拖过、缩放过之后记在 localStorage，换题、刷新都保留。
 * 位置是栗子左上角在视口里的坐标；没有位置时由组件放在默认锚点上（编辑器右上角）。
 */

export interface PetPosition {
  x: number;
  y: number;
}

export interface PetPlacement {
  position: PetPosition | null;
  size: number;
}

export const PET_SIZE = { min: 40, max: 120, default: 56 } as const;

/** 离视口边缘至少留这么多 */
export const PET_MARGIN = 8;

const STORAGE_KEY = "myoj:companion-pet";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export const clampPetSize = (size: number) =>
  Math.round(clamp(size, PET_SIZE.min, PET_SIZE.max));

/** 保证整个栗子（边长 box）都在视口内 */
export const clampPetPosition = (
  position: PetPosition,
  box: number,
  viewport: { width: number; height: number }
): PetPosition => ({
  x: Math.round(
    clamp(position.x, PET_MARGIN, viewport.width - box - PET_MARGIN)
  ),
  y: Math.round(
    clamp(position.y, PET_MARGIN, viewport.height - box - PET_MARGIN)
  ),
});

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** 解析存储的内容，格式不对时当作没有存过 */
export const parsePetPlacement = (raw: string | null): PetPlacement => {
  const fallback: PetPlacement = { position: null, size: PET_SIZE.default };
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const size = isFiniteNumber(value.size)
      ? clampPetSize(value.size)
      : PET_SIZE.default;
    const position =
      isFiniteNumber(value.x) && isFiniteNumber(value.y)
        ? { x: value.x, y: value.y }
        : null;
    return { position, size };
  } catch {
    return fallback;
  }
};

const readStored = () => {
  try {
    return parsePetPlacement(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return parsePetPlacement(null);
  }
};

const state = reactive<PetPlacement>({
  position: null,
  size: PET_SIZE.default,
});
let loaded = false;

const persist = () => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state.position, size: state.size })
    );
  } catch {
    // 存不了也不影响使用，只是刷新后回到默认
  }
};

export const usePetPlacement = () => {
  if (!loaded) {
    Object.assign(state, readStored());
    loaded = true;
  }

  return {
    placement: readonly(state),
    moveTo(position: PetPosition) {
      state.position = { ...position };
    },
    resizeTo(size: number) {
      state.size = clampPetSize(size);
    },
    resetSize() {
      state.size = PET_SIZE.default;
      persist();
    },
    save: persist,
  };
};
