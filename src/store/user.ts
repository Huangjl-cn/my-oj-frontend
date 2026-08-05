import type { Module } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import type { RootState } from "@/store";
import { UserControllerService, UserVO } from "../../generated";

export interface UserState {
  loginUser: UserVO;
}

const userModule: Module<UserState, RootState> = {
  namespaced: true,
  state: () => ({
    loginUser: {
      userName: "未登录",
    },
  }),
  actions: {
    async getLoginUser({ commit, state }) {
      // 从远程请求获取登录信息
      const res = await UserControllerService.getLoginUserUsingGet();
      if (res.code === 0) {
        commit("updateUser", res.data);
      } else {
        commit("updateUser", {
          ...state.loginUser,
          userRole: ACCESS_ENUM.NOT_LOGIN,
        });
      }
    },
  },
  mutations: {
    updateUser(state, payload) {
      state.loginUser = payload;
    },
  },
};

export default userModule;
