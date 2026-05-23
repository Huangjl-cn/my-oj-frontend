<template>
  <div id="userLoginView">
    <div class="login-container">
      <div class="login-header">
        <img class="logo" src="../../assets/logo.png" />
        <h2>用户登录</h2>
        <p class="subtitle">欢迎回到 MyOJ</p>
      </div>
      <a-form
        class="login-form"
        label-align="left"
        auto-label-width
        :model="form"
        @submit="handleSubmit"
      >
        <a-form-item field="userAccount" label="账号">
          <a-input
            v-model="form.userAccount"
            placeholder="请输入账号"
            size="large"
          />
        </a-form-item>
        <a-form-item
          field="userPassword"
          tooltip="密码不少于 8 位"
          label="密码"
        >
          <a-input-password
            v-model="form.userPassword"
            placeholder="请输入密码"
            size="large"
          />
        </a-form-item>
        <a-form-item>
          <div class="form-actions">
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              class="login-button"
            >
              登录
            </a-button>
            <a-button
              type="outline"
              size="large"
              class="register-button"
              @click="goToRegister"
            >
              注册
            </a-button>
          </div>
        </a-form-item>
      </a-form>
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
    135deg,
    #f8fafc 0%,
    #e2e8f0 25%,
    #cbd5e1 50%,
    #e2e8f0 75%,
    #f8fafc 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: var(--spacing-md);
  position: relative;
  overflow: hidden;
}

/* 背景装饰效果 */
#userLoginView::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
      circle at 30% 40%,
      rgba(99, 102, 241, 0.05),
      transparent 50%
    ),
    radial-gradient(
      circle at 70% 60%,
      rgba(139, 92, 246, 0.05),
      transparent 50%
    );
  animation: rotate 20s linear infinite;
  z-index: 0;
}

/* 渐变背景动画 */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 登录容器样式 */
.login-container {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
  padding: var(--spacing-2xl);
  width: 100%;
  max-width: 520px;
  transition: all var(--transition-normal);
  position: relative;
  z-index: 1;
  animation: fadeInUp var(--transition-normal) ease-out;
}

.login-container:hover {
  box-shadow: var(--shadow-2xl);
  border-color: var(--border-light);
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

/* 登录头部样式 */
.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  position: relative;
}

.login-header::after {
  content: "";
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: var(--primary-gradient);
  border-radius: 1.5px;
}

.login-header .logo {
  height: 80px;
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
}

.login-header .logo:hover {
  transform: rotate(5deg) scale(1.05);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.login-header h2 {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 15px rgba(0, 180, 255, 0.2);
}

.login-header .subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

/* 表单样式 */
.login-form {
  width: 100%;
}

/* 表单项样式 */
.login-form .arco-form-item {
  margin-bottom: var(--spacing-lg);
}

.login-form .arco-form-item-label {
  color: var(--text-secondary) !important;
  font-weight: 500 !important;
  font-size: 14px !important;
}

.login-form .arco-input,
.login-form .arco-input-password {
  background-color: var(--surface-color) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: var(--border-radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.login-form .arco-input:hover,
.login-form .arco-input-password:hover {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-light) !important;
}

.login-form .arco-input:focus,
.login-form .arco-input-password:focus {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-light) !important;
}

/* 表单操作按钮样式 */
.form-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-2xl);
}

.login-button {
  flex: 1;
  background: var(--primary-gradient) !important;
  border: none !important;
  border-radius: var(--border-radius-md) !important;
  font-weight: 600 !important;
  transition: all var(--transition-fast) !important;
  padding: var(--spacing-md) !important;
}

.login-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 12px rgba(0, 180, 255, 0.4) !important;
}

.register-button {
  flex: 1;
  border-color: var(--border-color) !important;
  color: var(--text-secondary) !important;
  border-radius: var(--border-radius-md) !important;
  transition: all var(--transition-fast) !important;
  padding: var(--spacing-md) !important;
  font-weight: 600 !important;
}

.register-button:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: var(--spacing-xl);
    margin: var(--spacing-sm);
  }

  .login-header h2 {
    font-size: 24px;
  }

  .login-header .logo {
    height: 64px;
  }

  .form-actions {
    flex-direction: column;
  }

  .login-button,
  .register-button {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { reactive } from "vue";
import { UserControllerService, UserLoginRequest } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

/**
 * 表单信息
 */
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

/**
 * 提交表单
 * @param data
 */
const handleSubmit = async () => {
  const res = await UserControllerService.userLoginUsingPost(form);
  // 登录成功，跳转到主页
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
