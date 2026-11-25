<template>
  <div class="hover-card" role="tooltip">
    <div class="who">
      <UserAvatar :avatar="user.userAvatar" :name="displayName" :size="44" />
      <div class="who-text">
        <strong>{{ displayName }}</strong>
        <span>
          @{{ user.userAccount || "--" }}
          <em>{{ formatUserRole(user.userRole) }}</em>
        </span>
      </div>
    </div>
    <p v-if="user.userProfile" class="bio">{{ user.userProfile }}</p>
    <div class="numbers">
      <div>
        <b class="num">{{ solved.all }}</b>
        <span>通过题数</span>
      </div>
      <div>
        <b class="num">{{ streaks.current }}</b>
        <span>连续天数</span>
      </div>
      <div>
        <b class="num">{{ thisWeekSubmits }}</b>
        <span>本周提交</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, onMounted, PropType } from "vue";

import UserAvatar from "@/components/user/UserAvatar.vue";
import { useMyProgress } from "@/composables/useMyProgress";
import { useSubmitCalendar } from "@/composables/useSubmitCalendar";
import { formatUserRole } from "@/utils/userRole";

type CardUser = {
  userName?: string;
  userAccount?: string;
  userAvatar?: string;
  userRole?: string;
  userProfile?: string;
};

const props = defineProps({
  user: { type: Object as PropType<CardUser>, required: true },
});

const displayName = computed(
  () => props.user.userName || props.user.userAccount || "未设置昵称"
);

const { solved, load: loadProgress } = useMyProgress();
const { streaks, thisWeekSubmits, load: loadCalendar } = useSubmitCalendar();

// 卡片出现时取一次（一分钟内不重复取）
onMounted(() => {
  void loadProgress();
  void loadCalendar();
});
</script>

<style scoped>
.hover-card {
  position: absolute;
  z-index: 70;
  left: calc(100% + 12px);
  bottom: 0;
  width: 260px;
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow-float);
  pointer-events: none;
  animation: card-in var(--motion-fast) var(--ease-out);
}

.who {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.who-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.who-text strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.who-text span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12.5px;
}

.who-text em {
  padding: 0 7px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  font-size: 11.5px;
  font-style: normal;
  line-height: 20px;
}

.bio {
  display: -webkit-box;
  margin: -4px 0 0;
  overflow: hidden;
  color: var(--body);
  font-size: 13px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.numbers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.numbers div {
  display: grid;
  gap: 1px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--fill);
}

.numbers b {
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.numbers span {
  color: var(--faint);
  font-size: 11.5px;
  white-space: nowrap;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hover-card {
    animation: none;
  }
}
</style>
