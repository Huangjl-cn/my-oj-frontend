<template>
  <main class="no-auth">
    <section class="panel no-auth-card">
      <CompanionAvatar :size="72" mood="nervous" />
      <h1>这里进不去</h1>
      <p>当前账号没有访问这个页面的权限。需要的话找管理员开通。</p>
      <div class="actions">
        <router-link class="btn primary sm" to="/">
          <AppIcon name="book" :size="16" />
          回到题库
        </router-link>
        <router-link
          v-if="!isLoggedIn"
          class="btn sm"
          :to="{ path: '/user/login', query: { redirect: from } }"
        >
          <AppIcon name="log-in" :size="16" />
          换个账号登录
        </router-link>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import AppIcon from "@/components/ui/AppIcon.vue";

const store = useStore();
const router = useRouter();
const isLoggedIn = computed(() =>
  checkAccess(store.state.user.loginUser, ACCESS_ENUM.USER)
);
/** 被拦下之前想去的页面 */
const from = computed(() => {
  const back = router.options.history.state.back;
  return typeof back === "string" ? back : "/";
});
</script>

<style scoped>
.no-auth {
  display: grid;
  place-items: center;
  padding: 24px 20px;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.no-auth-card {
  width: min(440px, 100%);
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 40px 32px 32px;
  text-align: center;
  --mascot-fill: var(--panel);
}

h1 {
  margin: 8px 0 0;
  color: var(--ink);
  font-size: 26px;
  font-weight: 800;
}

p {
  margin: 0;
  color: var(--muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}
</style>
