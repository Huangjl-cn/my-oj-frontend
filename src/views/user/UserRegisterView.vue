<template>
  <AuthShell
    title="创建账号"
    subtitle="注册后，做过的题和草稿都会记下来"
    mood="excited"
  >
    <form class="auth-form" @submit.prevent="handleSubmit">
      <label class="auth-field">
        <span>账号</span>
        <UiInput
          v-model="form.userAccount"
          icon="user"
          placeholder="登录用的账号"
          autocomplete="username"
        />
      </label>
      <label class="auth-field">
        <span>昵称</span>
        <UiInput
          v-model="form.userName"
          icon="edit"
          placeholder="别人看到的名字"
          autocomplete="nickname"
        />
      </label>
      <label class="auth-field">
        <span>密码</span>
        <UiInput
          v-model="form.userPassword"
          icon="lock"
          type="password"
          placeholder="至少 8 位"
          autocomplete="new-password"
        />
      </label>
      <label class="auth-field">
        <span>确认密码</span>
        <UiInput
          v-model="form.checkPassword"
          icon="lock"
          type="password"
          placeholder="再输入一次"
          autocomplete="new-password"
        />
      </label>
      <button
        class="btn primary auth-submit"
        type="submit"
        :disabled="submitting"
      >
        <AppIcon :name="submitting ? 'spinner' : 'check'" :size="17" />
        {{ submitting ? "注册中" : "注册" }}
      </button>
    </form>

    <template #footer>
      <span>已经有账号？</span>
      <router-link to="/user/login">去登录</router-link>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import AuthShell from "@/components/user/AuthShell.vue";
import { UserControllerService } from "../../../generated";

const form = reactive({
  userAccount: "",
  userPassword: "",
  checkPassword: "",
  userName: "",
});

const router = useRouter();

const submitting = ref(false);

const handleSubmit = async () => {
  if (submitting.value) return;
  if (form.userPassword !== form.checkPassword) {
    message.warning("两次输入的密码不一样");
    return;
  }
  submitting.value = true;
  const res = await UserControllerService.userRegister(form).finally(() => {
    submitting.value = false;
  });
  if (res.code === 0) {
    message.success("注册成功");
    router.push({
      path: "/user/login",
      replace: true,
    });
  } else {
    message.error(`注册失败，${res.message || "请稍后重试"}`);
  }
};
</script>
