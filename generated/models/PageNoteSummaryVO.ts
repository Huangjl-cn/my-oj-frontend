/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { NoteSummaryVO } from './NoteSummaryVO';
import type { OrderItem } from './OrderItem';

export type PageNoteSummaryVO = {
    records?: Array<NoteSummaryVO>;
    total?: number;
    size?: number;
    current?: number;
    orders?: Array<OrderItem>;
    optimizeCountSql?: PageNoteSummaryVO;
    searchCount?: PageNoteSummaryVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    /**
     * @deprecated
     */
    pages?: number;
};
