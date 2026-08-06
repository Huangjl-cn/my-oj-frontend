import type { Module } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import { clearQuestionDraftsForUser } from "@/services/questionDraft";
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
      const res = await UserControllerService.getLoginUser();
      if (res.code === 0) {
        commit("updateUser", res.data);
      } else {
        if (state.loginUser.id != null) {
          clearQuestionDraftsForUser(state.loginUser.id);
        }
        commit("updateUser", {
          ...state.loginUser,
          userRole: ACCESS_ENUM.NOT_LOGIN,
        });
      }
    },
  },
  mutations: {
    updateUser(state, payload) {
      if (
        state.loginUser.id != null &&
        String(state.loginUser.id) !== String(payload?.id ?? "")
      ) {
        clearQuestionDraftsForUser(state.loginUser.id);
      }
      state.loginUser = payload;
    },
  },
};

export default userModule;
