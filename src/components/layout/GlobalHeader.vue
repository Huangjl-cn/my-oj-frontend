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
      >
        {{ item.name }}
      </a>
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
      <div v-if="isLoggedIn" class="user-entry-wrap">
        <button
          class="user-entry"
          type="button"
          title="进入个人中心"
          aria-describedby="header-user-summary"
          @click="doMenuClick('/profile')"
        >
          <UserAvatar
            :avatar="loginUser.userAvatar"
            :name="loginUser.userName"
            :size="32"
          />
          <span class="user-name">{{ loginUser.userName ?? "用户" }}</span>
        </button>
        <aside id="header-user-summary" class="user-summary" role="tooltip">
          <header class="user-summary-header">
            <UserAvatar
              :avatar="loginUser.userAvatar"
              :name="loginUser.userName || loginUser.userAccount"
              :size="46"
            />
            <div>
              <strong>{{ loginUser.userName || "未设置昵称" }}</strong>
              <span>@{{ loginUser.userAccount || "--" }}</span>
            </div>
            <span class="user-role">{{ roleText(loginUser.userRole) }}</span>
          </header>
          <p class="user-profile">
            {{ loginUser.userProfile || "暂未填写个人简介" }}
          </p>
          <dl class="user-meta">
            <div>
              <dt>账号</dt>
              <dd>{{ loginUser.userAccount || "--" }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatDateTime(loginUser.createTime) }}</dd>
            </div>
          </dl>
          <span class="profile-hint">点击头像进入个人中心</span>
        </aside>
      </div>
      <template v-else>
        <span class="guest-avatar">?</span>
        <span class="user-name">未登录</span>
      </template>
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
import UserAvatar from "@/components/user/UserAvatar.vue";
import { useTheme } from "@/composables/useTheme";
import { routes } from "@/router/routes";
import { formatDateTime } from "@/utils/dateTime";
import { UserControllerService } from "../../../generated";

const router = useRouter();
const route = useRoute();
const store = useStore();
const { isDark, toggleTheme } = useTheme();
const showLeaveDialog = ref(false);
const showLogoutDialog = ref(false);
const pendingPath = ref("");
const loginUser = computed(() => store.state.user.loginUser);
const isLoggedIn = computed(() => {
  const role = loginUser.value?.userRole;
  return !!role && role !== ACCESS_ENUM.NOT_LOGIN;
});

const roleText = (role?: string) => {
  if (role === ACCESS_ENUM.ADMIN) return "管理员";
  if (role === ACCESS_ENUM.USER) return "用户";
  return role || "--";
};

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
  min-width: 0;
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  gap: 4px;
  padding: 0 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-links::-webkit-scrollbar {
  display: none;
}

.nav-link {
  position: relative;
  height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: var(--muted);
  background: transparent;
  border: 0;
  font-family: "Cormorant Garamond", "Noto Serif SC", "Songti SC", SimSun, serif;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 150ms ease;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--ink);
}

.nav-link.active {
  color: var(--ink);
  font-weight: 600;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 28px;
  height: 2px;
  background: var(--primary);
  border-radius: 1px;
  opacity: 0;
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: opacity 150ms ease, transform 180ms ease;
}

.nav-link:hover::after {
  opacity: 0.4;
  transform: translateX(-50%) scaleX(0.45);
}

.nav-link.active::after {
  opacity: 1;
  transform: translateX(-50%) scaleX(1);
}

.nav-link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.nav-right {
  display: flex;
  align-items: center;
  margin-left: auto;
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

.guest-avatar {
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

.user-entry {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 2px 4px 2px 2px;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: var(--radius-pill);
}

.user-entry-wrap {
  position: relative;
  min-width: 0;
}

.user-entry:hover {
  background: var(--surface-card);
}

.user-entry:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.user-summary {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 120;
  width: 300px;
  padding: 16px;
  visibility: hidden;
  color: var(--on-dark-soft);
  background: var(--surface-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateY(-4px);
  transform-origin: top right;
  transition: opacity 150ms ease, transform 150ms ease, visibility 150ms;
  pointer-events: none;
}

.user-summary::before {
  content: "";
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 11px;
}

.user-entry-wrap:focus-within .user-summary {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

@media (hover: hover) and (pointer: fine) {
  .user-entry-wrap:hover .user-summary {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
}

.user-summary-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-summary-header > div {
  min-width: 0;
  display: grid;
  gap: 1px;
}

.user-summary-header strong,
.user-summary-header > div > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-summary-header strong {
  color: var(--on-dark);
  font-size: 14px;
  font-weight: 600;
}

.user-summary-header > div > span {
  color: var(--on-dark-soft);
  font-size: 11px;
}

.user-role {
  padding: 3px 7px;
  color: var(--primary);
  background: var(--primary-light);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 600;
}

.user-profile {
  margin: 12px 0;
  color: var(--on-dark-soft);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.user-meta {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  background: var(--surface-dark-elevated);
  border-radius: var(--radius-sm);
}

.user-meta > div {
  min-width: 0;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px;
}

.user-meta dt {
  color: var(--on-dark-soft);
  font-size: 10px;
}

.user-meta dd {
  overflow: hidden;
  color: var(--on-dark);
  font-family: var(--font-code);
  font-size: 10px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-hint {
  display: block;
  margin-top: 10px;
  color: var(--on-dark-soft);
  font-size: 10px;
  text-align: right;
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
  transition: background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease, color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
  text-decoration: none;
  height: 36px;
}

.btn:active {
  transform: translateY(1px);
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
    min-height: 108px;
    height: auto;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "logo spacer actions"
      "links links links";
    align-content: stretch;
    gap: 0 8px;
    padding: 10px 12px 0;
  }

  .logo {
    grid-area: logo;
    margin-right: 0;
  }

  .logo-text {
    font-size: 24px;
  }

  .nav-links {
    grid-area: links;
    width: calc(100% + 24px);
    max-width: none;
    margin-left: -12px;
    padding: 0 12px;
    gap: 4px;
    overflow-x: auto;
    background: var(--header-surface);
    border-top: 1px solid var(--hairline-soft);
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
  }

  .nav-link {
    flex: 0 0 auto;
    height: 46px;
    padding: 0 11px;
    font-size: 15px;
  }

  .nav-link::after {
    bottom: 3px;
  }

  .nav-right {
    grid-area: actions;
    margin-left: 0;
    gap: 6px;
  }

  .theme-toggle {
    width: 34px;
    height: 34px;
  }

  .user-name {
    display: none;
  }

  .user-entry {
    padding-right: 2px;
  }

  .user-summary {
    display: none;
  }

  .btn {
    height: 34px;
    padding: 7px 10px;
    font-size: 12px;
  }
}

@media (max-width: 390px) {
  .logo-text {
    font-size: 21px;
  }

  .logo {
    gap: 7px;
  }

  .theme-toggle {
    width: 32px;
    height: 32px;
  }

  .nav-right {
    gap: 4px;
  }

  .btn {
    padding-right: 8px;
    padding-left: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .user-summary {
    transition-duration: 120ms;
    transform: none;
  }
}
</style>
