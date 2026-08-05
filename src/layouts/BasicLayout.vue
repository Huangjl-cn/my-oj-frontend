<template>
  <div id="basicLayout">
    <a-layout class="layout-wrapper">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <div class="router-wrap">
          <router-view />
        </div>
      </a-layout-content>
      <a-layout-footer class="footer">
        <div class="footer-inner">
          <Transition name="quote-fade" mode="out-in">
            <div class="footer-quote" :key="quoteIndex">
              <span class="quote-text">" {{ quotes[quoteIndex].text }} "</span>
              <span class="quote-sep">--</span>
              <span class="quote-author">
                {{ quotes[quoteIndex].author }},
                {{ quotes[quoteIndex].country }}
              </span>
            </div>
          </Transition>
        </div>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import GlobalHeader from "@/components/layout/GlobalHeader.vue";
import { quotes } from "@/constants/quotes";

const quoteIndex = ref(0);
let quoteTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  quoteTimer = setInterval(() => {
    quoteIndex.value = (quoteIndex.value + 1) % quotes.length;
  }, 60000);
});

onBeforeUnmount(() => {
  if (quoteTimer) clearInterval(quoteTimer);
});
</script>

<style scoped>
#basicLayout {
  height: 100vh;
  overflow: hidden;
  background: var(--canvas);
}

#basicLayout .layout-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

#basicLayout .header {
  background: var(--header-surface) !important;
  border-bottom: 1px solid var(--hairline);
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
}

#basicLayout .content {
  background: transparent !important;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.router-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 约束 router-view（如果它渲染成 DOM 元素） */
.router-wrap > :deep(router-view) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

#basicLayout .footer {
  background: var(--surface-dark) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
  padding: 10px var(--space-lg) 6px;
  line-height: 1;
}

.footer-inner {
  margin: 0 var(--space-lg);
  text-align: center;
}

.footer-quote {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 6px;
  min-height: 20px;
}

.quote-text {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 12px;
  font-weight: 400;
  font-style: italic;
  color: var(--on-dark);
  line-height: 1.4;
  letter-spacing: 0.02em;
  min-width: 0;
}

.quote-sep {
  color: var(--on-dark-soft);
  font-size: 10px;
  flex-shrink: 0;
}

.quote-author {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 500;
  color: var(--on-dark-soft);
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
}

.quote-fade-enter-active,
.quote-fade-leave-active {
  transition: opacity 0.6s ease;
}

.quote-fade-enter-from,
.quote-fade-leave-to {
  opacity: 0;
}
</style>
