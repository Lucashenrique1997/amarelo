import { authenticatedUserId } from "../auth/session.js";
import { readJson, jsonError } from "./json.js";
import { getProfile, upsertProfile } from "../db/profiles.js";
import { listDecisions, listDecisionVersions, upsertDecisionWithVersion } from "../db/decisions.js";
import { listWorkspaces } from "../db/workspaces.js";
import { listGoals, upsertGoal, deleteGoal } from "../db/goals.js";
import { getEntitlements } from "../db/subscriptions.js";

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

  if (url.pathname === "/api/v1/goals") {
    if (request.method === "GET") {
      const result = await listGoals(env.DB, userId);
      return Response.json({ ok: true, goals: result.results || [] });
    }
    if (request.method === "POST" || request.method === "PUT") {
      const body = await readJson(request);
      if (!body.ok) return body.response;
      if (!body.value?.name) return jsonError("missing_required_fields", 422);
      return Response.json({ ok: true, ...(await upsertGoal(env.DB, userId, body.value)) }, { status: request.method === "POST" ? 201 : 200 });
    }
    return jsonError("method_not_allowed", 405);
  }

  const goalMatch = url.pathname.match(/^\/api\/v1\/goals\/([^/]+)$/);
  if (goalMatch) {
    if (request.method !== "DELETE") return jsonError("method_not_allowed", 405);
    await deleteGoal(env.DB, userId, decodeURIComponent(goalMatch[1]));
    return Response.json({ ok: true });
  }

  if (url.pathname === "/api/v1/entitlements") {
    if (request.method !== "GET") return jsonError("method_not_allowed", 405);
    return Response.json({ ok: true, entitlements: await getEntitlements(env.DB, userId) });
  }

  if (url.pathname === "/api/v1/export") {
    if (request.method !== "GET") return jsonError("method_not_allowed", 405);
    const [profile, decisionList, goalList, workspaceList, entitlements] = await Promise.all([
      getProfile(env.DB, userId),
      listDecisions(env.DB, userId, 500),
      listGoals(env.DB, userId),
      listWorkspaces(env.DB, userId),
      getEntitlements(env.DB, userId)
    ]);
    const decisions = decisionList.results || [];
    const versions = {};
    for (const decision of decisions) {
      const result = await listDecisionVersions(env.DB, userId, decision.id);
      versions[decision.id] = result.results || [];
    }
    return Response.json({
      ok: true,
      export: {
        app: "amarelo",
        format: 1,
        exportedAt: new Date().toISOString(),
        profile,
        decisions,
        versions,
        goals: goalList.results || [],
        workspaces: workspaceList.results || [],
        entitlements
      }
    });
  }

  return jsonError("not_found", 404);
}
