/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseCompanionCompactionVO } from '../models/BaseResponseCompanionCompactionVO';
import type { BaseResponseCompanionHintStateVO } from '../models/BaseResponseCompanionHintStateVO';
import type { BaseResponseCompanionHintVO } from '../models/BaseResponseCompanionHintVO';
import type { BaseResponseCompanionReactionVO } from '../models/BaseResponseCompanionReactionVO';
import type { BaseResponseCompanionSessionVO } from '../models/BaseResponseCompanionSessionVO';
import type { BaseResponseListCompanionConversationVO } from '../models/BaseResponseListCompanionConversationVO';
import type { BaseResponseListCompanionMessageVO } from '../models/BaseResponseListCompanionMessageVO';
import type { CompanionChatRequest } from '../models/CompanionChatRequest';
import type { CompanionCompactRequest } from '../models/CompanionCompactRequest';
import type { CompanionHintRequest } from '../models/CompanionHintRequest';
import type { CompanionLevelRequest } from '../models/CompanionLevelRequest';
import type { CompanionNewConversationRequest } from '../models/CompanionNewConversationRequest';
import type { CompanionReactRequest } from '../models/CompanionReactRequest';
import type { CompanionSolutionRequest } from '../models/CompanionSolutionRequest';
import type { CompanionSwitchConversationRequest } from '../models/CompanionSwitchConversationRequest';
import type { SseEmitter } from '../models/SseEmitter';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CompanionControllerService {

    /**
     * 设置本题的提示档位 0-4
     * @param requestBody 
     * @returns BaseResponseCompanionHintStateVO OK
     * @throws ApiError
     */
    public static setLevel(
requestBody: CompanionLevelRequest,
): CancelablePromise<BaseResponseCompanionHintStateVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/companion/level',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 切换到之前的对话，返回切换后的会话
     * @param requestBody 
     * @returns BaseResponseCompanionSessionVO OK
     * @throws ApiError
     */
    public static switchConversation(
requestBody: CompanionSwitchConversationRequest,
): CancelablePromise<BaseResponseCompanionSessionVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/companion/conversation/active',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 看答案：参考代码和讲解（SSE 流式，含思考过程）
     * @param requestBody 
     * @returns SseEmitter OK
     * @throws ApiError
     */
    public static solution(
requestBody: CompanionSolutionRequest,
): CancelablePromise<SseEmitter> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/companion/solution',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 判题结束后获取陪练的反应（同一次提交重复调用返回同一结果）
     * @param requestBody 
     * @returns BaseResponseCompanionReactionVO OK
     * @throws ApiError
     */
    public static react(
requestBody: CompanionReactRequest,
): CancelablePromise<BaseResponseCompanionReactionVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/companion/react',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 按当前档位给一条提示
     * @param requestBody 
     * @returns BaseResponseCompanionHintVO OK
     * @throws ApiError
     */
    public static hint(
requestBody: CompanionHintRequest,
): CancelablePromise<BaseResponseCompanionHintVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/companion/hint',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 开一段新对话（当前对话还没有消息时沿用它），返回切换后的会话
     * @param requestBody 
     * @returns BaseResponseCompanionSessionVO OK
     * @throws ApiError
     */
    public static newConversation(
requestBody: CompanionNewConversationRequest,
): CancelablePromise<BaseResponseCompanionSessionVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/companion/conversation',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 手动整理记忆
     * @param requestBody 
     * @returns BaseResponseCompanionCompactionVO OK
     * @throws ApiError
     */
    public static compact(
requestBody: CompanionCompactRequest,
): CancelablePromise<BaseResponseCompanionCompactionVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/companion/compact',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 和陪练聊天（SSE 流式）
     * @param requestBody 
     * @returns SseEmitter OK
     * @throws ApiError
     */
    public static chat(
requestBody: CompanionChatRequest,
): CancelablePromise<SseEmitter> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/companion/chat',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 进入题目时获取陪练会话：提示档位、各档说明、当前对话的上下文占用和最近消息
     * @param questionId 
     * @returns BaseResponseCompanionSessionVO OK
     * @throws ApiError
     */
    public static getSession(
questionId: number,
): CancelablePromise<BaseResponseCompanionSessionVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/companion/session',
            query: {
                'questionId': questionId,
            },
        });
    }

    /**
     * 往前翻对话里的历史消息
     * @param conversationId 
     * @param beforeId 
     * @returns BaseResponseListCompanionMessageVO OK
     * @throws ApiError
     */
    public static listMessages(
conversationId: number,
beforeId?: number,
): CancelablePromise<BaseResponseListCompanionMessageVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/companion/messages',
            query: {
                'conversationId': conversationId,
                'beforeId': beforeId,
            },
        });
    }

    /**
     * 本题的对话列表，最近活跃的在前
     * @param questionId 
     * @returns BaseResponseListCompanionConversationVO OK
     * @throws ApiError
     */
    public static listConversations(
questionId: number,
): CancelablePromise<BaseResponseListCompanionConversationVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/companion/conversations',
            query: {
                'questionId': questionId,
            },
        });
    }

}
