/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AiModelOptionVO } from './AiModelOptionVO';

export type AiSettingVO = {
    /**
     * AI 厂商
     */
    provider?: string;
    /**
     * 是否已配置 API Key；模拟模式下恒为 true
     */
    keyConfigured?: boolean;
    /**
     * API Key 后 4 位，未配置时为空
     */
    keyHint?: string;
    /**
     * 当前使用的模型 id
     */
    model?: string;
    /**
     * 可选的模型
     */
    models?: Array<AiModelOptionVO>;
    /**
     * 提示模式：guided 循序渐进 / direct 有问必答
     */
    hintMode?: string;
    /**
     * 是否为模拟模式（开发环境默认开启，回复是固定话术）
     */
    mockMode?: boolean;
};
