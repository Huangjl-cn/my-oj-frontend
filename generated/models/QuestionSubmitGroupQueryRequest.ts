/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionSubmitGroupQueryRequest = {
    current?: number;
    /**
     * 页面大小，范围 1-20
     */
    pageSize?: number;
    /**
     * 判题结果筛选，可选 all/accepted/failed/pending，不传或 all 不过滤
     */
    judgeResult?: string;
    /**
     * 编程语言筛选，不传不过滤；筛选后仅按该语言的提交聚合
     */
    language?: string;
    /**
     * 提交用户 id 筛选，不传不过滤
     */
    userId?: number;
    /**
     * 提交者昵称模糊搜索，不传不过滤；筛选后仅按该用户的提交聚合
     */
    userName?: string;
    /**
     * 排序字段，可选 latestSubmitTime（最近提交时间，默认）/bestTime（最短判题耗时 ms）/bestMemory（最小判题内存 KB）
     */
    sortField?: string;
    /**
     * 排序顺序，可选 ascend/descend，缺省 descend
     */
    sortOrder?: string;
};
