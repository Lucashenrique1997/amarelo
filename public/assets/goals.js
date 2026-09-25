/* AMARELO 1.0 — tracked goals */
function goals(){return storage.get('amarelo_goals',[])}
function goalProgress(goal){
  const target=Math.max(0,Number(goal?.targetAmount||0)),current=Math.max(0,Number(goal?.currentAmount||0));
  return target>0?Math.min(100,Math.max(0,current/target*100)):0;
}
function goalMonthsRemaining(date){
  if(!date)return null;
  const end=new Date(date+'T12:00:00'),now=new Date();
  if(Number.isNaN(end.getTime()))return null;
  const months=(end.getFullYear()-now.getFullYear())*12+(end.getMonth()-now.getMonth());
  return Math.max(0,months);
}
function renderGoals(){
  const list=goals().slice().sort((a,b)=>{
    const da=a.targetDate?new Date(a.targetDate).getTime():Infinity;
    const db=b.targetDate?new Date(b.targetDate).getTime():Infinity;
    return da-db;
  });
  const summary=$('goalSummary'),container=$('goalList');
  if(!summary||!container)return;

  const target=list.reduce((s,g)=>s+Math.max(0,Number(g.targetAmount||0)),0);
  const current=list.reduce((s,g)=>s+Math.max(0,Number(g.currentAmount||0)),0);
  const overall=target>0?Math.min(100,current/target*100):0;

  summary.innerHTML=list.length?
    `<div><small>METAS ATIVAS</small><b>${list.length}</b></div><div><small>VALOR-ALVO</small><b>${BRL(target)}</b></div><div><small>JÁ FORMADO</small><b>${BRL(current)}</b></div><div><small>PROGRESSO</small><b>${PCT(overall)}</b></div>`:
    '';

  container.innerHTML=list.length?list.map(goal=>{
    const progress=goalProgress(goal),months=goalMonthsRemaining(goal.targetDate);
    const remaining=Math.max(0,Number(goal.targetAmount||0)-Number(goal.currentAmount||0));
    return `<article class="goalItem">
      <div class="goalTop"><div><span>${months===null?'SEM PRAZO':months===0?'PRAZO ATUAL':months+' MESES'}</span><h4>${escapeHtml(goal.name)}</h4></div><b>${PCT(progress)}</b></div>
      <div class="goalBar"><i style="width:${progress}%"></i></div>
      <div class="goalNumbers"><span><small>Atual</small><b>${BRL(Number(goal.currentAmount||0))}</b></span><span><small>Falta</small><b>${BRL(remaining)}</b></span><span><small>Meta</small><b>${BRL(Number(goal.targetAmount||0))}</b></span></div>
      <div class="goalActions"><button data-goal-edit="${escapeHtml(String(goal.id))}">Editar</button><button data-goal-delete="${escapeHtml(String(goal.id))}">Excluir</button></div>
    </article>`;
  }).join(''):`<div class="dashEmpty"><span>◎</span><h4>Transforme uma decisão em algo para acompanhar.</h4><p>Cadastre uma meta de patrimônio, entrada, reserva ou qualquer objetivo com valor e prazo.</p><button onclick="openGoalModal()">Criar primeira meta →</button></div>`;
  container.querySelectorAll('[data-goal-edit]').forEach(button=>button.addEventListener('click',()=>openGoalModal(button.dataset.goalEdit)));
  container.querySelectorAll('[data-goal-delete]').forEach(button=>button.addEventListener('click',()=>deleteGoal(button.dataset.goalDelete)));
}
function openGoalModal(id=null){
  const existing=id?goals().find(g=>String(g.id)===String(id)):null;
  $('goalId').value=existing?.id||'';
  $('goalName').value=existing?.name||'';
  $('goalTarget').value=existing?.targetAmount??100000;
  $('goalCurrent').value=existing?.currentAmount??0;
  $('goalDate').value=existing?.targetDate||'';
  $('goalModalTitle').textContent=existing?'Editar meta.':'Nova meta.';
  $('goalPrivacy').textContent=runtimeCapabilities.persistence&&runtimeCapabilities.authentication?'A meta será sincronizada com sua conta AMARELO.':'Na beta, a meta fica neste navegador.';
  $('goalModal').classList.remove('hidden');
}
function closeGoalModal(){$('goalModal').classList.add('hidden')}
async function saveGoal(){
  const id=$('goalId').value||String(Date.now());
  const name=$('goalName').value.trim();
  if(!name)return toast('Dê um nome para a meta.');
  const item={
    id,
    name,
    targetAmount:Math.max(0,num('goalTarget')),
    currentAmount:Math.max(0,num('goalCurrent')),
    targetDate:$('goalDate').value||null,
    updatedAt:new Date().toISOString()
  };
  const items=goals(),index=items.findIndex(g=>String(g.id)===String(id));
  if(index>=0)item.remoteGoalId=items[index].remoteGoalId||null;
  if(index>=0)items[index]=item;else items.unshift(item);
  storage.set('amarelo_goals',items.slice(0,100));
  closeGoalModal();renderGoals();
  const remote=await syncGoalIfAvailable(item);
  if(remote?.id){
    const latest=goals(),found=latest.find(g=>String(g.id)===String(id));
    if(found){found.remoteGoalId=remote.id;found.clientGoalId=String(id);storage.set('amarelo_goals',latest)}
  }
  toast(runtimeCapabilities.persistence&&runtimeCapabilities.authentication?'Meta salva e sincronizada.':'Meta salva neste navegador.');
}
async function deleteGoal(id){
  const items=goals(),item=items.find(g=>String(g.id)===String(id));
  if(!item)return;
  if(runtimeCapabilities.persistence&&runtimeCapabilities.authentication&&item.remoteGoalId){
    try{await amareloApi.deleteGoal(item.remoteGoalId)}
    catch(error){console.warn('AMARELO goal delete failed',String(error?.message||error));return toast('Não foi possível excluir a meta sincronizada.')}
  }
  storage.set('amarelo_goals',items.filter(g=>String(g.id)!==String(id)));
  renderGoals();
  toast('Meta excluída.');
}
