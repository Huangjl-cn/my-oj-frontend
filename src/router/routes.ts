import { RouteRecordRaw } from "vue-router";
import ACCESS_ENUM from "@/access/accessEnum";

const UserLayout = () =>
  import(/* webpackChunkName: "page-auth" */ "@/layouts/UserLayout.vue");
const UserLoginView = () =>
  import(/* webpackChunkName: "page-auth" */ "@/views/user/UserLoginView.vue");
const UserRegisterView = () =>
  import(
    /* webpackChunkName: "page-auth" */ "@/views/user/UserRegisterView.vue"
  );
const NoAuthView = () =>
  import(/* webpackChunkName: "page-no-auth" */ "@/views/NoAuthView.vue");
const AddQuestionView = () =>
  import(
    /* webpackChunkName: "page-question-editor" */ "@/views/question/AddQuestionView.vue"
  );
const ManageQuestionView = () =>
  import(
    /* webpackChunkName: "page-question-manage" */ "@/views/question/ManageQuestionView.vue"
  );
const QuestionsView = () =>
  import(
    /* webpackChunkName: "page-questions" */ "@/views/question/QuestionsView.vue"
  );
const QuestionSubmitView = () =>
  import(
    /* webpackChunkName: "page-submissions" */ "@/views/question/QuestionSubmitView.vue"
  );
const UserManageView = () =>
  import(
    /* webpackChunkName: "page-user-manage" */ "@/views/user/UserManageView.vue"
  );
const UserProfileView = () =>
  import(
    /* webpackChunkName: "page-user-profile" */ "@/views/user/UserProfileView.vue"
  );

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/user",
    name: "用户",
    component: UserLayout,
    children: [
      {
        path: "/user/login",
        name: "用户登录",
        component: UserLoginView,
      },
      {
        path: "/user/register",
        name: "用户注册",
        component: UserRegisterView,
      },
    ],
    meta: {
      hideInMenu: true,
    },
  },
  {
    path: "/",
    name: "题库",
    component: QuestionsView,
  },
  {
    path: "/questions",
    name: "浏览题目",
    component: QuestionsView,
    meta: {
      hideInMenu: true,
    },
  },
  {
    path: "/question_submit",
    name: "浏览题目提交",
    component: QuestionSubmitView,
  },
  {
    path: "/my/question",
    name: "我的题目",
    component: ManageQuestionView,
    props: { scope: "mine" },
    meta: {
      access: ACCESS_ENUM.USER,
    },
  },
  {
    path: "/add/question",
    name: "创建题目",
    component: AddQuestionView,
    meta: {
      access: ACCESS_ENUM.USER,
    },
  },
  {
    path: "/update/question",
    name: "更新题目",
    component: AddQuestionView,
    meta: {
      access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/manage/question/",
    name: "管理题目",
    component: ManageQuestionView,
    props: { scope: "all" },
    meta: {
      access: ACCESS_ENUM.ADMIN,
    },
  },
  {
    path: "/manage/user",
    name: "用户管理",
    component: UserManageView,
    meta: {
      access: ACCESS_ENUM.ADMIN,
    },
  },
  {
    path: "/profile",
    name: "个人中心",
    component: UserProfileView,
    meta: {
      access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/noAuth",
    name: "无权限",
    component: NoAuthView,
    meta: {
      hideInMenu: true,
    },
  },
];
