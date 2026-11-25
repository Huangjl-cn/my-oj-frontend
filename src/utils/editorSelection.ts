/**
 * 编辑器里选中的一段代码，以及它在编辑器里的位置（用来摆放跟着选区的小浮层）。
 */
export interface EditorSelection {
  /** 行号从 1 开始，含结束行 */
  startLine: number;
  endLine: number;
  text: string;
  /** 选区最后一行的上下边和选区末尾的横坐标，相对编辑器左上角，单位 px */
  anchor: { top: number; bottom: number; left: number };
  /** 编辑器可见区域的大小 */
  view: { width: number; height: number };
}

/**
 * 选区的行范围。整行选中时选区会停在下一行的第 1 列，那一行不算进去。
 */
export const selectedLineRange = (
  startLine: number,
  endLine: number,
  endColumn: number
) => ({
  startLine,
  endLine: endColumn === 1 && endLine > startLine ? endLine - 1 : endLine,
});
