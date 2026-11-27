import {
  QuestionListControllerService,
  QuestionListDetailVO,
  QuestionListVO,
} from "../../generated";
import { ApiId, toGeneratedApiId } from "@/services/apiId";

/**
 * 题单：我的收藏、自建题单、官方题单。接口都要登录；这里把可选字段补齐成页面直接能用的样子。
 */
export type QuestionListType = "favorite" | "custom" | "official";

export type QuestionListCard = {
  id: string;
  title: string;
  description: string;
  type: QuestionListType;
  questionCount: number;
  solvedCount: number;
  /** 当前用户能不能改（加题、删题、排序、改名） */
  editable: boolean;
};

export type QuestionListEntry = {
  questionId: string;
  title: string;
  tags: string[];
  submitNum: number;
  acceptedNum: number;
};

export type QuestionListDetail = {
  list: QuestionListCard;
  questions: QuestionListEntry[];
};

type Response<T> = { code?: number; data?: T; message?: string };

const unwrap = <T>(response: Response<T>, fallback: string): T => {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data as T;
};

const count = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;

const isType = (value: unknown): value is QuestionListType =>
  value === "favorite" || value === "custom" || value === "official";

export const normalizeListCard = (
  vo?: QuestionListVO | null
): QuestionListCard | null => {
  if (!vo || vo.id == null) return null;
  return {
    id: String(vo.id),
    title: vo.title || "（无标题）",
    description: vo.description ?? "",
    type: isType(vo.type) ? vo.type : "custom",
    questionCount: count(vo.questionCount),
    solvedCount: Math.min(count(vo.solvedCount), count(vo.questionCount)),
    editable: vo.editable === true,
  };
};

const normalizeCards = (list?: QuestionListVO[] | null) =>
  (list ?? [])
    .map(normalizeListCard)
    .filter((card): card is QuestionListCard => card !== null);

export const normalizeListDetail = (
  vo?: QuestionListDetailVO | null
): QuestionListDetail | null => {
  const list = normalizeListCard(vo?.list);
  if (!list) return null;
  return {
    list,
    questions: (vo?.questions ?? [])
      .filter((item) => item.questionId != null)
      .map((item) => ({
        questionId: String(item.questionId),
        title: item.title || "（无标题）",
        tags: item.tags ?? [],
        submitNum: count(item.submitNum),
        acceptedNum: count(item.acceptedNum),
      })),
  };
};

export const loadMyLists = async () =>
  normalizeCards(
    unwrap(
      await QuestionListControllerService.listMyQuestionLists(),
      "题单没加载出来"
    )
  );

export const loadOfficialLists = async () =>
  normalizeCards(
    unwrap(
      await QuestionListControllerService.listOfficialQuestionLists(),
      "官方题单没加载出来"
    )
  );

export const loadListDetail = async (id: ApiId) => {
  const detail = normalizeListDetail(
    unwrap(
      await QuestionListControllerService.getQuestionList(toGeneratedApiId(id)),
      "题单没加载出来"
    )
  );
  if (!detail) throw new Error("题单不存在");
  return detail;
};

export type ListForm = {
  title: string;
  description: string;
  official?: boolean;
};

export const createList = async (form: ListForm) =>
  String(
    unwrap(
      await QuestionListControllerService.addQuestionList({
        title: form.title,
        description: form.description,
        official: form.official === true,
      }),
      "新建题单失败"
    )
  );

export const updateList = async (id: ApiId, form: ListForm) => {
  unwrap(
    await QuestionListControllerService.updateQuestionList({
      id: toGeneratedApiId(id),
      title: form.title,
      description: form.description,
    }),
    "保存失败"
  );
};

export const deleteList = async (id: ApiId) => {
  unwrap(
    await QuestionListControllerService.deleteQuestionList({
      id: toGeneratedApiId(id),
    }),
    "删除失败"
  );
};

export const addToList = async (listId: ApiId, questionId: ApiId) => {
  unwrap(
    await QuestionListControllerService.addQuestionToList({
      listId: toGeneratedApiId(listId),
      questionId: toGeneratedApiId(questionId),
    }),
    "加入题单失败"
  );
};

export const removeFromList = async (listId: ApiId, questionId: ApiId) => {
  unwrap(
    await QuestionListControllerService.removeQuestionFromList({
      listId: toGeneratedApiId(listId),
      questionId: toGeneratedApiId(questionId),
    }),
    "移出题单失败"
  );
};

export const sortList = async (listId: ApiId, questionIds: ApiId[]) => {
  unwrap(
    await QuestionListControllerService.sortQuestionList({
      listId: toGeneratedApiId(listId),
      questionIds: questionIds.map(toGeneratedApiId),
    }),
    "调整顺序失败"
  );
};

export const setFavorite = async (questionId: ApiId, favorite: boolean) => {
  unwrap(
    await QuestionListControllerService.setQuestionFavorite({
      questionId: toGeneratedApiId(questionId),
      favorite,
    }),
    favorite ? "收藏失败" : "取消收藏失败"
  );
};

export const loadFavoriteIds = async () =>
  (
    unwrap(
      await QuestionListControllerService.listFavoriteQuestionIds(),
      "收藏没加载出来"
    ) ?? []
  ).map(String);

export const loadListIdsContaining = async (questionId: ApiId) =>
  (
    unwrap(
      await QuestionListControllerService.listMyListIdsContaining(
        toGeneratedApiId(questionId)
      ),
      "题单没加载出来"
    ) ?? []
  ).map(String);

/** 把第 index 道题往前（-1）或往后（1）挪一位，返回新顺序；挪不动时原样返回 */
export const moveQuestion = <T>(items: T[], index: number, delta: -1 | 1) => {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0) return items;
  if (target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/** 题单标题和简介的长度（和后端一致） */
export const LIST_TITLE_MAX = 40;
export const LIST_DESCRIPTION_MAX = 200;

/** 表单检查：返回第一条错误，没问题返回空字符串 */
export const validateListForm = (form: ListForm) => {
  const title = form.title.trim();
  if (!title) return "题单标题不能为空";
  if (title.length > LIST_TITLE_MAX) return `标题最多 ${LIST_TITLE_MAX} 个字`;
  if (form.description.trim().length > LIST_DESCRIPTION_MAX) {
    return `简介最多 ${LIST_DESCRIPTION_MAX} 个字`;
  }
  return "";
};
