/* AMARELO 1.0 — Meu AMARELO dashboard, profile and backup */
function renderDashboard(){
  let badge=$('dataModeBadge'),text=$('dataModeText');
  if(badge&&text){
    let synced=runtimeCapabilities.persistence&&runtimeCapabilities.authentication;
    badge.textContent=synced?'Sincronizado com sua conta':'Somente neste navegador';
    text.textContent=synced?'Suas decisões e versões estão persistidas na sua conta AMARELO.':'Exporte um backup enquanto a sincronização online não está ativa.';
  }
  let p=storage.get('amarelo_profile',{income:0,wealth:0,essentials:0,reserve:0,monthly:0,age:0}),months=p.essentials?p.reserve/p.essentials:0;
  $('profileSummary').innerHTML=[['Renda líquida',BRL(p.income)],['Patrimônio financeiro',BRL(p.wealth)],['Reserva',months?months.toFixed(1)+' meses':'—'],['Investimento mensal',BRL(p.monthly)]].map(x=>`<div class="profileStat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
  let d=saved(),groups=groupSavedDecisions(d),now=Date.now(),day=86400000,review=groups.filter(g=>(now-new Date(g.versions[0].date).getTime())/day>=45),multi=groups.filter(g=>g.versions.length>1),recent=groups.filter(g=>(now-new Date(g.versions[0].date).getTime())/day<30);
  $('decisionPulse').innerHTML=[
    ['Decisões acompanhadas',groups.length],
    ['Versões salvas',d.length],
    ['Com histórico',multi.length],
    ['Atualizadas em 30 dias',recent.length]
  ].map((x,i)=>`<div class="pulseStat"><span>0${i+1}</span><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
  $('reviewQueue').innerHTML=review.length?review.slice(0,4).map(g=>{let x=g.versions[0],days=Math.floor((now-new Date(x.date).getTime())/day);return`<div class="reviewDecision"><div><span>${days} DIAS</span><h4>${escapeHtml(x.decisionName||x.title)}</h4><p>${escapeHtml(x.title)} · última versão V${x.version||g.versions.length}</p></div><button onclick="openSavedDecision(${x.id})">Revisar →</button></div>`}).join(''):`<div class="reviewEmpty"><i>✓</i><div><b>Nenhuma decisão está há 45 dias sem nova versão.</b><p>Quando uma decisão ficar antiga, ela aparece aqui para você reabrir as premissas.</p></div></div>`;
  $('savedDecisions').innerHTML=groups.length?groups.slice(0,8).map(g=>{let x=g.versions[0],count=g.versions.length;return`<div class="decisionRow groupedDecision"><div><div class="decisionTitleLine"><h4>${escapeHtml(x.decisionName||x.title)}</h4><span>V${x.version||count}</span></div><p>${escapeHtml(x.title)} · ${count} ${count===1?'versão':'versões'} · atualizado ${new Date(x.date).toLocaleDateString('pt-BR')}</p></div><div class="decisionValue"><strong>${escapeHtml(x.primary)}</strong><div class="decisionActions"><button onclick="openSavedDecision(${x.id})">Reabrir</button>${count>1?`<button data-history-key="${escapeHtml(g.key)}">Histórico</button>`:''}<button onclick="deleteDecision(${x.id})">Excluir última</button></div></div></div>`}).join(''):'<div class="dashEmpty"><span>01</span><h4>Seu histórico começa na primeira decisão.</h4><p>Faça uma simulação, dê um nome ao caso e salve a primeira versão.</p><button onclick="navigate(\'tools\')">Abrir biblioteca →</button></div>';
  $('savedDecisions').querySelectorAll('[data-history-key]').forEach(b=>b.addEventListener('click',()=>openVersionCompare(b.dataset.historyKey)));
  let f=favs().map(id=>tools.find(t=>t.id===id)).filter(Boolean);
  $('favoriteTools').innerHTML=f.length?f.slice(0,6).map(t=>`<div class="miniTool" onclick="openTool('${t.id}')"><i>${t.icon}</i><b>${t.title}</b></div>`).join(''):'<div class="dashEmpty compact"><span>☆</span><h4>Fixe o que você usa mais.</h4><p>Seus favoritos aparecem aqui.</p></div>';
  if(review.length){
    let x=review[0].versions[0];
    $('nextDecision').innerHTML=`<div class="miniTool" onclick="openSavedDecision(${x.id})"><i>↻</i><div><b>${escapeHtml(x.decisionName||x.title)}</b><p class="muted">Reabra a última versão e atualize as premissas.</p></div></div>`;
  }else{
    let next=p.reserve<p.essentials*6&&p.essentials>0?['reserva','Sua reserva informada está abaixo de 6 meses.']:p.monthly>0?['meta-financeira','Transforme seu aporte mensal em uma meta.']:['diagnostico','Comece pelo diagnóstico financeiro.'];
    $('nextDecision').innerHTML=`<div class="miniTool" onclick="openTool('${next[0]}')"><i>→</i><div><b>${tools.find(t=>t.id===next[0])?.title||'Próxima análise'}</b><p class="muted">${next[1]}</p></div></div>`;
  }
  renderGoals();
}
function exportBackup(){
  const payload={app:'amarelo',format:1,exportedAt:new Date().toISOString(),data:storage.snapshot()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='amarelo-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast('Backup do AMARELO exportado.');
}
async function importBackupFile(event){
  const input=event?.target,file=input?.files?.[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text());
    if(payload?.app!=='amarelo'||payload?.format!==1||!payload?.data||typeof payload.data!=='object')throw new Error('backup inválido');
    const entries=Object.entries(payload.data).filter(([key])=>key.startsWith('amarelo_'));
    if(!entries.length)throw new Error('backup vazio');
    entries.forEach(([key,value])=>storage.set(key,value));
    state.plan=storage.get('amarelo_plan','free');
    toast('Backup restaurado neste navegador.');
    renderDashboard();renderHome();
  }catch(err){console.error('AMARELO backup import error',err);toast('Não foi possível importar este backup.')}
  finally{if(input)input.value=''}
}

function openProfile(){let p=storage.get('amarelo_profile',{income:0,wealth:0,essentials:0,reserve:0,monthly:0,age:0});for(const k in p){let el=$('profile'+k[0].toUpperCase()+k.slice(1));if(el)el.value=p[k]}let privacy=$('profilePrivacy');if(privacy)privacy.textContent=runtimeCapabilities.persistence&&runtimeCapabilities.authentication?'Os dados serão sincronizados com sua conta AMARELO.':'Nesta versão os dados ficam somente neste navegador.';$('profileModal').classList.remove('hidden')}
function closeProfile(){$('profileModal').classList.add('hidden')}
function saveProfile(){let p={income:num('profileIncome'),wealth:num('profileWealth'),essentials:num('profileEssentials'),reserve:num('profileReserve'),monthly:num('profileMonthly'),age:num('profileAge')};storage.set('amarelo_profile',p);syncProfileIfAvailable(p);closeProfile();renderDashboard();toast(runtimeCapabilities.persistence&&runtimeCapabilities.authentication?'Perfil salvo e sincronizado.':'Perfil salvo neste navegador.')}
