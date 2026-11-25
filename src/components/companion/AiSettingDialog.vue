<template>
  <Teleport to="body">
    <Transition name="setting-dialog" appear>
      <div v-if="visible" class="setting-backdrop" @click.self="close">
        <section
          class="setting-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-setting-title"
        >
          <header class="setting-header">
            <h2 id="ai-setting-title">AI 陪练设置</h2>
            <button
              class="icon-btn"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </header>
          <AiSettingForm cancelable @saved="onSaved" @cancel="close" />
          <p class="setting-more">
            也可以在
            <router-link to="/profile" @click="close">个人中心</router-link>
            里改
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from "vue";

import AiSettingForm from "@/components/companion/AiSettingForm.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { AiSetting } from "@/services/companion";

defineProps<{ visible: boolean }>();

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "saved", setting: AiSetting): void;
}>();

const close = () => emit("update:visible", false);

const onSaved = (setting: AiSetting) => {
  emit("saved", setting);
  close();
};
</script>

<style scoped>
.setting-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(9, 9, 11, 0.42);
  backdrop-filter: blur(4px);
}

.setting-dialog {
  width: min(500px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 18px 24px 20px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 -10px 14px 0;
}

.setting-header h2 {
  margin: 0;
  color: var(--ink);
  font-size: 19px;
  font-weight: 700;
}

.setting-more {
  margin: 14px 0 0;
  color: var(--faint);
  font-size: 12.5px;
}

.setting-more a {
  color: var(--muted);
}

.setting-dialog-enter-active,
.setting-dialog-leave-active {
  transition: opacity 180ms ease;
}

.setting-dialog-enter-active .setting-dialog,
.setting-dialog-leave-active .setting-dialog {
  transition: transform var(--motion-standard) var(--ease-out);
}

.setting-dialog-enter-from,
.setting-dialog-leave-to {
  opacity: 0;
}

.setting-dialog-enter-from .setting-dialog,
.setting-dialog-leave-to .setting-dialog {
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .setting-dialog-enter-from .setting-dialog,
  .setting-dialog-leave-to .setting-dialog {
    transform: none;
  }
}
</style>
