<template>
  <div class="app-shell">
    <AppRail class="app-rail" />
    <div :class="['app-main', { 'full-height': fullHeight }]">
      <div class="app-page">
        <router-view v-slot="{ Component, route: viewRoute }">
          <component :is="Component" :key="viewRoute.fullPath" />
        </router-view>
      </div>
      <footer class="app-foot">
        <a
          href="http://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >
          渝ICP备2026019190号
        </a>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import AppRail from "@/components/layout/AppRail.vue";

const route = useRoute();

/** 做题页这类占满一屏、内部自己滚动的页面 */
const fullHeight = computed(() => route.meta.fullHeight === true);
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  background: var(--bg);
}

.app-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

.app-main.full-height {
  overflow: hidden;
}

.app-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.app-page > :deep(*) {
  flex: 1;
  min-height: 0;
}

.app-foot {
  flex: none;
  padding: 10px 0 12px;
  text-align: center;
  font-size: 12px;
}

.app-foot a {
  color: var(--faint);
  text-decoration: none;
}

.app-foot a:hover {
  color: var(--muted);
}

.full-height .app-foot {
  padding: 4px 0 6px;
}

@media (max-width: 720px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .app-rail {
    order: 2;
  }
}
</style>
