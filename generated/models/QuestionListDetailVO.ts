/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { QuestionListItemVO } from './QuestionListItemVO';
import type { QuestionListVO } from './QuestionListVO';

export type QuestionListDetailVO = {
    list?: QuestionListVO;
    /**
     * 题单里的题，按题单里的顺序；已删除的题不在其中
     */
    questions?: Array<QuestionListItemVO>;
};
