import { handleApi } from "./api.js";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY"
};

function secure(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return secure(await handleApi(request, env));
      } catch (cause) {
        console.error("AMARELO API error", cause);
        return secure(Response.json(
          { ok:false, error:"internal_error", message:"Não foi possível concluir esta operação." },
          { status:500, headers:{ "cache-control":"no-store" } }
        ));
      }
    }

    return secure(await env.ASSETS.fetch(request));
  }
};
