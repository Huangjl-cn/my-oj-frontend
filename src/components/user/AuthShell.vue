<template>
  <main class="auth-page">
    <div class="auth-shell">
      <section class="auth-brand" aria-label="MyOJ">
        <router-link class="brand-lockup" to="/" aria-label="返回 MyOJ 题库">
          <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M7 6 C3 7 1 10 1 14 C1 18 3 21 7 22"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <path
              d="M21 6 C25 7 27 10 27 14 C27 18 25 21 21 22"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <path
              d="M12 4 C14 9 15 19 16 24"
              stroke="var(--primary)"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
          <span>MyOJ</span>
        </router-link>

        <div class="brand-statement">
          <span class="brand-kicker">MY ONLINE JUDGE</span>
          <h1>MyOJ</h1>
          <p>专注每一次思考、提交与改进。</p>
        </div>

        <div class="brand-mark" aria-hidden="true">
          <span>(</span><i></i><span>)</span>
        </div>

        <span class="brand-footnote">MYOJ · ONLINE JUDGE</span>
      </section>

      <section class="auth-form-panel">
        <div class="auth-form-content">
          <header class="auth-heading">
            <span class="auth-kicker">{{ kicker }}</span>
            <h2>{{ title }}</h2>
            <p>{{ subtitle }}</p>
          </header>
          <slot />
          <footer class="auth-footer">
            <slot name="footer" />
          </footer>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

defineProps<{
  kicker: string;
  title: string;
  subtitle: string;
}>();
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  overflow: auto;
  background: var(--surface-soft);
}

.auth-shell {
  width: min(1040px, 100%);
  min-height: min(660px, calc(100vh - 64px));
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(420px, 1.1fr);
  overflow: hidden;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.auth-brand {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 38px 42px;
  overflow: hidden;
  color: var(--on-dark);
  background: var(--surface-dark);
  border-right: 1px solid var(--hairline);
}

.brand-lockup {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 10px;
  color: var(--on-dark);
  text-decoration: none;
}

.brand-lockup svg {
  width: 26px;
  height: 26px;
}

.brand-lockup span {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
}

.brand-statement {
  position: relative;
  z-index: 1;
  margin-top: 130px;
}

.brand-kicker,
.brand-footnote,
.auth-kicker {
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 500;
}

.brand-kicker,
.auth-kicker {
  color: var(--primary);
}

.brand-statement h1 {
  margin: 4px 0 10px;
  color: var(--on-dark);
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 400;
  letter-spacing: 0;
}

.brand-statement p {
  max-width: 270px;
  color: var(--on-dark-soft);
  font-size: 15px;
  line-height: 1.8;
}

.brand-mark {
  position: absolute;
  right: -22px;
  bottom: 74px;
  display: flex;
  align-items: center;
  gap: 18px;
  color: rgba(250, 249, 245, 0.07);
  font-family: var(--font-code);
  font-size: 190px;
  line-height: 1;
}

.brand-mark i {
  width: 18px;
  height: 18px;
  background: var(--primary);
  opacity: 0.45;
}

.brand-footnote {
  position: relative;
  z-index: 1;
  margin-top: auto;
  color: var(--on-dark-soft);
}

.auth-form-panel {
  display: grid;
  place-items: center;
  padding: 56px 64px;
  background: var(--canvas);
}

.auth-form-content {
  width: 100%;
  max-width: 410px;
}

.auth-heading {
  margin-bottom: 30px;
}

.auth-heading h2 {
  margin: 3px 0 7px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 400;
  letter-spacing: 0;
}

.auth-heading p {
  color: var(--muted);
  font-size: 13px;
}

:deep(.auth-form .arco-form-item) {
  margin-bottom: 18px;
}

:deep(.auth-form .arco-form-item-label) {
  padding-bottom: 6px !important;
  color: var(--body-strong) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

:deep(.auth-form .arco-input-inner-wrapper),
:deep(.auth-form .arco-input-wrapper) {
  height: 46px;
  background: var(--surface-soft) !important;
}

:deep(.auth-form .arco-input) {
  font-size: 14px !important;
}

:deep(.auth-submit) {
  width: 100%;
  height: 46px;
  margin-top: 6px;
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  transition: background-color 150ms ease, border-color 150ms ease,
    transform 100ms ease;
}

:deep(.auth-submit:hover) {
  background: var(--primary-active);
  border-color: var(--primary-active);
}

:deep(.auth-submit:active) {
  transform: translateY(1px);
}

.auth-footer {
  margin-top: 24px;
  padding-top: 20px;
  color: var(--muted);
  border-top: 1px solid var(--hairline-soft);
  font-size: 12px;
  text-align: center;
}

:deep(.auth-link) {
  margin-left: 5px;
  padding: 0;
  color: var(--primary);
  background: transparent;
  border: 0;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
}

:deep(.auth-link:hover) {
  color: var(--primary-active);
}

@media (max-width: 840px) {
  .auth-page {
    display: block;
    min-height: 100vh;
    padding: 0;
    overflow: visible;
    background: var(--canvas);
  }

  .auth-shell {
    min-height: 100vh;
    grid-template-columns: 1fr;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .auth-brand {
    min-height: 178px;
    padding: 26px 24px;
    border-right: 0;
    border-bottom: 1px solid var(--hairline);
  }

  .brand-statement {
    margin-top: 28px;
  }

  .brand-statement h1 {
    margin-bottom: 2px;
    font-size: 38px;
  }

  .brand-statement p {
    font-size: 13px;
  }

  .brand-mark {
    right: 8px;
    bottom: -18px;
    font-size: 112px;
  }

  .brand-footnote {
    display: none;
  }

  .auth-form-panel {
    align-items: start;
    padding: 36px 24px 48px;
  }
}
</style>
