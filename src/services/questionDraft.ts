import { ApiId } from "@/services/apiId";

const DRAFT_PREFIX = "myoj:question-draft";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type DraftKey = {
  userId: ApiId | "anonymous";
  questionId: ApiId;
  language: string;
};

type StoredDraft = {
  code: string;
  updatedAt: number;
};

const createKey = ({ userId, questionId, language }: DraftKey) =>
  `${DRAFT_PREFIX}:${[userId, questionId, language]
    .map((part) => encodeURIComponent(String(part)))
    .join(":")}`;

const isDraftExpired = (updatedAt: unknown) =>
  typeof updatedAt !== "number" ||
  !Number.isFinite(updatedAt) ||
  Date.now() - updatedAt > DRAFT_TTL_MS;

const listDraftStorageKeys = (storage: Storage) =>
  Array.from({ length: storage.length }, (_, index) =>
    storage.key(index)
  ).filter((key): key is string => !!key?.startsWith(`${DRAFT_PREFIX}:`));

const parseStoredDraft = (value: string | null) => {
  if (!value) return undefined;
  try {
    const draft = JSON.parse(value) as Partial<StoredDraft>;
    if (typeof draft.code !== "string" || isDraftExpired(draft.updatedAt)) {
      return undefined;
    }
    return draft as StoredDraft;
  } catch {
    return undefined;
  }
};

export const sweepExpiredQuestionDrafts = () => {
  try {
    for (const key of listDraftStorageKeys(localStorage)) {
      if (!parseStoredDraft(localStorage.getItem(key))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const getQuestionDraft = (key: DraftKey) => {
  try {
    return parseStoredDraft(localStorage.getItem(createKey(key)))?.code;
  } catch {
    return undefined;
  }
};

export const saveQuestionDraft = (key: DraftKey, code: string) => {
  try {
    const draft: StoredDraft = { code, updatedAt: Date.now() };
    localStorage.setItem(createKey(key), JSON.stringify(draft));
  } catch {
    // Editing must continue even when browser storage is unavailable or full.
  }
};

export const removeQuestionDraft = (key: DraftKey) => {
  try {
    localStorage.removeItem(createKey(key));
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const clearQuestionDraftsForUser = (userId: ApiId) => {
  try {
    const prefix = `${DRAFT_PREFIX}:${encodeURIComponent(String(userId))}:`;
    for (const key of listDraftStorageKeys(localStorage)) {
      if (key.startsWith(prefix)) localStorage.removeItem(key);
    }
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const clearQuestionDraftsForQuestion = (questionId: ApiId) => {
  try {
    const prefix = `${DRAFT_PREFIX}:`;
    const questionIdText = String(questionId);
    for (const key of listDraftStorageKeys(localStorage)) {
      const [, storedQuestionId] = key.slice(prefix.length).split(":");
      if (decodeURIComponent(storedQuestionId || "") === questionIdText) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore unavailable browser storage.
  }
};
