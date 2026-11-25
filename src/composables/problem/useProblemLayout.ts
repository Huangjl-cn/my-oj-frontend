import { computed, onBeforeUnmount, onMounted, reactive, ref, Ref } from "vue";

/** 做题页三块面板的宽度：题面和陪练可以拖，编辑器占剩下的 */
export type ProblemLayout = {
  /** 题面占整行宽度的比例（窗口变宽变窄时跟着变） */
  statement: number;
  /** 陪练面板的宽度，像素 */
  companion: number;
};

export const PANE_LIMITS = {
  /** 面板之间拖动条的宽度，也就是面板间距 */
  handle: 12,
  statementMin: 300,
  editorMin: 380,
  companionMin: 300,
  companionMax: 600,
} as const;

export const DEFAULT_LAYOUT: ProblemLayout = {
  statement: 0.42,
  companion: 360,
};

const STORAGE_KEY = "myoj:problem-layout";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** 按可用宽度算出题面和陪练的实际像素宽度，保证编辑器至少有 editorMin */
export const computeColumns = (
  width: number,
  layout: ProblemLayout,
  companionOpen: boolean
) => {
  const { handle, statementMin, editorMin, companionMin, companionMax } =
    PANE_LIMITS;
  const companion = companionOpen
    ? clamp(
        layout.companion,
        companionMin,
        Math.min(companionMax, width - statementMin - editorMin - 2 * handle)
      )
    : 0;
  const statementAndEditor =
    width - handle - (companionOpen ? companion + handle : 0);
  const statement = clamp(
    layout.statement * width,
    statementMin,
    statementAndEditor - editorMin
  );
  return { statement: Math.round(statement), companion: Math.round(companion) };
};

const readLayout = (): ProblemLayout => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      saved &&
      Number.isFinite(saved.statement) &&
      saved.statement > 0 &&
      saved.statement < 1 &&
      Number.isFinite(saved.companion)
    ) {
      return { statement: saved.statement, companion: saved.companion };
    }
  } catch {
    // 存的东西坏了就用默认宽度
  }
  return { ...DEFAULT_LAYOUT };
};

export const useProblemLayout = (
  container: Ref<HTMLElement | null>,
  companionOpen: Ref<boolean>
) => {
  const width = ref(0);
  const layout = reactive(readLayout());
  const columns = computed(() =>
    computeColumns(width.value, layout, companionOpen.value)
  );

  /** 量到宽度之前不写行内样式，先用 CSS 里的默认比例 */
  const gridStyle = computed(() => {
    if (!width.value) return undefined;
    const { handle } = PANE_LIMITS;
    const { statement, companion } = columns.value;
    return {
      gridTemplateColumns: companionOpen.value
        ? `${statement}px ${handle}px minmax(0, 1fr) ${handle}px ${companion}px`
        : `${statement}px ${handle}px minmax(0, 1fr)`,
    };
  });

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // 记不住也没关系，这次照样能拖
    }
  };

  let base = 0;

  const setStatement = (pixels: number) => {
    if (!width.value) return;
    const next = computeColumns(
      width.value,
      { ...layout, statement: pixels / width.value },
      companionOpen.value
    );
    layout.statement = next.statement / width.value;
  };

  const setCompanion = (pixels: number) => {
    layout.companion = computeColumns(
      width.value,
      { ...layout, companion: pixels },
      true
    ).companion;
  };

  const statementHandle = {
    start: () => (base = columns.value.statement),
    move: (dx: number) => setStatement(base + dx),
    nudge: (dx: number) => {
      setStatement(columns.value.statement + dx);
      save();
    },
    reset: () => {
      layout.statement = DEFAULT_LAYOUT.statement;
      save();
    },
    end: save,
  };

  // 陪练在右边：往左拖是变宽
  const companionHandle = {
    start: () => (base = columns.value.companion),
    move: (dx: number) => setCompanion(base - dx),
    nudge: (dx: number) => {
      setCompanion(columns.value.companion - dx);
      save();
    },
    reset: () => {
      layout.companion = DEFAULT_LAYOUT.companion;
      save();
    },
    end: save,
  };

  let observer: ResizeObserver | undefined;
  onMounted(() => {
    if (!container.value || typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver(([entry]) => {
      width.value = entry.contentRect.width;
    });
    observer.observe(container.value);
  });
  onBeforeUnmount(() => observer?.disconnect());

  return { gridStyle, columns, statementHandle, companionHandle };
};
