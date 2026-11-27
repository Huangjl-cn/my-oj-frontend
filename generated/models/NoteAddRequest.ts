/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type NoteAddRequest = {
    /**
     * 标题，可不填：挂在题上时默认「题目名 笔记」，否则「未命名笔记」
     */
    title?: string;
    /**
     * 正文（Markdown），可不填
     */
    content?: string;
    /**
     * 关联的题目 id，自由笔记不填
     */
    questionId?: number;
};
