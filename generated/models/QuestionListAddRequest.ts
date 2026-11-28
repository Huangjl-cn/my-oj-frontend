/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionListAddRequest = {
    /**
     * 标题，1～40 个字
     */
    title?: string;
    /**
     * 简介，最多 200 个字，可不填
     */
    description?: string;
    /**
     * 建成官方题单（所有人可见），只有管理员能用
     */
    official?: boolean;
};
