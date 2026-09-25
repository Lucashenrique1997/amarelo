import { handleApi } from "./api/router.js";
import { withSecurityHeaders } from "./http/security.js";

export default {
  async fetch(request, env) {
    const apiResponse = await handleApi(request, env);
    if (apiResponse) return withSecurityHeaders(apiResponse);

    const assetResponse = await env.ASSETS.fetch(request);
    return withSecurityHeaders(assetResponse);
  }
};
