/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 用户提问时引用的代码，没有为 null
 */
export type CodeQuote = {
    /**
     * 起始行，从 1 开始
     */
    startLine?: number;
    /**
     * 结束行（含）
     */
    endLine?: number;
    /**
     * 选中的代码原文
     */
    code?: string;
};
