import { computed, ref } from "vue";

import {
  addDays,
  CalendarDay,
  computeStreaks,
  toDateKey,
} from "@/utils/submitCalendar";
import { QuestionControllerService } from "../../generated";

/** 统计最近一年，连续天数也按这一年算 */
const RANGE_DAYS = 365;
/** 头像卡片里的数字过这么久再重新取 */
const STALE_MS = 60 * 1000;

// 个人中心的做题日历和左下角头像卡片共用一份
const days = ref<CalendarDay[]>([]);
const totals = ref({ submits: 0, accepted: 0 });
const loading = ref(false);
const failed = ref(false);
const loadedAt = ref(0);
let pending: Promise<void> | null = null;

export const useSubmitCalendar = () => {
  /** 取一次；force 时总是重新取，否则一分钟内不重复取 */
  const load = async (force = false) => {
    if (!force && loadedAt.value && Date.now() - loadedAt.value < STALE_MS) {
      return;
    }
    if (pending) return pending;
    loading.value = true;
    failed.value = false;
    pending = (async () => {
      try {
        const response = await QuestionControllerService.getMySubmitCalendar(
          RANGE_DAYS
        );
        if (response.code !== 0) throw new Error(response.message);
        days.value = response.data?.days ?? [];
        totals.value = {
          submits: response.data?.totalSubmits ?? 0,
          accepted: response.data?.acceptedSubmits ?? 0,
        };
        loadedAt.value = Date.now();
      } catch {
        failed.value = true;
      } finally {
        loading.value = false;
        pending = null;
      }
    })();
    return pending;
  };

  const today = () => new Date();
  const streaks = computed(() => computeStreaks(days.value, today()));

  /** 本周（周一到今天）的提交次数 */
  const thisWeekSubmits = computed(() => {
    const now = today();
    const monday = toDateKey(addDays(now, -((now.getDay() + 6) % 7)));
    const todayKey = toDateKey(now);
    return days.value
      .filter((day) => day.date && day.date >= monday && day.date <= todayKey)
      .reduce((sum, day) => sum + (day.submitCount ?? 0), 0);
  });

  /** 换账号或退出时清掉 */
  const reset = () => {
    days.value = [];
    totals.value = { submits: 0, accepted: 0 };
    loadedAt.value = 0;
    failed.value = false;
  };

  return {
    days,
    totals,
    loading,
    failed,
    streaks,
    thisWeekSubmits,
    load,
    reset,
  };
};
