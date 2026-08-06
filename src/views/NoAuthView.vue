<template>
  <main class="no-auth-view">
    <h1>你没权限！</h1>
  </main>
</template>

<style scoped>
.no-auth-view {
  flex: 1;
  min-height: 100%;
  display: grid;
  place-items: center;
  background: var(--canvas);
}

.no-auth-view h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(48px, 8vw, 112px);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.15;
}
</style>
