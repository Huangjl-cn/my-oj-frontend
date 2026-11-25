<template>
  <main class="auth-page">
    <header class="auth-top">
      <router-link class="brand" to="/" aria-label="回到题库">
        <CompanionAvatar :size="32" />
        <span>MyOJ</span>
      </router-link>
      <button
        class="icon-btn tip-down"
        type="button"
        :data-tip="isDark ? '浅色模式' : '深色模式'"
        :aria-label="isDark ? '切换为浅色模式' : '切换为深色模式'"
        @click="toggleTheme"
      >
        <AppIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
      </button>
    </header>

    <section class="panel auth-card">
      <CompanionAvatar :size="64" :mood="mood" class="auth-mascot" />
      <h1>{{ title }}</h1>
      <p class="auth-subtitle">{{ subtitle }}</p>
      <slot />
      <footer class="auth-switch">
        <slot name="footer" />
      </footer>
    </section>

    <footer class="auth-foot">
      <a
        href="http://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
      >
        渝ICP备2026019190号
      </a>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { defineProps, PropType } from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { useTheme } from "@/composables/useTheme";
import { PetMood } from "@/constants/companionMoods";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  mood: { type: String as PropType<PetMood>, default: "idle" },
});

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  padding: 16px 20px 12px;
  animation: page-enter var(--motion-standard) var(--ease-out);
}

.auth-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;
  --mascot-fill: var(--bg);
}

.auth-card {
  align-self: center;
  width: min(400px, 100%);
  display: grid;
  gap: 0;
  margin: 24px 0;
  padding: 36px 32px 28px;
  --mascot-fill: var(--panel);
}

.auth-mascot {
  justify-self: center;
  margin-bottom: 18px;
}

h1 {
  margin: 0;
  color: var(--ink);
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  margin: 8px 0 26px;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

.auth-switch {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
  color: var(--muted);
  font-size: 13.5px;
}

.auth-switch :deep(a),
.auth-switch :deep(button) {
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

/* 登录、注册表单共用 */
.auth-card :deep(.auth-form) {
  display: grid;
  gap: 14px;
}

.auth-card :deep(.auth-field) {
  display: grid;
  gap: 6px;
}

.auth-card :deep(.auth-field > span) {
  color: var(--body);
  font-size: 13px;
  font-weight: 500;
}

.auth-card :deep(.auth-submit) {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  justify-content: center;
  font-size: 15px;
}

.auth-foot {
  font-size: 12px;
}

.auth-foot a {
  color: var(--faint);
  text-decoration: none;
}

.auth-foot a:hover {
  color: var(--muted);
}

@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px 22px;
  }
}
</style>
