/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AdminUserVO } from './AdminUserVO';
import type { OrderItem } from './OrderItem';

export type PageAdminUserVO = {
    records?: Array<AdminUserVO>;
    total?: number;
    size?: number;
    current?: number;
    orders?: Array<OrderItem>;
    optimizeCountSql?: PageAdminUserVO;
    searchCount?: PageAdminUserVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    /**
     * @deprecated
     */
    pages?: number;
};
