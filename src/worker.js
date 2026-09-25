import { handleApi } from "./api/router.js";

export default {
  async fetch(request, env) {
    const apiResponse = await handleApi(request, env);
    if (apiResponse) return apiResponse;
    return env.ASSETS.fetch(request);
  }
};
