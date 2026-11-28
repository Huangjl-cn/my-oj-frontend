/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CompanionTraceTurnVO } from './CompanionTraceTurnVO';
import type { TraceTool } from './TraceTool';

export type CompanionTraceVO = {
    conversationId?: number;
    /**
     * 对话标题；还没提问时为空
     */
    title?: string;
    /**
     * false：这段对话开始于记录轨迹之前，更早的部分没有记录
     */
    recordedFromStart?: boolean;
    /**
     * true：这段对话没有记录，下面是从鸭鸭的记忆还原的（没有耗时，整理过的部分只剩整理笔记）
     */
    fromMemory?: boolean;
    /**
     * 用到的系统提示词（去重），各轮按下标引用
     */
    systemPrompts?: Array<string>;
    /**
     * 用到的工具清单（去重），各轮按下标引用
     */
    toolSets?: Array<Array<TraceTool>>;
    turns?: Array<CompanionTraceTurnVO>;
};
