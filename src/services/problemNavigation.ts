import { ApiId } from "@/services/apiId";
import {
  QuestionControllerService,
  QuestionQueryRequest,
} from "../../generated";

/**
 * 做题页的「上一题 / 下一题 / 题目列表」沿用题库页当时的筛选和排序：
 * 题库页每次加载一页就记下来，做题页翻到这一页的头尾时再按同样条件取相邻的一页。
 * 存在 sessionStorage，刷新做题页也还在；直接打开题目链接时用默认顺序。
 */
export type ProblemListContext = {
  /** 筛选和排序条件，不含页码 */
  query: Omit<QuestionQueryRequest, "current">;
  page: number;
  pageSize: number;
  total: number;
  /** 这一页题目的 id、标题和标签，按列表顺序（id 实际是字符串，见 apiId.ts） */
  items: Array<{ id?: ApiId; title?: string; tags?: string[] }>;
  /** 从题单进来时：题单 id 和名字（整个题单就是一页，不翻页） */
  listId?: string;
  listTitle?: string;
};

const STORAGE_KEY = "myoj:problem-list";
const DEFAULT_PAGE_SIZE = 15;

let current: ProblemListContext | null = null;

const read = (): ProblemListContext | null => {
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ProblemListContext) : null;
    if (parsed && Array.isArray(parsed.items) && parsed.pageSize > 0) {
      current = parsed;
    }
  } catch {
    current = null;
  }
  return current;
};

export const setProblemListContext = (context: ProblemListContext) => {
  current = {
    ...context,
    items: context.items.map(({ id, title, tags }) => ({ id, title, tags })),
  };
  if (!context.listId) {
    delete current.listId;
    delete current.listTitle;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // 存不了也不影响当前页面里的上一题 / 下一题
  }
};

export const getProblemListContext = () => read();

const sameId = (a?: ApiId | null, b?: ApiId | null) =>
  a != null && b != null && String(a) === String(b);

/** 按同样的筛选条件取某一页，取到了就把它记成当前上下文 */
export const loadProblemListPage = async (
  page: number,
  base: Pick<ProblemListContext, "query" | "pageSize"> = read() ?? {
    query: {},
    pageSize: DEFAULT_PAGE_SIZE,
  }
): Promise<ProblemListContext | null> => {
  const response = await QuestionControllerService.listQuestionVoByPage({
    ...base.query,
    current: page,
    pageSize: base.pageSize,
  });
  if (response.code !== 0) return null;
  const context: ProblemListContext = {
    query: base.query,
    page,
    pageSize: base.pageSize,
    total: Number(response.data?.total ?? 0),
    items: response.data?.records ?? [],
  };
  setProblemListContext(context);
  return context;
};

export type Neighbors = { prev?: ApiId; next?: ApiId };

/**
 * 当前题目在列表里的前后两题。题目不在记下的那一页里（比如直接打开的链接）时返回空。
 * 在页首、页尾时，相邻的题在上一页、下一页，用 loadNeighborAcrossPage 去取。
 */
export const getNeighbors = (questionId: ApiId): Neighbors => {
  const context = read();
  if (!context) return {};
  const index = context.items.findIndex(({ id }) => sameId(id, questionId));
  if (index === -1) return {};
  return {
    prev: context.items[index - 1]?.id,
    next: context.items[index + 1]?.id,
  };
};

/** 当前题在这一页的头 / 尾时，是否还有上一页 / 下一页 */
export const hasNeighborPage = (
  questionId: ApiId,
  direction: "prev" | "next"
) => {
  const context = read();
  if (!context) return false;
  const index = context.items.findIndex(({ id }) => sameId(id, questionId));
  if (index === -1) return false;
  if (direction === "prev") return index === 0 && context.page > 1;
  const lastPage = Math.ceil(context.total / context.pageSize);
  return index === context.items.length - 1 && context.page < lastPage;
};

/** 跨页取相邻的题：上一页的最后一题，或下一页的第一题 */
export const loadNeighborAcrossPage = async (
  direction: "prev" | "next"
): Promise<ApiId | undefined> => {
  const context = read();
  if (!context) return undefined;
  const page = context.page + (direction === "prev" ? -1 : 1);
  if (page < 1) return undefined;
  const loaded = await loadProblemListPage(page, context);
  if (!loaded?.items.length) return undefined;
  return direction === "prev"
    ? loaded.items[loaded.items.length - 1].id
    : loaded.items[0].id;
};

/** 从题单进入做题页：整个题单作为一页记下来，上一题 / 下一题和题目抽屉都按题单走 */
export const setListContext = (
  listId: string,
  listTitle: string,
  items: ProblemListContext["items"]
) =>
  setProblemListContext({
    query: {},
    page: 1,
    pageSize: Math.max(1, items.length),
    total: items.length,
    items,
    listId,
    listTitle,
  });

/** 只在测试里用 */
export const resetProblemListContextForTest = () => {
  current = null;
};
