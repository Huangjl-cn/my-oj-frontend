/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { NoteProposal } from './NoteProposal';

export type CompanionNotePreviewVO = {
    /**
     * ready 可以直接应用 / rebased 笔记在这之后改过，修改都重新对上了 / partial 有几处对不上，会跳过 / overwrite 笔记在这之后改过，应用会整篇覆盖（要确认） / stale 修改都对不上了，不能应用 / missing 笔记已经删了 / applied 已经应用过
     */
    status?: string;
    proposal?: NoteProposal;
    /**
     * 应用后的标题
     */
    title?: string;
    /**
     * 应用后的正文
     */
    content?: string;
    /**
     * 笔记现在的正文（只有修改有）
     */
    currentContent?: string;
    /**
     * 对不上、会被跳过的修改数
     */
    skipped?: number;
    /**
     * 笔记 id：修改的那篇，或已经应用的新建笔记
     */
    noteId?: number;
};
