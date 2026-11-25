/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AiSettingSaveRequest } from '../models/AiSettingSaveRequest';
import type { BaseResponseAiSettingVO } from '../models/BaseResponseAiSettingVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AiSettingControllerService {

    /**
     * 获取当前用户的 AI 设置
     * @returns BaseResponseAiSettingVO OK
     * @throws ApiError
     */
    public static getSetting(): CancelablePromise<BaseResponseAiSettingVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ai/setting',
        });
    }

    /**
     * 保存 AI 设置；带了新 Key 时先校验再加密保存
     * @param requestBody 
     * @returns BaseResponseAiSettingVO OK
     * @throws ApiError
     */
    public static saveSetting(
requestBody: AiSettingSaveRequest,
): CancelablePromise<BaseResponseAiSettingVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/ai/setting',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 删除保存的 API Key
     * @returns BaseResponseAiSettingVO OK
     * @throws ApiError
     */
    public static deleteKey(): CancelablePromise<BaseResponseAiSettingVO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/ai/setting/key',
        });
    }

}
