/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 各语言的提交情况，按提交次数从多到少
 */
export type LanguageStatVO = {
    /**
     * 语言标识，如 java
     */
    language?: string;
    /**
     * 语言的显示名，如 Java 25；已不再支持的语言就是标识本身
     */
    languageName?: string;
    /**
     * 提交次数
     */
    submitCount?: number;
    /**
     * 通过的提交次数
     */
    acceptedCount?: number;
    /**
     * 用这种语言通过过的题目数
     */
    solvedCount?: number;
};
