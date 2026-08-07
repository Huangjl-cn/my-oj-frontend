<template>
  <span
    class="user-avatar-image"
    :style="{ '--avatar-size': `${size}px` }"
    role="img"
    :aria-label="`${name || '用户'}的头像`"
  >
    <img v-if="avatarSrc" :src="avatarSrc" alt="" />
    <span v-else class="avatar-loading" aria-hidden="true"></span>
  </span>
</template>

<script setup lang="ts">
import { defineProps, ref, watch, withDefaults } from "vue";

import { resolveUserAvatar } from "@/constants/userAvatars";

const props = withDefaults(
  defineProps<{
    avatar?: string;
    name?: string;
    size?: number;
  }>(),
  {
    avatar: "",
    name: "用户",
    size: 40,
  }
);

const avatarSrc = ref("");
let avatarRequest = 0;

watch(
  () => props.avatar,
  async (avatar) => {
    const request = ++avatarRequest;
    avatarSrc.value = "";
    try {
      const source = await resolveUserAvatar(avatar);
      if (request === avatarRequest) avatarSrc.value = source;
    } catch {
      if (request === avatarRequest) avatarSrc.value = "";
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.user-avatar-image {
  width: var(--avatar-size);
  height: var(--avatar-size);
  display: inline-grid;
  place-items: center;
  flex: 0 0 var(--avatar-size);
  overflow: hidden;
  color: var(--ink);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: 50%;
  font-size: calc(var(--avatar-size) * 0.38);
  font-weight: 600;
}

.user-avatar-image img {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-loading {
  width: 36%;
  height: 36%;
  background: var(--hairline);
  border-radius: 2px;
  animation: avatar-loading-pulse 900ms ease-in-out infinite alternate;
}

@keyframes avatar-loading-pulse {
  to {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .avatar-loading {
    animation: none;
  }
}
</style>
