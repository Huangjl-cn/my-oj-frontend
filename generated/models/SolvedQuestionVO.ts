/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 最近第一次通过的题，最近的在前，最多 10 道
 */
export type SolvedQuestionVO = {
    questionId?: number;
    title?: string;
    /**
     * 题目标签（含难度标签）
     */
    tags?: Array<string>;
    /**
     * 第一次通过的时间
     */
    solvedTime?: string;
    /**
     * 第一次通过用的语言的显示名
     */
    languageName?: string;
    /**
     * 第几次提交才通过（含通过的那次），1 就是一次通过
     */
    attempts?: number;
};
