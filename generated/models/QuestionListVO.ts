/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionListVO = {
    id?: number;
    title?: string;
    description?: string;
    /**
     * favorite 我的收藏 / custom 自建 / official 官方
     */
    type?: string;
    /**
     * 题目数（已删除的题不算）
     */
    questionCount?: number;
    /**
     * 其中当前用户已通过的题目数
     */
    solvedCount?: number;
    /**
     * 当前用户能不能改这个题单（加题、删题、排序）
     */
    editable?: boolean;
    updateTime?: string;
};
