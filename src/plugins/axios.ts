import axios from "axios";

import { OpenAPI } from "../../generated";

axios.defaults.withCredentials = true;
OpenAPI.BASE = "/api";
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";
