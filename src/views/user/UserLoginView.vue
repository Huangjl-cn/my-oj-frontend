<template>
  <div id="userLoginView">
    <div class="login-card">
      <div class="card-accent"></div>

      <div class="login-header">
        <div class="logo-wrap">
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
        </div>
        <h2 class="login-title">欢迎回来</h2>
        <p class="login-subtitle">登录你的 MyOJ 账号</p>
      </div>

      <a-form
        class="login-form"
        :model="form"
        @submit="handleSubmit"
        layout="vertical"
      >
        <a-form-item field="userAccount" label="账号">
          <a-input v-model="form.userAccount" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item field="userPassword" label="密码">
          <a-input-password
            v-model="form.userPassword"
            placeholder="请输入密码"
          />
        </a-form-item>

        <a-form-item>
          <button type="submit" class="submit-btn">登录</button>
        </a-form-item>
      </a-form>

      <div class="login-footer">
        <span class="footer-text">还没有账号？</span>
        <button class="link-btn" @click="goToRegister">立即注册</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#userLoginView {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    180deg,
    var(--surface-card) 0%,
    var(--surface-soft) 30%,
    var(--canvas) 100%
  );
  padding: var(--space-md);
  position: relative;
  overflow: hidden;
}

/* Card */
.login-card {
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  padding: 0;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--accent-teal));
}

.login-header {
  text-align: center;
  padding: var(--space-xl) var(--space-xl) 0;
}

.logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface-soft);
  margin-bottom: var(--space-md);
  color: var(--ink);
}

.logo-wrap svg {
  width: 22px;
  height: 22px;
}

.login-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.login-subtitle {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}

/* Form */
.login-form {
  padding: var(--space-lg) var(--space-xl) 0;
}

.login-form :deep(.arco-form-item) {
  margin-bottom: var(--space-md);
}

.login-form :deep(.arco-form-item-label) {
  color: var(--body-strong) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  padding-bottom: 4px !important;
}

.login-form :deep(.arco-input-inner-wrapper),
.login-form :deep(.arco-input-wrapper) {
  height: 44px;
}

.login-form :deep(.arco-input) {
  font-size: 15px !important;
}

/* Submit button */
.submit-btn {
  width: 100%;
  height: 44px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  margin-top: var(--space-xs);
}

.submit-btn:hover {
  background: var(--primary-active);
}

.submit-btn:active {
  background: var(--primary-active);
}

/* Footer */
.login-footer {
  text-align: center;
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--hairline-soft);
  margin-top: var(--space-md);
}

.footer-text {
  font-size: 13px;
  color: var(--muted);
}

.link-btn {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  transition: color 0.15s;
}

.link-btn:hover {
  color: var(--primary-active);
}

@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
    border-radius: var(--radius-lg);
  }

  .login-form {
    padding: var(--space-md) var(--space-lg) 0;
  }

  .login-header {
    padding: var(--space-lg) var(--space-lg) 0;
  }

  .login-footer {
    padding: var(--space-md) var(--space-lg);
  }
}
</style>

<script setup lang="ts">
import { reactive } from "vue";
import { UserControllerService, UserLoginRequest } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

const form = reactive({
  userAccount: "",
  userPassword: "",
} as UserLoginRequest);

const router = useRouter();
const store = useStore();

const goToRegister = () => {
  router.push({
    path: "/user/register",
  });
};

const handleSubmit = async () => {
  const res = await UserControllerService.userLoginUsingPost(form);
  if (res.code === 0) {
    await store.dispatch("user/getLoginUser");
    router.push({
      path: "/",
      replace: true,
    });
  } else {
    message.error("登陆失败，" + res.message);
  }
};
</script>
