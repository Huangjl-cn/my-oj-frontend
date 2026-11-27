/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 一种判题结果的提交次数
 */
export type VerdictCountVO = {
    /**
     * accepted / wrong_answer / time_limit / memory_limit / runtime_error / compile_error / other
     */
    verdict?: string;
    /**
     * 结果的中文名
     */
    text?: string;
    count?: number;
};
