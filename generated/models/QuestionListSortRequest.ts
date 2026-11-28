/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionListSortRequest = {
    listId?: number;
    /**
     * 题单里全部题目的 id，按新的顺序；必须和题单里现有的题一一对应
     */
    questionIds?: Array<number>;
};
