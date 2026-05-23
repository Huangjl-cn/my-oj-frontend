<template>
  <div id="app">
    <template v-if="route.path.startsWith('/user')">
      <router-view />
    </template>
    <template v-else>
      <BasicLayout />
    </template>
  </div>
</template>

<style>
:root {
  /* 明亮色系主题变量 - 简约高级配色 */
  --primary-color: #6366f1;
  --primary-light: rgba(99, 102, 241, 0.1);
  --primary-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --secondary-color: #94a3b8;
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --surface-light: #f1f5f9;
  --card-color: rgba(255, 255, 255, 0.5);
  --card-hover: rgba(255, 255, 255, 0.7);
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --hover-color: rgba(99, 102, 241, 0.05);
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #3b82f6;

  /* 字体 */
  --font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  --font-heading: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* 边框圆角 */
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
  --shadow-primary: 0 0 20px rgba(99, 102, 241, 0.2);

  /* 过渡动画 */
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  font-family: var(--font-family);
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #e0f2fe 15%,
    #dbeafe 30%,
    #ede9fe 45%,
    #fce7f3 60%,
    #fef3c7 75%,
    #dcfce7 90%,
    #f8fafc 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #e0f2fe 15%,
    #dbeafe 30%,
    #ede9fe 45%,
    #fce7f3 60%,
    #fef3c7 75%,
    #dcfce7 90%,
    #f8fafc 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  overflow-x: hidden;
}

/* 渐变背景动画 */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--surface-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--secondary-color);
  border-radius: 4px;
  transition: all var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* Arco Design 组件样式覆盖 */
.arco-btn {
  border-radius: var(--border-radius-md) !important;
  transition: all var(--transition-fast) !important;
  font-weight: 500 !important;
}

.arco-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: var(--shadow-md) !important;
}

.arco-btn-primary {
  background: var(--primary-gradient) !important;
  border: none !important;
}

.arco-btn-outline {
  border-color: var(--border-color) !important;
  color: var(--text-secondary) !important;
}

.arco-btn-outline:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  background-color: var(--primary-light) !important;
}

.arco-card {
  background-color: var(--card-color) !important;
  border-radius: var(--border-radius-lg) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: var(--shadow-sm) !important;
  transition: all var(--transition-normal) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
}

.arco-card:hover {
  box-shadow: var(--shadow-md) !important;
  border-color: var(--border-light) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
}

.arco-form {
  color: var(--text-primary) !important;
  background-color: var(--card-color) !important;
  border-radius: var(--border-radius-lg) !important;
  border: 1px solid var(--border-color) !important;
  padding: var(--spacing-lg) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: var(--shadow-sm) !important;
  transition: all var(--transition-normal) !important;
}

.arco-form:hover {
  box-shadow: var(--shadow-md) !important;
  border-color: var(--border-light) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
}

.arco-form-item-label {
  color: var(--text-secondary) !important;
  font-weight: 500 !important;
}

/* 输入框 placeholder 颜色 */
.arco-input::placeholder,
.arco-input-affix-wrapper::placeholder,
.arco-input-password::placeholder {
  color: var(--text-muted) !important;
}

/* 输入框内部元素颜色 */
.arco-input-inner-wrapper {
  background-color: transparent !important;
}

.arco-input-icon {
  color: var(--text-secondary) !important;
}

.arco-input-icon:hover {
  color: var(--primary-color) !important;
}

.arco-menu {
  background-color: rgba(255, 255, 255, 0.5) !important;
  color: var(--text-primary) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border-radius: var(--border-radius-lg) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: var(--shadow-sm) !important;
}

.arco-menu-item {
  color: var(--text-secondary) !important;
  border-radius: var(--border-radius-md) !important;
  margin: 0 4px !important;
  transition: all var(--transition-fast) !important;
  font-weight: 500 !important;
  background-color: transparent !important;
}

.arco-menu-item:hover {
  background-color: var(--hover-color) !important;
  color: var(--text-primary) !important;
}

.arco-menu-item.arco-menu-item-selected {
  background-color: var(--primary-light) !important;
  color: var(--primary-color) !important;
}

.arco-menu-item.arco-menu-item-disabled {
  background-color: transparent !important;
  color: var(--text-secondary) !important;
  opacity: 1 !important;
}

.arco-table {
  background-color: var(--card-color) !important;
  border-radius: var(--border-radius-lg) !important;
  border: 1px solid var(--border-color) !important;
  overflow: hidden !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: var(--shadow-sm) !important;
}

.arco-table-th {
  background-color: rgba(255, 255, 255, 0.6) !important;
  color: var(--text-primary) !important;
  font-weight: 600 !important;
  border-bottom: 1px solid var(--border-color) !important;
  padding: var(--spacing-md) !important;
}

.arco-table-td {
  background-color: rgba(255, 255, 255, 0.4) !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
  padding: var(--spacing-md) !important;
  transition: all var(--transition-fast) !important;
}

.arco-table-tr:hover .arco-table-td {
  background-color: var(--hover-color) !important;
  color: var(--text-primary) !important;
}

.arco-divider {
  margin: var(--spacing-md) 0 !important;
  border-color: var(--border-color) !important;
}

.arco-tag {
  background-color: var(--primary-light) !important;
  color: var(--primary-color) !important;
  border: 1px solid var(--primary-light) !important;
  border-radius: var(--border-radius-sm) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

.arco-pagination {
  background-color: var(--card-color) !important;
  border-radius: var(--border-radius-md) !important;
  border: 1px solid var(--border-color) !important;
  padding: var(--spacing-sm) !important;
  margin-top: var(--spacing-lg) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: var(--shadow-sm) !important;
}

.arco-pagination-item {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-secondary) !important;
  transition: all var(--transition-fast) !important;
  border-radius: var(--border-radius-sm) !important;
}

.arco-pagination-item:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  background-color: rgba(255, 255, 255, 0.8) !important;
}

.arco-pagination-item.arco-pagination-item-active {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: white !important;
}

/* 通用动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn var(--transition-normal) ease-out;
}

/* 通用渐变背景 */
.gradient-bg {
  background: linear-gradient(135deg, var(--surface-color), var(--card-color));
}

/* 通用玻璃态效果 */
.glass-effect {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-normal);
}

.glass-effect:hover {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-light);
}
</style>
<script setup lang="ts">
import BasicLayout from "@/layouts/BasicLayout";
import { onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

/**
 * 全局初始化函数，有全局单次调用的代码，都可以写到这里
 */
const doInit = () => {
  console.log("hello 欢迎来到我的项目");
};

onMounted(() => {
  doInit();
});
</script>
