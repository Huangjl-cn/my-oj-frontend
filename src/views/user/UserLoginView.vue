<template>
  <AuthShell title="欢迎回来" subtitle="登录后继续做题，进度和草稿都在">
    <form class="auth-form" @submit.prevent="handleSubmit">
      <label class="auth-field">
        <span>账号</span>
        <UiInput
          v-model="form.userAccount"
          icon="user"
          placeholder="请输入账号"
          autocomplete="username"
        />
      </label>
      <label class="auth-field">
        <span>密码</span>
        <UiInput
          v-model="form.userPassword"
          icon="lock"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
        />
      </label>
      <button
        class="btn primary auth-submit"
        type="submit"
        :disabled="submitting"
      >
        <AppIcon :name="submitting ? 'spinner' : 'log-in'" :size="17" />
        {{ submitting ? "登录中" : "登录" }}
      </button>
    </form>

    <template #footer>
      <span>还没有账号？</span>
      <router-link to="/user/register">注册一个</router-link>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
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

const submitting = ref(false);

const handleSubmit = async () => {
  if (submitting.value) return;
  if (!form.userAccount || !form.userPassword) {
    message.warning("请输入账号和密码");
    return;
  }
  submitting.value = true;
  const res = await UserControllerService.userLogin(form).finally(() => {
    submitting.value = false;
  });
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
    message.error(`登录失败，${res.message || "请稍后重试"}`);
  }
};
</script>
