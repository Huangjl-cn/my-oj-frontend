<template>
  <Teleport to="body">
    <Transition name="confirm-dialog" appear>
      <div v-if="visible" class="confirm-dialog-backdrop" @click.self="close">
        <section
          class="confirm-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div :class="['confirm-dialog-marker', tone]" aria-hidden="true">
            <AppIcon :name="tone === 'danger' ? 'trash' : 'bulb'" :size="18" />
          </div>
          <div class="confirm-dialog-copy">
            <h2 :id="titleId">{{ title }}</h2>
            <p>{{ message }}</p>
          </div>
          <div class="confirm-dialog-actions">
            <button class="dialog-btn secondary" type="button" @click="close">
              {{ cancelText }}
            </button>
            <button
              :class="['dialog-btn', tone]"
              type="button"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineProps,
  onBeforeUnmount,
  watch,
  withDefaults,
} from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    tone?: "primary" | "danger";
  }>(),
  {
    confirmText: "确认",
    cancelText: "取消",
    tone: "primary",
  }
);

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "confirm"): void;
}>();

const titleId = computed(
  () => `confirm-dialog-${props.title.replace(/\s+/g, "-")}`
);
const close = () => emit("update:visible", false);

// 打开时 Esc 关闭
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") close();
};
watch(
  () => props.visible,
  (visible) => {
    if (visible) document.addEventListener("keydown", onKeydown);
    else document.removeEventListener("keydown", onKeydown);
  },
  { immediate: true }
);
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(9, 9, 11, 0.42);
  backdrop-filter: blur(4px);
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 180ms ease;
}

.confirm-dialog-enter-active .confirm-dialog,
.confirm-dialog-leave-active .confirm-dialog {
  transition: opacity var(--motion-standard) ease,
    transform var(--motion-standard) var(--ease-out);
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to,
.confirm-dialog-enter-from .confirm-dialog,
.confirm-dialog-leave-to .confirm-dialog {
  opacity: 0;
}

.confirm-dialog-enter-from .confirm-dialog,
.confirm-dialog-leave-to .confirm-dialog {
  transform: translateY(8px) scale(0.98);
}

.confirm-dialog {
  width: min(420px, 100%);
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 14px;
  padding: 24px 22px 20px;
  color: var(--body);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}

.confirm-dialog-marker {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--fill);
  color: var(--ink);
}

.confirm-dialog-marker.danger {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.confirm-dialog-copy h2 {
  margin: 2px 0 6px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
}

.confirm-dialog-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.7;
}

.confirm-dialog-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.dialog-btn {
  height: 38px;
  padding: 0 18px;
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.dialog-btn.secondary {
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--line-strong);
}

.dialog-btn.secondary:hover {
  background: var(--fill);
}

.dialog-btn.primary {
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
}

.dialog-btn.danger {
  color: #fff;
  background: var(--danger);
  border: 1px solid var(--danger);
}

.dialog-btn.primary:hover,
.dialog-btn.danger:hover {
  opacity: 0.88;
}

@media (prefers-reduced-motion: reduce) {
  .confirm-dialog-enter-active .confirm-dialog,
  .confirm-dialog-leave-active .confirm-dialog {
    transition-duration: 120ms;
  }

  .confirm-dialog-enter-from .confirm-dialog,
  .confirm-dialog-leave-to .confirm-dialog {
    transform: none;
  }
}
</style>
