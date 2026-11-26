<template>
  <div class="page">
    <section class="panel page-head">
      <h1>
        用户管理
        <span class="count num">{{ total }}</span>
      </h1>
      <div class="head-end">
        <button class="btn primary sm" type="button" @click="openAddDialog">
          <AppIcon name="plus" :size="16" />
          新增用户
        </button>
      </div>
    </section>

    <section class="panel list-panel">
      <div class="list-toolbar">
        <UiInput
          v-model="filters.userAccount"
          icon="user"
          placeholder="账号"
          clearable
        />
        <UiInput
          v-model="filters.userName"
          icon="search"
          placeholder="昵称"
          clearable
        />
        <UiSelect
          v-model="filters.userRole"
          class="role-filter"
          :options="roleOptions"
          placeholder="全部角色"
          :disabled="rolesLoading"
          aria-label="按角色筛选"
        />
        <div class="toolbar-end">
          <button
            v-if="hasFilters"
            class="icon-btn tip-up"
            type="button"
            data-tip="清除筛选"
            aria-label="清除筛选"
            @click="resetFilters"
          >
            <AppIcon name="close" :size="17" />
          </button>
          <button
            class="icon-btn tip-down tip-end"
            type="button"
            data-tip="刷新"
            aria-label="刷新"
            :disabled="loading"
            @click="loadUsers"
          >
            <AppIcon name="refresh" :size="17" />
          </button>
        </div>
      </div>

      <div :class="['list-rows', { stale: loading && users.length }]">
        <div v-if="users.length" class="list-head cols">
          <span>用户</span>
          <span>角色</span>
          <span>简介</span>
          <span>注册</span>
          <span />
        </div>
        <div v-for="user in users" :key="String(user.id)" class="list-row cols">
          <UserIdentity :user="user" :size="36" />
          <span>
            <span :class="['role', roleClass(user.userRole)]">
              {{ roleText(user.userRole) }}
            </span>
          </span>
          <span class="cell-muted profile" :title="user.userProfile || ''">
            {{ user.userProfile || "—" }}
          </span>
          <time class="cell-faint num" :title="formatDateTime(user.updateTime)">
            {{ formatDateTime(user.createTime).slice(0, 10) }}
          </time>
          <span class="row-actions">
            <button
              class="icon-btn tip-up"
              type="button"
              data-tip="编辑"
              aria-label="编辑用户"
              @click="openEditDialog(user)"
            >
              <AppIcon name="edit" :size="16" />
            </button>
            <button
              class="icon-btn danger tip-up tip-end"
              type="button"
              :data-tip="isCurrentUser(user) ? '不能删除自己' : '删除'"
              aria-label="删除用户"
              :disabled="isCurrentUser(user)"
              @click="askDelete(user)"
            >
              <AppIcon name="trash" :size="16" />
            </button>
          </span>
        </div>

        <div v-if="!loading && !users.length" class="list-empty">
          <CompanionAvatar :size="56" mood="confused" />
          <p>没有符合条件的用户</p>
          <button
            v-if="hasFilters"
            class="btn sm"
            type="button"
            @click="resetFilters"
          >
            清除筛选
          </button>
        </div>
      </div>

      <UiPagination
        class="list-pager"
        :current="current"
        :total="total"
        :page-size="pageSize"
        @change="changePage"
      />
    </section>

    <UserFormDialog
      v-model:visible="formDialogVisible"
      :user="editingUser"
      :roles="roles"
      :current-user-id="currentUserId"
      :submitting="saving"
      @submit="saveUser"
    />
    <ConfirmDialog
      v-model:visible="deleteDialogVisible"
      title="删除用户"
      :message="`确定删除「${
        deletingUser?.userName || deletingUser?.userAccount || ''
      }」吗？不能撤销。`"
      confirm-text="删除用户"
      tone="danger"
      @confirm="deleteUser"
    />
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useStore } from "vuex";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UserFormDialog, {
  UserFormValue,
} from "@/components/user/UserFormDialog.vue";
import UserIdentity from "@/components/user/UserIdentity.vue";
import { toGeneratedApiId } from "@/services/apiId";
import { clearUserSummaryCache } from "@/services/userSummary";
import { formatDateTime } from "@/utils/dateTime";
import type { AdminUserVO, UserRoleVO } from "../../../generated";
import { UserControllerService } from "../../../generated";

const store = useStore();
const users = ref<AdminUserVO[]>([]);
const roles = ref<UserRoleVO[]>([]);
const total = ref(0);
const current = ref(1);
const pageSize = 10;
const loading = ref(false);
const rolesLoading = ref(false);
const saving = ref(false);
const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingUser = ref<AdminUserVO | null>(null);
const deletingUser = ref<AdminUserVO | null>(null);
const filters = reactive({
  userAccount: "",
  userName: "",
  userRole: "",
});

const currentUserId = computed(() =>
  String(store.state.user.loginUser?.id ?? "")
);
const roleOptions = computed(() =>
  roles.value.map((role) => ({
    value: role.value ?? "",
    label: role.text ?? role.value ?? "",
  }))
);
const hasFilters = computed(
  () => !!(filters.userAccount || filters.userName || filters.userRole)
);
const roleMap = computed(
  () =>
    new Map(
      roles.value.map((role) => [role.value ?? "", role.text ?? role.value])
    )
);

const loadRoles = async () => {
  rolesLoading.value = true;
  try {
    const response = await UserControllerService.getSupportedRoles();
    if (response.code !== 0) {
      message.error(response.message || "加载角色选项失败");
      return;
    }
    roles.value = response.data ?? [];
  } catch {
    message.error("加载角色选项失败");
  } finally {
    rolesLoading.value = false;
  }
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await UserControllerService.listUserByPage({
      current: current.value,
      pageSize,
      userAccount: filters.userAccount.trim() || undefined,
      userName: filters.userName.trim() || undefined,
      userRole: filters.userRole || undefined,
    });
    if (response.code !== 0) {
      message.error(response.message || "加载用户失败");
      return;
    }
    users.value = response.data?.records ?? [];
    total.value = Number(response.data?.total ?? 0);
  } catch {
    message.error("加载用户失败");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadRoles(), loadUsers()]);
});

const roleText = (role?: string) =>
  roleMap.value.get(role ?? "") || role || "--";
const roleClass = (role?: string) => {
  if (role === "admin") return "admin";
  if (role === "ban") return "ban";
  return "user";
};
const isCurrentUser = (user: AdminUserVO) =>
  String(user.id ?? "") === currentUserId.value;

const searchUsers = () => {
  current.value = 1;
  loadUsers();
};

// 输入停下来 300ms 后自动搜，角色一改马上搜
let filterTimer: number | undefined;
watch(
  () => [filters.userAccount, filters.userName],
  () => {
    window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(searchUsers, 300);
  }
);
watch(() => filters.userRole, searchUsers);

const resetFilters = () => {
  Object.assign(filters, { userAccount: "", userName: "", userRole: "" });
};

const changePage = (page: number) => {
  current.value = page;
  loadUsers();
};

const openAddDialog = () => {
  editingUser.value = null;
  formDialogVisible.value = true;
};

const openEditDialog = (user: AdminUserVO) => {
  editingUser.value = user;
  formDialogVisible.value = true;
};

const saveUser = async (value: UserFormValue) => {
  saving.value = true;
  try {
    const response =
      editingUser.value?.id == null
        ? await UserControllerService.addUser(value)
        : await UserControllerService.updateUser({
            id: toGeneratedApiId(editingUser.value.id),
            userName: value.userName,
            userAvatar: value.userAvatar,
            userProfile: value.userProfile,
            userRole: value.userRole,
          });
    if (response.code !== 0) {
      message.error(response.message || "保存失败");
      return;
    }
    message.success(
      editingUser.value ? "用户信息已更新" : "用户创建成功，默认密码为 12345678"
    );
    if (editingUser.value?.id != null) {
      clearUserSummaryCache(editingUser.value.id);
    }
    formDialogVisible.value = false;
    editingUser.value = null;
    await loadUsers();
  } catch {
    message.error("保存用户失败");
  } finally {
    saving.value = false;
  }
};

const askDelete = (user: AdminUserVO) => {
  if (isCurrentUser(user)) return;
  deletingUser.value = user;
  deleteDialogVisible.value = true;
};

const deleteUser = async () => {
  if (deletingUser.value?.id == null) return;
  try {
    const response = await UserControllerService.deleteUser({
      id: toGeneratedApiId(deletingUser.value.id),
    });
    if (response.code !== 0) {
      message.error(response.message || "删除用户失败");
      return;
    }
    message.success("用户已删除");
    clearUserSummaryCache(deletingUser.value.id);
    deleteDialogVisible.value = false;
    deletingUser.value = null;
    if (users.value.length === 1 && current.value > 1) current.value -= 1;
    await loadUsers();
  } catch {
    message.error("删除用户失败");
  }
};
</script>

<style scoped>
.cols {
  grid-template-columns: minmax(180px, 1.2fr) 88px minmax(0, 1.4fr) 96px 80px;
}

.role-filter {
  width: 148px;
}

.role {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 500;
}

.role.admin {
  background: var(--primary);
  color: var(--on-primary);
}

.role.ban {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.profile {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 900px) {
  .cols {
    grid-template-columns: minmax(0, 1fr) 80px 80px;
  }

  .cols > :nth-child(3),
  .cols > :nth-child(4) {
    display: none;
  }
}
</style>
