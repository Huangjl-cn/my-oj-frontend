import { createStore } from "vuex";
import user, { UserState } from "./user";

export interface RootState {
  user: UserState;
}

export default createStore<RootState>({
  mutations: {},
  actions: {},
  modules: {
    user,
  },
});
