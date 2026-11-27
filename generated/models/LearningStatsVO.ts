/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LanguageStatVO } from './LanguageStatVO';
import type { SolvedQuestionVO } from './SolvedQuestionVO';
import type { TagProgressVO } from './TagProgressVO';

export type LearningStatsVO = {
    /**
     * 各标签的做题情况，难度标签不算；按题目数从多到少
     */
    tags?: Array<TagProgressVO>;
    /**
     * 各语言的提交情况，按提交次数从多到少
     */
    languages?: Array<LanguageStatVO>;
    /**
     * 最近第一次通过的题，最近的在前，最多 10 道
     */
    recentSolved?: Array<SolvedQuestionVO>;
    /**
     * 第一次提交就通过的题目数
     */
    firstTrySolved?: number;
};
