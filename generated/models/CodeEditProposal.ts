/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodeEdit } from './CodeEdit';

/**
 * 这条消息附带的代码修改建议，没有为 null
 */
export type CodeEditProposal = {
    baseHash?: string;
    edits?: Array<CodeEdit>;
    resultCode?: string;
};
