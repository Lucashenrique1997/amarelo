export async function readJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    return { ok: false, response: Response.json({ ok: false, error: "content_type" }, { status: 415 }) };
  }

  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: Response.json({ ok: false, error: "invalid_json" }, { status: 400 }) };
  }
}

export function jsonError(error, status = 400, detail = undefined) {
  return Response.json({ ok: false, error, ...(detail ? { detail } : {}) }, { status });
}
