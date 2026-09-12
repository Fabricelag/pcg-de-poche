/* PCG de poche — logique de l'application (vanilla JS, aucune dépendance). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DIACRITICS = new RegExp("[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]", "g");
  const norm = s => String(s).normalize("NFD").replace(DIACRITICS, "").toLowerCase();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const store = {
    get(k, d) { try { const v = localStorage.getItem("pcg." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("pcg." + k, JSON.stringify(v)); } catch {} }
  };
  const ICON = {
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>',
    copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    plan: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h7"/></svg>',
    sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"/></svg>',
    auto: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>'
  };
  const SHORT = { 1: "Capitaux", 2: "Immobilisations", 3: "Stocks", 4: "Tiers", 5: "Financiers", 6: "Charges", 7: "Produits", 8: "Spéciaux" };
  const NAT = {
    actif: ["Actif", "Solde débiteur", "actif", "debit"],
    "actif-": ["Actif soustractif", "Solde créditeur", "actif", "credit"],
    passif: ["Passif", "Solde créditeur", "passif", "credit"],
    mixte: ["Tiers", "Débiteur ou créditeur", "actif", ""],
    charge: ["Charge", "Au débit", "charge", "debit"],
    produit: ["Produit", "Au crédit", "produit", "credit"],
    special: ["Compte spécial", "Hors bilan", "special", ""]
  };
  const CLASS_NAT = { 1: "passif", 2: "actif", 3: "actif", 4: "mixte", 5: "actif", 6: "charge", 7: "produit", 8: "special" };

  /* ---------- Modèle ---------- */
  const byNum = new Map();
  const infos = PCG.infos || {}, natures = PCG.nature || {};
  const list = PCG.accounts.map(({ n, l }) => ({ n, l, nl: norm(l), c: n[0], kids: [], info: infos[n] || null, kw: (infos[n]?.k || []).map(norm) }));
  list.sort((a, b) => a.n.localeCompare(b.n));
  list.forEach(a => byNum.set(a.n, a));
  list.forEach(a => {
    let p = a.n.slice(0, -1);
    while (p && !byNum.has(p)) p = p.slice(0, -1);
    a.parent = p || null;
    if (p) byNum.get(p).kids.push(a);
    a.depth = Math.max(0, a.n.length - 2);
  });
  const nature = a => { for (let p = a; p; p = p.parent ? byNum.get(p.parent) : null) if (natures[p.n]) return natures[p.n]; return CLASS_NAT[a.c]; };
  const classOf = c => PCG.classes.find(k => k.n === c);

  /* ---------- État ---------- */
  const st = {
    q: "", cls: null, expanded: new Set(), sheet: [],
    favs: store.get("favs", []), recents: store.get("recents", []), numpad: store.get("numpad", false), theme: store.get("theme", "")
  };

  /* ---------- Éléments ---------- */
  const main = $("#main"), input = $("#q"), field = $("#field"), chips = $("#chips"), sheetWrap = $("#sheetWrap"), sheet = $("#sheet"), toast = $("#toast");

  /* ---------- Recherche ---------- */
  function search(q, cls) {
    const toks = norm(q.trim()).split(/\s+/).filter(Boolean);
    let res = cls ? list.filter(a => a.c === cls) : list;
    if (!toks.length) return res.map(a => ({ a, num: null, words: [], via: [] }));
    const nums = toks.filter(t => /^\d+$/.test(t)), words = toks.filter(t => !/^\d+$/.test(t));
    const res2 = [];
    for (const a of res) {
      if (!nums.every(t => a.n.startsWith(t))) continue;
      const via = [];
      let ok = true;
      for (const w of words) {
        const re = new RegExp("(^|[^a-z0-9])" + reEsc(w));
        if (re.test(a.nl)) continue;
        const k = a.kw.find(k => re.test(k));
        if (k) via.push(k); else { ok = false; break; }
      }
      if (ok) res2.push({ a, num: nums[0] || null, words, via });
    }
    return res2;
  }
  const hiNum = (n, pre) => pre && n.startsWith(pre) ? `<mark>${pre}</mark>${n.slice(pre.length)}` : n;
  function hiLabel(l, words) {
    if (!words.length) return esc(l);
    let out = "", i = 0;
    const nl = norm(l);
    const hits = [];
    for (const w of words) { const re = new RegExp("(^|[^a-z0-9])(" + reEsc(w) + "[a-z0-9]*)", "g"); let m; while ((m = re.exec(nl))) hits.push([m.index + m[1].length, m.index + m[1].length + m[2].length]); }
    hits.sort((x, y) => x[0] - y[0]);
    for (const [s, e] of hits) { if (s < i) continue; out += esc(l.slice(i, s)) + "<mark>" + esc(l.slice(s, e)) + "</mark>"; i = e; }
    return out + esc(l.slice(i));
  }

  /* ---------- Rendu ---------- */
  function row(a, opts = {}) {
    const lvl = a.depth === 0 ? "h2" : a.depth === 1 ? "h3" : "deep";
    const tog = opts.tree && a.kids.length && a.depth >= 1
      ? `<button class="tog" aria-expanded="${st.expanded.has(a.n)}" data-tog="${a.n}" aria-label="Déplier ${a.n}">${ICON.chev}</button>` : "";
    const fav = st.favs.includes(a.n) ? `<span class="fav-mark" aria-label="Favori">${ICON.star}</span>` : "";
    return `<div class="row ${lvl}" role="button" tabindex="0" data-n="${a.n}" style="--cc:var(--c${a.c});--depth:${opts.tree ? Math.max(0, a.depth - 1) : 0}">
      <span class="stripe"></span>
      <span class="num">${opts.num ? hiNum(a.n, opts.num) : a.n}</span>
      <span class="lbl">${hiLabel(a.l, opts.words || [])}${opts.via?.length ? `<small>via « ${esc(opts.via.join(", "))} »</small>` : ""}</span>
      <span class="acts">${fav}${tog}<button class="info" data-info="${a.n}" aria-label="Informations sur le compte ${a.n}">i</button></span>
    </div>`;
  }
  function tree(a) {
    let h = row(a, { tree: true });
    if (a.depth === 0 || st.expanded.has(a.n)) for (const k of a.kids) h += tree(k);
    return h;
  }
  function renderHome() {
    const cards = PCG.classes.map(k => `<button class="class-card" data-cls="${k.n}" style="--cc:var(--c${k.n})">
        <span class="tab"></span><span class="digit">${k.n}</span>
        <span><span class="t">${esc(k.t)}</span><span class="s">${esc(k.s)}</span></span>
        <span class="n">${list.filter(a => a.c === k.n).length} cptes</span></button>`).join("");
    const favs = st.favs.map(n => byNum.get(n)).filter(Boolean);
    const rec = st.recents.map(n => byNum.get(n)).filter(Boolean).filter(a => !st.favs.includes(a.n)).slice(0, 5);
    return `<div class="hint">Tapez une racine (<b>401</b>, <b>6</b>) ou un mot (<b>loyer</b>, <b>voiture</b>, <b>honoraires</b>). Le <b>i</b> explique chaque compte.</div>
      ${favs.length ? `<h3 class="section-title">Favoris</h3><div class="rows">${favs.map(a => row(a)).join("")}</div>` : ""}
      ${rec.length ? `<h3 class="section-title">Récents <button data-act="clear-recents">Effacer</button></h3><div class="rows">${rec.map(a => row(a)).join("")}</div>` : ""}
      <h3 class="section-title">Classes</h3><div class="class-list">${cards}</div>
      <div class="foot"><img src="logos/lagarde.png" alt="Lagarde Expertise & Conseil"><span>Usage interne · ${esc(PCG.version || "")}<br><a href="installer.html">Installer sur un téléphone</a></span><img src="logos/ac.png" alt="L'Agent Comptable"></div>`;
  }
  function renderClass(c) {
    const k = classOf(c);
    const roots = list.filter(a => a.c === c && a.depth === 0);
    return `<div class="crumb"><button data-act="home">${ICON.back} Classes</button><span class="where">Classe ${c} · ${esc(k.t)}</span></div>
      <div class="rows">${roots.map(tree).join("")}</div>`;
  }
  function renderResults() {
    const res = search(st.q, st.cls);
    if (!res.length) return `<div class="empty"><b>Aucun compte trouvé</b>Essayez un autre mot, une racine plus courte, ou retirez le filtre de classe.</div>`;
    const shown = res.slice(0, 150);
    return `<h3 class="section-title">${res.length} compte${res.length > 1 ? "s" : ""}${st.cls ? ` · classe ${st.cls}` : ""}</h3>
      <div class="rows">${shown.map(r => row(r.a, { num: r.num, words: r.words, via: r.via })).join("")}</div>
      ${res.length > shown.length ? `<div class="empty">${res.length - shown.length} autres comptes. Précisez la recherche.</div>` : ""}`;
  }
  function render(keepScroll) {
    const y = main.scrollTop;
    main.innerHTML = st.q.trim() ? renderResults() : st.cls ? renderClass(st.cls) : renderHome();
    main.scrollTop = keepScroll ? y : 0;
    for (const b of chips.querySelectorAll(".chip")) b.setAttribute("aria-pressed", String(b.dataset.cls === st.cls));
    field.classList.toggle("has-text", !!st.q);
  }

  /* ---------- Fiche compte ---------- */
  const link = (a, why) => `<button class="link" data-open="${a.n}" style="--cc:var(--c${a.c})"><span class="num mono">${a.n}</span><span class="lbl">${esc(a.l)}${why ? `<small>${esc(why)}</small>` : ""}</span></button>`;
  function openSheet(n, push = true) {
    const a = byNum.get(n); if (!a) return;
    if (push) st.sheet.push(n); else st.sheet[st.sheet.length - 1] = n;
    st.recents = [n, ...st.recents.filter(x => x !== n)].slice(0, 8); store.set("recents", st.recents);
    const nat = NAT[nature(a)], info = a.info, k = classOf(a.c), fav = st.favs.includes(n);
    const back = st.sheet.length > 1 ? `<button class="close" data-act="sheet-back" aria-label="Retour">${ICON.back}</button>` : "";
    const ncHtml = (info?.nc || []).map(x => Array.isArray(x) ? x : [x, ""]).map(([m, why]) => { const b = byNum.get(m); return b ? link(b, why) : ""; }).join("");
    const rel = (info?.rel || []).map(m => byNum.get(m)).filter(Boolean);
    const parent = a.parent ? byNum.get(a.parent) : null;
    sheet.innerHTML = `<div class="handle"></div>
      <div class="sheet-head" style="--cc:var(--c${a.c})"><span class="stripe"></span>
        <div><div class="num mono">${a.n}</div><div class="lbl">${esc(a.l)}</div><div class="cls">Classe ${a.c} · ${esc(k.t)}${parent ? ` · sous ${parent.n} ${esc(parent.l)}` : ""}</div></div>
        <div style="display:flex;gap:6px">${back}<button class="close" data-act="sheet-close" aria-label="Fermer">${ICON.x}</button></div>
      </div>
      <div class="sheet-body">
        <div class="tags"><span class="tag ${nat[2]}">${nat[0]}</span>${nat[1] ? `<span class="tag ${nat[3]}" style="--cc:var(--c${a.c})">${nat[1]}</span>` : ""}</div>
        ${info?.i ? `<div class="block"><h4>En clair</h4><p>${esc(info.i)}</p></div>` : ""}
        ${ncHtml ? `<div class="block"><h4>À ne pas confondre avec</h4><div class="links">${ncHtml}</div></div>` : ""}
        ${rel.length ? `<div class="block"><h4>Comptes liés</h4><div class="links">${rel.map(b => link(b)).join("")}</div></div>` : ""}
        ${a.kids.length ? `<div class="block"><h4>Sous-comptes</h4><div class="links">${a.kids.map(b => link(b)).join("")}</div></div>` : ""}
        ${info?.k?.length ? `<div class="block"><h4>Mots-clés</h4><div class="kw">${info.k.map(x => `<span>${esc(x)}</span>`).join("")}</div></div>` : ""}
        <div class="sheet-acts">
          <button data-act="fav" class="${fav ? "on" : ""}">${ICON.star} Favori</button>
          <button data-act="copy">${ICON.copy} Copier</button>
          <button data-act="goto">${ICON.plan} Dans le plan</button>
        </div>
      </div>`;
    sheetWrap.classList.add("open");
    $(".sheet-body", sheet).scrollTop = 0;
  }
  function closeSheet() { sheetWrap.classList.remove("open"); st.sheet = []; }
  function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove("show"), 1600); }
  function gotoInPlan(n) {
    const a = byNum.get(n); closeSheet();
    st.q = ""; input.value = ""; st.cls = a.c;
    for (let p = a.parent; p; p = byNum.get(p).parent) st.expanded.add(p);
    render();
    const el = main.querySelector(`.row[data-n="${n}"]`);
    if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); }
  }

  /* ---------- Thème et clavier ---------- */
  function applyTheme() {
    const root = document.documentElement;
    if (st.theme) root.dataset.theme = st.theme; else delete root.dataset.theme;
    $("#themeBtn").innerHTML = st.theme === "dark" ? ICON.moon : st.theme === "light" ? ICON.sun : ICON.auto;
    $("#themeBtn").title = st.theme === "dark" ? "Thème sombre" : st.theme === "light" ? "Thème clair" : "Thème automatique";
  }
  function applyNumpad() { input.inputMode = st.numpad ? "numeric" : "search"; $("#padBtn").setAttribute("aria-pressed", String(st.numpad)); }

  /* ---------- Événements ---------- */
  input.addEventListener("input", () => { st.q = input.value; render(); });
  input.addEventListener("keydown", e => { if (e.key === "Enter") { const a = byNum.get(st.q.trim()); if (a) openSheet(a.n); input.blur(); } });
  $("#clearBtn").addEventListener("click", () => { st.q = ""; input.value = ""; render(); input.focus(); });
  $("#padBtn").addEventListener("click", () => { st.numpad = !st.numpad; store.set("numpad", st.numpad); applyNumpad(); input.focus(); });
  $("#themeBtn").addEventListener("click", () => { st.theme = st.theme === "" ? "dark" : st.theme === "dark" ? "light" : ""; store.set("theme", st.theme); applyTheme(); });
  chips.addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; st.cls = st.cls === b.dataset.cls ? null : b.dataset.cls; render(); });
  main.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("a")) return;
    const info = t.closest("[data-info]"); if (info) { openSheet(info.dataset.info); return; }
    const tog = t.closest("[data-tog]"); if (tog) { const n = tog.dataset.tog; st.expanded.has(n) ? st.expanded.delete(n) : st.expanded.add(n); render(true); return; }
    const card = t.closest("[data-cls]"); if (card) { st.cls = card.dataset.cls; render(); return; }
    const act = t.closest("[data-act]");
    if (act?.dataset.act === "home") { st.cls = null; render(); return; }
    if (act?.dataset.act === "clear-recents") { st.recents = []; store.set("recents", []); render(true); return; }
    const r = t.closest(".row"); if (!r) return;
    const a = byNum.get(r.dataset.n);
    if (!st.q.trim() && st.cls && a.kids.length && a.depth >= 1) { st.expanded.has(a.n) ? st.expanded.delete(a.n) : st.expanded.add(a.n); render(true); }
    else openSheet(a.n);
  });
  main.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("row")) { e.preventDefault(); e.target.click(); } });
  sheetWrap.addEventListener("click", e => {
    const t = e.target;
    if (t.closest(".scrim")) { closeSheet(); return; }
    const open = t.closest("[data-open]"); if (open) { openSheet(open.dataset.open); return; }
    const act = t.closest("[data-act]")?.dataset.act; if (!act) return;
    const n = st.sheet[st.sheet.length - 1];
    if (act === "sheet-close") closeSheet();
    else if (act === "sheet-back") { st.sheet.pop(); openSheet(st.sheet[st.sheet.length - 1], false); }
    else if (act === "fav") { st.favs = st.favs.includes(n) ? st.favs.filter(x => x !== n) : [...st.favs, n]; store.set("favs", st.favs); openSheet(n, false); render(true); showToast(st.favs.includes(n) ? `${n} ajouté aux favoris` : `${n} retiré des favoris`); }
    else if (act === "copy") { (navigator.clipboard?.writeText(n) || Promise.reject()).then(() => showToast(`${n} copié`), () => showToast(`Copie impossible ici`)); }
    else if (act === "goto") gotoInPlan(n);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetWrap.classList.contains("open")) closeSheet(); });

  /* ---------- Hors ligne et mises à jour ---------- */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    const banner = $("#update");
    const wasControlled = !!navigator.serviceWorker.controller; // faux à la toute première visite : pas de bannière ce jour-là
    let wanted = false, reloading = false;
    navigator.serviceWorker.register("sw.js").then(reg => {
      const offer = w => { banner.hidden = false; $("#updateBtn").onclick = () => { wanted = true; w.postMessage("skipWaiting"); banner.hidden = true; }; };
      if (wasControlled && reg.waiting) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener("statechange", () => { if (w.state === "installed" && wasControlled) offer(w); });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (wanted && !reloading) { reloading = true; location.reload(); } });
  }

  /* ---------- Démarrage ---------- */
  chips.innerHTML = PCG.classes.map(k => `<button class="chip" data-cls="${k.n}" aria-pressed="false" style="--cc:var(--c${k.n})"><i>${k.n}</i>${SHORT[k.n]}</button>`).join("");
  $("#searchIcon").innerHTML = ICON.search; $("#clearBtn").innerHTML = ICON.x;
  applyTheme(); applyNumpad(); render();
})();
