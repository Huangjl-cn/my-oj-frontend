/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 当前对话的上下文占用
 */
export type ContextUsageVO = {
    /**
     * 当前上下文 token 数
     */
    usedTokens?: number;
    /**
     * 模型上下文窗口 token 数
     */
    limitTokens?: number;
    /**
     * 占用比例 0-1
     */
    ratio?: number;
    /**
     * 达到这个比例时自动整理记忆
     */
    compactRatio?: number;
    /**
     * 是否为估算值（刚压缩完、还没有调用过模型时）
     */
    estimated?: boolean;
};
