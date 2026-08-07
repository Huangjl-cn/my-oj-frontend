<template>
  <AuthShell
    kicker="NEW ACCOUNT"
    title="创建账号"
    subtitle="加入 MyOJ，开始记录你的解题轨迹"
  >
    <a-form
      class="auth-form"
      :model="form"
      layout="vertical"
      @submit="handleSubmit"
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
        <button type="submit" class="auth-submit">注册</button>
      </a-form-item>
    </a-form>

    <template #footer>
      <span>已有账号？</span>
      <button class="auth-link" type="button" @click="goToLogin">去登录</button>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { reactive } from "vue";
import { useRouter } from "vue-router";

import AuthShell from "@/components/user/AuthShell.vue";
import { UserControllerService } from "../../../generated";

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
