/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CodeSnapshot = {
    /**
     * 编辑器里的完整代码，原样传递（修改建议的 baseHash 按它计算）
     */
    code?: string;
    /**
     * 编程语言
     */
    language?: string;
    /**
     * 光标所在行，从 1 开始，可为空
     */
    cursorLine?: number;
    /**
     * 选中区域起始行，从 1 开始，没有选中时为空
     */
    selectionStartLine?: number;
    /**
     * 选中区域结束行（含），没有选中时为空
     */
    selectionEndLine?: number;
};
