import { ApiId } from "@/services/apiId";

const DRAFT_PREFIX = "myoj:question-draft";

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

export const getQuestionDraft = (key: DraftKey) => {
  try {
    const value = sessionStorage.getItem(createKey(key));
    if (!value) return undefined;
    const draft = JSON.parse(value) as Partial<StoredDraft>;
    return typeof draft.code === "string" ? draft.code : undefined;
  } catch {
    return undefined;
  }
};

export const saveQuestionDraft = (key: DraftKey, code: string) => {
  try {
    const draft: StoredDraft = { code, updatedAt: Date.now() };
    sessionStorage.setItem(createKey(key), JSON.stringify(draft));
  } catch {
    // Editing must continue even when browser storage is unavailable or full.
  }
};

export const removeQuestionDraft = (key: DraftKey) => {
  try {
    sessionStorage.removeItem(createKey(key));
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const clearQuestionDraftsForUser = (userId: ApiId) => {
  try {
    const prefix = `${DRAFT_PREFIX}:${encodeURIComponent(String(userId))}:`;
    const keys = Array.from({ length: sessionStorage.length }, (_, index) =>
      sessionStorage.key(index)
    );
    for (const key of keys) {
      if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore unavailable browser storage.
  }
};
