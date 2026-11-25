<template>
  <Teleport to="body">
    <Transition name="user-dialog" appear>
      <div v-if="visible" class="dialog-backdrop" @click.self="close">
        <section
          class="user-form-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="dialog-header">
            <h2 :id="titleId">{{ isEditing ? "编辑用户" : "新增用户" }}</h2>
            <button
              class="icon-btn"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <form class="user-form" @submit.prevent="submit">
            <div class="field-row">
              <label class="field">
                <span class="field-label">账号</span>
                <UiInput
                  v-model="form.userAccount"
                  :readonly="isEditing"
                  autocomplete="off"
                  placeholder="登录用的账号"
                />
              </label>
              <label class="field">
                <span class="field-label">昵称</span>
                <UiInput
                  v-model="form.userName"
                  autocomplete="off"
                  placeholder="别人看到的名字"
                />
              </label>
            </div>

            <label class="field">
              <span class="field-label">角色</span>
              <UiSelect
                v-model="form.userRole"
                :options="roleOptions"
                :disabled="isCurrentUser"
                aria-label="角色"
              />
              <span v-if="isCurrentUser" class="field-hint">
                不能修改自己的角色
              </span>
            </label>

            <label class="field">
              <span class="field-label">简介</span>
              <textarea
                v-model="form.userProfile"
                class="textarea"
                rows="3"
                placeholder="一句话介绍"
              ></textarea>
            </label>

            <div class="field">
              <span class="field-label">头像</span>
              <AvatarPicker v-model="form.userAvatar" />
            </div>

            <p v-if="formError" class="form-error">{{ formError }}</p>
            <p v-if="!isEditing" class="field-hint">
              新用户的默认密码是 12345678
            </p>

            <footer class="dialog-actions">
              <button class="btn sm" type="button" @click="close">取消</button>
              <button
                class="btn primary sm"
                type="submit"
                :disabled="submitting"
              >
                {{
                  submitting ? "保存中" : isEditing ? "保存修改" : "创建用户"
                }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, reactive, ref, watch } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import AvatarPicker from "@/components/user/AvatarPicker.vue";
import {
  DEFAULT_USER_AVATAR,
  normalizeUserAvatar,
} from "@/constants/userAvatars";
import type { AdminUserVO, UserRoleVO } from "../../../generated";

export type UserFormValue = {
  userAccount: string;
  userName: string;
  userAvatar: string;
  userProfile: string;
  userRole: string;
};

const props = defineProps<{
  visible: boolean;
  user?: AdminUserVO | null;
  roles: UserRoleVO[];
  currentUserId?: string;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:visible", value: boolean): void;
  (event: "submit", value: UserFormValue): void;
}>();

const createEmptyForm = (): UserFormValue => ({
  userAccount: "",
  userName: "",
  userAvatar: DEFAULT_USER_AVATAR,
  userProfile: "",
  userRole: "user",
});

const form = reactive(createEmptyForm());
const formError = ref("");
const isEditing = computed(() => props.user?.id != null);
const isCurrentUser = computed(
  () =>
    isEditing.value &&
    String(props.user?.id ?? "") === String(props.currentUserId ?? "")
);
const roleOptions = computed(() =>
  props.roles.map((role) => ({
    value: role.value ?? "",
    label: role.text ?? role.value ?? "",
  }))
);
const titleId = computed(() =>
  isEditing.value ? "user-form-edit-title" : "user-form-add-title"
);

watch(
  () => [props.visible, props.user] as const,
  ([visible]) => {
    if (!visible) return;
    Object.assign(form, {
      ...createEmptyForm(),
      userAccount: props.user?.userAccount ?? "",
      userName: props.user?.userName ?? "",
      userAvatar: normalizeUserAvatar(props.user?.userAvatar),
      userProfile: props.user?.userProfile ?? "",
      userRole: props.user?.userRole || "user",
    });
    formError.value = "";
  },
  { immediate: true }
);

const close = () => {
  if (!props.submitting) emit("update:visible", false);
};

const submit = () => {
  const value = {
    userAccount: form.userAccount.trim(),
    userName: form.userName.trim(),
    userAvatar: form.userAvatar,
    userProfile: form.userProfile.trim(),
    userRole: form.userRole,
  };

  if (!isEditing.value && !value.userAccount) {
    formError.value = "请输入登录账号";
    return;
  }
  if (!isEditing.value && value.userAccount.length < 4) {
    formError.value = "登录账号不能少于 4 个字符";
    return;
  }
  if (!value.userName) {
    formError.value = "请输入用户昵称";
    return;
  }
  if (!value.userRole) {
    formError.value = "请选择用户角色";
    return;
  }

  formError.value = "";
  emit("submit", value);
};
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  overflow: auto;
  background: rgba(9, 9, 11, 0.42);
  backdrop-filter: blur(4px);
}

.user-form-dialog {
  width: min(560px, 100%);
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 14px 6px 24px;
}

.dialog-header h2 {
  margin: 0;
  color: var(--ink);
  font-size: 19px;
  font-weight: 700;
}

.user-form {
  display: grid;
  gap: 16px;
  padding: 10px 24px 22px;
  overflow: auto;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.user-form .field-hint {
  margin: 0;
  color: var(--faint);
  font-size: 12.5px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.user-dialog-enter-active,
.user-dialog-leave-active {
  transition: opacity 180ms ease;
}

.user-dialog-enter-active .user-form-dialog,
.user-dialog-leave-active .user-form-dialog {
  transition: transform var(--motion-standard) var(--ease-out);
}

.user-dialog-enter-from,
.user-dialog-leave-to {
  opacity: 0;
}

.user-dialog-enter-from .user-form-dialog,
.user-dialog-leave-to .user-form-dialog {
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 560px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .user-dialog-enter-from .user-form-dialog,
  .user-dialog-leave-to .user-form-dialog {
    transform: none;
  }
}
</style>
