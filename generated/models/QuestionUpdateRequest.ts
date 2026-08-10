/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JudgeCaseConfig } from './JudgeCaseConfig';
import type { JudgeConfig } from './JudgeConfig';
import type { QuestionStarterCodeSaveRequest } from './QuestionStarterCodeSaveRequest';

export type QuestionUpdateRequest = {
    id?: number;
    title?: string;
    content?: string;
    tags?: Array<string>;
    answer?: string;
    judgeCase?: JudgeCaseConfig;
    judgeConfig?: JudgeConfig;
    starterCodeList?: Array<QuestionStarterCodeSaveRequest>;
};
