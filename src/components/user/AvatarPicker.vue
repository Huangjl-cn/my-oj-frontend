<template>
  <div class="avatar-picker" role="radiogroup" aria-label="选择头像">
    <div class="style-tabs" role="tablist" aria-label="头像风格">
      <button
        v-for="group in USER_AVATAR_GROUPS"
        :key="group.value"
        type="button"
        role="tab"
        :aria-selected="activeGroupValue === group.value"
        :class="{ on: activeGroupValue === group.value }"
        @click="activeGroupValue = group.value"
      >
        {{ group.label }}
      </button>
    </div>
    <div v-if="activeGroup" :key="activeGroup.value" class="avatar-grid">
      <button
        v-for="avatar in activeGroup.avatars"
        :key="avatar.value"
        :class="['avatar-option', { selected: modelValue === avatar.value }]"
        type="button"
        role="radio"
        :aria-checked="modelValue === avatar.value"
        :aria-label="avatar.label"
        :title="avatar.label"
        @click="$emit('update:modelValue', avatar.value)"
      >
        <UserAvatar :avatar="avatar.value" :name="avatar.label" :size="44" />
      </button>
    </div>
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
  gap: 12px;
}

.style-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.style-tabs button {
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
}

.style-tabs button:hover {
  color: var(--ink);
}

.style-tabs button.on {
  background: var(--fill);
  color: var(--ink);
  font-weight: 600;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 6px;
}

.avatar-option {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: background-color var(--motion-fast) ease;
}

.avatar-option:hover {
  background: var(--fill);
}

.avatar-option.selected {
  background: var(--fill);
  box-shadow: inset 0 0 0 2px var(--ink);
}

.avatar-option:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
