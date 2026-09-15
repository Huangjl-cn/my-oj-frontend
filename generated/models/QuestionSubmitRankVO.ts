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
     * 同题同语言、通过（Accepted）且有有效耗时的提交总数（含本人若已通过）
     */
    timeTotal?: number;
    /**
     * 其中耗时大于等于本次提交的数量（持平计入超过），首次通过提交时为 1/1 即超过 100%
     */
    timeBeaten?: number;
    /**
     * 同题同语言、通过（Accepted）且有有效内存的提交总数（含本人若已通过）
     */
    memoryTotal?: number;
    /**
     * 其中内存大于等于本次提交的数量（持平计入超过），首次通过提交时为 1/1 即超过 100%
     */
    memoryBeaten?: number;
};
