<template>
  <div id="userRegisterView">
    <div class="register-container">
      <div class="register-header">
        <img class="logo" src="../../assets/logo.png" />
        <h2>用户注册</h2>
        <p class="subtitle">创建新账号加入 MyOJ</p>
      </div>
      <a-form
        class="register-form"
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
        <a-form-item
          field="checkPassword"
          tooltip="两次密码需一致"
          label="确认密码"
        >
          <a-input-password
            v-model="form.checkPassword"
            placeholder="请再次输入密码"
            size="large"
          />
        </a-form-item>
        <a-form-item field="userName" label="用户名">
          <a-input
            v-model="form.userName"
            placeholder="请输入用户名"
            size="large"
          />
        </a-form-item>
        <a-form-item>
          <div class="form-actions">
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              class="register-button"
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
#userRegisterView {
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
#userRegisterView::before {
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

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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

/* 注册容器样式 */
.register-container {
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

.register-container:hover {
  box-shadow: var(--shadow-2xl);
  border-color: var(--border-light);
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

/* 注册头部样式 */
.register-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  position: relative;
}

.register-header::after {
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

.register-header .logo {
  height: 80px;
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
}

.register-header .logo:hover {
  transform: rotate(5deg) scale(1.05);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.register-header h2 {
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

.register-header .subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

/* 表单样式 */
.register-form {
  width: 100%;
}

/* 表单项样式 */
.register-form .arco-form-item {
  margin-bottom: var(--spacing-lg);
}

.register-form .arco-form-item-label {
  color: var(--text-secondary) !important;
  font-weight: 500 !important;
  font-size: 14px !important;
}

.register-form .arco-input,
.register-form .arco-input-password {
  background-color: var(--surface-color) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: var(--border-radius-md) !important;
  transition: all var(--transition-fast) !important;
}

.register-form .arco-input:hover,
.register-form .arco-input-password:hover {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-light) !important;
}

.register-form .arco-input:focus,
.register-form .arco-input-password:focus {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-light) !important;
}

/* 表单操作按钮样式 */
.form-actions {
  margin-top: var(--spacing-2xl);
}

.register-button {
  width: 100%;
  background: var(--primary-gradient) !important;
  border: none !important;
  border-radius: var(--border-radius-md) !important;
  font-weight: 600 !important;
  transition: all var(--transition-fast) !important;
  padding: var(--spacing-md) !important;
}

.register-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 12px rgba(0, 180, 255, 0.4) !important;
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
  .register-container {
    padding: var(--spacing-xl);
    margin: var(--spacing-sm);
  }

  .register-header h2 {
    font-size: 24px;
  }

  .register-header .logo {
    height: 64px;
  }
}
</style>

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

const handleSubmit = async () => {
  const res = await UserControllerService.userRegisterUsingPost(form);
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
