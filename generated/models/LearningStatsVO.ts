/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LanguageStatVO } from './LanguageStatVO';
import type { SolvedQuestionVO } from './SolvedQuestionVO';
import type { TagAttemptsVO } from './TagAttemptsVO';
import type { TagProgressVO } from './TagProgressVO';
import type { VerdictCountVO } from './VerdictCountVO';

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
    /**
     * 最近一次就通过的题，最近的在前，最多 6 道
     */
    firstTryRecent?: Array<SolvedQuestionVO>;
    /**
     * 最近一年一天里各个小时（0-23）的提交次数，24 个数
     */
    hourCounts?: Array<number>;
    /**
     * 判完的提交按结果分的次数，次数从多到少，没有的结果不出现
     */
    verdicts?: Array<VerdictCountVO>;
    /**
     * 最常卡住的标签：已通过的题平均第几次才过，从多到少，最多 3 个
     */
    stuckTags?: Array<TagAttemptsVO>;
};
