/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { TraceToolCall } from './TraceToolCall';

export type CompanionTraceStepVO = {
    id?: number;
    /**
     * model 模型调用 / tool 工具调用
     */
    kind?: string;
    /**
     * 模型名或工具名
     */
    name?: string;
    /**
     * 工具参数（JSON）
     */
    input?: string;
    /**
     * 模型回答的正文 / 工具结果
     */
    output?: string;
    /**
     * 模型的思考过程
     */
    thinking?: string;
    /**
     * 模型发起的工具调用
     */
    toolCalls?: Array<TraceToolCall>;
    inputTokens?: number;
    /**
     * 输入里命中缓存的 token
     */
    cachedTokens?: number;
    outputTokens?: number;
    finishReason?: string;
    /**
     * 出错原因；工具调用被拒绝、参数不对等也算
     */
    error?: string;
    /**
     * 开始时间；从记忆还原的没有
     */
    startTime?: string;
    /**
     * 耗时（毫秒）；从记忆还原的没有
     */
    durationMs?: number;
};
