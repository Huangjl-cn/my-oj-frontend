import { NoteControllerService, NoteSummaryVO, NoteVO } from "../../generated";
import { ApiId, toGeneratedApiId } from "@/services/apiId";
import {
  DIFFICULTY_LABELS,
  getDifficulty,
  getTopicTags,
} from "@/utils/difficulty";

/**
 * 笔记：自由笔记，或挂在某道题上（一道题可以有多篇）。保存带版本号，对不上返回 40900。
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  questionId: string | null;
  questionTitle: string | null;
  questionTags: string[];
  version: number;
  createTime: string;
  updateTime: string;
};

export type NoteSummary = {
  id: string;
  title: string;
  snippet: string;
  /** 正文开头一段（Markdown），卡片墙上渲染着看 */
  excerpt: string;
  questionId: string | null;
  questionTitle: string | null;
  questionTags: string[];
  updateTime: string;
};

/** 保存时版本号对不上：笔记在别处（另一个标签页、鸭鸭）改过了 */
export const NOTE_CONFLICT_CODE = 40900;

export class NoteServiceError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = "NoteServiceError";
  }
}

type Response<T> = { code?: number; data?: T; message?: string };

const unwrap = <T>(response: Response<T>, fallback: string): T => {
  if (response.code !== 0) {
    throw new NoteServiceError(response.message || fallback, response.code);
  }
  return response.data as T;
};

export const normalizeNote = (vo?: NoteVO | null): Note | null => {
  if (!vo || vo.id == null) return null;
  return {
    id: String(vo.id),
    title: vo.title || "未命名笔记",
    content: vo.content ?? "",
    questionId: vo.questionId == null ? null : String(vo.questionId),
    questionTitle: vo.questionTitle ?? null,
    questionTags: vo.questionTags ?? [],
    version: typeof vo.version === "number" ? vo.version : 0,
    createTime: vo.createTime ?? "",
    updateTime: vo.updateTime ?? "",
  };
};

export const normalizeNoteSummary = (
  vo?: NoteSummaryVO | null
): NoteSummary | null => {
  if (!vo || vo.id == null) return null;
  return {
    id: String(vo.id),
    title: vo.title || "未命名笔记",
    snippet: vo.snippet ?? "",
    excerpt: vo.excerpt ?? "",
    questionId: vo.questionId == null ? null : String(vo.questionId),
    questionTitle: vo.questionTitle ?? null,
    questionTags: vo.questionTags ?? [],
    updateTime: vo.updateTime ?? "",
  };
};

const requireNote = (vo: NoteVO | undefined) => {
  const note = normalizeNote(vo);
  if (!note) throw new NoteServiceError("笔记不存在");
  return note;
};

export const NOTE_PAGE_SIZE = 20;

export const loadNotes = async (options: {
  page: number;
  keyword?: string;
  questionId?: ApiId | null;
  /** true 只看挂在题上的，false 只看自由笔记 */
  linked?: boolean;
  /** 只看挂在带这个标签的题上的 */
  tag?: string;
}) => {
  const data = unwrap(
    await NoteControllerService.listMyNotes({
      current: options.page,
      pageSize: NOTE_PAGE_SIZE,
      keyword: options.keyword?.trim() || undefined,
      questionId:
        options.questionId == null
          ? undefined
          : toGeneratedApiId(options.questionId),
      linked: options.linked,
      tag: options.tag || undefined,
    }),
    "笔记没加载出来"
  );
  return {
    items: (data?.records ?? [])
      .map(normalizeNoteSummary)
      .filter((item): item is NoteSummary => item !== null),
    total: Number(data?.total ?? 0),
  };
};

export const loadNote = async (id: ApiId) =>
  requireNote(
    unwrap(
      await NoteControllerService.getNote(toGeneratedApiId(id)),
      "笔记没加载出来"
    )
  );

export const createNote = async (options: {
  title?: string;
  content?: string;
  questionId?: ApiId | null;
}) =>
  requireNote(
    unwrap(
      await NoteControllerService.addNote({
        title: options.title,
        content: options.content,
        questionId:
          options.questionId == null
            ? undefined
            : toGeneratedApiId(options.questionId),
      }),
      "新建笔记失败"
    )
  );

export const saveNote = async (note: {
  id: ApiId;
  title: string;
  content: string;
  version: number;
}) =>
  requireNote(
    unwrap(
      await NoteControllerService.updateNote({
        id: toGeneratedApiId(note.id),
        title: note.title,
        content: note.content,
        version: note.version,
      }),
      "保存失败"
    )
  );

export const removeNote = async (id: ApiId) => {
  unwrap(
    await NoteControllerService.deleteNote({ id: toGeneratedApiId(id) }),
    "删除失败"
  );
};

/** 追加到末尾：和前文之间空一行（和后端鸭鸭追加笔记的规则一样） */
export const appendMarkdown = (content: string, text: string) => {
  const body = text.replace(/\r\n/g, "\n").trim();
  const head = content.replace(/\r\n/g, "\n").trimEnd();
  if (!body) return content;
  return head ? `${head}\n\n${body}\n` : `${body}\n`;
};

/**
 * 把一段内容追加到一篇笔记末尾。读到保存之间笔记在别处改了（40900）就重新读一次再追加，最多试两次
 */
export const appendToNote = async (id: ApiId, text: string): Promise<Note> => {
  for (let attempt = 0; ; attempt += 1) {
    const note = await loadNote(id);
    try {
      return await saveNote({
        id: note.id,
        title: note.title,
        content: appendMarkdown(note.content, text),
        version: note.version,
      });
    } catch (cause) {
      const conflict =
        cause instanceof NoteServiceError && cause.code === NOTE_CONFLICT_CODE;
      if (!conflict || attempt >= 1) throw cause;
    }
  }
};

export type NoteOverview = {
  total: number;
  linked: number;
  free: number;
  /** 笔记最多的几个标签（按挂的题的标签算） */
  tags: { tag: string; count: number }[];
};

export const loadNoteOverview = async (): Promise<NoteOverview> => {
  const data = unwrap(
    await NoteControllerService.getMyNoteOverview(),
    "笔记没加载出来"
  );
  return {
    total: data?.total ?? 0,
    linked: data?.linked ?? 0,
    free: data?.free ?? 0,
    tags: (data?.tags ?? [])
      .filter((item) => item.tag)
      .map((item) => ({ tag: item.tag as string, count: item.count ?? 0 })),
  };
};

/**
 * 卡片墙：按顺序轮流放进各列（第 i 篇放第 i % 列数 列），最新的几篇排在第一行；
 * 每列各自往下排，卡片长短不一也不留空。
 */
export const distributeColumns = <T>(items: T[], columns: number): T[][] => {
  const count = Math.max(1, Math.floor(columns));
  const result: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => result[index % count].push(item));
  return result;
};

/** 列表里的摘要：在前端粗略去掉 Markdown 符号（和后端 NoteSnippets 一个意思），保存后不用重新拉列表 */
export const noteSnippet = (markdown: string, maxLength = 90) => {
  const text = markdown
    .replace(/```[\s\S]*?(```|$)/g, " [代码] ")
    .replace(/!\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/^\s*([-*_]\s*){3,}$/gm, " ")
    .replace(
      /^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+\[[ xX]]\s+|[-*+]\s+|\d+[.)]\s+)/gm,
      ""
    )
    .replace(/[*_~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const chars = Array.from(text);
  return chars.length <= maxLength
    ? text
    : `${chars.slice(0, maxLength).join("").trimEnd()}…`;
};

/** 卡片墙上的正文片段：和后端 NoteSnippets.excerpt 一样，整行截断，截进代码块就补上结尾，后面加「…」 */
export const noteExcerpt = (markdown: string, maxLength = 600) => {
  const text = markdown.replace(/\r\n/g, "\n").trim();
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  let cut = chars.slice(0, maxLength).join("");
  const lineEnd = cut.lastIndexOf("\n");
  if (lineEnd > cut.length / 2) cut = cut.slice(0, lineEnd);
  cut = cut.trimEnd();
  if ((cut.match(/```/g) ?? []).length % 2 === 1) cut += "\n```";
  return `${cut}\n\n…`;
};

/** 片段开头那行标题和笔记标题一样时去掉（卡片上已经有标题了） */
export const stripTitleHeading = (excerpt: string, title: string) => {
  const match = /^#{1,6}\s+(.+?)\s*(?:\n|$)/.exec(excerpt);
  if (!match || match[1].trim() !== title.trim()) return excerpt;
  return excerpt.slice(match[0].length).trimStart();
};

/** 存好、新建后的笔记换成列表里的一条（不用重新拉列表） */
export const toNoteSummary = (note: Note): NoteSummary => ({
  id: note.id,
  title: note.title,
  snippet: noteSnippet(note.content),
  excerpt: noteExcerpt(note.content),
  questionId: note.questionId,
  questionTitle: note.questionTitle,
  questionTags: note.questionTags,
  updateTime: note.updateTime,
});

// region 导出到 Obsidian

export type ObsidianSettings = {
  /** 库名；空着就让 Obsidian 用当前打开的库 */
  vault: string;
  /** 放在库里的哪个文件夹 */
  folder: string;
  /** 同名笔记已经在库里时覆盖它 */
  overwrite: boolean;
};

export const DEFAULT_OBSIDIAN_SETTINGS: ObsidianSettings = {
  vault: "",
  folder: "MyOJ",
  overwrite: false,
};

const OBSIDIAN_SETTINGS_KEY = "myoj:obsidian";

export const readObsidianSettings = (): ObsidianSettings => {
  try {
    const raw = localStorage.getItem(OBSIDIAN_SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ObsidianSettings>) : {};
    return {
      vault: typeof parsed.vault === "string" ? parsed.vault : "",
      folder:
        typeof parsed.folder === "string"
          ? parsed.folder
          : DEFAULT_OBSIDIAN_SETTINGS.folder,
      overwrite: parsed.overwrite === true,
    };
  } catch {
    return { ...DEFAULT_OBSIDIAN_SETTINGS };
  }
};

export const writeObsidianSettings = (settings: ObsidianSettings) => {
  try {
    localStorage.setItem(OBSIDIAN_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 存不了就每次用默认值
  }
};

/** 文件名里不能有的字符（Windows、macOS、Obsidian 链接都要避开）去掉，太长截断 */
export const obsidianFileName = (title: string) => {
  const cleaned = title
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .trim();
  return cleaned || "未命名笔记";
};

const folderPath = (folder: string) =>
  folder
    .split(/[\\/]+/)
    .map((part) => obsidianFileName(part))
    .filter((part) => part && part !== "未命名笔记")
    .join("/");

const yamlString = (value: string) => JSON.stringify(value);

/** Obsidian 的标签不能有空格，开头不能是数字 */
const obsidianTag = (tag: string) => {
  const cleaned = tag.trim().replace(/\s+/g, "-").replace(/[#,]/g, "");
  return /^\d/.test(cleaned) ? `_${cleaned}` : cleaned;
};

const dateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

/** 整理成 Obsidian 习惯的 Markdown：开头是属性（标题、来源、标签、难度、日期），后面是正文 */
export const buildObsidianMarkdown = (note: Note, origin: string) => {
  const lines = ["---", `title: ${yamlString(note.title)}`];
  if (note.questionId) {
    lines.push(`source: ${yamlString(`${origin}/problem/${note.questionId}`)}`);
    if (note.questionTitle) {
      lines.push(`problem: ${yamlString(note.questionTitle)}`);
    }
  }
  const tags = [
    "myoj",
    ...getTopicTags(note.questionTags).map(obsidianTag),
  ].filter((tag, index, all) => tag && all.indexOf(tag) === index);
  lines.push("tags:", ...tags.map((tag) => `  - ${yamlString(tag)}`));
  const difficulty = getDifficulty(note.questionTags);
  if (difficulty) {
    lines.push(`difficulty: ${yamlString(DIFFICULTY_LABELS[difficulty])}`);
  }
  const created = dateOnly(note.createTime);
  const updated = dateOnly(note.updateTime);
  if (created) lines.push(`created: ${created}`);
  if (updated) lines.push(`updated: ${updated}`);
  lines.push("---", "");
  return `${lines.join("\n")}\n${note.content.trim()}\n`;
};

/** obsidian://new 链接：内容从剪贴板取（clipboard 参数），所以先复制再打开 */
export const buildObsidianUri = (title: string, settings: ObsidianSettings) => {
  const folder = folderPath(settings.folder);
  const file = folder
    ? `${folder}/${obsidianFileName(title)}`
    : obsidianFileName(title);
  const params = [];
  if (settings.vault.trim()) {
    params.push(`vault=${encodeURIComponent(settings.vault.trim())}`);
  }
  params.push(`file=${encodeURIComponent(file)}`, "clipboard=true");
  if (settings.overwrite) params.push("overwrite=true");
  return `obsidian://new?${params.join("&")}`;
};

// endregion
