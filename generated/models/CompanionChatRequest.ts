/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodeQuote } from './CodeQuote';
import type { CodeSnapshot } from './CodeSnapshot';

export type CompanionChatRequest = {
    /**
     * 对话 id（会话接口返回的 conversationId）
     */
    conversationId?: number;
    message?: string;
    quote?: CodeQuote;
    snapshot?: CodeSnapshot;
};
