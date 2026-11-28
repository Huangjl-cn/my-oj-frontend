/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type NoteVO = {
    id?: number;
    title?: string;
    content?: string;
    /**
     * 关联的题目 id，自由笔记为空
     */
    questionId?: number;
    /**
     * 关联题目的标题；题目已删除时为空
     */
    questionTitle?: string;
    /**
     * 关联题目的标签（含难度标签）
     */
    questionTags?: Array<string>;
    /**
     * 版本号，保存时原样带回
     */
    version?: number;
    createTime?: string;
    updateTime?: string;
};
