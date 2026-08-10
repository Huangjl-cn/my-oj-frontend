/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JudgeCaseConfig } from './JudgeCaseConfig';
import type { JudgeConfig } from './JudgeConfig';

export type QuestionManageVO = {
    id?: number;
    userId?: number;
    title?: string;
    content?: string;
    tags?: Array<string>;
    answer?: string;
    submitNum?: number;
    acceptedNum?: number;
    judgeConfig?: JudgeConfig;
    judgeCase?: JudgeCaseConfig;
    createTime?: string;
    updateTime?: string;
};
