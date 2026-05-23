<template>
  <div id="globalHeader">
    <div class="header-content">
      <!-- Logo 和标题 -->
      <div class="title-bar">
        <img class="logo" src="../assets/logo.png" />
        <div class="title">MyOJ</div>
      </div>

      <!-- 导航菜单 -->
      <div class="menu-container">
        <a-menu
          mode="horizontal"
          :selected-keys="selectedKeys"
          @menu-item-click="doMenuClick"
        >
          <a-menu-item
            v-for="item in visibleRoutes"
            :key="item.path"
            :style="{
              padding: '8px 16px',
              margin: '0 4px',
              borderRadius: 'var(--border-radius-md)',
              transition: 'all var(--transition-fast)',
            }"
          >
            {{ item.name }}
          </a-menu-item>
        </a-menu>
      </div>

      <!-- 用户信息 -->
      <div class="user-info">
        <div>{{ store.state.user?.loginUser?.userName ?? "未登录" }}</div>
        <a-button
          v-if="store.state.user?.loginUser"
          class="switch-account-btn"
          type="outline"
          size="small"
          @click="doSwitchAccount"
        >
          切换账号
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "../router/routes";
import { useRoute, useRouter } from "vue-router";
import { computed, ref } from "vue";
import { useStore } from "vuex";
import checkAccess from "@/access/checkAccess";
import ACCESS_ENUM from "@/access/accessEnum";

const router = useRouter();
const store = useStore();

// 展示在菜单的路由数组
const visibleRoutes = computed(() => {
  return routes.filter((item, index) => {
    if (item.meta?.hideInMenu) {
      return false;
    }
    // 根据权限过滤菜单
    if (
      !checkAccess(store.state.user.loginUser, item?.meta?.access as string)
    ) {
      return false;
    }
    return true;
  });
});

// 默认主页
const selectedKeys = ref(["/"]);

// 路由跳转后，更新选中的菜单项
router.afterEach((to, from, failure) => {
  selectedKeys.value = [to.path];
});

console.log();

setTimeout(() => {
  store.dispatch("user/getLoginUser", {
    userName: "鱼皮管理员",
    userRole: ACCESS_ENUM.ADMIN,
  });
}, 3000);

const doMenuClick = (key: string) => {
  router.push({
    path: key,
  });
};

const doSwitchAccount = () => {
  router.push({
    path: "/user/login",
  });
};
</script>

<style scoped>
#globalHeader {
  background-color: transparent;
  padding: 0 var(--spacing-lg);
  height: 72px;
  display: flex;
  align-items: center;
  transition: all var(--transition-normal);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

/* 标题栏样式 */
.title-bar {
  display: flex;
  align-items: center;
  transition: all var(--transition-fast);
  position: relative;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
}

.title-bar:hover {
  transform: scale(1.02);
}

.title-bar::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-gradient);
  transition: width var(--transition-fast);
  border-radius: 1px;
}

.title-bar:hover::after {
  width: 100%;
}

.title {
  color: var(--text-primary);
  margin-left: var(--spacing-md);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 10px rgba(0, 180, 255, 0.2);
}

.logo {
  height: 44px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.logo:hover {
  transform: rotate(5deg) scale(1.05);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

/* 菜单样式 */
.menu-container {
  flex: 1;
  margin: 0 var(--spacing-xl);
}

.menu-container .arco-menu {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-container .arco-menu-item {
  padding: 8px 16px;
  margin: 0 4px;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.menu-container .arco-menu-item:hover {
  background-color: var(--hover-color);
  border-radius: var(--border-radius-md);
}

/* 用户名样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  position: relative;
}

.user-info:hover {
  background-color: var(--hover-color);
  color: var(--text-primary);
}

.user-info::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width var(--transition-fast);
  border-radius: 1px;
}

.user-info:hover::after {
  width: 80%;
}

/* 切换账号按钮 */
.switch-account-btn {
  border-color: var(--border-color) !important;
  color: var(--text-secondary) !important;
  font-weight: 500 !important;
  transition: all var(--transition-fast) !important;
}

.switch-account-btn:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  background-color: var(--primary-light) !important;
  transform: translateY(-1px) !important;
  box-shadow: var(--shadow-sm) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  #globalHeader {
    padding: 0 var(--spacing-md);
    height: 64px;
  }

  .header-content {
    justify-content: space-between;
  }

  .menu-container {
    margin: 0 var(--spacing-md);
  }

  .title {
    font-size: 18px;
  }

  .logo {
    height: 36px;
  }

  .user-info {
    font-size: 12px;
    gap: var(--spacing-sm);
  }

  .switch-account-btn {
    font-size: 12px !important;
    padding: 4px 8px !important;
  }
}
</style>
