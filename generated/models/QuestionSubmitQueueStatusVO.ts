/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type QuestionSubmitQueueStatusVO = {
    /**
     * 提交 id
     */
    submissionId?: number;
    /**
     * 提交状态（0-待判题，1-判题中，2-成功，3-失败），非待判题状态前端可停止轮询
     */
    status?: number;
    /**
     * 我前方排队的提交数（仅待判题时有效，其余状态为 0）
     */
    aheadCount?: number;
    /**
     * 当前待判题队列总长（含本人）
     */
    queueLength?: number;
};
