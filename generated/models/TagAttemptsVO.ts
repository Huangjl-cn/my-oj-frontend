/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 一个标签下通过的题平均第几次才过
 */
export type TagAttemptsVO = {
    tag?: string;
    /**
     * 这个标签下已通过的题目数
     */
    solved?: number;
    /**
     * 平均第几次提交才通过，保留一位小数
     */
    averageAttempts?: number;
};
