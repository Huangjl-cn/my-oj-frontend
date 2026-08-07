<template>
  <main id="userProfileView">
    <header class="page-header">
      <span class="page-kicker">ACCOUNT</span>
      <h1>个人中心</h1>
    </header>

    <div class="profile-layout">
      <aside class="identity-panel">
        <UserAvatar
          :avatar="loginUser.userAvatar"
          :name="loginUser.userName || loginUser.userAccount"
          :size="112"
        />
        <div class="identity-heading">
          <h2>{{ loginUser.userName || "未设置昵称" }}</h2>
          <p>@{{ loginUser.userAccount || "--" }}</p>
        </div>
        <span class="identity-role">{{ roleText(loginUser.userRole) }}</span>
        <p class="identity-profile">
          {{ loginUser.userProfile || "暂未填写个人简介" }}
        </p>
        <dl class="identity-meta">
          <div>
            <dt>注册时间</dt>
            <dd>{{ formatDateTime(loginUser.createTime) }}</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{{ formatDateTime(loginUser.updateTime) }}</dd>
          </div>
        </dl>
      </aside>

      <section class="settings-panel">
        <div class="settings-tabs" role="tablist" aria-label="个人设置">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'profile'"
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            <IconUser />
            个人资料
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'password'"
            :class="{ active: activeTab === 'password' }"
            @click="activeTab = 'password'"
          >
            <IconLock />
            修改密码
          </button>
        </div>

        <form
          v-if="activeTab === 'profile'"
          class="settings-form"
          @submit.prevent="saveProfile"
        >
          <header class="form-heading">
            <h2>个人资料</h2>
            <p>更新昵称、简介和头像。</p>
          </header>

          <label class="form-field">
            <span>账号</span>
            <input :value="loginUser.userAccount" readonly />
          </label>
          <label class="form-field">
            <span>昵称</span>
            <input
              v-model="profileForm.userName"
              autocomplete="name"
              placeholder="请输入昵称"
            />
          </label>
          <label class="form-field">
            <span>个人简介</span>
            <textarea
              v-model="profileForm.userProfile"
              rows="4"
              placeholder="介绍一下自己"
            ></textarea>
          </label>
          <fieldset class="avatar-field">
            <legend>选择头像</legend>
            <AvatarPicker v-model="profileForm.userAvatar" />
          </fieldset>
          <p v-if="profileError" class="form-error">{{ profileError }}</p>
          <div class="form-actions">
            <button
              class="primary-button"
              type="submit"
              :disabled="profileSaving"
            >
              <IconSave />
              {{ profileSaving ? "保存中..." : "保存资料" }}
            </button>
          </div>
        </form>

        <form
          v-else
          class="settings-form password-form"
          @submit.prevent="savePassword"
        >
          <header class="form-heading">
            <h2>修改密码</h2>
            <p>新密码至少需要 8 位。</p>
          </header>

          <label class="form-field">
            <span>旧密码</span>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              autocomplete="current-password"
              placeholder="请输入旧密码"
            />
          </label>
          <label class="form-field">
            <span>新密码</span>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="至少 8 位"
            />
          </label>
          <label class="form-field">
            <span>确认新密码</span>
            <input
              v-model="passwordForm.checkPassword"
              type="password"
              autocomplete="new-password"
              placeholder="再次输入新密码"
            />
          </label>
          <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
          <div class="form-actions">
            <button
              class="primary-button"
              type="submit"
              :disabled="passwordSaving"
            >
              <IconLock />
              {{ passwordSaving ? "修改中..." : "修改密码" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { IconLock, IconSave, IconUser } from "@arco-design/web-vue/es/icon";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useStore } from "vuex";

import AvatarPicker from "@/components/user/AvatarPicker.vue";
import UserAvatar from "@/components/user/UserAvatar.vue";
import {
  DEFAULT_USER_AVATAR,
  normalizeUserAvatar,
} from "@/constants/userAvatars";
import { formatDateTime } from "@/utils/dateTime";
import { UserControllerService } from "../../../generated";

const store = useStore();
const activeTab = ref<"profile" | "password">("profile");
const profileSaving = ref(false);
const passwordSaving = ref(false);
const profileError = ref("");
const passwordError = ref("");
const loginUser = computed(() => store.state.user.loginUser);
const profileForm = reactive({
  userName: "",
  userAvatar: DEFAULT_USER_AVATAR,
  userProfile: "",
});
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  checkPassword: "",
});

watch(
  loginUser,
  (user) => {
    Object.assign(profileForm, {
      userName: user.userName ?? "",
      userAvatar: normalizeUserAvatar(user.userAvatar),
      userProfile: user.userProfile ?? "",
    });
  },
  { immediate: true }
);

onMounted(async () => {
  try {
    await store.dispatch("user/getLoginUser");
  } catch {
    message.error("加载个人资料失败");
  }
});

const roleText = (role?: string) => {
  if (role === "admin") return "管理员";
  if (role === "user") return "用户";
  return role || "--";
};

const saveProfile = async () => {
  const userName = profileForm.userName.trim();
  if (!userName) {
    profileError.value = "昵称不能为空";
    return;
  }

  profileSaving.value = true;
  profileError.value = "";
  try {
    const response = await UserControllerService.updateMyUser({
      userName,
      userAvatar: profileForm.userAvatar,
      userProfile: profileForm.userProfile.trim(),
    });
    if (response.code !== 0) {
      profileError.value = response.message || "保存个人资料失败";
      return;
    }
    await store.dispatch("user/getLoginUser");
    message.success("个人资料已更新");
  } catch {
    profileError.value = "保存个人资料失败";
  } finally {
    profileSaving.value = false;
  }
};

const savePassword = async () => {
  passwordError.value = "";
  if (!passwordForm.oldPassword) {
    passwordError.value = "请输入旧密码";
    return;
  }
  if (passwordForm.newPassword.length < 8) {
    passwordError.value = "新密码不能少于 8 位";
    return;
  }
  if (passwordForm.newPassword !== passwordForm.checkPassword) {
    passwordError.value = "两次输入的新密码不一致";
    return;
  }

  passwordSaving.value = true;
  try {
    const response = await UserControllerService.updateMyPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      checkPassword: passwordForm.checkPassword,
    });
    if (response.code !== 0) {
      passwordError.value = response.message || "修改密码失败";
      return;
    }
    Object.assign(passwordForm, {
      oldPassword: "",
      newPassword: "",
      checkPassword: "",
    });
    message.success("密码已修改");
  } catch {
    passwordError.value = "修改密码失败";
  } finally {
    passwordSaving.value = false;
  }
};
</script>

<style scoped>
#userProfileView {
  width: min(1180px, 100%);
  min-width: 0;
  margin: 0 auto;
  padding: var(--space-lg);
  animation: claude-fade-up 0.4s ease-out;
}

.page-header {
  margin-bottom: 22px;
}

.page-kicker {
  color: var(--primary);
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 500;
}

.page-header h1 {
  margin: 2px 0 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 400;
  letter-spacing: 0;
}

.profile-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  gap: 18px;
}

.identity-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 24px 24px;
  color: var(--on-dark);
  background: var(--surface-dark);
  border-radius: var(--radius-lg);
}

.identity-heading {
  max-width: 100%;
  margin-top: 16px;
  text-align: center;
}

.identity-heading h2,
.identity-heading p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-heading h2 {
  color: var(--on-dark);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
}

.identity-heading p {
  color: var(--on-dark-soft);
  font-size: 12px;
}

.identity-role {
  margin-top: 12px;
  padding: 3px 10px;
  color: var(--on-dark);
  background: var(--surface-dark-elevated);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 600;
}

.identity-profile {
  width: 100%;
  margin-top: 18px;
  color: var(--on-dark-soft);
  font-size: 12px;
  line-height: 1.65;
  text-align: center;
  overflow-wrap: anywhere;
}

.identity-meta {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.identity-meta div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.identity-meta dt {
  color: var(--on-dark-soft);
  font-size: 10px;
}

.identity-meta dd {
  color: var(--on-dark);
  font-family: var(--font-code);
  font-size: 9px;
  text-align: right;
}

.settings-panel {
  min-width: 0;
  overflow: hidden;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
}

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  background: var(--surface-soft);
  border-bottom: 1px solid var(--hairline);
}

.settings-tabs button {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
}

.settings-tabs button.active {
  color: var(--ink);
  background: var(--surface-card);
}

.settings-form {
  width: 100%;
  max-width: 760px;
  display: grid;
  gap: 18px;
  padding: 26px;
}

.password-form {
  max-width: 560px;
}

.form-heading {
  padding-bottom: 4px;
}

.form-heading h2 {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
}

.form-heading p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}

.form-field {
  display: grid;
  gap: 7px;
}

.form-field > span,
.avatar-field legend {
  color: var(--body-strong);
  font-size: 12px;
  font-weight: 600;
}

.form-field input,
.form-field textarea {
  width: 100%;
  color: var(--ink);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  outline: none;
  font-family: var(--font-body);
  font-size: 14px;
}

.form-field input {
  height: 42px;
  padding: 0 12px;
}

.form-field textarea {
  min-height: 100px;
  padding: 10px 12px;
  line-height: 1.55;
  resize: vertical;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-field input[readonly] {
  color: var(--muted);
  background: var(--surface-soft);
}

.avatar-field {
  min-width: 0;
  padding: 0;
  border: 0;
}

.avatar-field legend {
  margin-bottom: 8px;
}

.form-error {
  color: var(--error);
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 17px;
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
}

.primary-button:disabled {
  color: var(--muted);
  background: var(--primary-disabled);
  border-color: var(--primary-disabled);
}

@media (max-width: 820px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .identity-panel {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    column-gap: 16px;
    text-align: left;
  }

  .identity-heading {
    margin: 0;
    text-align: left;
  }

  .identity-role {
    margin: 0;
  }

  .identity-profile,
  .identity-meta {
    grid-column: 1 / -1;
  }

  .identity-profile {
    text-align: left;
  }
}

@media (max-width: 560px) {
  #userProfileView {
    padding: 16px;
  }

  .identity-panel {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .identity-role {
    grid-column: 2;
    justify-self: start;
  }

  .settings-form {
    padding: 20px 16px;
  }
}
</style>
