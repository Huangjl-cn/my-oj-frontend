/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseNoteVO } from '../models/BaseResponseNoteVO';
import type { BaseResponsePageNoteSummaryVO } from '../models/BaseResponsePageNoteSummaryVO';
import type { DeleteRequest } from '../models/DeleteRequest';
import type { NoteAddRequest } from '../models/NoteAddRequest';
import type { NoteQueryRequest } from '../models/NoteQueryRequest';
import type { NoteUpdateRequest } from '../models/NoteUpdateRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class NoteControllerService {

    /**
     * @param requestBody 
     * @returns BaseResponseNoteVO OK
     * @throws ApiError
     */
    public static updateNote(
requestBody: NoteUpdateRequest,
): CancelablePromise<BaseResponseNoteVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/note/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponsePageNoteSummaryVO OK
     * @throws ApiError
     */
    public static listMyNotes(
requestBody: NoteQueryRequest,
): CancelablePromise<BaseResponsePageNoteSummaryVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/note/list/page',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static deleteNote(
requestBody: DeleteRequest,
): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/note/delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns BaseResponseNoteVO OK
     * @throws ApiError
     */
    public static addNote(
requestBody: NoteAddRequest,
): CancelablePromise<BaseResponseNoteVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/note/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id 
     * @returns BaseResponseNoteVO OK
     * @throws ApiError
     */
    public static getNote(
id: number,
): CancelablePromise<BaseResponseNoteVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/note/get',
            query: {
                'id': id,
            },
        });
    }

}
