<template>
  <div id="app">
    <template v-if="route.path.startsWith('/user')">
      <router-view />
    </template>
    <template v-else>
      <AppLayout />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

import { useTheme } from "@/composables/useTheme";
import AppLayout from "@/layouts/AppLayout.vue";

const route = useRoute();
useTheme();
</script>
