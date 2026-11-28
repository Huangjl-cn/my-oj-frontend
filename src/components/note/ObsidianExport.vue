<template>
  <div ref="rootRef" class="obsidian-export">
    <button
      class="send tip-down"
      type="button"
      data-tip="发到 Obsidian"
      aria-label="发到 Obsidian"
      :disabled="!note"
      @click="send"
    >
      <ObsidianIcon :size="17" />
      <span class="send-text">Obsidian</span>
    </button>
    <button
      :class="['more', { on: open }]"
      type="button"
      aria-label="Obsidian 导出设置"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="open = !open"
    >
      <AppIcon name="chevron-down" :size="14" />
    </button>

    <div
      v-if="open"
      class="panel-pop"
      role="dialog"
      aria-label="Obsidian 导出设置"
    >
      <p class="pop-title">
        <ObsidianIcon :size="16" />
        导出到 Obsidian
      </p>
      <label class="field">
        <span class="field-label">库名（空着用当前打开的库）</span>
        <input
          v-model="settings.vault"
          class="pop-input"
          placeholder="比如 我的笔记"
          @change="persist"
        />
      </label>
      <label class="field">
        <span class="field-label">放在哪个文件夹</span>
        <input
          v-model="settings.folder"
          class="pop-input"
          placeholder="MyOJ"
          @change="persist"
        />
      </label>
      <label class="switch-row">
        <UiSwitch
          v-model="settings.overwrite"
          label="同名笔记已存在时覆盖它"
          @update:model-value="persist"
        />
        <span>同名笔记已存在时覆盖它</span>
      </label>
      <p class="pop-hint">需要 Obsidian 桌面版，只单向发送</p>
      <button class="btn sm" type="button" :disabled="!note" @click="download">
        <AppIcon name="arrow-down" :size="15" />
        下载 .md 文件
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import message from "@arco-design/web-vue/es/message";
import { defineProps, PropType, reactive, ref } from "vue";

import ObsidianIcon from "@/components/note/ObsidianIcon.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";
import { useDismissable } from "@/composables/useDismissable";
import {
  buildObsidianMarkdown,
  buildObsidianUri,
  Note,
  obsidianFileName,
  readObsidianSettings,
  writeObsidianSettings,
} from "@/services/note";
import { copyText } from "@/utils/copyText";

/**
 * 发到 Obsidian：把笔记整理成 Obsidian 格式（开头带属性）复制到剪贴板，再打开 obsidian://new?…&clipboard=true，
 * Obsidian 从剪贴板取内容建笔记（和 Web Clipper 一个思路）。也可以直接下载 .md。
 */
const props = defineProps({
  note: { type: Object as PropType<Note | null>, default: null },
});

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
useDismissable(rootRef, open);
const settings = reactive(readObsidianSettings());

const persist = () => writeObsidianSettings({ ...settings });

const markdown = () =>
  props.note ? buildObsidianMarkdown(props.note, window.location.origin) : "";

const send = async () => {
  const note = props.note;
  if (!note) return;
  const copied = await copyText(markdown());
  if (!copied) {
    message.error("复制失败，试试「下载 .md」");
    return;
  }
  message.info("正在打开 Obsidian…");
  window.location.href = buildObsidianUri(note.title, settings);
};

const download = () => {
  const note = props.note;
  if (!note) return;
  const blob = new Blob([markdown()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${obsidianFileName(note.title)}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
</script>

<style scoped>
.obsidian-export {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, #7c3aed 30%, var(--line));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, #7c3aed 6%, var(--panel));
}

.send,
.more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.send {
  padding: 0 8px 0 10px;
  border-radius: var(--radius-pill) 0 0 var(--radius-pill);
}

.more {
  padding: 0 8px 0 6px;
  border-left: 1px solid color-mix(in srgb, #7c3aed 22%, var(--line));
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
  color: var(--muted);
}

.send:hover,
.more:hover,
.more.on {
  background: color-mix(in srgb, #7c3aed 12%, transparent);
}

.send:disabled {
  opacity: 0.5;
  cursor: default;
}

.panel-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 40;
  width: 300px;
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-float);
}

.pop-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.pop-input {
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--fill);
  color: var(--ink);
  font: inherit;
  font-size: 13.5px;
}

.pop-input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--body);
  font-size: 13px;
  cursor: pointer;
}

.pop-hint {
  margin: 0;
  color: var(--faint);
  font-size: 12px;
  line-height: 1.6;
}

.panel-pop .btn {
  justify-self: start;
}

@media (max-width: 720px) {
  .send-text {
    display: none;
  }
}
</style>
