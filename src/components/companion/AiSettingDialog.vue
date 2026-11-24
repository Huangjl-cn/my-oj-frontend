<template>
  <Teleport to="body">
    <Transition name="setting-dialog" appear>
      <div v-if="visible" class="setting-backdrop" @click.self="close">
        <section
          class="setting-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-setting-title"
        >
          <header class="setting-header">
            <h2 id="ai-setting-title">AI 陪练设置</h2>
            <button
              class="setting-close"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              ×
            </button>
          </header>

          <div v-if="loading" class="setting-hint">正在加载设置…</div>
          <div v-else-if="loadError" class="setting-hint error">
            {{ loadError }}
            <button class="link-btn" type="button" @click="load">重试</button>
          </div>
          <form v-else class="setting-form" @submit.prevent="save">
            <p v-if="setting?.mockMode" class="setting-note">
              当前是开发环境的模拟模式，不会真正调用模型，回复是固定话术。
            </p>

            <label class="setting-field">
              <span class="setting-label">DeepSeek API Key</span>
              <input
                v-model="apiKey"
                class="setting-input"
                type="password"
                autocomplete="off"
                spellcheck="false"
                :placeholder="
                  setting?.keyConfigured
                    ? `已配置 ${setting.keyHint || ''}，留空表示不修改`
                    : 'sk-...'
                "
              />
              <span class="setting-help">
                费用走你自己的 DeepSeek 账户，Key
                加密保存，任何接口都不会返回完整 Key。
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  >去创建 Key</a
                >
              </span>
            </label>

            <label class="setting-field">
              <span class="setting-label">模型</span>
              <select v-model="model" class="setting-input">
                <option
                  v-for="option in setting?.models ?? []"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.displayName || option.id }}
                </option>
              </select>
            </label>

            <fieldset class="setting-field">
              <legend class="setting-label">提示方式</legend>
              <label
                v-for="option in HINT_MODE_OPTIONS"
                :key="option.value"
                :class="['mode-option', { active: hintMode === option.value }]"
              >
                <input
                  v-model="hintMode"
                  type="radio"
                  name="hint-mode"
                  :value="option.value"
                />
                <span>
                  <strong>{{ option.title }}</strong>
                  <small>{{ option.description }}</small>
                </span>
              </label>
            </fieldset>

            <p v-if="saveError" class="setting-hint error">{{ saveError }}</p>

            <footer class="setting-actions">
              <button
                v-if="setting?.keyConfigured"
                class="dialog-btn danger-text"
                type="button"
                :disabled="saving"
                @click="removeKey"
              >
                删除 Key
              </button>
              <span class="spacer"></span>
              <button
                class="dialog-btn secondary"
                type="button"
                :disabled="saving"
                @click="close"
              >
                取消
              </button>
              <button
                class="dialog-btn primary"
                type="submit"
                :disabled="saving"
              >
                {{ saving ? (apiKey.trim() ? "校验中…" : "保存中…") : "保存" }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { defineEmits, defineProps, ref, watch } from "vue";

import {
  AiSetting,
  deleteAiKey,
  describeCompanionError,
  getAiSetting,
  HintMode,
  saveAiSetting,
} from "@/services/companion";

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

const props = defineProps<{ visible: boolean }>();

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "saved", setting: AiSetting): void;
}>();

const setting = ref<AiSetting | null>(null);
const loading = ref(false);
const loadError = ref("");
const saving = ref(false);
const saveError = ref("");
const apiKey = ref("");
const model = ref("");
const hintMode = ref<HintMode>("guided");

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

watch(
  () => props.visible,
  (visible) => {
    saveError.value = "";
    apiKey.value = "";
    if (visible) void load();
  },
  { immediate: true }
);

const close = () => {
  if (!saving.value) emit("update:visible", false);
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
    emit("update:visible", false);
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
</script>

<style scoped>
.setting-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(18, 17, 15, 0.52);
  backdrop-filter: blur(3px);
}

.setting-dialog {
  width: min(480px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 22px;
  color: var(--body);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.22);
}

.setting-dialog-enter-active,
.setting-dialog-leave-active {
  transition: opacity 180ms ease;
}

.setting-dialog-enter-from,
.setting-dialog-leave-to {
  opacity: 0;
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.setting-header h2 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 600;
}

.setting-close {
  width: 28px;
  height: 28px;
  color: var(--muted);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.setting-form {
  display: grid;
  gap: 16px;
}

.setting-field {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: none;
}

.setting-label {
  padding: 0;
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
}

.setting-input {
  height: 38px;
  padding: 0 12px;
  color: var(--ink);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
}

.setting-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-ring);
}

.setting-help,
.setting-note {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.setting-help a {
  color: var(--primary);
}

.setting-note {
  padding: 8px 10px;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
}

.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.mode-option.active {
  border-color: var(--primary);
}

.mode-option input {
  margin-top: 3px;
  accent-color: var(--primary);
}

.mode-option strong {
  display: block;
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
}

.mode-option small {
  color: var(--muted);
  font-size: 12px;
}

.setting-hint {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.setting-hint.error {
  color: var(--error);
}

.link-btn {
  margin-left: 6px;
  padding: 0;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.spacer {
  flex: 1;
}

.dialog-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.dialog-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dialog-btn.secondary {
  color: var(--body);
  background: transparent;
  border: 1px solid var(--hairline);
}

.dialog-btn.primary {
  color: var(--on-primary);
  background: var(--primary);
  border: 1px solid var(--primary);
}

.dialog-btn.danger-text {
  padding: 0 4px;
  color: var(--error);
  background: transparent;
  border: none;
}
</style>
