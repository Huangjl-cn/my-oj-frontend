<template>
  <div id="userRegisterView">
    <div class="register-card">
      <div class="card-accent"></div>

      <div class="register-header">
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
        <h2 class="register-title">创建账号</h2>
        <p class="register-subtitle">加入 MyOJ 开始编程挑战</p>
      </div>

      <a-form
        class="register-form"
        :model="form"
        @submit="handleSubmit"
        layout="vertical"
      >
        <a-form-item field="userAccount" label="账号">
          <a-input v-model="form.userAccount" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item field="userName" label="用户名">
          <a-input v-model="form.userName" placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item field="userPassword" label="密码">
          <a-input-password
            v-model="form.userPassword"
            placeholder="请输入密码"
          />
        </a-form-item>

        <a-form-item field="checkPassword" label="确认密码">
          <a-input-password
            v-model="form.checkPassword"
            placeholder="请再次输入密码"
          />
        </a-form-item>

        <a-form-item>
          <button type="submit" class="submit-btn">注册</button>
        </a-form-item>
      </a-form>

      <div class="register-footer">
        <span class="footer-text">已有账号？</span>
        <button class="link-btn" @click="goToLogin">去登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { UserControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRouter } from "vue-router";

const form = reactive({
  userAccount: "",
  userPassword: "",
  checkPassword: "",
  userName: "",
});

const router = useRouter();

const goToLogin = () => {
  router.push({
    path: "/user/login",
  });
};

const handleSubmit = async () => {
  const res = await UserControllerService.userRegister(form);
  if (res.code === 0) {
    message.success("注册成功");
    router.push({
      path: "/user/login",
      replace: true,
    });
  } else {
    message.error("注册失败，" + res.message);
  }
};
</script>

<style scoped>
#userRegisterView {
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
.register-card {
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
  background: linear-gradient(90deg, var(--accent-teal), var(--primary));
}

.register-header {
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

.register-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.register-subtitle {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}

/* Form */
.register-form {
  padding: var(--space-lg) var(--space-xl) 0;
}

.register-form :deep(.arco-form-item) {
  margin-bottom: var(--space-md);
}

.register-form :deep(.arco-form-item-label) {
  color: var(--body-strong) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  padding-bottom: 4px !important;
}

.register-form :deep(.arco-input-inner-wrapper),
.register-form :deep(.arco-input-wrapper) {
  height: 44px;
}

.register-form :deep(.arco-input) {
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
.register-footer {
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
  .register-card {
    max-width: 100%;
    border-radius: var(--radius-lg);
  }

  .register-form {
    padding: var(--space-md) var(--space-lg) 0;
  }

  .register-header {
    padding: var(--space-lg) var(--space-lg) 0;
  }

  .register-footer {
    padding: var(--space-md) var(--space-lg);
  }
}
</style>
