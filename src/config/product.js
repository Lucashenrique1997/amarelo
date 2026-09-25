export const PRODUCT = Object.freeze({
  app: "amarelo",
  phase: "beta",
  proBeta: true,
  localDecisions: true
});

export function capabilities(env) {
  return {
    ok: true,
    app: PRODUCT.app,
    phase: PRODUCT.phase,
    database: env.DB ? "bound" : "not-bound-yet",
    persistence: false,
    authentication: false,
    billing: false,
    ai_interpretation: false,
    local_decisions: PRODUCT.localDecisions,
    pro_beta: PRODUCT.proBeta
  };
}
