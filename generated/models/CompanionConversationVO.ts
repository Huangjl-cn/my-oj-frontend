/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CompanionConversationVO = {
    id?: number;
    /**
     * 第一次提问的开头，还没提问时为空
     */
    title?: string;
    /**
     * 消息条数
     */
    messageCount?: number;
    /**
     * 是否为当前对话
     */
    active?: boolean;
    createTime?: string;
    /**
     * 最近活跃时间
     */
    updateTime?: string;
};
