/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { DifficultyCountVO } from './DifficultyCountVO';

export type QuestionProgressVO = {
    total?: DifficultyCountVO;
    solved?: DifficultyCountVO;
    /**
     * 做过的题目的状态，key 为题目 id；passed 已通过 / failed 没通过 / judging 判题中，没做过的不在其中
     */
    statuses?: Record<string, string>;
};
