<template>
  <div
    ref="rootRef"
    :class="['ui-select', `size-${size}`, { disabled, open: isOpen }]"
  >
    <button
      ref="triggerRef"
      class="ui-select-trigger"
      type="button"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? listId : undefined"
      :aria-activedescendant="
        isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
      "
      :aria-label="ariaLabel || placeholder"
      @click="toggle"
      @keydown="onKeydown"
    >
      <!-- 宽度按最长的选项撑开，和原生下拉框一样，换选项时不跳 -->
      <span class="ui-select-value">
        <span
          v-for="option in allOptions"
          :key="`size-${option.value}`"
          class="ui-select-sizer"
          aria-hidden="true"
        >
          {{ option.label }}
        </span>
        <span :class="['ui-select-text', { placeholder: !selected }]">
          {{ selected?.label ?? placeholder ?? "" }}
        </span>
      </span>
      <AppIcon name="chevron-down" :size="14" class="ui-select-chevron" />
    </button>

    <Teleport to="body">
      <ul
        v-if="isOpen"
        :id="listId"
        ref="listRef"
        class="ui-select-list"
        role="listbox"
        :aria-label="ariaLabel || placeholder"
        :style="listStyle"
      >
        <li
          v-for="(option, index) in allOptions"
          :id="optionId(index)"
          :key="option.value"
          role="option"
          :aria-selected="option.value === current"
          :class="[
            'ui-select-option',
            {
              active: index === activeIndex,
              selected: option.value === current,
            },
          ]"
          @pointermove="activeIndex = index"
          @click="choose(option)"
        >
          <span class="ui-select-option-text">{{ option.label }}</span>
          <AppIcon v-if="option.value === current" name="check" :size="15" />
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineProps,
  nextTick,
  onBeforeUnmount,
  PropType,
  ref,
  watch,
} from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

type SelectOption = { value: string; label: string };

/**
 * 下拉选择：按钮 + 自己画的选项列表（和站内其他菜单一个样子，不用浏览器自带的）。
 * 列表挂在 body 上，不会被对话框、面板的 overflow 裁掉；键盘可以上下选、回车确定、Esc 关闭、按字母跳转。
 */
const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array as PropType<SelectOption[]>, required: true },
  /** 不为空时多一个值为 "" 的选项，用来表示「全部」或「未选择」 */
  placeholder: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  /** md：表单里的输入框样式；sm：工具栏里的小胶囊 */
  size: { type: String as PropType<"md" | "sm">, default: "md" },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const listId = `ui-select-${Math.random().toString(36).slice(2, 10)}`;
const optionId = (index: number) => `${listId}-${index}`;

const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activeIndex = ref(-1);
const listStyle = ref<Record<string, string>>({});

const allOptions = computed<SelectOption[]>(() =>
  props.placeholder != null
    ? [{ value: "", label: props.placeholder }, ...props.options]
    : props.options
);
const current = computed(() => props.modelValue ?? "");
const selected = computed(() =>
  allOptions.value.find((option) => option.value === current.value)
);
const selectedIndex = () =>
  allOptions.value.findIndex((option) => option.value === current.value);

// region 列表位置：贴着按钮，下面放不下就放上面

const GAP = 6;
const MAX_HEIGHT = 280;

const place = () => {
  const trigger = triggerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - GAP - 8;
  const above = rect.top - GAP - 8;
  const listHeight = Math.min(
    MAX_HEIGHT,
    listRef.value?.scrollHeight ?? MAX_HEIGHT
  );
  const upward = below < listHeight && above > below;
  const room = Math.max(120, upward ? above : below);
  listStyle.value = {
    left: `${Math.round(rect.left)}px`,
    minWidth: `${Math.round(rect.width)}px`,
    maxHeight: `${Math.round(Math.min(MAX_HEIGHT, room))}px`,
    ...(upward
      ? { bottom: `${Math.round(window.innerHeight - rect.top + GAP)}px` }
      : { top: `${Math.round(rect.bottom + GAP)}px` }),
  };
};

let placeFrame = 0;
const schedulePlace = () => {
  if (!placeFrame) {
    placeFrame = requestAnimationFrame(() => {
      placeFrame = 0;
      place();
    });
  }
};

// endregion

// region 打开、关闭、选择

const scrollActiveIntoView = () => {
  if (activeIndex.value < 0) return;
  document
    .getElementById(optionId(activeIndex.value))
    ?.scrollIntoView?.({ block: "nearest" });
};

const open = async () => {
  if (props.disabled || isOpen.value) return;
  activeIndex.value = Math.max(0, selectedIndex());
  place();
  isOpen.value = true;
  await nextTick();
  place();
  scrollActiveIntoView();
};

const close = (focusTrigger = false) => {
  if (!isOpen.value) return;
  isOpen.value = false;
  if (focusTrigger) triggerRef.value?.focus();
};

const toggle = () => (isOpen.value ? close() : void open());

const choose = (option: SelectOption) => {
  if (option.value !== current.value) emit("update:modelValue", option.value);
  close(true);
};

const move = (delta: number) => {
  const count = allOptions.value.length;
  if (!count) return;
  activeIndex.value = (activeIndex.value + delta + count) % count;
  void nextTick(scrollActiveIntoView);
};

/** 按字母跳到下一个以它开头的选项 */
const jumpTo = (key: string) => {
  const count = allOptions.value.length;
  const lower = key.toLowerCase();
  for (let step = 1; step <= count; step++) {
    const index = (Math.max(activeIndex.value, 0) + step) % count;
    if (allOptions.value[index].label.toLowerCase().startsWith(lower)) {
      activeIndex.value = index;
      void nextTick(scrollActiveIntoView);
      return;
    }
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      void open();
    }
    return;
  }
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      move(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      move(-1);
      break;
    case "Home":
      event.preventDefault();
      activeIndex.value = 0;
      break;
    case "End":
      event.preventDefault();
      activeIndex.value = allOptions.value.length - 1;
      break;
    case "Enter":
    case " ": {
      event.preventDefault();
      const option = allOptions.value[activeIndex.value];
      if (option) choose(option);
      break;
    }
    case "Escape":
      event.preventDefault();
      close(true);
      break;
    case "Tab":
      close();
      break;
    default:
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        jumpTo(event.key);
      }
  }
};

// 点到按钮和列表以外的地方就关掉；页面滚动、窗口变化时跟着按钮走
const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Node | null;
  if (!target) return;
  if (rootRef.value?.contains(target) || listRef.value?.contains(target)) {
    return;
  }
  close();
};

const onScroll = (event: Event) => {
  if (listRef.value && event.target instanceof Node) {
    if (listRef.value.contains(event.target)) return;
  }
  schedulePlace();
};

const detach = () => {
  document.removeEventListener("pointerdown", onPointerDown, true);
  window.removeEventListener("scroll", onScroll, true);
  window.removeEventListener("resize", schedulePlace);
  if (placeFrame) cancelAnimationFrame(placeFrame);
  placeFrame = 0;
};

watch(isOpen, (value) => {
  if (value) {
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", schedulePlace);
  } else {
    detach();
  }
});

watch(
  () => props.disabled,
  (value) => {
    if (value) close();
  }
);

onBeforeUnmount(detach);

// endregion
</script>

<style scoped>
.ui-select {
  position: relative;
  display: inline-flex;
  min-width: 0;
}

.ui-select-trigger {
  position: relative;
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  border: none;
  background: var(--fill);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--motion-fast) ease;
}

.size-md .ui-select-trigger {
  height: 40px;
  padding: 0 34px 0 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
}

.size-sm .ui-select-trigger {
  height: 34px;
  padding: 0 32px 0 14px;
  border-radius: var(--radius-pill);
  font-size: 13.5px;
  font-weight: 500;
}

.ui-select-trigger:hover,
.open .ui-select-trigger {
  background: var(--fill-strong);
}

.ui-select-trigger:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.size-md .ui-select-trigger:focus-visible {
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--line-strong), var(--focus-ring);
}

.disabled .ui-select-trigger {
  cursor: default;
  opacity: 0.6;
}

.disabled .ui-select-trigger:hover {
  background: var(--fill);
}

/* 所有选项叠在同一格里撑开宽度，只显示当前那个 */
.ui-select-value {
  display: grid;
  min-width: 0;
  flex: 1;
}

.ui-select-sizer,
.ui-select-text {
  grid-area: 1 / 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ui-select-sizer {
  height: 0;
  visibility: hidden;
}

.ui-select-text.placeholder {
  color: var(--muted);
}

.ui-select-chevron {
  position: absolute;
  right: 12px;
  color: var(--muted);
  pointer-events: none;
  transition: transform var(--motion-fast) ease;
}

.open .ui-select-chevron {
  transform: rotate(180deg);
}

/* 列表：和站内其他弹出菜单一样 */
.ui-select-list {
  position: fixed;
  z-index: 3100;
  max-width: min(360px, calc(100vw - 16px));
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-float);
  animation: ui-select-in var(--motion-fast) var(--ease-out);
}

.ui-select-option {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  color: var(--body);
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.ui-select-option-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ui-select-option.active {
  background: var(--fill);
  color: var(--ink);
}

.ui-select-option.selected {
  color: var(--ink);
  font-weight: 600;
}

@keyframes ui-select-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-select-list {
    animation: none;
  }
}
</style>
