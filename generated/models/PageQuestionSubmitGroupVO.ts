/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { OrderItem } from './OrderItem';
import type { QuestionSubmitGroupVO } from './QuestionSubmitGroupVO';

export type PageQuestionSubmitGroupVO = {
    records?: Array<QuestionSubmitGroupVO>;
    total?: number;
    size?: number;
    current?: number;
    orders?: Array<OrderItem>;
    optimizeCountSql?: PageQuestionSubmitGroupVO;
    searchCount?: PageQuestionSubmitGroupVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    /**
     * @deprecated
     */
    pages?: number;
};
