import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
import "bytemd/dist/index.css";
import { createApp } from "vue";

import App from "./App.vue";
import { setUnauthorizedHandler } from "@/plugins/axios";
import "@/access";
import "@/styles/global.css";
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

createApp(App).use(ArcoVue).use(store).use(router).mount("#app");
