/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { NoteTagVO } from './NoteTagVO';

export type NoteOverviewVO = {
    total?: number;
    /**
     * 挂在题上的
     */
    linked?: number;
    /**
     * 自由笔记
     */
    free?: number;
    /**
     * 笔记最多的几个标签（按笔记挂的题的标签算，难度标签不算），多的在前
     */
    tags?: Array<NoteTagVO>;
};
