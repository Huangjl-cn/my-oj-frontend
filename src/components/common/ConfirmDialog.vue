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
          <div :class="['confirm-dialog-marker', tone]">!</div>
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
import { computed, defineEmits, defineProps, withDefaults } from "vue";

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
</script>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(18, 17, 15, 0.52);
  backdrop-filter: blur(3px);
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 180ms ease;
}

.confirm-dialog-enter-active .confirm-dialog,
.confirm-dialog-leave-active .confirm-dialog {
  transform-origin: center;
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
  transform: translateY(6px) scale(0.97);
}

.confirm-dialog {
  width: min(440px, 100%);
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 14px;
  padding: 22px;
  color: var(--body);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.22);
}

.confirm-dialog-marker {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--primary);
  background: var(--primary-light);
  border: 1px solid var(--primary);
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}

.confirm-dialog-marker.danger {
  color: var(--error);
  background: rgba(198, 69, 69, 0.1);
  border-color: var(--error);
}

.confirm-dialog-copy h2 {
  margin: 1px 0 7px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 600;
}

.confirm-dialog-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.65;
}

.confirm-dialog-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.dialog-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) var(--ease-out);
}

.dialog-btn:active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .confirm-dialog-enter-active,
  .confirm-dialog-leave-active,
  .confirm-dialog-enter-active .confirm-dialog,
  .confirm-dialog-leave-active .confirm-dialog {
    transition-duration: 120ms;
  }

  .confirm-dialog-enter-from .confirm-dialog,
  .confirm-dialog-leave-to .confirm-dialog {
    transform: none;
  }
}

.dialog-btn.secondary {
  color: var(--body);
  background: transparent;
  border: 1px solid var(--hairline);
}

.dialog-btn.primary,
.dialog-btn.danger {
  color: var(--on-primary);
  border: 1px solid var(--primary);
  background: var(--primary);
}

.dialog-btn.danger {
  border-color: var(--error);
  background: var(--error);
}

.dialog-btn.secondary:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.dialog-btn.primary:hover {
  background: var(--primary-active);
}

.dialog-btn.danger:hover {
  filter: brightness(0.9);
}
</style>
