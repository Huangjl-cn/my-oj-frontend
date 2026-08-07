import axios from "axios";

import { OpenAPI } from "../../generated";

axios.defaults.withCredentials = true;
OpenAPI.BASE = "/api";
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | undefined;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

const handleUnauthorized = () => void unauthorizedHandler?.();

axios.interceptors.response.use(
  (response) => {
    if (response.data?.code === 40101) handleUnauthorized();
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 ||
      error.response?.data?.code === 40101
    ) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);
