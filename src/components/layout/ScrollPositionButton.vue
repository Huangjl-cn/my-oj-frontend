<template>
  <button
    v-if="scrollActionVisible"
    class="scroll-position-button"
    type="button"
    :aria-label="scrollAtBottom ? '回到顶部' : '到底部'"
    :title="scrollAtBottom ? '回到顶部' : '到底部'"
    @click="toggleScrollPosition"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path v-if="scrollAtBottom" d="m6 15 6-6 6 6" />
      <path v-else d="m6 9 6 6 6-6" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import {
  defineProps,
  onBeforeUnmount,
  onMounted,
  ref,
  withDefaults,
} from "vue";

const props = withDefaults(
  defineProps<{
    targetSelector?: string;
  }>(),
  {
    targetSelector: "#basicLayout .content",
  }
);

const scrollActionVisible = ref(false);
const scrollAtBottom = ref(false);
let scrollContainer: HTMLElement | null = null;
let contentObserver: MutationObserver | null = null;
let updateFrame: number | null = null;

const updateScrollAction = () => {
  if (!scrollContainer) {
    scrollActionVisible.value = false;
    scrollAtBottom.value = false;
    return;
  }
  const maxScrollTop = Math.max(
    0,
    scrollContainer.scrollHeight - scrollContainer.clientHeight
  );
  scrollActionVisible.value = maxScrollTop > 80;
  scrollAtBottom.value =
    maxScrollTop <= 24 || scrollContainer.scrollTop >= maxScrollTop - 24;
};

const scheduleScrollUpdate = () => {
  if (updateFrame != null) return;
  updateFrame = requestAnimationFrame(() => {
    updateFrame = null;
    updateScrollAction();
  });
};

const toggleScrollPosition = () => {
  if (!scrollContainer) return;
  const targetTop = scrollAtBottom.value
    ? 0
    : scrollContainer.scrollHeight - scrollContainer.clientHeight;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  scrollContainer.scrollTo({ top: targetTop, behavior });
};

onMounted(() => {
  scrollContainer = document.querySelector<HTMLElement>(props.targetSelector);
  scrollContainer?.addEventListener("scroll", updateScrollAction, {
    passive: true,
  });
  window.addEventListener("resize", scheduleScrollUpdate);
  if (scrollContainer) {
    contentObserver = new MutationObserver(scheduleScrollUpdate);
    contentObserver.observe(scrollContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  scheduleScrollUpdate();
});

onBeforeUnmount(() => {
  scrollContainer?.removeEventListener("scroll", updateScrollAction);
  window.removeEventListener("resize", scheduleScrollUpdate);
  contentObserver?.disconnect();
  if (updateFrame != null) cancelAnimationFrame(updateFrame);
  scrollContainer = null;
  contentObserver = null;
  updateFrame = null;
});
</script>

<style scoped>
.scroll-position-button {
  position: fixed;
  right: 60px;
  bottom: 100px;
  z-index: 120;
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  padding: 0;
  color: var(--muted);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: 50%;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  animation: claude-fade-up var(--motion-fast) var(--ease-out);
  transition: color 160ms ease, background 160ms ease, border-color 160ms ease,
    transform 160ms ease;
}

.scroll-position-button svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.scroll-position-button:hover {
  color: var(--primary);
  border-color: var(--primary);
  transform: translateY(-2px);
}
</style>
