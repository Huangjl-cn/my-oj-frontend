<template>
  <div class="page">
    <div class="profile-grid">
      <aside class="side">
        <section class="panel identity">
          <UserAvatar
            :avatar="loginUser.userAvatar"
            :name="loginUser.userName || loginUser.userAccount"
            :size="88"
          />
          <h1>{{ loginUser.userName || "未设置昵称" }}</h1>
          <p class="account">
            @{{ loginUser.userAccount || "--" }}
            <span class="role">{{ formatUserRole(loginUser.userRole) }}</span>
          </p>
          <p class="bio">{{ loginUser.userProfile || "还没有写简介" }}</p>
          <p class="joined">
            <AppIcon name="clock" :size="14" />
            {{ formatDateTime(loginUser.createTime).slice(0, 10) }} 加入
          </p>
        </section>

        <section class="panel progress">
          <header>
            <h2>做题进度</h2>
            <span class="num">
              <b>{{ solved.all }}</b> / {{ total.all }}
            </span>
          </header>
          <div v-for="level in LEVELS" :key="level" class="bar-row">
            <DifficultyLabel :difficulty="level" />
            <span class="bar">
              <i
                :class="level"
                :style="{ width: percent(solved[level], total[level]) }"
              />
            </span>
            <span class="bar-count num">
              {{ solved[level] }} / {{ total[level] }}
            </span>
          </div>
          <router-link class="btn sm" to="/">
            <AppIcon name="book" :size="16" />
            去题库
          </router-link>
        </section>
      </aside>

      <section class="panel settings">
        <header class="settings-head">
          <h2>{{ activeTab === "profile" ? "个人资料" : "修改密码" }}</h2>
          <UiSegmented
            :model-value="activeTab"
            :options="TABS"
            label="设置项"
            @update:model-value="setTab"
          />
        </header>

        <form
          v-if="activeTab === 'profile'"
          class="settings-form"
          @submit.prevent="saveProfile"
        >
          <div class="field-row">
            <label class="field">
              <span class="field-label">账号</span>
              <UiInput :model-value="loginUser.userAccount" readonly />
            </label>
            <label class="field">
              <span class="field-label">昵称</span>
              <UiInput
                v-model="profileForm.userName"
                autocomplete="nickname"
                placeholder="别人看到的名字"
              />
            </label>
          </div>
          <label class="field">
            <span class="field-label">简介</span>
            <textarea
              v-model="profileForm.userProfile"
              class="textarea"
              rows="3"
              placeholder="一句话介绍自己"
            ></textarea>
          </label>
          <div class="field">
            <span class="field-label">头像</span>
            <AvatarPicker v-model="profileForm.userAvatar" />
          </div>
          <p v-if="profileError" class="form-error">{{ profileError }}</p>
          <div class="form-actions">
            <button
              class="btn primary sm"
              type="submit"
              :disabled="profileSaving"
            >
              <AppIcon name="check" :size="16" />
              {{ profileSaving ? "保存中" : "保存" }}
            </button>
          </div>
        </form>

        <form
          v-else
          class="settings-form narrow"
          @submit.prevent="savePassword"
        >
          <label class="field">
            <span class="field-label">旧密码</span>
            <UiInput
              v-model="passwordForm.oldPassword"
              icon="lock"
              type="password"
              autocomplete="current-password"
              placeholder="现在的密码"
            />
          </label>
          <label class="field">
            <span class="field-label">新密码</span>
            <UiInput
              v-model="passwordForm.newPassword"
              icon="lock"
              type="password"
              autocomplete="new-password"
              placeholder="至少 8 位"
            />
          </label>
          <label class="field">
            <span class="field-label">确认新密码</span>
            <UiInput
              v-model="passwordForm.checkPassword"
              icon="lock"
              type="password"
              autocomplete="new-password"
              placeholder="再输入一次"
            />
          </label>
          <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
          <div class="form-actions">
            <button
              class="btn primary sm"
              type="submit"
              :disabled="passwordSaving"
            >
              <AppIcon name="lock" :size="16" />
              {{ passwordSaving ? "修改中" : "修改密码" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useStore } from "vuex";

import DifficultyLabel from "@/components/problem/DifficultyLabel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSegmented from "@/components/ui/UiSegmented.vue";
import AvatarPicker from "@/components/user/AvatarPicker.vue";
import UserAvatar from "@/components/user/UserAvatar.vue";
import {
  DEFAULT_USER_AVATAR,
  normalizeUserAvatar,
} from "@/constants/userAvatars";
import { useMyProgress } from "@/composables/useMyProgress";
import { formatDateTime } from "@/utils/dateTime";
import { Difficulty } from "@/utils/difficulty";
import { formatUserRole } from "@/utils/userRole";
import { UserControllerService } from "../../../generated";

const store = useStore();
const activeTab = ref<"profile" | "password">("profile");
const TABS = [
  { value: "profile", label: "资料" },
  { value: "password", label: "密码" },
];
const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
const setTab = (value: string) => {
  activeTab.value = value === "password" ? "password" : "profile";
};
const { total, solved, load: loadProgress } = useMyProgress();
const percent = (part: number, whole: number) =>
  whole ? `${Math.min(100, (part / whole) * 100)}%` : "0%";
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
  void loadProgress();
  try {
    await store.dispatch("user/getLoginUser");
  } catch {
    message.error("加载个人资料失败");
  }
});

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
.profile-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}

.side {
  display: grid;
  gap: 14px;
}

.identity {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 30px 24px 24px;
  text-align: center;
}

.identity h1 {
  margin: 14px 0 0;
  color: var(--ink);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.account {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--muted);
  font-size: 13.5px;
}

.role {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--body);
  font-size: 12px;
}

.bio {
  margin: 12px 0 0;
  color: var(--body);
  font-size: 13.5px;
  line-height: 1.7;
}

.joined {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 14px 0 0;
  color: var(--faint);
  font-size: 12.5px;
}

.progress {
  display: grid;
  gap: 14px;
  padding: 20px 22px 22px;
}

.progress header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.progress h2 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.progress header span {
  color: var(--faint);
  font-size: 13px;
}

.progress header b {
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
}

.bar-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 12px;
}

.bar {
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--fill);
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.bar i.easy {
  background: var(--easy);
}

.bar i.medium {
  background: var(--medium);
}

.bar i.hard {
  background: var(--hard);
}

.bar-count {
  color: var(--faint);
  font-size: 12.5px;
  text-align: right;
}

.progress .btn {
  justify-self: start;
  margin-top: 4px;
}

.settings {
  padding: 22px 26px 26px;
}

.settings-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.settings-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 20px;
  font-weight: 700;
}

.settings-form {
  display: grid;
  gap: 18px;
}

.settings-form.narrow {
  max-width: 420px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .field-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
