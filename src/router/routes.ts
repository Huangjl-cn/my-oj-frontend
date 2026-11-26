import { RouteRecordRaw } from "vue-router";
import ACCESS_ENUM from "@/access/accessEnum";

const UserLayout = () => import("@/layouts/UserLayout.vue");
const UserLoginView = () => import("@/views/user/UserLoginView.vue");
const UserRegisterView = () => import("@/views/user/UserRegisterView.vue");
const NoAuthView = () => import("@/views/NoAuthView.vue");
const AddQuestionView = () => import("@/views/question/AddQuestionView.vue");
const ManageQuestionView = () =>
  import("@/views/question/ManageQuestionView.vue");
const ProblemView = () => import("@/views/problem/ProblemView.vue");
const ProblemsView = () => import("@/views/problem/ProblemsView.vue");
const QuestionSubmitView = () =>
  import("@/views/question/QuestionSubmitView.vue");
const UserManageView = () => import("@/views/user/UserManageView.vue");
const UserProfileView = () => import("@/views/user/UserProfileView.vue");

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
    component: ProblemsView,
    meta: {
      queryState: true,
    },
  },
  {
    path: "/questions",
    name: "浏览题目",
    component: ProblemsView,
    meta: {
      hideInMenu: true,
      queryState: true,
    },
  },
  {
    path: "/problem/:id",
    name: "做题",
    component: ProblemView,
    meta: {
      hideInMenu: true,
      fullHeight: true,
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
