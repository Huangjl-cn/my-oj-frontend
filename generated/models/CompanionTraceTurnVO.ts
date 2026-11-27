/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CompanionTraceStepVO } from './CompanionTraceStepVO';
import type { TracePromptSection } from './TracePromptSection';

export type CompanionTraceTurnVO = {
    id?: number;
    /**
     * chat 聊天 / hint 提示 / solution 看答案 / reaction 提交后反应 / compaction 整理记忆
     */
    type?: string;
    /**
     * running 进行中 / ok 完成 / error 出错 / fallback 用了兜底话术
     */
    status?: string;
    /**
     * 这一轮用户做了什么（聊天时是用户说的话）
     */
    userText?: string;
    /**
     * 发给模型的用户消息里除了「用户说」以外的各段（场景、提示状态、代码……）
     */
    context?: Array<TracePromptSection>;
    /**
     * 这一轮用的系统提示词，CompanionTraceVO.systemPrompts 的下标；没调用模型时为空
     */
    systemPromptIndex?: number;
    /**
     * 这一轮提供给模型的工具，CompanionTraceVO.toolSets 的下标；没调用模型时为空
     */
    toolSetIndex?: number;
    /**
     * 这一轮产生的陪练消息 id
     */
    messageId?: number;
    error?: string;
    /**
     * 开始时间；从记忆还原的没有
     */
    startTime?: string;
    /**
     * 耗时（毫秒）；进行中或从记忆还原的没有
     */
    durationMs?: number;
    steps?: Array<CompanionTraceStepVO>;
};
