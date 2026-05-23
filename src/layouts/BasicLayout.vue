<template>
  <div id="basicLayout">
    <a-layout class="layout-wrapper" style="min-height: 100vh">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <a-layout-footer class="footer">
        <a href="https://unsplash.com/t/nature" target="_blank">
          Embrace nature
        </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<style scoped>
#basicLayout {
  min-height: 100vh;
  background-color: transparent;
  position: relative;
}

#basicLayout .layout-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#basicLayout .header {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  box-shadow: var(--shadow-md);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--transition-normal);
}

#basicLayout .header:hover {
  box-shadow: var(--shadow-lg);
  border-bottom-color: var(--border-light);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

#basicLayout .content {
  background-color: transparent !important;
  padding: var(--spacing-md);
  flex: 1;
  position: relative;
  z-index: 1;
}

#basicLayout .footer {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  padding: var(--spacing-md);
  left: 0;
  right: 0;
  text-align: center;
  border-top: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  z-index: 10;
  margin-top: auto;
}

#basicLayout .footer:hover {
  border-top-color: var(--border-light);
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

#basicLayout .footer a {
  color: var(--primary-color) !important;
  text-decoration: none;
  transition: all var(--transition-fast);
  font-weight: 500;
  position: relative;
}

#basicLayout .footer a::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--primary-gradient);
  transition: width var(--transition-fast);
}

#basicLayout .footer a:hover {
  color: var(--text-primary) !important;
}

#basicLayout .footer a:hover::after {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  #basicLayout .content {
    padding: var(--spacing-sm);
  }
}
</style>
<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader";
</script>
