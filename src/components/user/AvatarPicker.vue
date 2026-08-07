<template>
  <div class="avatar-picker" role="radiogroup" aria-label="选择头像">
    <div class="style-tabs" role="tablist" aria-label="头像风格">
      <button
        v-for="group in USER_AVATAR_GROUPS"
        :key="group.value"
        type="button"
        role="tab"
        :aria-selected="activeGroupValue === group.value"
        :class="{ active: activeGroupValue === group.value }"
        @click="activeGroupValue = group.value"
      >
        {{ group.label }}
      </button>
    </div>
    <section v-if="activeGroup" :key="activeGroup.value" class="avatar-group">
      <header class="group-header">
        <h3>{{ activeGroup.label }}</h3>
        <span>{{ activeGroup.avatars.length }} 个</span>
      </header>
      <div class="avatar-grid">
        <button
          v-for="avatar in activeGroup.avatars"
          :key="avatar.value"
          class="avatar-option"
          :class="{ selected: modelValue === avatar.value }"
          type="button"
          role="radio"
          :aria-checked="modelValue === avatar.value"
          :title="avatar.label"
          @click="$emit('update:modelValue', avatar.value)"
        >
          <UserAvatar :avatar="avatar.value" :name="avatar.label" :size="54" />
          <span>{{ avatar.label }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, ref, watch } from "vue";

import UserAvatar from "@/components/user/UserAvatar.vue";
import { USER_AVATAR_GROUPS } from "@/constants/userAvatars";

const props = defineProps<{
  modelValue?: string;
}>();

defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const activeGroupValue = ref(USER_AVATAR_GROUPS[0].value);
const activeGroup = computed(() =>
  USER_AVATAR_GROUPS.find((group) => group.value === activeGroupValue.value)
);

watch(
  () => props.modelValue,
  (avatar) => {
    const selectedGroup = USER_AVATAR_GROUPS.find((group) =>
      group.avatars.some((option) => option.value === avatar)
    );
    if (selectedGroup) activeGroupValue.value = selectedGroup.value;
  },
  { immediate: true }
);
</script>

<style scoped>
.avatar-picker {
  display: grid;
  gap: 14px;
}

.style-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  background: var(--surface-soft);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
}

.style-tabs button {
  min-width: 0;
  min-height: 34px;
  padding: 5px 8px;
  overflow-wrap: anywhere;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 500;
  line-height: 1.25;
}

.style-tabs button.active {
  color: var(--ink);
  background: var(--canvas);
  box-shadow: var(--shadow-sm);
}

.avatar-group {
  min-width: 0;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.group-header h3 {
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
}

.group-header span {
  color: var(--muted-soft);
  font-family: var(--font-code);
  font-size: 10px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(76px, 1fr));
  gap: 8px;
}

.avatar-option {
  min-width: 0;
  min-height: 86px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px;
  color: var(--muted);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 10px;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.avatar-option:hover,
.avatar-option.selected {
  color: var(--ink);
  background: var(--surface-soft);
  border-color: var(--primary);
}

.avatar-option.selected {
  box-shadow: 0 0 0 2px var(--primary-light);
}

@media (max-width: 760px) {
  .style-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .avatar-grid {
    grid-template-columns: repeat(3, minmax(76px, 1fr));
  }
}
</style>
