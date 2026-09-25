import { handleApi } from "./api/router.js";
import { withSecurityHeaders } from "./http/security.js";

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);

    try {
      const apiResponse = await handleApi(request, env);
      if (apiResponse) return withSecurityHeaders(apiResponse, requestId);

      const assetResponse = await env.ASSETS.fetch(request);
      return withSecurityHeaders(assetResponse, requestId);
    } catch (error) {
      console.error("AMARELO request failure", {
        requestId,
        method: request.method,
        path: url.pathname,
        error: String(error?.message || error || "unknown")
      });

      return withSecurityHeaders(
        Response.json(
          { ok: false, error: "internal_error", requestId },
          { status: 500 }
        ),
        requestId
      );
    }
  }
};
