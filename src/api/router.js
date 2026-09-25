import { capabilities } from "../config/product.js";
import { healthResponse } from "./health.js";
import { handlePrivateApi } from "./private.js";

export async function handleApi(request, env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return healthResponse(env);
  }

  if (request.method === "GET" && url.pathname === "/api/capabilities") {
    return Response.json(capabilities(env));
  }

  const privateResponse = await handlePrivateApi(request, env, url);
  if (privateResponse) return privateResponse;

  if (url.pathname.startsWith("/api/")) {
    return Response.json(
      { ok: false, error: "not_found", path: url.pathname },
      { status: 404 }
    );
  }

  return null;
}
