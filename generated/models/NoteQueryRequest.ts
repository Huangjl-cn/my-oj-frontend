/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type NoteQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    /**
     * 关键词，在标题和正文里找
     */
    keyword?: string;
    /**
     * 只看挂在这道题上的笔记
     */
    questionId?: number;
};
