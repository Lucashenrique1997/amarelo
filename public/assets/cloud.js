(() => {
  const SYNC_KEYS = new Set(["amarelo_decisions","amarelo_profile","amarelo_favs","amarelo_plan"]);
  const EMPTY_PROFILE = { income:0, wealth:0, essentials:0, reserve:0, monthly:0, age:0 };
  const cloudState = {
    capabilities:null,
    user:null,
    ready:false,
    hydrated:false,
    syncing:false,
    lastSync:null,
    error:null,
    timer:null
  };

  const parse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };

  function localSnapshot() {
    return {
      profile:parse("amarelo_profile", EMPTY_PROFILE),
      favorites:parse("amarelo_favs", []),
      decisions:parse("amarelo_decisions", []),
      plan:parse("amarelo_plan", "free")
    };
  }

  function hasProfileData(profile) {
    return Object.values(profile || {}).some(value => Number(value || 0) !== 0);
  }

  function mergeSnapshots(local, remote) {
    const seen = new Set();
    const decisions = [];
    for (const item of [...(local.decisions || []), ...(remote.decisions || [])]) {
      const key = [item.decisionKey || item.toolId || "", item.version || 1, item.id || "", item.date || ""].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      decisions.push(item);
    }
    decisions.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));

    const localProfile = local.profile || EMPTY_PROFILE;
    const remoteProfile = remote.profile || EMPTY_PROFILE;
    const profile = hasProfileData(localProfile) ? localProfile : remoteProfile;

    return {
      profile,
      favorites:[...new Set([...(remote.favorites || []), ...(local.favorites || [])])],
      decisions:decisions.slice(0,250),
      plan:local.plan === "pro" || remote.plan === "pro" ? "pro" : "free"
    };
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials:"same-origin",
      headers:{ "content-type":"application/json", ...(options.headers || {}) },
      ...options
    });
    let payload = null;
    try { payload = await response.json(); } catch { payload = { ok:false, message:"Resposta inválida do servidor." }; }
    if (!response.ok) {
      const err = new Error(payload?.message || "Não foi possível concluir a operação.");
      err.status = response.status;
      err.code = payload?.error;
      throw err;
    }
    return payload;
  }

  function setLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function applySnapshot(snapshot) {
    setLocal("amarelo_profile", snapshot.profile || EMPTY_PROFILE);
    setLocal("amarelo_favs", snapshot.favorites || []);
    setLocal("amarelo_decisions", snapshot.decisions || []);
    setLocal("amarelo_plan", snapshot.plan === "pro" ? "pro" : "free");
    try {
      if (typeof state !== "undefined") state.plan = snapshot.plan === "pro" ? "pro" : "free";
      if (typeof renderDashboard === "function" && document.getElementById("profileSummary")) renderDashboard();
      if (typeof renderHome === "function") renderHome();
      if (typeof renderTools === "function" && document.getElementById("toolSearch")) renderTools(document.getElementById("toolSearch")?.value || "");
    } catch {}
  }

  function notify(message) {
    try { if (typeof toast === "function") return toast(message); } catch {}
    console.info(message);
  }

  function formatSyncDate() {
    return cloudState.lastSync ? cloudState.lastSync.toLocaleString("pt-BR") : "Ainda não sincronizado";
  }

  function render() {
    const cap = cloudState.capabilities;
    const available = Boolean(cap?.authentication && cap?.cloud_sync);
    const logged = Boolean(cloudState.user);

    const nav = document.getElementById("accountNavLabel");
    if (nav) nav.textContent = logged ? "Minha conta" : "Conta";

    const badge = document.getElementById("cloudStatusBadge");
    const title = document.getElementById("cloudStatusTitle");
    const text = document.getElementById("cloudStatusText");
    if (badge) badge.textContent = available ? (logged ? "CONECTADO" : "NUVEM PRONTA") : "MODO LOCAL";
    if (title) title.textContent = available
      ? (logged ? "Seus dados podem acompanhar você." : "A infraestrutura de conta está disponível.")
      : "Seus dados continuam seguros neste navegador.";
    if (text) text.textContent = available
      ? (logged ? "Perfil, favoritos, decisões e versões são sincronizados com sua conta AMARELO." : "Crie sua conta ou entre para ativar sincronização entre dispositivos.")
      : "O D1 ainda precisa ser conectado e receber as migrations. Até lá, nada muda no uso atual do AMARELO.";

    document.querySelectorAll("[data-cloud-only]").forEach(el => el.classList.toggle("hidden", !available));
    const auth = document.getElementById("accountAuth");
    const session = document.getElementById("accountSession");
    if (auth) auth.classList.toggle("hidden", !available || logged);
    if (session) session.classList.toggle("hidden", !available || !logged);

    const email = document.getElementById("accountEmail");
    if (email) email.textContent = cloudState.user?.email || "—";
    const last = document.getElementById("accountLastSync");
    if (last) last.textContent = formatSyncDate();

    const syncButton = document.getElementById("accountSyncButton");
    if (syncButton) {
      syncButton.disabled = cloudState.syncing;
      syncButton.textContent = cloudState.syncing ? "Sincronizando…" : "Sincronizar agora";
    }

    const dashText = document.getElementById("dashboardStorageNote");
    if (dashText) dashText.textContent = logged
      ? "Salve análises, acompanhe premissas e retome suas decisões em outros dispositivos com a mesma conta."
      : "Salve análises e acompanhe premissas. Sem conta conectada, os dados permanecem somente neste navegador.";

    const privacy = document.getElementById("profilePrivacy");
    if (privacy) privacy.textContent = logged
      ? "O perfil é salvo localmente e sincronizado com sua conta AMARELO."
      : "Sem conta conectada, estes dados ficam somente neste navegador.";

    const banner = document.getElementById("cloudDashboardBanner");
    if (banner) {
      banner.classList.toggle("cloudActive", logged);
      banner.innerHTML = logged
        ? `<div><span>CONTA CONECTADA</span><b>${escapeText(cloudState.user.email)}</b><p>Última sincronização: ${escapeText(formatSyncDate())}</p></div><button onclick="navigate('account')">Gerenciar conta →</button>`
        : `<div><span>${available ? "SINCRONIZAÇÃO DISPONÍVEL" : "MODO LOCAL"}</span><b>${available ? "Leve suas decisões para qualquer dispositivo." : "O AMARELO continua funcionando normalmente."}</b><p>${available ? "Entre ou crie uma conta para ativar a nuvem." : "Conecte o D1 depois para ativar conta e sincronização."}</p></div><button onclick="navigate('account')">${available ? "Conectar conta →" : "Ver status →"}</button>`;
    }
  }

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch]));
  }

  async function initialSync() {
    if (!cloudState.user || cloudState.syncing) return;
    cloudState.syncing = true;
    render();
    try {
      const remote = await api("/api/sync");
      const combined = mergeSnapshots(localSnapshot(), remote);
      const saved = await api("/api/sync", { method:"POST", body:JSON.stringify(combined) });
      applySnapshot(saved);
      cloudState.hydrated = true;
      cloudState.lastSync = new Date();
      cloudState.error = null;
    } catch (err) {
      cloudState.error = err.message;
      console.error("AMARELO initial sync", err);
    } finally {
      cloudState.syncing = false;
      render();
    }
  }

  async function pushLocal({ silent = true } = {}) {
    if (!cloudState.user || !cloudState.ready || !cloudState.hydrated || cloudState.syncing) return;
    cloudState.syncing = true;
    render();
    try {
      const saved = await api("/api/sync", { method:"POST", body:JSON.stringify(localSnapshot()) });
      applySnapshot(saved);
      cloudState.lastSync = new Date();
      cloudState.error = null;
      if (!silent) notify("Dados sincronizados.");
    } catch (err) {
      cloudState.error = err.message;
      if (!silent) notify(err.message);
      console.error("AMARELO sync", err);
    } finally {
      cloudState.syncing = false;
      render();
    }
  }

  async function syncNow() {
    if (!cloudState.user) return notify("Entre na sua conta para sincronizar.");
    cloudState.syncing = true;
    render();
    try {
      const remote = await api("/api/sync");
      const combined = mergeSnapshots(localSnapshot(), remote);
      const saved = await api("/api/sync", { method:"POST", body:JSON.stringify(combined) });
      applySnapshot(saved);
      cloudState.hydrated = true;
      cloudState.lastSync = new Date();
      cloudState.error = null;
      window.dispatchEvent(new CustomEvent("amarelo:account-event",{detail:{name:"sync_manual"}}));
      notify("AMARELO sincronizado.");
    } catch (err) {
      cloudState.error = err.message;
      notify(err.message);
    } finally {
      cloudState.syncing = false;
      render();
    }
  }

  async function register(event) {
    event?.preventDefault();
    const email = document.getElementById("registerEmail")?.value || "";
    const password = document.getElementById("registerPassword")?.value || "";
    try {
      const result = await api("/api/auth/register", { method:"POST", body:JSON.stringify({ email, password }) });
      cloudState.user = result.user;
      render();
      await initialSync();
      window.dispatchEvent(new CustomEvent("amarelo:account-event",{detail:{name:"account_created"}}));
      notify("Conta criada e dados sincronizados.");
    } catch (err) { notify(err.message); }
    return false;
  }

  async function login(event) {
    event?.preventDefault();
    const email = document.getElementById("loginEmail")?.value || "";
    const password = document.getElementById("loginPassword")?.value || "";
    try {
      const result = await api("/api/auth/login", { method:"POST", body:JSON.stringify({ email, password }) });
      cloudState.user = result.user;
      render();
      await initialSync();
      window.dispatchEvent(new CustomEvent("amarelo:account-event",{detail:{name:"account_login"}}));
      notify("Conta conectada.");
    } catch (err) { notify(err.message); }
    return false;
  }

  async function logout() {
    try { await api("/api/auth/logout", { method:"POST", body:"{}" }); } catch {}
    cloudState.user = null;
    cloudState.hydrated = false;
    cloudState.lastSync = null;
    render();
    notify("Você saiu da conta. Os dados locais foram mantidos neste aparelho.");
  }

  function exportLocal() {
    const payload = {
      exportedAt:new Date().toISOString(),
      app:"amarelo",
      version:"1.0-cloud-core",
      data:localSnapshot()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "amarelo-backup-" + new Date().toISOString().slice(0,10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function init() {
    try {
      cloudState.capabilities = await api("/api/capabilities");
      cloudState.ready = Boolean(cloudState.capabilities.authentication && cloudState.capabilities.cloud_sync);
      if (cloudState.ready) {
        try {
          const me = await api("/api/me");
          cloudState.user = me.user;
        } catch (err) {
          if (err.status !== 401) throw err;
        }
      }
    } catch (err) {
      cloudState.capabilities = { authentication:false, cloud_sync:false, database:"unavailable" };
      cloudState.ready = false;
      cloudState.error = err.message;
    }
    render();
    if (cloudState.user) await initialSync();
  }

  window.addEventListener("amarelo:local-change", event => {
    if (!SYNC_KEYS.has(event.detail?.key) || !cloudState.user || !cloudState.hydrated) return;
    clearTimeout(cloudState.timer);
    cloudState.timer = setTimeout(() => pushLocal({ silent:true }), 900);
  });

  window.AmareloCloud = {
    init,
    register,
    login,
    logout,
    syncNow,
    exportLocal,
    isAuthenticated:() => Boolean(cloudState.user),
    isReady:() => cloudState.ready,
    state:cloudState
  };

  document.addEventListener("DOMContentLoaded", init);
})();
