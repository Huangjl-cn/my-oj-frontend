<template>
  <nav class="rail" aria-label="主导航">
    <router-link to="/" class="rail-logo" aria-label="MyOJ 首页">
      <CompanionAvatar :size="38" />
    </router-link>

    <router-link
      to="/"
      :class="['rail-btn', { on: section === 'problems' }]"
      style="--tint: var(--tint-blue)"
      data-tip="题库"
      aria-label="题库"
    >
      <AppIcon name="book" :size="21" />
    </router-link>
    <router-link
      v-if="isLoggedIn"
      to="/lists"
      :class="['rail-btn', { on: section === 'lists' }]"
      style="--tint: var(--tint-yellow)"
      data-tip="题单"
      aria-label="题单"
    >
      <AppIcon name="layers" :size="21" />
    </router-link>
    <router-link
      to="/question_submit"
      :class="['rail-btn', { on: section === 'submissions' }]"
      style="--tint: var(--tint-green)"
      data-tip="提交记录"
      aria-label="提交记录"
    >
      <AppIcon name="list-checks" :size="21" />
    </router-link>
    <router-link
      v-if="isLoggedIn"
      to="/stats"
      :class="['rail-btn', { on: section === 'stats' }]"
      style="--tint: var(--tint-orange)"
      data-tip="学习统计"
      aria-label="学习统计"
    >
      <AppIcon name="chart" :size="21" />
    </router-link>

    <template v-if="isLoggedIn">
      <hr />
      <RailMenu
        label="出题"
        icon="pen-square"
        style="--tint: var(--tint-pink)"
        :items="authorItems"
        :active="section === 'authoring'"
      />
      <RailMenu
        v-if="isAdmin"
        label="管理"
        icon="sliders"
        style="--tint: var(--tint-teal)"
        :items="adminItems"
        :active="section === 'admin'"
      />
    </template>

    <span class="gap" />

    <button
      class="rail-btn"
      type="button"
      :style="{ '--tint': isDark ? 'var(--tint-amber)' : 'var(--tint-indigo)' }"
      :data-tip="isDark ? '浅色模式' : '深色模式'"
      :aria-label="isDark ? '切换为浅色模式' : '切换为深色模式'"
      @click="toggleTheme"
    >
      <AppIcon :name="isDark ? 'sun' : 'moon'" :size="20" />
    </button>

    <div
      v-if="isLoggedIn"
      class="account"
      @mouseenter="showCard"
      @mouseleave="hideCard"
    >
      <RailMenu
        :label="loginUser.userName || '我的账号'"
        :items="accountItems"
        :active="section === 'profile'"
        no-tip
        @toggle="onAccountMenu"
      >
        <template #trigger>
          <UserAvatar
            :avatar="loginUser.userAvatar"
            :name="loginUser.userName"
            :size="32"
          />
        </template>
        <template #header>
          <strong class="who">{{ loginUser.userName || "未设置昵称" }}</strong>
          <span class="who-sub">
            @{{ loginUser.userAccount || "--" }} ·
            {{ formatUserRole(loginUser.userRole) }}
          </span>
        </template>
      </RailMenu>
      <UserHoverCard v-if="cardOpen" :user="loginUser" />
    </div>
    <router-link
      v-else
      to="/user/login"
      class="rail-btn"
      data-tip="登录"
      aria-label="登录"
    >
      <AppIcon name="log-in" :size="20" />
    </router-link>

    <ConfirmDialog
      v-model:visible="showLogoutDialog"
      title="退出登录"
      message="确定退出当前账号并返回登录页面吗？"
      confirm-text="退出登录"
      tone="danger"
      @confirm="confirmLogout"
    />
  </nav>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import RailMenu from "@/components/layout/RailMenu.vue";
import UserHoverCard from "@/components/layout/UserHoverCard.vue";
import { RailMenuItem } from "@/components/layout/railMenu";
import AppIcon from "@/components/ui/AppIcon.vue";
import UserAvatar from "@/components/user/UserAvatar.vue";
import { useSubmitCalendar } from "@/composables/useSubmitCalendar";
import { useTheme } from "@/composables/useTheme";
import { formatUserRole } from "@/utils/userRole";
import { UserControllerService } from "../../../generated";

const route = useRoute();
const router = useRouter();
const store = useStore();
const { isDark, toggleTheme } = useTheme();
const showLogoutDialog = ref(false);

const loginUser = computed(() => store.state.user.loginUser ?? {});
const isLoggedIn = computed(() =>
  checkAccess(loginUser.value, ACCESS_ENUM.USER)
);
const isAdmin = computed(() => checkAccess(loginUser.value, ACCESS_ENUM.ADMIN));

// ===== 头像悬停卡片：停一下才出现，移开稍后消失；菜单打开时不显示 =====
const CARD_OPEN_DELAY = 250;
const CARD_CLOSE_DELAY = 120;
const cardOpen = ref(false);
const menuOpen = ref(false);
let cardTimer: number | undefined;

const showCard = () => {
  if (menuOpen.value) return;
  window.clearTimeout(cardTimer);
  cardTimer = window.setTimeout(() => (cardOpen.value = true), CARD_OPEN_DELAY);
};
const hideCard = () => {
  window.clearTimeout(cardTimer);
  cardTimer = window.setTimeout(
    () => (cardOpen.value = false),
    CARD_CLOSE_DELAY
  );
};
const onAccountMenu = (open: boolean) => {
  menuOpen.value = open;
  if (open) {
    window.clearTimeout(cardTimer);
    cardOpen.value = false;
  }
};
onBeforeUnmount(() => window.clearTimeout(cardTimer));

// 换账号或退出后，卡片里的数字重新取
const { reset: resetCalendar } = useSubmitCalendar();
watch(
  () => loginUser.value?.id,
  () => resetCalendar()
);

/** 当前页面属于图标栏的哪一项 */
const section = computed(() => {
  const path = route.path;
  if (
    path === "/" ||
    path.startsWith("/questions") ||
    path.startsWith("/problem")
  ) {
    return "problems";
  }
  if (path.startsWith("/question_submit")) return "submissions";
  if (path.startsWith("/stats")) return "stats";
  if (path.startsWith("/lists")) return "lists";
  if (["/add/question", "/update/question", "/my/question"].includes(path)) {
    return "authoring";
  }
  if (path.startsWith("/manage")) return "admin";
  if (path.startsWith("/profile")) return "profile";
  return "";
});

const authorItems: RailMenuItem[] = [
  { label: "创建题目", icon: "plus", to: "/add/question" },
  { label: "我的题目", icon: "files", to: "/my/question" },
];

const adminItems: RailMenuItem[] = [
  { label: "题目管理", icon: "book", to: "/manage/question/" },
  { label: "用户管理", icon: "users", to: "/manage/user" },
];

const accountItems: RailMenuItem[] = [
  { label: "个人中心", icon: "user", to: "/profile" },
  {
    label: "退出登录",
    icon: "log-out",
    danger: true,
    action: () => {
      showLogoutDialog.value = true;
    },
  },
];

const confirmLogout = async () => {
  const response = await UserControllerService.userLogout();
  if (response.code !== 0) {
    message.error(response.message || "退出登录失败");
    return;
  }
  showLogoutDialog.value = false;
  await store.dispatch("user/getLoginUser");
  void router.push({ path: "/user/login" });
};
</script>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 0;
  height: 100%;
}

.rail-logo {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: var(--radius-md);
  --mascot-fill: var(--bg);
}

.rail hr {
  width: 26px;
  border: none;
  border-top: 1px solid var(--line-strong);
  margin: 10px 0;
}

.gap {
  flex: 1;
}

.rail :deep(.rail-btn) {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  text-decoration: none;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.rail :deep(.rail-btn:hover) {
  color: var(--ink);
  background: var(--fill-strong);
}

.rail :deep(.rail-btn > svg) {
  transition: transform var(--motion-fast) var(--ease-out);
}

/* 悬停（键盘聚焦也一样）时图标换成这一项自己的颜色（--tint，见 tokens.css），底色淡淡带一点。
   窄屏变成底部栏时不上色（见下面的 720px），手机上点完不会一直留着颜色 */
.rail :deep(.rail-btn:hover),
.rail :deep(.rail-btn:focus-visible) {
  color: var(--tint, var(--ink));
  background: color-mix(in srgb, var(--tint, var(--ink)) 11%, transparent);
}

.rail :deep(.rail-btn.on:hover) {
  color: var(--tint, var(--ink));
  background: var(--panel);
}

.rail :deep(.rail-btn:hover > svg) {
  transform: scale(1.08);
}

@media (prefers-reduced-motion: reduce) {
  .rail :deep(.rail-btn:hover > svg) {
    transform: none;
  }
}

.rail :deep(.rail-btn.on) {
  color: var(--ink);
  background: var(--panel);
  border-color: var(--line);
  box-shadow: var(--shadow-panel);
}

.account {
  position: relative;
}

.who {
  display: block;
  color: var(--ink);
  font-size: 14px;
}

.who-sub {
  color: var(--muted);
  font-size: 12.5px;
}

/* 窄屏：图标栏移到底部 */
@media (max-width: 720px) {
  .rail {
    flex-direction: row;
    justify-content: space-around;
    height: auto;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    background: var(--panel);
    border-top: 1px solid var(--line);
  }

  .rail-logo,
  .rail hr,
  .gap {
    display: none;
  }

  .rail :deep([data-tip]:hover::after) {
    display: none;
  }

  .rail :deep(.rail-btn:hover),
  .rail :deep(.rail-btn:focus-visible) {
    color: var(--muted);
    background: transparent;
  }

  .rail :deep(.rail-btn.on),
  .rail :deep(.rail-btn.on:hover) {
    color: var(--ink);
    background: var(--panel);
  }

  .rail :deep(.rail-btn:hover > svg) {
    transform: none;
  }

  /* 图标栏在底部时卡片没地方放 */
  .account :deep(.hover-card) {
    display: none;
  }
}
</style>
