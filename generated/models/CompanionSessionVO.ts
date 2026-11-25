/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CompanionMessageVO } from './CompanionMessageVO';
import type { ContextUsageVO } from './ContextUsageVO';
import type { HintStepVO } from './HintStepVO';

export type CompanionSessionVO = {
    questionId?: number;
    /**
     * 当前对话 id，聊天、提示、看答案、整理记忆都带上它
     */
    conversationId?: number;
    /**
     * 提示档位 0-5，5 表示看过答案
     */
    hintLevel?: number;
    /**
     * 实际生效的档位：有问必答模式下为 5
     */
    effectiveLevel?: number;
    /**
     * 提示模式 guided / direct
     */
    hintMode?: string;
    /**
     * 各档位的名字和说明，下标即档位（0-5）
     */
    hintSteps?: Array<HintStepVO>;
    /**
     * 能否调用模型：没配 Key 时为 false，前端引导用户去配置
     */
    canCallModel?: boolean;
    /**
     * 是否为模拟模式
     */
    mockMode?: boolean;
    /**
     * 陪练的名字
     */
    personaName?: string;
    contextUsage?: ContextUsageVO;
    /**
     * 当前对话最近的消息，按时间正序
     */
    messages?: Array<CompanionMessageVO>;
    /**
     * 当前对话是否还有更早的消息
     */
    hasMoreMessages?: boolean;
};
