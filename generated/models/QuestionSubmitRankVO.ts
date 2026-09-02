/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionSubmitRankVO = {
    /**
     * 提交 id
     */
    submissionId?: number;
    /**
     * 题目 id，对比人群限定在该题目内
     */
    questionId?: number;
    /**
     * 编程语言
     */
    language?: string;
    /**
     * 判题耗时（ms），无有效指标时为 null
     */
    time?: number;
    /**
     * 判题内存（KB），无有效指标时为 null
     */
    memory?: number;
    /**
     * 同语言、判题成功且有有效耗时的其他提交总数（不含本人）
     */
    timeTotal?: number;
    /**
     * 其中耗时比本次提交更大（更差）的数量
     */
    timeBeaten?: number;
    /**
     * 同语言、判题成功且有有效内存的其他提交总数（不含本人）
     */
    memoryTotal?: number;
    /**
     * 其中内存比本次提交更大（更差）的数量
     */
    memoryBeaten?: number;
};
