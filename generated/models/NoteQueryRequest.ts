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
    /**
     * true 只看挂在题上的，false 只看自由笔记，不填都看
     */
    linked?: boolean;
    /**
     * 只看挂在带这个标签的题上的笔记
     */
    tag?: string;
};
