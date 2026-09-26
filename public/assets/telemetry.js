(() => {
  const ALLOWED = new Set(["page_view","route_view","tool_open","decision_saved","account_created","account_login","sync_manual"]);
  let enabled = false;

  function anonymousId(){
    const key = "amarelo_analytics_id";
    let id = localStorage.getItem(key);
    if(!id){
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }

  async function track(eventName, data = {}){
    if(!enabled || !ALLOWED.has(eventName)) return;
    const payload = {
      eventName,
      anonymousId:anonymousId(),
      route:String(data.route || "").slice(0,40) || null,
      toolId:String(data.toolId || "").slice(0,100) || null
    };
    try{
      await fetch("/api/telemetry", {
        method:"POST",
        credentials:"same-origin",
        headers:{ "content-type":"application/json" },
        body:JSON.stringify(payload),
        keepalive:true
      });
    }catch{}
  }

  async function init(){
    try{
      const response = await fetch("/api/capabilities", { credentials:"same-origin" });
      const cap = await response.json();
      enabled = Boolean(cap?.persistence);
    }catch{
      enabled = false;
    }
    if(enabled) track("page_view", { route:"home" });
  }

  document.addEventListener("click", event => {
    const routeButton = event.target.closest("[data-route]");
    if(routeButton?.dataset.route) track("route_view", { route:routeButton.dataset.route });
  });

  window.addEventListener("amarelo:tool-open", event => track("tool_open", { route:"tool", toolId:event.detail?.toolId }));
  window.addEventListener("amarelo:decision-saved", event => track("decision_saved", { route:"tool", toolId:event.detail?.toolId }));
  window.addEventListener("amarelo:account-event", event => {
    const name = event.detail?.name;
    if(ALLOWED.has(name)) track(name, { route:"account" });
  });

  window.AmareloTelemetry = { track, isEnabled:() => enabled };
  document.addEventListener("DOMContentLoaded", init);
})();
