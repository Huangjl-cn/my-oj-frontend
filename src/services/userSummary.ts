import type { UserVO } from "../../generated";
import { UserControllerService } from "../../generated";

import { ApiId, toGeneratedApiId } from "@/services/apiId";

const userSummaryCache = new Map<string, Promise<UserVO | undefined>>();

export const getUserSummary = (userId: ApiId) => {
  const cacheKey = String(userId);
  const cached = userSummaryCache.get(cacheKey);
  if (cached) return cached;

  const request = UserControllerService.getUserVoById(toGeneratedApiId(userId))
    .then((response) =>
      response.code === 0 && response.data ? response.data : undefined
    )
    .catch((error) => {
      userSummaryCache.delete(cacheKey);
      throw error;
    });

  userSummaryCache.set(cacheKey, request);
  return request;
};

export const clearUserSummaryCache = (userId?: ApiId) => {
  if (userId == null) {
    userSummaryCache.clear();
    return;
  }
  userSummaryCache.delete(String(userId));
};
