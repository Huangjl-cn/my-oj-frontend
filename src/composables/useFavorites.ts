import { computed, ref } from "vue";
import { useStore } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import { ApiId } from "@/services/apiId";
import { loadFavoriteIds, setFavorite } from "@/services/questionList";

/**
 * 我收藏的题：题库列表、做题页、题单页共用一份（模块级），一次取全；
 * 点星标时先改界面再发请求，失败了改回来。
 */
const ids = ref<Set<string>>(new Set());
const loadedFor = ref<string | null>(null);
/** 正在发请求的题，避免连点 */
const pending = ref<Set<string>>(new Set());
let loading: Promise<void> | null = null;

export const useFavorites = () => {
  const store = useStore();
  const userId = computed<string | null>(() => {
    const loginUser = store.state.user.loginUser;
    return checkAccess(loginUser, ACCESS_ENUM.USER) && loginUser?.id != null
      ? String(loginUser.id)
      : null;
  });

  const load = async (force = false) => {
    const id = userId.value;
    if (id == null) {
      ids.value = new Set();
      loadedFor.value = null;
      return;
    }
    if (!force && loadedFor.value === id) return;
    if (loading && !force) return loading;
    loading = (async () => {
      try {
        const list = await loadFavoriteIds();
        if (userId.value === id) {
          ids.value = new Set(list);
          loadedFor.value = id;
        }
      } catch {
        // 星标只是锦上添花，取不到时都显示没收藏
      } finally {
        loading = null;
      }
    })();
    return loading;
  };

  const isFavorite = (questionId?: ApiId | null) =>
    questionId != null && ids.value.has(String(questionId));

  /** 切换收藏，返回切换后的状态；失败时抛出错误，界面已经改回原样 */
  const toggle = async (questionId: ApiId) => {
    const key = String(questionId);
    if (pending.value.has(key)) return isFavorite(key);
    const next = !ids.value.has(key);
    const apply = (favorite: boolean) => {
      const copy = new Set(ids.value);
      if (favorite) copy.add(key);
      else copy.delete(key);
      ids.value = copy;
    };
    apply(next);
    pending.value = new Set(pending.value).add(key);
    try {
      await setFavorite(key, next);
      return next;
    } catch (error) {
      apply(!next);
      throw error;
    } finally {
      const rest = new Set(pending.value);
      rest.delete(key);
      pending.value = rest;
    }
  };

  /** 只在测试里用 */
  const resetForTest = () => {
    ids.value = new Set();
    loadedFor.value = null;
    pending.value = new Set();
    loading = null;
  };

  return { load, isFavorite, toggle, resetForTest };
};
