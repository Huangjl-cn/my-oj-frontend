<template>
  <main id="userManageView">
    <header class="page-header">
      <div>
        <span class="page-kicker">ADMIN DIRECTORY</span>
        <h1>用户管理</h1>
        <p>共 {{ total }} 位用户</p>
      </div>
      <button class="primary-action" type="button" @click="openAddDialog">
        <IconPlus />
        新增用户
      </button>
    </header>

    <section class="directory-panel">
      <form class="filter-bar" @submit.prevent="searchUsers">
        <label>
          <span>账号</span>
          <input v-model="filters.userAccount" placeholder="搜索登录账号" />
        </label>
        <label>
          <span>昵称</span>
          <input v-model="filters.userName" placeholder="搜索用户昵称" />
        </label>
        <label>
          <span>角色</span>
          <select v-model="filters.userRole" :disabled="rolesLoading">
            <option value="">全部角色</option>
            <option v-for="role in roles" :key="role.value" :value="role.value">
              {{ role.text }}
            </option>
          </select>
        </label>
        <div class="filter-actions">
          <button class="search-button" type="submit" :disabled="loading">
            <IconSearch />
            搜索
          </button>
          <button class="reset-button" type="button" @click="resetFilters">
            <IconRefresh />
            重置
          </button>
        </div>
      </form>

      <div class="table-wrap" :class="{ loading }">
        <table class="user-table">
          <colgroup>
            <col class="user-column" />
            <col class="role-column" />
            <col class="profile-column" />
            <col class="time-column" />
            <col class="action-column" />
          </colgroup>
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>简介</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="String(user.id)">
              <td data-label="用户">
                <UserIdentity :user="user" :size="46" />
              </td>
              <td data-label="角色">
                <span :class="['role-badge', roleClass(user.userRole)]">
                  {{ roleText(user.userRole) }}
                </span>
              </td>
              <td data-label="简介">
                <p class="profile-copy" :title="user.userProfile || ''">
                  {{ user.userProfile || "暂未填写简介" }}
                </p>
              </td>
              <td data-label="时间">
                <div class="time-stack">
                  <span>创建 {{ formatDateTime(user.createTime) }}</span>
                  <span>更新 {{ formatDateTime(user.updateTime) }}</span>
                </div>
              </td>
              <td data-label="操作">
                <div class="row-actions">
                  <button
                    type="button"
                    title="编辑用户"
                    @click="openEditDialog(user)"
                  >
                    <IconEdit />
                    编辑
                  </button>
                  <button
                    class="danger"
                    type="button"
                    :disabled="isCurrentUser(user)"
                    :title="
                      isCurrentUser(user) ? '不能删除当前管理员' : '删除用户'
                    "
                    @click="askDelete(user)"
                  >
                    <IconDelete />
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !users.length" class="empty-row">
              <td colspan="5">暂无符合条件的用户</td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="loading-state">正在加载用户...</div>
      </div>

      <div class="mobile-user-list" :class="{ loading }">
        <article
          v-for="user in users"
          :key="String(user.id)"
          class="mobile-user-card"
        >
          <header class="mobile-user-header">
            <UserIdentity :user="user" :size="46" />
            <span :class="['role-badge', roleClass(user.userRole)]">
              {{ roleText(user.userRole) }}
            </span>
          </header>

          <p class="mobile-user-profile">
            {{ user.userProfile || "暂未填写简介" }}
          </p>

          <div class="mobile-user-times">
            <time>创建 {{ formatDateTime(user.createTime) }}</time>
            <time>更新 {{ formatDateTime(user.updateTime) }}</time>
          </div>

          <footer class="mobile-user-actions">
            <button type="button" @click="openEditDialog(user)">
              <IconEdit />
              编辑
            </button>
            <button
              class="danger"
              type="button"
              :disabled="isCurrentUser(user)"
              :title="isCurrentUser(user) ? '不能删除当前管理员' : '删除用户'"
              @click="askDelete(user)"
            >
              <IconDelete />
              删除
            </button>
          </footer>
        </article>
        <p v-if="!loading && !users.length" class="mobile-user-empty">
          暂无符合条件的用户
        </p>
        <div v-if="loading" class="mobile-user-loading">正在加载用户...</div>
      </div>

      <footer class="pagination-bar">
        <span>第 {{ current }} 页</span>
        <a-pagination
          class="desktop-pagination"
          :current="current"
          :page-size="pageSize"
          :total="total"
          :show-total="true"
          @change="changePage"
        />
        <a-pagination
          class="mobile-pagination"
          :current="current"
          :page-size="pageSize"
          :total="total"
          simple
          hide-on-single-page
          @change="changePage"
        />
      </footer>
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
      :message="`确定删除用户「${
        deletingUser?.userName || deletingUser?.userAccount || ''
      }」吗？此操作不可撤销。`"
      confirm-text="删除用户"
      tone="danger"
      @confirm="deleteUser"
    />
  </main>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import {
  IconDelete,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-vue/es/icon";
import { computed, onMounted, reactive, ref } from "vue";
import { useStore } from "vuex";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
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

const resetFilters = () => {
  Object.assign(filters, { userAccount: "", userName: "", userRole: "" });
  current.value = 1;
  loadUsers();
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
      message.error(response.message || "保存用户失败");
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
#userManageView {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
  padding: var(--space-lg) 0;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.page-header {
  width: calc(100% - (var(--space-xl) * 2));
  margin-right: auto;
  margin-left: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.page-kicker {
  color: var(--primary);
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 2px 0 4px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 400;
  letter-spacing: 0;
}

.page-header p {
  color: var(--muted);
  font-size: 13px;
}

.primary-action,
.search-button,
.reset-button,
.row-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-body);
  font-weight: 500;
}

.primary-action {
  height: 40px;
  padding: 0 16px;
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.directory-panel {
  width: calc(100% - (var(--space-xl) * 2));
  margin: 0 auto;
  min-width: 0;
  overflow: hidden;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
}

.filter-bar {
  display: grid;
  grid-template-columns:
    minmax(150px, 1fr) minmax(150px, 1fr) minmax(140px, 0.7fr)
    auto;
  align-items: end;
  gap: 14px;
  padding: 18px 20px;
  background: var(--surface-soft);
  border-bottom: 1px solid var(--hairline);
}

.filter-bar label {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.filter-bar label > span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
}

.filter-bar input,
.filter-bar select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  color: var(--ink);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  outline: none;
  font-family: var(--font-body);
  font-size: 13px;
}

.filter-bar input:focus,
.filter-bar select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.search-button,
.reset-button {
  height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  font-size: 12px;
}

.search-button {
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
}

.reset-button {
  color: var(--body);
  background: var(--canvas);
  border: 1px solid var(--hairline);
}

.table-wrap {
  position: relative;
  min-width: 0;
}

.mobile-user-list {
  display: none;
}

.table-wrap.loading .user-table {
  opacity: 0.45;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: var(--surface-soft);
  transition: opacity 150ms ease;
}

.user-column {
  width: 29%;
}

.role-column {
  width: 11%;
}

.profile-column {
  width: 29%;
}

.time-column {
  width: 19%;
}

.action-column {
  width: 12%;
}

.user-table th {
  height: 50px;
  padding: 0 16px;
  color: var(--muted);
  background: var(--surface-soft);
  border-bottom: 1px solid var(--hairline);
  font-size: 11px;
  font-weight: 600;
  text-align: left;
}

.user-table td {
  min-width: 0;
  padding: 14px 16px;
  color: var(--body);
  border-bottom: 1px solid var(--hairline-soft);
  font-size: 13px;
  vertical-align: middle;
}

.user-table tbody tr:last-child td {
  border-bottom: 0;
}

.user-table tbody tr:not(.empty-row) {
  background: var(--surface-card);
}

.user-table tbody tr:not(.empty-row):hover {
  background: var(--surface-cream-strong);
}

.role-badge {
  display: inline-flex;
  padding: 3px 9px;
  color: var(--body);
  background: var(--surface-card);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.role-badge.admin {
  color: var(--primary-active);
  background: var(--primary-light);
}

.role-badge.ban {
  color: var(--error);
  background: rgba(198, 69, 69, 0.1);
}

.profile-copy {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  line-height: 1.55;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.time-stack {
  display: grid;
  gap: 4px;
  color: var(--muted);
  font-family: var(--font-code);
  font-size: 10px;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.row-actions button {
  height: 30px;
  padding: 0 8px;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-size: 11px;
}

.row-actions button.danger {
  color: var(--error);
}

.row-actions button:disabled {
  color: var(--muted-soft);
  background: var(--surface-soft);
  cursor: not-allowed;
  opacity: 0.7;
}

.empty-row td {
  height: 180px;
  color: var(--muted-soft);
  text-align: center;
}

.loading-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--muted);
  background: var(--surface-overlay);
  font-size: 13px;
}

.pagination-bar {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  background: var(--surface-soft);
  border-top: 1px solid var(--hairline);
}

.pagination-bar > span {
  color: var(--muted);
  font-size: 11px;
}

.mobile-pagination {
  display: none;
}

@media (max-width: 960px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .user-column {
    width: 32%;
  }

  .role-column {
    width: 12%;
  }

  .profile-column {
    width: 24%;
  }

  .time-column {
    width: 18%;
  }

  .action-column {
    width: 14%;
  }

  .user-table th,
  .user-table td {
    padding-right: 10px;
    padding-left: 10px;
  }

  .row-actions {
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  #userManageView {
    padding: 16px;
  }

  .directory-panel {
    width: 100%;
  }

  .page-header {
    width: 100%;
    align-items: center;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .table-wrap {
    display: none;
  }

  .pagination-bar {
    justify-content: center;
    padding-bottom: 14px;
  }

  .pagination-bar > span,
  .desktop-pagination {
    display: none;
  }

  .mobile-pagination {
    display: flex;
    min-width: 0;
  }

  .mobile-user-list {
    position: relative;
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .mobile-user-list.loading .mobile-user-card {
    opacity: 0.45;
  }

  .mobile-user-card {
    min-width: 0;
    overflow: hidden;
    background: var(--surface-card);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-md);
  }

  .mobile-user-header {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    background: var(--surface-soft);
    border-bottom: 1px solid var(--hairline-soft);
  }

  .mobile-user-header .role-badge {
    flex: 0 0 auto;
  }

  .mobile-user-profile {
    margin: 0;
    padding: 16px 14px 10px;
    color: var(--body);
    font-size: 13px;
    line-height: 1.65;
    overflow-wrap: anywhere;
  }

  .mobile-user-times {
    display: grid;
    gap: 3px;
    padding: 0 14px 16px;
    color: var(--muted-soft);
    font-family: var(--font-code);
    font-size: 9px;
  }

  .mobile-user-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 14px;
    border-top: 1px solid var(--hairline-soft);
  }

  .mobile-user-actions button {
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 10px;
    color: var(--primary);
    background: transparent;
    border: 1px solid var(--hairline);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 500;
  }

  .mobile-user-actions button.danger {
    color: var(--error);
  }

  .mobile-user-actions button:disabled {
    color: var(--muted-soft);
    background: var(--surface-soft);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .mobile-user-empty,
  .mobile-user-loading {
    padding: 48px 16px;
    color: var(--muted);
    text-align: center;
  }

  .mobile-user-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--surface-overlay);
  }
}
</style>
