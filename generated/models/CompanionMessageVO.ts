/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodeEditProposal } from './CodeEditProposal';
import type { CodeQuote } from './CodeQuote';

/**
 * 当前对话最近的消息，按时间正序
 */
export type CompanionMessageVO = {
    id?: number;
    /**
     * user 用户 / assistant 陪练
     */
    role?: string;
    /**
     * chat 聊天 / hint 提示 / reaction 提交后反应 / solution 参考解法 / compaction 记忆整理
     */
    type?: string;
    /**
     * 提示档位（提示、解法）
     */
    hintLevel?: number;
    /**
     * 陪练心情（提交后反应）
     */
    mood?: string;
    /**
     * 心情强度 1-3
     */
    moodIntensity?: number;
    /**
     * 触发反应的提交 id
     */
    submissionId?: number;
    content?: string;
    quote?: CodeQuote;
    codeEdits?: CodeEditProposal;
    createTime?: string;
};
