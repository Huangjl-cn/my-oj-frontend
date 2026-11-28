/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 一道通过了的题：第一次通过的时间、语言、第几次提交
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
