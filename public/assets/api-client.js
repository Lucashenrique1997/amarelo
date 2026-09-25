/* AMARELO 1.0 — authenticated API client
 * Same-origin only. No token is stored in JavaScript.
 */
const amareloApi={
  async request(path,{method='GET',body}={}){
    const response=await fetch(path,{
      method,
      credentials:'same-origin',
      headers:{
        'Accept':'application/json',
        ...(body!==undefined?{'Content-Type':'application/json'}:{})
      },
      ...(body!==undefined?{body:JSON.stringify(body)}:{})
    });
    const payload=await response.json().catch(()=>({ok:false,error:'invalid_response'}));
    if(!response.ok){
      const error=new Error(payload?.error||('http_'+response.status));
      error.status=response.status;
      error.payload=payload;
      throw error;
    }
    return payload;
  },
  profile(){return this.request('/api/v1/profile')},
  updateProfile(profile){return this.request('/api/v1/profile',{method:'PUT',body:profile})},
  decisions(){return this.request('/api/v1/decisions')},
  saveDecision(decision){return this.request('/api/v1/decisions',{method:'POST',body:decision})},
  decisionVersions(id){return this.request('/api/v1/decisions/'+encodeURIComponent(id)+'/versions')},
  deleteDecisionVersion(decisionId,versionId){return this.request('/api/v1/decisions/'+encodeURIComponent(decisionId)+'/versions/'+encodeURIComponent(versionId),{method:'DELETE'})},
  workspaces(){return this.request('/api/v1/workspaces')},
  goals(){return this.request('/api/v1/goals')},
  saveGoal(goal){return this.request('/api/v1/goals',{method:goal?.id?'PUT':'POST',body:goal})},
  deleteGoal(id){return this.request('/api/v1/goals/'+encodeURIComponent(id),{method:'DELETE'})},
  entitlements(){return this.request('/api/v1/entitlements')},
  exportAccount(){return this.request('/api/v1/export')}
};
