/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { NoteProposal } from './NoteProposal';
import type { NoteVO } from './NoteVO';

export type CompanionNoteApplyVO = {
    note?: NoteVO;
    proposal?: NoteProposal;
    /**
     * 笔记在提议之后改过、对不上被跳过的修改数
     */
    skipped?: number;
};
