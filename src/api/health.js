export async function healthResponse(env) {
  if (!env.DB) {
    return Response.json({ ok: true, app: "amarelo", database: "not-bound-yet" });
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
