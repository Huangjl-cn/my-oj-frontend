/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 有提交的日子，按日期从早到晚；没提交的日子不在其中
 */
export type SubmitDayVO = {
    /**
     * 日期，yyyy-MM-dd
     */
    date?: string;
    /**
     * 这一天的提交次数
     */
    submitCount?: number;
    /**
     * 其中通过的次数
     */
    acceptedCount?: number;
};
