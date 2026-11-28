/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { NoteChange } from './NoteChange';

/**
 * 鸭鸭提议的一篇笔记：新建一篇，或修改已有的一篇
 */
export type NoteProposal = {
    /**
     * create 新建 / update 修改已有的笔记
     */
    kind?: string;
    /**
     * 修改的是哪篇笔记；新建的在应用后填上新笔记的 id
     */
    noteId?: number;
    /**
     * 修改时笔记的版本号；应用时笔记已经不是这个版本，说明在这之后改过
     */
    baseVersion?: number;
    /**
     * 应用后的标题
     */
    title?: string;
    /**
     * 修改前的标题（只有修改有）
     */
    previousTitle?: string;
    /**
     * 挂在哪道题上；自由笔记为空
     */
    questionId?: number;
    /**
     * 所挂题目的标题
     */
    questionTitle?: string;
    /**
     * 修改的明细（只有修改有），按顺序应用
     */
    changes?: Array<NoteChange>;
    /**
     * 提议时算好的全文：新建的正文，或依次应用全部修改后的正文
     */
    content?: string;
    /**
     * 一句话说明，展示给用户
     */
    reason?: string;
    /**
     * 用户已经点过「应用」
     */
    applied?: boolean;
};
