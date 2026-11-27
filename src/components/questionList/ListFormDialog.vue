<template>
  <Teleport to="body">
    <Transition name="list-dialog" appear>
      <div v-if="visible" class="dialog-backdrop" @click.self="close">
        <section
          class="list-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="dialog-header">
            <h2 :id="titleId">{{ editing ? "编辑题单" : "新建题单" }}</h2>
            <button
              class="icon-btn"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <form class="list-form" @submit.prevent="submit">
            <label class="field">
              <span class="field-label">标题</span>
              <UiInput
                v-model="form.title"
                autocomplete="off"
                placeholder="比如：动态规划入门"
              />
            </label>
            <label class="field">
              <span class="field-label">简介（可不填）</span>
              <textarea
                v-model="form.description"
                class="textarea"
                rows="3"
                placeholder="这个题单练什么、按什么顺序做"
              ></textarea>
            </label>
            <UiSwitch
              v-if="canCreateOfficial && !editing"
              v-model="form.official"
              label="官方题单（所有人都能看到）"
            />

            <p v-if="error" class="form-error">{{ error }}</p>

            <footer class="dialog-actions">
              <button class="btn sm" type="button" @click="close">取消</button>
              <button
                class="btn primary sm"
                type="submit"
                :disabled="submitting"
              >
                {{ submitting ? "保存中" : editing ? "保存" : "新建" }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, PropType, reactive, ref, watch } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";
import { ListForm, validateListForm } from "@/services/questionList";

/** 新建 / 编辑题单；检查通过后 emit submit，保存由外面做 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  /** 编辑时传原来的标题和简介 */
  initial: { type: Object as PropType<ListForm | null>, default: null },
  /** 管理员新建时可以选官方题单 */
  canCreateOfficial: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  /** 保存失败时外面传进来的错误 */
  serverError: { type: String, default: "" },
});

const emit = defineEmits<{
  (event: "update:visible", value: boolean): void;
  (event: "submit", value: ListForm): void;
}>();

const titleId = `list-dialog-${Math.random().toString(36).slice(2, 8)}`;
const form = reactive<Required<ListForm>>({
  title: "",
  description: "",
  official: false,
});
const error = ref("");
const editing = ref(false);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    editing.value = props.initial != null;
    form.title = props.initial?.title ?? "";
    form.description = props.initial?.description ?? "";
    form.official = false;
    error.value = "";
  },
  { immediate: true }
);

watch(
  () => props.serverError,
  (value) => {
    if (value) error.value = value;
  }
);

const close = () => emit("update:visible", false);

const submit = () => {
  const value: ListForm = {
    title: form.title.trim(),
    description: form.description.trim(),
    official: form.official,
  };
  error.value = validateListForm(value);
  if (error.value) return;
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

.list-dialog {
  width: min(480px, 100%);
  display: flex;
  flex-direction: column;
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

.list-form {
  display: grid;
  gap: 16px;
  padding: 10px 24px 22px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.list-dialog-enter-active,
.list-dialog-leave-active {
  transition: opacity 180ms ease;
}

.list-dialog-enter-active .list-dialog,
.list-dialog-leave-active .list-dialog {
  transition: transform var(--motion-standard) var(--ease-out);
}

.list-dialog-enter-from,
.list-dialog-leave-to {
  opacity: 0;
}

.list-dialog-enter-from .list-dialog,
.list-dialog-leave-to .list-dialog {
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .list-dialog-enter-from .list-dialog,
  .list-dialog-leave-to .list-dialog {
    transform: none;
  }
}
</style>
