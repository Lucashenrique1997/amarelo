export const PRODUCT = Object.freeze({
  app: "amarelo",
  defaultPhase: "beta"
});

function enabled(value) {
  return String(value || "").toLowerCase() === "true";
}

export function capabilities(env) {
  const authentication = enabled(env.AUTH_ENABLED);
  const billing = enabled(env.BILLING_ENABLED);
  const aiInterpretation = enabled(env.AI_ENABLED);
  const persistence = Boolean(env.DB) && authentication;
  const phase = env.PRODUCT_PHASE || PRODUCT.defaultPhase;
  const proBeta = !billing && phase === "beta";

  return {
    ok: true,
    app: PRODUCT.app,
    phase,
    database: env.DB ? "bound" : "not-bound-yet",
    persistence,
    authentication,
    billing,
    ai_interpretation: aiInterpretation,
    local_decisions: true,
    pro_beta: proBeta
  };
}

export function proBetaEnabled(env) {
  return capabilities(env).pro_beta;
}
