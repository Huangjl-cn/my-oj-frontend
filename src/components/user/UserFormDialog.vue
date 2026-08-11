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
            <div>
              <span class="dialog-kicker">USER DIRECTORY</span>
              <h2 :id="titleId">{{ isEditing ? "编辑用户" : "新增用户" }}</h2>
            </div>
            <button
              class="close-button"
              type="button"
              title="关闭"
              aria-label="关闭"
              @click="close"
            >
              <IconClose />
            </button>
          </header>

          <form class="user-form" @submit.prevent="submit">
            <div class="field-row">
              <label class="form-field">
                <span>账号</span>
                <input
                  v-model="form.userAccount"
                  :readonly="isEditing"
                  :class="{ readonly: isEditing }"
                  autocomplete="off"
                  placeholder="请输入登录账号"
                />
              </label>
              <label class="form-field">
                <span>昵称</span>
                <input
                  v-model="form.userName"
                  autocomplete="off"
                  placeholder="请输入用户昵称"
                />
              </label>
            </div>

            <label class="form-field">
              <span>角色</span>
              <select v-model="form.userRole" :disabled="isCurrentUser">
                <option value="" disabled>请选择角色</option>
                <option
                  v-for="role in roles"
                  :key="role.value"
                  :value="role.value"
                >
                  {{ role.text }}
                </option>
              </select>
              <small v-if="isCurrentUser">当前管理员不能降级或封禁自己</small>
            </label>

            <label class="form-field">
              <span>简介</span>
              <textarea
                v-model="form.userProfile"
                rows="3"
                placeholder="简单介绍这位用户"
              ></textarea>
            </label>

            <fieldset class="avatar-field">
              <legend>头像</legend>
              <AvatarPicker v-model="form.userAvatar" />
            </fieldset>

            <p v-if="formError" class="form-error">{{ formError }}</p>

            <footer class="dialog-actions">
              <button class="secondary-button" type="button" @click="close">
                取消
              </button>
              <button
                class="primary-button"
                type="submit"
                :disabled="submitting"
              >
                {{
                  submitting ? "保存中..." : isEditing ? "保存修改" : "创建用户"
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
import { IconClose } from "@arco-design/web-vue/es/icon";
import { computed, defineEmits, defineProps, reactive, ref, watch } from "vue";

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
  background: rgba(18, 17, 15, 0.56);
  backdrop-filter: blur(4px);
}

.user-dialog-enter-active,
.user-dialog-leave-active {
  transition: opacity 180ms ease;
}

.user-dialog-enter-active .user-form-dialog,
.user-dialog-leave-active .user-form-dialog {
  transform-origin: center;
  transition: opacity var(--motion-standard) ease,
    transform var(--motion-standard) var(--ease-out);
}

.user-dialog-enter-from,
.user-dialog-leave-to,
.user-dialog-enter-from .user-form-dialog,
.user-dialog-leave-to .user-form-dialog {
  opacity: 0;
}

.user-dialog-enter-from .user-form-dialog,
.user-dialog-leave-to .user-form-dialog {
  transform: translateY(6px) scale(0.97);
}

.user-form-dialog {
  width: min(760px, 100%);
  max-height: min(850px, calc(100vh - 40px));
  overflow-y: auto;
  color: var(--body);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.dialog-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px 18px;
  background: var(--surface-card);
  border-bottom: 1px solid var(--hairline);
}

.dialog-kicker {
  display: block;
  margin-bottom: 3px;
  color: var(--primary);
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 500;
}

.dialog-header h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 0;
}

.close-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: 50%;
}

.close-button:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.user-form {
  display: grid;
  gap: 18px;
  padding: 22px 24px 24px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  min-width: 0;
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
.form-field select,
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

.form-field input,
.form-field select {
  height: 42px;
  padding: 0 12px;
}

.form-field textarea {
  min-height: 86px;
  padding: 10px 12px;
  line-height: 1.55;
  resize: vertical;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-field input.readonly,
.form-field select:disabled {
  color: var(--muted);
  background: var(--surface-soft);
}

.form-field small {
  color: var(--muted);
  font-size: 11px;
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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 2px;
}

.secondary-button,
.primary-button {
  height: 40px;
  padding: 0 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
}

.secondary-button:active,
.primary-button:not(:disabled):active {
  transform: translateY(1px);
}

.secondary-button {
  color: var(--body);
  background: transparent;
  border: 1px solid var(--hairline);
}

.primary-button {
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
}

.primary-button:disabled {
  color: var(--muted);
  background: var(--primary-disabled);
  border-color: var(--primary-disabled);
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }

  .dialog-header,
  .user-form {
    padding-right: 16px;
    padding-left: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .user-dialog-enter-active,
  .user-dialog-leave-active,
  .user-dialog-enter-active .user-form-dialog,
  .user-dialog-leave-active .user-form-dialog {
    transition-duration: 120ms;
  }

  .user-dialog-enter-from .user-form-dialog,
  .user-dialog-leave-to .user-form-dialog {
    transform: none;
  }
}
</style>
