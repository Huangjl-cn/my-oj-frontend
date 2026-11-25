import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  InputTag,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  Option,
  Pagination,
  Row,
  Select,
  Switch,
  Table,
} from "@arco-design/web-vue";
import "@arco-design/web-vue/es/button/style/css.js";
import "@arco-design/web-vue/es/form/style/css.js";
import "@arco-design/web-vue/es/grid/style/css.js";
import "@arco-design/web-vue/es/input/style/css.js";
import "@arco-design/web-vue/es/input-number/style/css.js";
import "@arco-design/web-vue/es/input-tag/style/css.js";
import "@arco-design/web-vue/es/layout/style/css.js";
import "@arco-design/web-vue/es/message/style/css.js";
import "@arco-design/web-vue/es/pagination/style/css.js";
import "@arco-design/web-vue/es/select/style/css.js";
import "@arco-design/web-vue/es/switch/style/css.js";
import "@arco-design/web-vue/es/table/style/css.js";
import { createApp } from "vue";

import App from "./App.vue";
import { setUnauthorizedHandler } from "@/plugins/axios";
import { sweepExpiredQuestionDrafts } from "@/services/questionDraft";
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

const app = createApp(App);

app.component("AButton", Button);
app.component("ACol", Col);
app.component("AForm", Form);
app.component("AFormItem", FormItem);
app.component("AInput", Input);
app.component("AInputNumber", InputNumber);
app.component("AInputPassword", InputPassword);
app.component("AInputTag", InputTag);
app.component("ALayout", Layout);
app.component("ALayoutContent", LayoutContent);
app.component("ALayoutFooter", LayoutFooter);
app.component("ALayoutHeader", LayoutHeader);
app.component("AOption", Option);
app.component("APagination", Pagination);
app.component("ARow", Row);
app.component("ASelect", Select);
app.component("ASwitch", Switch);
app.component("ATable", Table);

app.use(store).use(router).mount("#app");
