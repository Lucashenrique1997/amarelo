export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      if (!env.DB) {
        return Response.json({
          ok: true,
          app: "amarelo",
          database: "not-bound-yet"
        });
      }

      try {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return Response.json({
          ok: row?.ok === 1,
          app: "amarelo",
          database: "d1"
        });
      } catch {
        return Response.json(
          { ok: false, app: "amarelo", database: "d1" },
          { status: 503 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
