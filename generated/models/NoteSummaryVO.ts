/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type NoteSummaryVO = {
    id?: number;
    title?: string;
    /**
     * 正文开头的纯文字摘要（去掉了 Markdown 符号）
     */
    snippet?: string;
    questionId?: number;
    questionTitle?: string;
    questionTags?: Array<string>;
    updateTime?: string;
};
