// Arco 只剩消息提示在用（message），组件都换成了自己的
import "@arco-design/web-vue/es/message/style/css.js";
import { createApp } from "vue";

import App from "./App.vue";
import { setUnauthorizedHandler } from "@/plugins/axios";
import { sweepExpiredQuestionDrafts } from "@/services/questionDraft";
import { installFloatingTips } from "@/utils/floatingTip";
import "@/access";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/code.css";
import "@/styles/page.css";
import "@/styles/arco.css";
import router from "./router";
import store from "./store";

let redirectingToLogin = false;

setUnauthorizedHandler(async () => {
  await store.dispatch("user/clearLoginUser");
  const currentRoute = router.currentRoute.value;
  if (currentRoute.path === "/user/login" || redirectingToLogin) return;

  redirectingToLogin = true;
  try {
    await router.replace({
      path: "/user/login",
      query: { redirect: currentRoute.fullPath },
    });
  } finally {
    redirectingToLogin = false;
  }
});

// Suppress benign ResizeObserver loop errors caused by Monaco Editor
window.addEventListener("error", (e) => {
  if (
    e.message ===
      "ResizeObserver loop completed with undelivered notifications." ||
    e.message === "ResizeObserver loop limit exceeded"
  ) {
    e.stopPropagation();
  }
});

sweepExpiredQuestionDrafts();
// data-tip 的悬停提示画在 body 下的浮层里，不被面板裁剪
installFloatingTips();

const app = createApp(App);

app.use(store).use(router).mount("#app");
