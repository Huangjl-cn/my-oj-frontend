/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { OrderItem } from './OrderItem';
import type { QuestionSubmitSummaryVO } from './QuestionSubmitSummaryVO';

export type PageQuestionSubmitSummaryVO = {
    records?: Array<QuestionSubmitSummaryVO>;
    total?: number;
    size?: number;
    current?: number;
    orders?: Array<OrderItem>;
    optimizeCountSql?: PageQuestionSubmitSummaryVO;
    searchCount?: PageQuestionSubmitSummaryVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    /**
     * @deprecated
     */
    pages?: number;
};
