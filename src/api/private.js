import { authenticatedUserId } from "../auth/session.js";
import { readJson, jsonError } from "./json.js";
import { getProfile, upsertProfile } from "../db/profiles.js";
import { listDecisions, listDecisionVersions, upsertDecisionWithVersion } from "../db/decisions.js";
import { listWorkspaces } from "../db/workspaces.js";

function databaseRequired(env) {
  return env.DB ? null : jsonError("database_not_configured", 503);
}

export async function handlePrivateApi(request, env, url) {
  if (!url.pathname.startsWith("/api/v1/")) return null;

  const noDb = databaseRequired(env);
  if (noDb) return noDb;

  const userId = await authenticatedUserId(request, env);
  if (!userId) return jsonError("authentication_required", 401);

  if (url.pathname === "/api/v1/profile") {
    if (request.method === "GET") {
      return Response.json({ ok: true, profile: await getProfile(env.DB, userId) });
    }

    if (request.method === "PUT") {
      const body = await readJson(request);
      if (!body.ok) return body.response;
      const profile = await upsertProfile(env.DB, userId, body.value || {});
      return Response.json({ ok: true, profile });
    }

    return jsonError("method_not_allowed", 405);
  }

  if (url.pathname === "/api/v1/decisions") {
    if (request.method === "GET") {
      const result = await listDecisions(env.DB, userId);
      return Response.json({ ok: true, decisions: result.results || [] });
    }

    if (request.method === "POST") {
      const body = await readJson(request);
      if (!body.ok) return body.response;
      const input = body.value || {};
      if (!input.toolId || !input.title) return jsonError("missing_required_fields", 422);
      const saved = await upsertDecisionWithVersion(env.DB, userId, input);
      return Response.json({ ok: true, ...saved }, { status: 201 });
    }

    return jsonError("method_not_allowed", 405);
  }

  const versionsMatch = url.pathname.match(/^\/api\/v1\/decisions\/([^/]+)\/versions$/);
  if (versionsMatch) {
    if (request.method !== "GET") return jsonError("method_not_allowed", 405);
    const result = await listDecisionVersions(env.DB, userId, decodeURIComponent(versionsMatch[1]));
    return Response.json({ ok: true, versions: result.results || [] });
  }

  if (url.pathname === "/api/v1/workspaces") {
    if (request.method !== "GET") return jsonError("method_not_allowed", 405);
    const result = await listWorkspaces(env.DB, userId);
    return Response.json({ ok: true, workspaces: result.results || [] });
  }

  return jsonError("not_found", 404);
}
