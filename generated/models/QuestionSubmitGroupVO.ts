/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionSubmitGroupVO = {
    /**
     * 题目 id
     */
    questionId?: number;
    /**
     * 题目标题
     */
    questionTitle?: string;
    /**
     * 题目标签列表
     */
    questionTags?: Array<string>;
    /**
     * 筛选范围内最近一次提交的判题结果，可选 accepted/failed/pending
     */
    latestResult?: string;
    /**
     * 筛选范围内最近一次提交 id
     */
    latestSubmissionId?: number;
    /**
     * 筛选范围内最近一次提交的编程语言
     */
    latestLanguage?: string;
    /**
     * 筛选范围内最近一次提交的代码
     */
    latestCode?: string;
    /**
     * 筛选范围内最近一次提交时间
     */
    latestSubmitTime?: string;
    /**
     * 筛选范围内最短判题耗时（ms），无有效指标时为 null
     */
    bestTime?: number;
    /**
     * 筛选范围内最小判题内存（KB），无有效指标时为 null
     */
    bestMemory?: number;
};
