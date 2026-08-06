<template>
  <nav id="globalHeader">
    <a class="logo" href="/" @click.prevent="doMenuClick('/')">
      <span class="logo-glyph">
        <svg viewBox="0 0 28 28" fill="none">
          <path
            d="M7 6 C3 7 1 10 1 14 C1 18 3 21 7 22"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <path
            d="M21 6 C25 7 27 10 27 14 C27 18 25 21 21 22"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <path
            d="M12 4 C14 9 15 19 16 24"
            stroke="var(--primary)"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="logo-text">MyOJ</span>
    </a>
    <div class="nav-links">
      <a
        v-for="item in visibleRoutes"
        :key="item.path"
        :class="['nav-link', { active: selectedKeys[0] === item.path }]"
        @click="doMenuClick(item.path)"
        >{{ item.name }}</a
      >
    </div>
    <div class="nav-right">
      <button
        class="theme-toggle"
        type="button"
        :aria-label="isDark ? '切换为亮色主题' : '切换为暗色主题'"
        :title="isDark ? '切换为亮色主题' : '切换为暗色主题'"
        @click="toggleTheme"
      >
        <IconSun v-if="isDark" />
        <IconMoon v-else />
      </button>
      <span class="user-avatar">{{
        (store.state.user?.loginUser?.userName ?? "?")[0]
      }}</span>
      <span class="user-name">{{
        store.state.user?.loginUser?.userName ?? "未登录"
      }}</span>
      <button
        v-if="isLoggedIn"
        class="btn btn-secondary"
        @click="doSwitchAccount"
      >
        切换账号
      </button>
      <button v-else class="btn btn-secondary" @click="goToLogin">登录</button>
    </div>
  </nav>
  <ConfirmDialog
    v-model:visible="showLeaveDialog"
    title="离开更新页面"
    message="离开后，当前尚未提交的题目修改将不会保留。"
    confirm-text="离开页面"
    @confirm="confirmNavigation"
  />
  <ConfirmDialog
    v-model:visible="showLogoutDialog"
    title="退出登录"
    message="确定退出当前账号并返回登录页面吗？"
    confirm-text="退出登录"
    tone="danger"
    @confirm="confirmLogout"
  />
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { IconMoon, IconSun } from "@arco-design/web-vue/es/icon";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

import checkAccess from "@/access/checkAccess";
import ACCESS_ENUM from "@/access/accessEnum";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import { useTheme } from "@/composables/useTheme";
import { routes } from "@/router/routes";
import { UserControllerService } from "../../../generated";

const router = useRouter();
const route = useRoute();
const store = useStore();
const { isDark, toggleTheme } = useTheme();
const showLeaveDialog = ref(false);
const showLogoutDialog = ref(false);
const pendingPath = ref("");
const isLoggedIn = computed(() => {
  const role = store.state.user?.loginUser?.userRole;
  return !!role && role !== ACCESS_ENUM.NOT_LOGIN;
});

const visibleRoutes = computed(() => {
  return routes.filter((item) => {
    if (item.meta?.hideInMenu) return false;
    if (!checkAccess(store.state.user.loginUser, item?.meta?.access as string))
      return false;
    return true;
  });
});

const selectedKeys = ref(["/"]);

router.afterEach((to) => {
  selectedKeys.value = [to.path];
});

setTimeout(() => {
  store.dispatch("user/getLoginUser", {
    userName: "鱼皮管理员",
    userRole: ACCESS_ENUM.ADMIN,
  });
}, 3000);

const doMenuClick = (path: string) => {
  if (route.path === "/update/question" && path !== route.path) {
    pendingPath.value = path;
    showLeaveDialog.value = true;
    return;
  }
  router.push({ path });
};

const doSwitchAccount = () => {
  showLogoutDialog.value = true;
};

const goToLogin = () => {
  router.push({ path: "/user/login" });
};

const confirmNavigation = () => {
  const path = pendingPath.value;
  pendingPath.value = "";
  showLeaveDialog.value = false;
  if (path) router.push({ path });
};

const confirmLogout = async () => {
  const response = await UserControllerService.userLogout();
  if (response.code !== 0) {
    message.error(response.message || "退出登录失败");
    return;
  }
  showLogoutDialog.value = false;
  await store.dispatch("user/getLoginUser");
  router.push({ path: "/user/login" });
};
</script>

<style scoped>
#globalHeader {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background: var(--header-surface);
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
  gap: 8px;
  transition: background-color 240ms ease, border-color 180ms ease;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  margin-right: 20px;
}

.logo-glyph {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--ink);
}

.logo-glyph svg {
  width: 18px;
  height: 18px;
}

.logo-text {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.nav-link.active {
  color: var(--ink);
  position: relative;
}

.nav-link.active::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: var(--primary);
  border-radius: 1px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--muted);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: 50%;
  cursor: pointer;
  transition: color 150ms ease, background-color 150ms ease,
    border-color 150ms ease;
}

.theme-toggle:hover {
  color: var(--ink);
  background: var(--surface-card);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.theme-toggle svg {
  width: 17px;
  height: 17px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  border: 1px solid var(--hairline);
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s;
  text-decoration: none;
  height: 36px;
}

.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
}

.btn-primary:hover {
  background: var(--primary-active);
}

.btn-secondary {
  background: var(--surface-card);
  color: var(--ink);
  border: 1px solid var(--hairline);
}

.btn-secondary:hover {
  background: var(--surface-soft);
}

@media (max-width: 768px) {
  #globalHeader {
    padding: 0 12px;
    gap: 4px;
  }

  .nav-links {
    gap: 2px;
  }

  .nav-link {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>
