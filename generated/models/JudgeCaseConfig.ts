/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JudgeCase } from './JudgeCase';
import type { JudgeParameterDefinition } from './JudgeParameterDefinition';
import type { JudgeValueDefinition } from './JudgeValueDefinition';

export type JudgeCaseConfig = {
    inputDefinitions?: Array<JudgeParameterDefinition>;
    outputDefinition?: JudgeValueDefinition;
    cases?: Array<JudgeCase>;
};
