/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 题单里的题，按题单里的顺序；已删除的题不在其中
 */
export type QuestionListItemVO = {
    questionId?: number;
    title?: string;
    /**
     * 题目标签（含难度标签）
     */
    tags?: Array<string>;
    submitNum?: number;
    acceptedNum?: number;
    /**
     * 加入题单的时间
     */
    addTime?: string;
};
