<template>
  <Teleport to="body">
    <div
      v-if="flight.active && flight.from"
      :key="flight.id"
      ref="duckRef"
      class="duck-flight"
      :style="style"
      aria-hidden="true"
    >
      <CompanionAvatar pose="fly" :size="flight.from.size" lively />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import CompanionAvatar from "@/components/companion/CompanionAvatar.vue";
import { useDuckFlight } from "@/composables/useDuckFlight";

/** 鸭鸭在编辑器和陪练面板之间飞：沿一条往上拱的弧线飞过去，边飞边变大小 */
const FLIGHT_MS = 520;

const { flight, finish } = useDuckFlight();
const duckRef = ref<HTMLElement | null>(null);

const style = computed(() =>
  flight.from
    ? {
        left: `${flight.from.x}px`,
        top: `${flight.from.y}px`,
        width: `${flight.from.size}px`,
        height: `${flight.from.size}px`,
      }
    : {}
);

watch(
  () => flight.id,
  async (id) => {
    await nextTick();
    const el = duckRef.value;
    const { from, to } = flight;
    if (!el || !from || !to || !flight.active) return;
    if (typeof el.animate !== "function") {
      finish(id);
      return;
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const scale = to.size / from.size;
    const lift = Math.min(80, 30 + Math.hypot(dx, dy) * 0.12);
    const tilt = dx >= 0 ? 8 : -8;
    const animation = el.animate(
      [
        { transform: "translate(0, 0) scale(1) rotate(0deg)" },
        {
          offset: 0.5,
          transform: `translate(${dx / 2}px, ${dy / 2 - lift}px) scale(${
            (1 + scale) / 2
          }) rotate(${tilt}deg)`,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)`,
        },
      ],
      {
        duration: FLIGHT_MS,
        easing: "cubic-bezier(0.45, 0, 0.25, 1)",
        fill: "forwards",
      }
    );
    animation.finished.then(
      () => finish(id),
      () => finish(id)
    );
  }
);
</script>

<style scoped>
.duck-flight {
  position: fixed;
  z-index: 1600;
  pointer-events: none;
  transform-origin: 0 0;
  --mascot-fill: var(--panel);
}
</style>
