/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CompanionNoteApplyRequest = {
    /**
     * 提议所在的消息 id
     */
    messageId?: number;
    /**
     * 第几条提议（消息的 noteEdits 下标，从 0 开始）
     */
    index?: number;
    /**
     * 笔记在提议之后改过、而提议要整篇改写时，确认覆盖传 true
     */
    overwrite?: boolean;
};
