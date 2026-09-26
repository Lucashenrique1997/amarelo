import {
  clearSessionCookie,
  deterministicId,
  getCookie,
  hashPassword,
  isMutation,
  normalizeEmail,
  randomToken,
  sameOriginOrNoOrigin,
  sessionCookie,
  sha256,
  sqlTimestamp,
  validatePassword,
  verifyPassword
} from "./lib/security.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function response(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function error(message, status = 400, code = "bad_request") {
  return response({ ok: false, error: code, message }, status);
}

async function bodyJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function requireDatabase(env) {
  return env.DB || null;
}

async function getSchemaState(db) {
  if (!db) return { bound: false, ready: false };
  try {
    const rows = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions','decisions','decision_versions','workspaces','user_preferences')"
    ).all();
    const names = new Set((rows.results || []).map(row => row.name));
    const required = ["users","sessions","decisions","decision_versions","workspaces","user_preferences"];
    return { bound: true, ready: required.every(name => names.has(name)), tables: [...names] };
  } catch {
    return { bound: true, ready: false, tables: [] };
  }
}

async function sessionUser(request, db) {
  const raw = getCookie(request, "amarelo_session");
  if (!raw || !db) return null;
  const id = await sha256(raw);
  const now = sqlTimestamp();
  const row = await db.prepare(
    "SELECT u.id, u.email, s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>?"
  ).bind(id, now).first();
  if (!row) return null;
  return { id: row.id, email: row.email };
}

async function createSession(db, userId) {
  const raw = randomToken(32);
  const id = await sha256(raw);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.prepare(
    "INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,CURRENT_TIMESTAMP)"
  ).bind(id, userId, sqlTimestamp(expires)).run();
  return raw;
}

async function destroySession(request, db) {
  const raw = getCookie(request, "amarelo_session");
  if (!raw || !db) return;
  await db.prepare("DELETE FROM sessions WHERE id=?").bind(await sha256(raw)).run();
}

async function rateKey(request, email) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  return sha256(normalizeEmail(email) + "|" + ip);
}

async function checkLoginRate(db, request, email) {
  const key = await rateKey(request, email);
  const row = await db.prepare(
    "SELECT failures, window_started_at, blocked_until FROM auth_rate_limits WHERE key=?"
  ).bind(key).first();
  const now = new Date();
  if (row?.blocked_until && new Date(row.blocked_until.replace(" ","T") + "Z") > now) {
    return { allowed: false, key };
  }
  return { allowed: true, key, row };
}

async function recordLoginFailure(db, key, row) {
  const now = new Date();
  const windowStart = row?.window_started_at ? new Date(row.window_started_at.replace(" ","T") + "Z") : null;
  const stale = !windowStart || now - windowStart > 15 * 60 * 1000;
  const failures = stale ? 1 : Number(row?.failures || 0) + 1;
  const blockedUntil = failures >= 8 ? sqlTimestamp(new Date(Date.now() + 15 * 60 * 1000)) : null;
  await db.prepare(
    `INSERT INTO auth_rate_limits(key,failures,window_started_at,blocked_until,updated_at)
     VALUES(?,?,?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET failures=excluded.failures, window_started_at=excluded.window_started_at,
       blocked_until=excluded.blocked_until, updated_at=CURRENT_TIMESTAMP`
  ).bind(key, failures, stale ? sqlTimestamp(now) : row.window_started_at, blockedUntil).run();
}

async function clearLoginRate(db, key) {
  await db.prepare("DELETE FROM auth_rate_limits WHERE key=?").bind(key).run();
}

async function register(request, db) {
  const payload = await bodyJson(request);
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return error("Informe um e-mail válido.");
  const passwordError = validatePassword(password);
  if (passwordError) return error(passwordError);

  const exists = await db.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (exists) return error("Já existe uma conta com este e-mail.", 409, "email_exists");

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const statements = [
    db.prepare("INSERT INTO users(id,email,password_hash,created_at,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(userId,email,passwordHash),
    db.prepare("INSERT INTO workspaces(id,owner_user_id,type,name,created_at,updated_at) VALUES(?,?, 'personal','Meu AMARELO',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(workspaceId,userId),
    db.prepare("INSERT INTO workspace_members(workspace_id,user_id,role,created_at) VALUES(?,?,'owner',CURRENT_TIMESTAMP)").bind(workspaceId,userId),
    db.prepare("INSERT INTO profiles(user_id,created_at,updated_at) VALUES(?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(userId),
    db.prepare("INSERT INTO user_preferences(user_id,review_interval_days,locale,timezone,preferences_json,updated_at) VALUES(?,45,'pt-BR','America/Sao_Paulo','{}',CURRENT_TIMESTAMP)").bind(userId),
    db.prepare("INSERT INTO subscriptions(user_id,plan,status,created_at,updated_at) VALUES(?,'free','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(userId)
  ];
  await db.batch(statements);
  const token = await createSession(db, userId);
  return response({ ok:true, user:{ id:userId, email }, password_recovery:false }, 201, { "set-cookie": sessionCookie(token) });
}

async function login(request, db) {
  const payload = await bodyJson(request);
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");
  const rate = await checkLoginRate(db, request, email);
  if (!rate.allowed) return error("Muitas tentativas. Tente novamente em alguns minutos.", 429, "rate_limited");

  const user = await db.prepare("SELECT id,email,password_hash FROM users WHERE email=?").bind(email).first();
  const valid = user && await verifyPassword(password, user.password_hash);
  if (!valid) {
    await recordLoginFailure(db, rate.key, rate.row);
    return error("E-mail ou senha inválidos.", 401, "invalid_credentials");
  }

  await clearLoginRate(db, rate.key);
  await db.prepare("DELETE FROM sessions WHERE user_id=? AND expires_at<=?").bind(user.id, sqlTimestamp()).run();
  const token = await createSession(db, user.id);
  return response({ ok:true, user:{ id:user.id, email:user.email }, password_recovery:false }, 200, { "set-cookie": sessionCookie(token) });
}

async function logout(request, db) {
  await destroySession(request, db);
  return response({ ok:true }, 200, { "set-cookie": clearSessionCookie() });
}

function safeJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

async function readSnapshot(db, userId) {
  const [profile, favoritesResult, decisionsResult, versionsResult, prefs] = await Promise.all([
    db.prepare("SELECT display_name,birth_date,monthly_income,financial_wealth,essential_expenses,emergency_reserve,monthly_investment FROM profiles WHERE user_id=?").bind(userId).first(),
    db.prepare("SELECT tool_id FROM favorites WHERE user_id=? ORDER BY created_at ASC").bind(userId).all(),
    db.prepare("SELECT id,decision_key,decision_name,tool_id,title,primary_result,summary,outputs_json,updated_at FROM decisions WHERE user_id=? AND status='active' ORDER BY updated_at DESC").bind(userId).all(),
    db.prepare("SELECT v.decision_id,v.version_number,v.outputs_json,v.created_at FROM decision_versions v JOIN decisions d ON d.id=v.decision_id WHERE d.user_id=? ORDER BY v.created_at DESC").bind(userId).all(),
    db.prepare("SELECT review_interval_days,locale,timezone,preferences_json FROM user_preferences WHERE user_id=?").bind(userId).first()
  ]);

  const decisionMap = new Map((decisionsResult.results || []).map(d => [d.id, d]));
  const flattened = [];
  for (const version of versionsResult.results || []) {
    const parent = decisionMap.get(version.decision_id);
    if (!parent) continue;
    const stored = safeJson(version.outputs_json, {});
    flattened.push({
      ...stored,
      version: Number(version.version_number || stored.version || 1),
      decisionKey: stored.decisionKey || parent.decision_key,
      decisionName: stored.decisionName || parent.decision_name,
      toolId: stored.toolId || parent.tool_id,
      title: stored.title || parent.title,
      primary: stored.primary || parent.primary_result,
      subtitle: stored.subtitle || parent.summary,
      date: stored.date || version.created_at.replace(" ","T") + "Z"
    });
  }

  const preferenceJson = safeJson(prefs?.preferences_json, {});
  return {
    ok:true,
    profile: {
      income:Number(profile?.monthly_income || 0),
      wealth:Number(profile?.financial_wealth || 0),
      essentials:Number(profile?.essential_expenses || 0),
      reserve:Number(profile?.emergency_reserve || 0),
      monthly:Number(profile?.monthly_investment || 0),
      age:Number(preferenceJson.age || 0)
    },
    favorites:(favoritesResult.results || []).map(row => row.tool_id),
    decisions:flattened,
    plan:preferenceJson.plan === "pro" ? "pro" : "free",
    preferences:{
      reviewIntervalDays:Number(prefs?.review_interval_days || 45),
      locale:prefs?.locale || "pt-BR",
      timezone:prefs?.timezone || "America/Sao_Paulo"
    }
  };
}

function normalizeLocalDecision(item) {
  if (!item || typeof item !== "object") return null;
  const toolId = String(item.toolId || "").slice(0, 100);
  const decisionKey = String(item.decisionKey || toolId + "::" + (item.decisionName || item.title || "decisao")).slice(0, 240);
  if (!toolId || !decisionKey) return null;
  const version = Math.max(1, Math.min(10000, Number(item.version || 1) || 1));
  return {
    ...item,
    id: item.id ?? Date.now(),
    toolId,
    decisionKey,
    decisionName:String(item.decisionName || item.title || "Decisão").slice(0, 120),
    title:String(item.title || "Decisão").slice(0, 160),
    version
  };
}

async function replaceSnapshot(db, userId, payload) {
  const profile = payload?.profile && typeof payload.profile === "object" ? payload.profile : {};
  const favorites = Array.isArray(payload?.favorites) ? [...new Set(payload.favorites.map(String))].slice(0,100) : [];
  const decisions = Array.isArray(payload?.decisions) ? payload.decisions.map(normalizeLocalDecision).filter(Boolean).slice(0,250) : [];
  const plan = payload?.plan === "pro" ? "pro" : "free";

  const byKey = new Map();
  for (const item of decisions) {
    if (!byKey.has(item.decisionKey)) byKey.set(item.decisionKey, []);
    byKey.get(item.decisionKey).push(item);
  }

  const statements = [];
  statements.push(db.prepare("DELETE FROM decision_versions WHERE decision_id IN (SELECT id FROM decisions WHERE user_id=?)").bind(userId));
  statements.push(db.prepare("DELETE FROM decisions WHERE user_id=?").bind(userId));
  statements.push(db.prepare("DELETE FROM favorites WHERE user_id=?").bind(userId));

  for (const toolId of favorites) {
    statements.push(db.prepare("INSERT INTO favorites(user_id,tool_id,created_at) VALUES(?,?,CURRENT_TIMESTAMP)").bind(userId,toolId));
  }

  for (const [decisionKey, versions] of byKey) {
    versions.sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));
    const latest = versions[versions.length - 1];
    const decisionId = await deterministicId("dec_", userId + "|" + decisionKey);
    statements.push(
      db.prepare(
        `INSERT INTO decisions(id,user_id,tool_id,title,status,inputs_json,outputs_json,assumptions_json,primary_result,summary,decision_key,decision_name,review_due_at,created_at,updated_at)
         VALUES(?,?,?,?, 'active','{}',?,'{}',?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`
      ).bind(
        decisionId,userId,latest.toolId,latest.title,JSON.stringify(latest),latest.primary || null,latest.subtitle || null,
        decisionKey,latest.decisionName,
        sqlTimestamp(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000))
      )
    );
    for (const version of versions) {
      const versionId = await deterministicId("ver_", decisionId + "|" + String(version.id) + "|" + String(version.version));
      statements.push(
        db.prepare(
          `INSERT INTO decision_versions(id,decision_id,version_number,scenario_label,inputs_json,outputs_json,assumptions_json,sensitivity_json,primary_result,summary,created_at)
           VALUES(?,?,?,?, '{}',?,?,?, ?,?,?)`
        ).bind(
          versionId,decisionId,version.version,version.scenarioLabel || null,
          JSON.stringify(version),
          JSON.stringify(version.assumptions || {}),
          JSON.stringify(version.sensitivity || []),
          version.primary || null,
          version.subtitle || null,
          sqlTimestamp(new Date(version.date || Date.now()))
        )
      );
    }
  }

  statements.push(
    db.prepare(
      `INSERT INTO profiles(user_id,monthly_income,financial_wealth,essential_expenses,emergency_reserve,monthly_investment,created_at,updated_at)
       VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET monthly_income=excluded.monthly_income, financial_wealth=excluded.financial_wealth,
       essential_expenses=excluded.essential_expenses, emergency_reserve=excluded.emergency_reserve,
       monthly_investment=excluded.monthly_investment, updated_at=CURRENT_TIMESTAMP`
    ).bind(
      userId,
      Number(profile.income || 0),
      Number(profile.wealth || 0),
      Number(profile.essentials || 0),
      Number(profile.reserve || 0),
      Number(profile.monthly || 0)
    )
  );

  const preferenceJson = JSON.stringify({ plan, age:Number(profile.age || 0) });
  statements.push(
    db.prepare(
      `INSERT INTO user_preferences(user_id,review_interval_days,locale,timezone,preferences_json,updated_at)
       VALUES(?,45,'pt-BR','America/Sao_Paulo',?,CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET preferences_json=excluded.preferences_json, updated_at=CURRENT_TIMESTAMP`
    ).bind(userId, preferenceJson)
  );

  await db.batch(statements);
  return readSnapshot(db, userId);
}

async function handleSync(request, db, user) {
  if (request.method === "GET") return response(await readSnapshot(db, user.id));
  if (request.method === "POST") {
    const payload = await bodyJson(request);
    if (!payload) return error("Payload inválido.");
    return response(await replaceSnapshot(db, user.id, payload));
  }
  return error("Método não permitido.", 405, "method_not_allowed");
}

async function recordTelemetry(request, db) {
  const payload = await bodyJson(request);
  const allowed = new Set(["page_view","route_view","tool_open","decision_saved","account_created","account_login","sync_manual"]);
  const eventName = String(payload?.eventName || "");
  if (!allowed.has(eventName)) return error("Evento inválido.", 400, "invalid_event");

  const anonymousId = String(payload?.anonymousId || "").slice(0,80) || null;
  const route = String(payload?.route || "").slice(0,40) || null;
  const toolId = String(payload?.toolId || "").slice(0,100) || null;
  const user = await sessionUser(request, db);

  await db.prepare(
    "INSERT INTO product_events(id,anonymous_id,user_id,event_name,route,tool_id,created_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)"
  ).bind(crypto.randomUUID(), anonymousId, user?.id || null, eventName, route, toolId).run();

  return response({ ok:true }, 202);
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  const db = requireDatabase(env);

  if (isMutation(request) && !sameOriginOrNoOrigin(request)) {
    return error("Origem da requisição não permitida.", 403, "origin_forbidden");
  }

  if (url.pathname === "/api/capabilities") {
    const schema = await getSchemaState(db);
    return response({
      ok:true,
      app:"amarelo",
      phase:"beta",
      database:schema.bound ? (schema.ready ? "d1" : "bound-needs-migrations") : "not-bound-yet",
      persistence:Boolean(schema.ready),
      authentication:Boolean(schema.ready),
      cloud_sync:Boolean(schema.ready),
      billing:false,
      password_recovery:false,
      ai_interpretation:false,
      local_decisions:true,
      pro_beta:true,
      modular_frontend:true,
      legibility_baseline:true
    });
  }

  if (url.pathname === "/api/health") {
    const schema = await getSchemaState(db);
    if (!schema.bound) return response({ ok:true, app:"amarelo", database:"not-bound-yet" });
    return response({ ok:schema.ready, app:"amarelo", database:schema.ready ? "d1" : "bound-needs-migrations" }, schema.ready ? 200 : 503);
  }

  if (url.pathname === "/api/version") {
    return response({ ok:true, app:"amarelo", product:"1.0-cloud-core", phase:"beta" });
  }

  if (!db) return error("A nuvem do AMARELO ainda não está conectada.", 503, "database_unavailable");
  const schema = await getSchemaState(db);
  if (!schema.ready) return error("O banco está conectado, mas as migrations ainda não foram aplicadas.", 503, "migrations_required");

  if (url.pathname === "/api/telemetry" && request.method === "POST") return recordTelemetry(request, db);

  if (url.pathname === "/api/auth/register" && request.method === "POST") return register(request, db);
  if (url.pathname === "/api/auth/login" && request.method === "POST") return login(request, db);
  if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout(request, db);

  const user = await sessionUser(request, db);
  if (url.pathname === "/api/me" && request.method === "GET") {
    return user ? response({ ok:true, user, password_recovery:false }) : error("Sessão não encontrada.", 401, "unauthorized");
  }

  if (!user) return error("Faça login para usar a sincronização.", 401, "unauthorized");

  if (url.pathname === "/api/sync") return handleSync(request, db, user);

  return error("Endpoint não encontrado.", 404, "not_found");
}
