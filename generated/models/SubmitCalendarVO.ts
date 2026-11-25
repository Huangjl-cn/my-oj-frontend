/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { SubmitDayVO } from './SubmitDayVO';

export type SubmitCalendarVO = {
    /**
     * 有提交的日子，按日期从早到晚；没提交的日子不在其中
     */
    days?: Array<SubmitDayVO>;
    /**
     * 统计了多少天（含今天）
     */
    rangeDays?: number;
    /**
     * 全部提交次数
     */
    totalSubmits?: number;
    /**
     * 全部通过的提交次数
     */
    acceptedSubmits?: number;
};
