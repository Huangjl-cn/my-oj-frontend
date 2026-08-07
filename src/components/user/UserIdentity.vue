<template>
  <div class="user-identity">
    <UserAvatar
      :avatar="resolvedUser?.userAvatar"
      :name="resolvedUser?.userName || resolvedUser?.userAccount || '用户'"
      :size="size"
    />
    <div class="identity-copy">
      <strong>{{ resolvedUser?.userName || fallbackName }}</strong>
      <span v-if="resolvedUser?.userAccount">
        @{{ resolvedUser.userAccount }}
      </span>
      <code :title="String(displayId)">{{ displayId }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watch, withDefaults } from "vue";

import UserAvatar from "@/components/user/UserAvatar.vue";
import type { ApiId } from "@/services/apiId";
import { getUserSummary } from "@/services/userSummary";

type UserIdentityData = {
  id?: ApiId;
  userName?: string;
  userAccount?: string;
  userAvatar?: string;
};

const props = withDefaults(
  defineProps<{
    user?: UserIdentityData;
    userId?: ApiId;
    size?: number;
  }>(),
  {
    user: undefined,
    userId: undefined,
    size: 38,
  }
);

const loadedUser = ref<UserIdentityData>();
let requestId = 0;

const resolvedUser = computed(() => props.user || loadedUser.value);
const displayId = computed(
  () => resolvedUser.value?.id ?? props.userId ?? "--"
);
const fallbackName = computed(() =>
  props.userId == null ? "未知用户" : "用户信息不可用"
);

watch(
  [() => props.user, () => props.userId],
  async ([user, userId]) => {
    const currentRequest = ++requestId;
    loadedUser.value = undefined;
    if (user || userId == null) return;

    try {
      const result = await getUserSummary(userId);
      if (currentRequest === requestId) loadedUser.value = result;
    } catch {
      if (currentRequest === requestId) loadedUser.value = undefined;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.user-identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.identity-copy {
  min-width: 0;
  display: grid;
  gap: 1px;
}

.identity-copy strong,
.identity-copy span,
.identity-copy code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-copy strong {
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
}

.identity-copy span {
  color: var(--muted);
  font-size: 11px;
}

.identity-copy code {
  color: var(--muted-soft);
  font-family: var(--font-code);
  font-size: 10px;
}
</style>
