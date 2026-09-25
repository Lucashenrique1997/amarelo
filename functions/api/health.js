export async function onRequestGet(context) {
  const hasDatabase = Boolean(context.env.DB);
  if (!hasDatabase) {
    return Response.json(
      { ok: true, app: "amarelo", database: "not-bound-yet" },
      { status: 200 }
    );
  }

  try {
    const row = await context.env.DB.prepare("SELECT 1 AS ok").first();
    return Response.json({ ok: row?.ok === 1, app: "amarelo", database: "d1" });
  } catch (error) {
    return Response.json(
      { ok: false, app: "amarelo", database: "d1", error: "database-check-failed" },
      { status: 503 }
    );
  }
}
