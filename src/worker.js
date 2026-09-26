const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY"
};

function json(data, status = 200) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...SECURITY_HEADERS
  });
  return new Response(JSON.stringify(data), { status, headers });
}

function secureAsset(response) {
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

    if (url.pathname === "/api/version") {
      return json({
        ok: true,
        app: "amarelo",
        product: "1.0-foundation",
        phase: "beta"
      });
    }

    if (url.pathname === "/api/capabilities") {
      return json({
        ok: true,
        app: "amarelo",
        phase: "beta",
        database: env.DB ? "bound" : "not-bound-yet",
        persistence: false,
        authentication: false,
        billing: false,
        ai_interpretation: false,
        local_decisions: true,
        pro_beta: true,
        modular_frontend: true,
        legibility_baseline: true
      });
    }

    if (url.pathname === "/api/health") {
      if (!env.DB) {
        return json({
          ok: true,
          app: "amarelo",
          database: "not-bound-yet"
        });
      }

      try {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return json({
          ok: row?.ok === 1,
          app: "amarelo",
          database: "d1"
        });
      } catch {
        return json(
          { ok: false, app: "amarelo", database: "d1" },
          503
        );
      }
    }

    return secureAsset(await env.ASSETS.fetch(request));
  }
};
