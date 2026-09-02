/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JudgeInfo } from './JudgeInfo';
import type { QuestionVO } from './QuestionVO';
import type { UserVO } from './UserVO';

export type QuestionSubmitVO = {
    id?: number;
    questionId?: number;
    userId?: number;
    language?: string;
    code?: string;
    judgeInfo?: JudgeInfo;
    status?: number;
    createTime?: string;
    updateTime?: string;
    userVO?: UserVO;
    questionVO?: QuestionVO;
    /**
     * 题目标题
     */
    questionTitle?: string;
    /**
     * 题目标签列表
     */
    questionTags?: Array<string>;
    /**
     * 提交用户昵称
     */
    userName?: string;
    /**
     * 提交用户头像
     */
    userAvatar?: string;
    /**
     * 派生判题结果，可选 accepted/failed/pending；status=2 仅代表判题完成，是否通过以本字段及 judgeInfo.message 为准
     */
    judgeResult?: string;
};
