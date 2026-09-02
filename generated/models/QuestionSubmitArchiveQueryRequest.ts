/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionSubmitArchiveQueryRequest = {
    current?: number;
    pageSize?: number;
    questionId?: number;
    userId?: number;
    /**
     * 提交者昵称模糊搜索，不传不过滤
     */
    userName?: string;
    language?: string;
    status?: number;
    /**
     * 判题结果筛选，可选 all/accepted/failed/pending，不传或 all 不过滤
     */
    judgeResult?: string;
    /**
     * 排序字段，可选 createTime（提交时间，默认）/judgeTime（判题耗时 ms）/judgeMemory（判题内存 KB）
     */
    sortField?: string;
    /**
     * 排序顺序，可选 ascend/descend，缺省 descend
     */
    sortOrder?: string;
};
