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
          <DifficultyBars :total="total" :solved="solved" />
          <div class="progress-links">
            <router-link class="btn sm" to="/">
              <AppIcon name="book" :size="16" />
              去题库
            </router-link>
            <router-link class="btn sm" to="/stats">
              <AppIcon name="chart" :size="16" />
              学习统计
            </router-link>
          </div>
        </section>

        <SubmitCalendar />
      </aside>

      <div class="settings">
        <section class="panel form-panel profile-card">
          <h2>个人资料</h2>
          <p class="form-hint">昵称、简介和头像别人都能看到。</p>
          <form class="profile-form" @submit.prevent="saveProfile">
            <div class="profile-fields">
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
              <label class="field">
                <span class="field-label">简介</span>
                <textarea
                  v-model="profileForm.userProfile"
                  class="textarea"
                  rows="3"
                  placeholder="一句话介绍自己"
                ></textarea>
              </label>
            </div>
            <div class="field avatar-field">
              <span class="field-label">头像</span>
              <AvatarPicker v-model="profileForm.userAvatar" />
            </div>
            <footer class="form-actions">
              <p v-if="profileError" class="form-error">{{ profileError }}</p>
              <button
                class="btn primary sm"
                type="submit"
                :disabled="profileSaving"
              >
                <AppIcon name="check" :size="16" />
                {{ profileSaving ? "保存中" : "保存资料" }}
              </button>
            </footer>
          </form>
        </section>

        <section class="panel form-panel">
          <h2>AI 陪练</h2>
          <p class="form-hint">做题时陪你的鸭鸭，用你自己的 DeepSeek Key。</p>
          <AiSettingForm />
        </section>

        <section class="panel form-panel">
          <h2>修改密码</h2>
          <p class="form-hint">新密码至少 8 位，改完下次登录生效。</p>
          <form class="password-form" @submit.prevent="savePassword">
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
            <footer class="form-actions">
              <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
              <button
                class="btn primary sm"
                type="submit"
                :disabled="passwordSaving"
              >
                <AppIcon name="lock" :size="16" />
                {{ passwordSaving ? "修改中" : "修改密码" }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useStore } from "vuex";

import AiSettingForm from "@/components/companion/AiSettingForm.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import AvatarPicker from "@/components/user/AvatarPicker.vue";
import DifficultyBars from "@/components/user/DifficultyBars.vue";
import SubmitCalendar from "@/components/user/SubmitCalendar.vue";
import UserAvatar from "@/components/user/UserAvatar.vue";
import {
  DEFAULT_USER_AVATAR,
  normalizeUserAvatar,
} from "@/constants/userAvatars";
import { useMyProgress } from "@/composables/useMyProgress";
import { formatDateTime } from "@/utils/dateTime";
import { formatUserRole } from "@/utils/userRole";
import { UserControllerService } from "../../../generated";

const store = useStore();
const { total, solved, load: loadProgress } = useMyProgress();
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

/* 左边头像和进度：右边比较长，往下滚时左边留在原处 */
.side {
  position: sticky;
  top: 16px;
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

.progress-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

/* 右边：资料占一整行，AI 陪练和密码并排 */
.settings {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}

.profile-card {
  grid-column: 1 / -1;
}

.profile-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px 28px;
}

.profile-fields {
  display: grid;
  align-content: start;
  gap: 16px;
}

.avatar-field {
  align-content: start;
}

.profile-form .form-actions {
  grid-column: 1 / -1;
}

.password-form {
  display: grid;
  gap: 16px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.form-actions .form-error {
  margin-right: auto;
}

@media (max-width: 1280px) {
  .settings {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    position: static;
  }

  .profile-form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
