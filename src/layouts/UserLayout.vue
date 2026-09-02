<template>
  <div id="userLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <ScrollPositionButton target-selector="#userLayout .auth-page" />
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import ScrollPositionButton from "@/components/layout/ScrollPositionButton.vue";
</script>

<style scoped>
#userLayout {
  min-height: 100vh;
  background: var(--canvas);
}

#userLayout .content {
  background: transparent !important;
  min-height: 100vh;
}
</style>
