/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 各标签的做题情况，难度标签不算；按题目数从多到少
 */
export type TagProgressVO = {
    tag?: string;
    /**
     * 题库里带这个标签的题目数
     */
    total?: number;
    /**
     * 其中已通过的题目数
     */
    solved?: number;
    /**
     * 其中做过但还没通过的题目数（含判题中）
     */
    attempted?: number;
};
