/* AMARELO 1.0 — runtime capability contract */
let runtimeCapabilities={
  ok:false,
  phase:"beta",
  database:"unknown",
  persistence:false,
  authentication:false,
  billing:false,
  ai_interpretation:false,
  local_decisions:true,
  pro_beta:true
};

async function refreshRuntimeCapabilities(){
  try{
    const response=await fetch("/api/capabilities",{headers:{"Accept":"application/json"}});
    if(!response.ok)throw new Error("capabilities unavailable");
    const next=await response.json();
    runtimeCapabilities={...runtimeCapabilities,...next};
  }catch(error){
    console.warn("AMARELO capabilities unavailable; using safe local defaults.");
  }
  window.dispatchEvent(new CustomEvent("amarelo:capabilities",{detail:runtimeCapabilities}));
  return runtimeCapabilities;
}
