<template>
  <div class="ai-setting">
    <p v-if="loading" class="hint">正在加载设置…</p>
    <p v-else-if="loadError" class="hint error">
      {{ loadError }}
      <button class="link-btn" type="button" @click="load">重试</button>
    </p>
    <form v-else class="setting-form" @submit.prevent="save">
      <p v-if="setting?.mockMode" class="note">模拟模式，回复是固定的</p>

      <label class="field">
        <span class="field-label key-label">
          DeepSeek API Key
          <span :class="['key-state', { on: setting?.keyConfigured }]">
            {{
              setting?.keyConfigured
                ? `已配置 ${setting.keyHint || ""}`
                : "还没配置"
            }}
          </span>
        </span>
        <UiInput
          v-model="apiKey"
          icon="lock"
          type="password"
          autocomplete="off"
          :placeholder="
            setting?.keyConfigured ? '留空表示不修改' : '粘贴 sk- 开头的 Key'
          "
        />
        <span class="field-hint">
          费用走你的 DeepSeek 账户，Key 加密保存。
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            去创建 Key
            <AppIcon name="external-link" :size="12" />
          </a>
        </span>
      </label>

      <label class="field">
        <span class="field-label">模型</span>
        <UiSelect v-model="model" :options="modelOptions" aria-label="模型" />
      </label>

      <div class="field">
        <span class="field-label">提示方式</span>
        <div class="modes" role="radiogroup" aria-label="提示方式">
          <button
            v-for="option in HINT_MODE_OPTIONS"
            :key="option.value"
            :class="['mode', { on: hintMode === option.value }]"
            type="button"
            role="radio"
            :aria-checked="hintMode === option.value"
            @click="hintMode = option.value"
          >
            <strong>{{ option.title }}</strong>
            <small>{{ option.description }}</small>
          </button>
        </div>
      </div>

      <p v-if="saveError" class="hint error">{{ saveError }}</p>

      <footer class="actions">
        <button
          v-if="setting?.keyConfigured"
          class="remove-key"
          type="button"
          :disabled="saving"
          @click="removeKey"
        >
          删除 Key
        </button>
        <span class="spacer" />
        <button
          v-if="cancelable"
          class="btn sm"
          type="button"
          :disabled="saving"
          @click="emit('cancel')"
        >
          取消
        </button>
        <button class="btn primary sm" type="submit" :disabled="saving">
          <AppIcon :name="saving ? 'spinner' : 'check'" :size="16" />
          {{ saving ? (apiKey.trim() ? "校验中" : "保存中") : "保存" }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { computed, defineEmits, defineProps, onMounted, ref } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import {
  AiSetting,
  deleteAiKey,
  describeCompanionError,
  getAiSetting,
  HintMode,
  saveAiSetting,
} from "@/services/companion";

/**
 * 陪练的 AI 设置：自己的 DeepSeek Key、模型、提示方式。
 * 个人中心里直接放在页面上，陪练面板里放在弹窗里（可以取消）。
 */
defineProps({
  cancelable: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (event: "saved", setting: AiSetting): void;
  (event: "cancel"): void;
}>();

const HINT_MODE_OPTIONS: {
  value: HintMode;
  title: string;
  description: string;
}[] = [
  {
    value: "guided",
    title: "循序渐进",
    description: "一步步给提示，你决定要到哪一步",
  },
  {
    value: "direct",
    title: "有问必答",
    description: "不分步骤，问什么答什么，可以直接改代码",
  },
];

const setting = ref<AiSetting | null>(null);
const loading = ref(false);
const loadError = ref("");
const saving = ref(false);
const saveError = ref("");
const apiKey = ref("");
const model = ref("");
const hintMode = ref<HintMode>("guided");

const modelOptions = computed(() =>
  (setting.value?.models ?? []).map((option) => ({
    value: option.id,
    label: option.displayName || option.id,
  }))
);

const fill = (value: AiSetting) => {
  setting.value = value;
  model.value = value.model;
  hintMode.value = value.hintMode;
  apiKey.value = "";
};

const load = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    fill(await getAiSetting());
  } catch (error) {
    loadError.value = describeCompanionError(error);
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  saveError.value = "";
  try {
    const key = apiKey.value.trim();
    const saved = await saveAiSetting({
      apiKey: key || undefined,
      model: model.value,
      hintMode: hintMode.value,
    });
    fill(saved);
    message.success(key ? "Key 校验通过，已保存" : "已保存");
    emit("saved", saved);
  } catch (error) {
    saveError.value = describeCompanionError(error);
  } finally {
    saving.value = false;
  }
};

const removeKey = async () => {
  saving.value = true;
  saveError.value = "";
  try {
    const saved = await deleteAiKey();
    fill(saved);
    message.success("已删除 Key");
    emit("saved", saved);
  } catch (error) {
    saveError.value = describeCompanionError(error);
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.setting-form {
  display: grid;
  gap: 18px;
}

.hint {
  margin: 0;
  color: var(--muted);
  font-size: 13.5px;
}

.hint.error {
  color: var(--danger);
}

.note {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--body);
  font-size: 13px;
}

.key-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.key-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--faint);
  font-size: 12.5px;
  font-weight: 400;
}

.key-state::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--line-strong);
}

.key-state.on {
  color: var(--success);
}

.key-state.on::before {
  background: currentColor;
}

.field-hint a {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--ink);
  font-weight: 500;
  text-decoration: none;
}

.field-hint a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mode {
  display: grid;
  gap: 3px;
  padding: 12px 14px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--fill);
  color: var(--body);
  text-align: left;
  cursor: pointer;
  transition: box-shadow var(--motion-fast) ease,
    background-color var(--motion-fast) ease;
}

.mode strong {
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}

.mode small {
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.5;
}

.mode:hover {
  background: var(--fill-strong);
}

.mode.on {
  background: var(--panel);
  box-shadow: inset 0 0 0 2px var(--ink);
}

.mode:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spacer {
  flex: 1;
}

.remove-key {
  padding: 0;
  border: none;
  background: none;
  color: var(--danger);
  font: inherit;
  font-size: 13.5px;
  cursor: pointer;
}

.remove-key:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.remove-key:disabled {
  cursor: default;
  opacity: 0.5;
}

.link-btn {
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 520px) {
  .modes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
