/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseListLong } from '../models/BaseResponseListLong';
import type { BaseResponseListQuestionListVO } from '../models/BaseResponseListQuestionListVO';
import type { BaseResponseLong } from '../models/BaseResponseLong';
import type { BaseResponseQuestionListDetailVO } from '../models/BaseResponseQuestionListDetailVO';
import type { DeleteRequest } from '../models/DeleteRequest';
import type { QuestionFavoriteRequest } from '../models/QuestionFavoriteRequest';
import type { QuestionListAddRequest } from '../models/QuestionListAddRequest';
import type { QuestionListItemRequest } from '../models/QuestionListItemRequest';
import type { QuestionListSortRequest } from '../models/QuestionListSortRequest';
import type { QuestionListUpdateRequest } from '../models/QuestionListUpdateRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class QuestionListControllerService {

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static updateQuestionList(
requestBody: QuestionListUpdateRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static sortQuestionList(
requestBody: QuestionListSortRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/question/sort',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static removeQuestionFromList(
requestBody: QuestionListItemRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/question/remove',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static addQuestionToList(
requestBody: QuestionListItemRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/question/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static setQuestionFavorite(
requestBody: QuestionFavoriteRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/favorite',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static deleteQuestionList(
requestBody: DeleteRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseLong OK
     * @throws ApiError
     */
    public static addQuestionList(
requestBody: QuestionListAddRequest,
): CancelablePromise<BaseResponseLong> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/question_list/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @returns BaseResponseListQuestionListVO OK
     * @throws ApiError
     */
    public static listOfficialQuestionLists(): CancelablePromise<BaseResponseListQuestionListVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/question_list/official',
        });
    }

    /**
     * @returns BaseResponseListQuestionListVO OK
     * @throws ApiError
     */
    public static listMyQuestionLists(): CancelablePromise<BaseResponseListQuestionListVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/question_list/mine',
        });
    }

    /**
     * @param id 
     * @returns BaseResponseQuestionListDetailVO OK
     * @throws ApiError
     */
    public static getQuestionList(
id: number,
): CancelablePromise<BaseResponseQuestionListDetailVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/question_list/get',
            query: {
                'id': id,
            },
        });
    }

    /**
     * @returns BaseResponseListLong OK
     * @throws ApiError
     */
    public static listFavoriteQuestionIds(): CancelablePromise<BaseResponseListLong> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/question_list/favorite/ids',
        });
    }

    /**
     * @param questionId 
     * @returns BaseResponseListLong OK
     * @throws ApiError
     */
    public static listMyListIdsContaining(
questionId: number,
): CancelablePromise<BaseResponseListLong> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/question_list/containing',
            query: {
                'questionId': questionId,
            },
        });
    }

}
