<template>
  <div class="preview-bar" role="region" aria-label="代码修改建议">
    <div class="preview-copy">
      <strong>{{ name }}的修改建议</strong>
      <span class="preview-summary">{{ summary }}</span>
      <ul v-if="reasons.length" class="preview-reasons">
        <li v-for="(reason, index) in reasons" :key="index">{{ reason }}</li>
      </ul>
      <p v-if="warning" class="preview-warning">{{ warning }}</p>
    </div>
    <div class="preview-actions">
      <button
        class="preview-btn secondary"
        type="button"
        @click="emit('cancel')"
      >
        不用了
      </button>
      <button
        class="preview-btn primary"
        type="button"
        :disabled="preview.resolution.applied === 0"
        @click="emit('apply')"
      >
        {{ preview.resolution.needsOverwriteConfirm ? "覆盖并应用" : "应用" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, withDefaults } from "vue";

import { CodePreview } from "@/composables/useCompanion";
import { describeProposal } from "@/services/codeEditProposal";

const MAX_REASONS = 3;

const props = withDefaults(
  defineProps<{
    preview: CodePreview;
    name?: string;
  }>(),
  { name: "栗子" }
);

const emit = defineEmits<{
  (event: "apply"): void;
  (event: "cancel"): void;
}>();

const summary = computed(() => describeProposal(props.preview.proposal));

const reasons = computed(() =>
  props.preview.proposal.edits
    .map((edit) => edit.reason?.trim())
    .filter((reason): reason is string => !!reason)
    .slice(0, MAX_REASONS)
);

const warning = computed(() => {
  const { resolution, proposal } = props.preview;
  if (resolution.applied === 0) {
    return "代码在这期间变过，这些修改都对不上了，重新问一次吧";
  }
  if (resolution.needsOverwriteConfirm) {
    return "你在这期间改过代码，应用后会整体覆盖当前代码（可以 Ctrl+Z 撤回）";
  }
  if (resolution.failed.length) {
    return `代码在这期间变过，${proposal.edits.length} 处里有 ${resolution.failed.length} 处对不上，已跳过`;
  }
  return "";
});
</script>

<style scoped>
.preview-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  color: var(--on-dark);
  background: var(--surface-dark-elevated);
  border-top: 1px solid rgba(204, 120, 92, 0.35);
  border-bottom: 1px solid rgba(204, 120, 92, 0.35);
  flex-shrink: 0;
}

.preview-copy {
  min-width: 0;
  font-size: 12px;
  line-height: 1.6;
}

.preview-copy strong {
  margin-right: 8px;
  color: var(--primary);
  font-weight: 600;
}

.preview-summary {
  color: var(--on-dark-soft);
}

.preview-reasons {
  margin: 4px 0 0;
  padding-left: 16px;
  color: var(--on-dark-soft);
}

.preview-warning {
  margin: 4px 0 0;
  color: var(--accent-amber);
}

.preview-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.preview-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.preview-btn.secondary {
  color: var(--on-dark-soft);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.preview-btn.primary {
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
}

.preview-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
