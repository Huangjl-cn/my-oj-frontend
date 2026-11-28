<template>
  <div class="timeline" aria-label="时间条">
    <div class="lane-names" aria-hidden="true">
      <span v-for="lane in LANES" :key="lane.value">{{ lane.label }}</span>
    </div>
    <div class="track-scroll">
      <div class="track" :style="{ minWidth: `${minWidth}px` }">
        <div
          v-for="lane in LANES"
          :key="lane.value"
          class="lane"
          :data-lane="lane.value"
        >
          <button
            v-for="(bar, index) in barsOf(lane.value)"
            :key="`${bar.rowKey}-${index}`"
            :class="[
              'bar',
              lane.value,
              { error: bar.error, on: bar.rowKey === selected },
            ]"
            type="button"
            :style="{ left: `${bar.left}%`, width: `${bar.width}%` }"
            :title="bar.label"
            :aria-label="bar.label"
            @click="emit('select', bar.rowKey)"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, PropType } from "vue";

import { TimelineBar, TimelineLane } from "@/services/companionTrace";

/** 轨迹顶上的时间条：输入、模型、工具三条泳道，点一段就选中下面对应的那一行 */
const props = defineProps({
  bars: { type: Array as PropType<TimelineBar[]>, required: true },
  /** 一共几轮：轮多的时候拉宽，左右滑着看 */
  turns: { type: Number, default: 1 },
  selected: { type: String, default: "" },
});

const emit = defineEmits<{
  (event: "select", rowKey: string): void;
}>();

const LANES: { value: TimelineLane; label: string }[] = [
  { value: "input", label: "输入" },
  { value: "model", label: "模型" },
  { value: "tool", label: "工具" },
];

/** 每轮至少 70px，看得清 */
const minWidth = computed(() => Math.max(0, props.turns * 70));

const barsOf = (lane: TimelineLane) =>
  props.bars.filter((bar) => bar.lane === lane);
</script>

<style scoped>
.timeline {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 8px;
  padding: 10px 16px 10px 14px;
  border-bottom: 1px solid var(--line);
}

.lane-names {
  display: grid;
  grid-auto-rows: 14px;
  row-gap: 6px;
  color: var(--faint);
  font-size: 11px;
  line-height: 14px;
  text-align: right;
}

.track-scroll {
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.track {
  display: grid;
  grid-auto-rows: 14px;
  row-gap: 6px;
  padding-bottom: 2px;
}

.lane {
  position: relative;
  border-radius: 3px;
  background: var(--fill);
}

.bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  min-width: 3px;
  padding: 0;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: filter var(--motion-fast) ease;
}

.bar.input {
  background: color-mix(in srgb, var(--tint-blue) 70%, var(--panel));
}

.bar.model {
  background: color-mix(in srgb, var(--tint-violet) 75%, var(--panel));
}

.bar.tool {
  background: color-mix(in srgb, var(--tint-orange) 80%, var(--panel));
}

.bar.error {
  background: var(--danger);
}

.bar:hover {
  filter: brightness(1.12);
}

.bar.on {
  top: 0;
  bottom: 0;
  box-shadow: 0 0 0 2px var(--panel), 0 0 0 3px var(--ink);
  z-index: 1;
}
</style>
