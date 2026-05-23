<template>
  <div id="userLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped>
#userLayout {
  min-height: 100vh;
}

#userLayout .content {
  background-color: transparent !important;
  min-height: 100vh;
  padding: 0;
  margin: 0;
}
</style>
<script setup lang="ts"></script>
