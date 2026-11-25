/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ContextUsageVO } from './ContextUsageVO';

export type CompanionCompactionVO = {
    /**
     * 是否真的整理了（对话太短时不整理）
     */
    compacted?: boolean;
    messageId?: number;
    /**
     * 整理出的笔记全文
     */
    note?: string;
    /**
     * 被整理掉的轮数
     */
    compactedRounds?: number;
    /**
     * 原样保留的最近轮数
     */
    keptRounds?: number;
    contextUsage?: ContextUsageVO;
};
