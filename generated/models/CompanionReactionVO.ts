/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CompanionReactionVO = {
    messageId?: number;
    submissionId?: number;
    /**
     * 心情，见心情调色板
     */
    mood?: string;
    /**
     * 心情强度 1-3
     */
    moodIntensity?: number;
    /**
     * 反应记在哪段对话里
     */
    conversationId?: number;
    message?: string;
    /**
     * 是否为兜底话术（没配 Key 或模型调用失败）
     */
    fallback?: boolean;
};
