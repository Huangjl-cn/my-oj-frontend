import type { Module } from "vuex";

import ACCESS_ENUM from "@/access/accessEnum";
import { clearQuestionDraftsForUser } from "@/services/questionDraft";
import type { RootState } from "@/store";
import { LoginUserVO, UserControllerService } from "../../generated";

export interface UserState {
  loginUser: LoginUserVO;
  initialized: boolean;
}

const createGuestUser = (): LoginUserVO => ({
  userName: "未登录",
  userRole: ACCESS_ENUM.NOT_LOGIN,
});

const userModule: Module<UserState, RootState> = {
  namespaced: true,
  state: () => ({
    loginUser: createGuestUser(),
    initialized: false,
  }),
  actions: {
    async getLoginUser({ commit }) {
      try {
        const res = await UserControllerService.getLoginUser();
        if (res.code === 0 && res.data) {
          commit("updateUser", res.data);
        } else {
          commit("resetUser");
        }
      } catch {
        commit("resetUser");
      } finally {
        commit("setInitialized", true);
      }
    },
    clearLoginUser({ commit }) {
      commit("resetUser");
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
    resetUser(state) {
      if (state.loginUser.id != null) {
        clearQuestionDraftsForUser(state.loginUser.id);
      }
      state.loginUser = createGuestUser();
    },
    setInitialized(state, initialized: boolean) {
      state.initialized = initialized;
    },
  },
};

export default userModule;
