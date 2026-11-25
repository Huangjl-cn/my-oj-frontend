/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodeEditProposal } from './CodeEditProposal';
import type { ContextUsageVO } from './ContextUsageVO';

export type CompanionHintVO = {
    messageId?: number;
    /**
     * 这条提示按哪一档给的
     */
    hintLevel?: number;
    /**
     * 这一档的名字，如「点关键」
     */
    stepTitle?: string;
    message?: string;
    codeEdits?: CodeEditProposal;
    contextUsage?: ContextUsageVO;
};
