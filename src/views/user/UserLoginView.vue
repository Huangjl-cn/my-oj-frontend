<template>
  <AuthShell
    kicker="ACCOUNT ACCESS"
    title="欢迎回来"
    subtitle="登录你的 MyOJ 账号"
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

      <a-form-item field="userPassword" label="密码">
        <a-input-password
          v-model="form.userPassword"
          placeholder="请输入密码"
        />
      </a-form-item>

      <a-form-item>
        <button type="submit" class="auth-submit">登录</button>
      </a-form-item>
    </a-form>

    <template #footer>
      <span>还没有账号？</span>
      <button class="auth-link" type="button" @click="goToRegister">
        立即注册
      </button>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

import AuthShell from "@/components/user/AuthShell.vue";
import { UserControllerService, UserLoginRequest } from "../../../generated";

const form = reactive({
  userAccount: "",
  userPassword: "",
} as UserLoginRequest);

const router = useRouter();
const route = useRoute();
const store = useStore();

const goToRegister = () => {
  router.push({
    path: "/user/register",
  });
};

const handleSubmit = async () => {
  const res = await UserControllerService.userLogin(form);
  if (res.code === 0) {
    await store.dispatch("user/getLoginUser");
    const requestedRedirect = route.query.redirect;
    const redirect =
      typeof requestedRedirect === "string" &&
      requestedRedirect.startsWith("/") &&
      !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : "/";
    router.replace(redirect);
  } else {
    message.error("登陆失败，" + res.message);
  }
};
</script>
