import React, { useEffect, useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, Plus, ArrowUpDown, Users, TrendingUp,
  Shield, LogOut, X, ChevronLeft, Pencil, Trash2, Trophy, ChartNoAxesCombined,
  Menu, UserRound, CalendarDays, Target, Footprints, Euro, LoaderCircle,
  AlertCircle, Database, RefreshCw, Building2, ImagePlus, MapPin, Ruler, Shirt
} from "lucide-react";
import { supabase } from "./lib/supabase";

const money = (value) => new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR", maximumFractionDigits: value >= 1000000 ? 1 : 0
}).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat("de-DE").format(Number(value || 0));

const countryCodes = {
  "österreich":"AT","austria":"AT","deutschland":"DE","germany":"DE","frankreich":"FR","france":"FR",
  "spanien":"ES","spain":"ES","england":"GB","vereinigtes königreich":"GB","portugal":"PT",
  "italien":"IT","italy":"IT","niederlande":"NL","netherlands":"NL","brasilien":"BR","brazil":"BR",
  "argentinien":"AR","argentina":"AR","norwegen":"NO","norway":"NO","schweden":"SE","sweden":"SE",
  "dänemark":"DK","denmark":"DK","schweiz":"CH","switzerland":"CH","belgien":"BE","belgium":"BE",
  "kroatien":"HR","croatia":"HR","serbien":"RS","serbia":"RS","slowenien":"SI","slovenia":"SI",
  "polen":"PL","poland":"PL","japan":"JP","südkorea":"KR","south korea":"KR","usa":"US",
  "mexiko":"MX","mexico":"MX","kanada":"CA","canada":"CA","marokko":"MA","senegal":"SN",
  "elfenbeinküste":"CI","ghana":"GH","nigeria":"NG","ägypten":"EG","kamerun":"CM","ukraine":"UA",
  "türkei":"TR","turkey":"TR","tschchien":"CZ","czechia":"CZ","slowakei":"SK","slovakia":"SK",
  "ungarn":"HU","hungary":"HU","rumänien":"RO","romania":"RO","griechenland":"GR","greece":"GR",
  "irland":"IE","ireland":"IE","wales":"GB-WLS","schottland":"GB-SCT"
};
function flagFor(nationality) {
  const code = countryCodes[String(nationality || "").trim().toLowerCase()];
  if (!code) return "🌍";
  if (code.startsWith("GB-")) return code === "GB-WLS" ? "🏴" : "🏴";
  return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}
function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase() || "?";
}

const emptyForm = { name:"", club_id:"", market_value:"", goals:"0", assists:"0", age:"", nationality:"", position:"", birth_date:"", height_cm:"", shirt_number:"" };
const emptyClubForm = { name:"", country:"", league:"", logoFile:null, logo_url:"" };

export default function App() {
  const [players, setPlayers] = useState([]);
  const [clubsData, setClubsData] = useState([]);
  const [showClubForm, setShowClubForm] = useState(false);
  const [clubEditing, setClubEditing] = useState(null);
  const [clubForm, setClubForm] = useState(emptyClubForm);
  const [clubBusy, setClubBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("market_value");
  const [direction, setDirection] = useState("desc");
  const [clubFilter, setClubFilter] = useState("all");
  const [nationFilter, setNationFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("database");
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError("Die Supabase-Verbindung fehlt. Bitte .env.local einrichten.");
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    loadPlayers();
    loadClubs();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadPlayers() {
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase.from("players").select("*");
    if (fetchError) setError(fetchError.message);
    else setPlayers(data || []);
    setLoading(false);
  }

  async function loadClubs() {
    if (!supabase) return;
    const { data, error: fetchError } = await supabase.from("clubs").select("*").order("name");
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setClubsData(data || []);
  }

  const clubs = useMemo(() => [...new Set(players.map(p => p.club).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de")), [players]);
  const nations = useMemo(() => [...new Set(players.map(p => p.nationality).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de")), [players]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...players].filter(p => {
      const matches = !q || [p.name,p.club,p.nationality].some(v => String(v || "").toLowerCase().includes(q));
      return matches && (clubFilter === "all" || p.club === clubFilter) && (nationFilter === "all" || p.nationality === nationFilter);
    }).sort((a,b) => {
      const av = a[sort], bv = b[sort];
      const cmp = typeof av === "string" ? String(av || "").localeCompare(String(bv || ""), "de") : Number(av || 0) - Number(bv || 0);
      return direction === "desc" ? -cmp : cmp;
    });
  }, [players, search, sort, direction, clubFilter, nationFilter]);

  const totalValue = players.reduce((sum,p)=>sum+Number(p.market_value || 0),0);
  const averageValue = players.length ? totalValue / players.length : 0;
  const topScorers = [...players].sort((a,b)=>Number(b.goals)-Number(a.goals)).slice(0,5);
  const topAssists = [...players].sort((a,b)=>Number(b.assists)-Number(a.assists)).slice(0,5);

  async function login(e) {
    e.preventDefault(); setAuthBusy(true); setError("");
    const {error: authError} = await supabase.auth.signInWithPassword({email,password});
    if (authError) setError(authError.message);
    else { setShowLogin(false); setPassword(""); }
    setAuthBusy(false);
  }
  async function logout() {
    await supabase.auth.signOut();
    setShowLogin(false);
  }
  function openAdd() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(player) {
    setEditing(player);
    setForm({name:player.name,club_id:player.club_id || "",market_value:String(player.market_value),goals:String(player.goals),assists:String(player.assists),age:String(player.age),nationality:player.nationality,position:player.position || "",birth_date:player.birth_date || "",height_cm:player.height_cm ? String(player.height_cm) : "",shirt_number:player.shirt_number ? String(player.shirt_number) : ""});
    setShowForm(true);
  }
  async function savePlayer(e) {
    e.preventDefault(); setFormBusy(true); setError("");
    const payload = {
      name: form.name.trim(), club_id: form.club_id || null,
      club: clubsData.find(c => c.id === form.club_id)?.name || editing?.club || "",
      market_value: Number(form.market_value),
      goals: Number(form.goals), assists: Number(form.assists), age: Number(form.age), nationality: form.nationality.trim(),
      position: form.position.trim() || null, birth_date: form.birth_date || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      shirt_number: form.shirt_number ? Number(form.shirt_number) : null
    };
    const result = editing
      ? await supabase.from("players").update(payload).eq("id", editing.id)
      : await supabase.from("players").insert(payload);
    if (result.error) setError(result.error.message);
    else { setShowForm(false); setSelected(null); await loadPlayers(); }
    setFormBusy(false);
  }
  async function deletePlayer(player) {
    if (!window.confirm(`Möchtest du ${player.name} wirklich löschen?`)) return;
    const {error: deleteError} = await supabase.from("players").delete().eq("id",player.id);
    if (deleteError) setError(deleteError.message);
    else { setSelected(null); await loadPlayers(); }
  }
  function openAddClub() { setClubEditing(null); setClubForm(emptyClubForm); setShowClubForm(true); }
  function openEditClub(club) {
    setClubEditing(club);
    setClubForm({name:club.name || "",country:club.country || "",league:club.league || "",logoFile:null,logo_url:club.logo_url || ""});
    setShowClubForm(true);
  }
  async function saveClub(e) {
    e.preventDefault(); setClubBusy(true); setError("");
    let logoUrl = clubForm.logo_url || null;
    if (clubForm.logoFile) {
      const file = clubForm.logoFile;
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g,"-");
      const path = `${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("club-logos").upload(path, file, { upsert:false, contentType:file.type });
      if (uploadError) { setError(uploadError.message); setClubBusy(false); return; }
      const { data: publicData } = supabase.storage.from("club-logos").getPublicUrl(path);
      logoUrl = publicData.publicUrl;
    }
    const payload = {name:clubForm.name.trim(),country:clubForm.country.trim() || null,league:clubForm.league.trim() || null,logo_url:logoUrl};
    const result = clubEditing
      ? await supabase.from("clubs").update(payload).eq("id",clubEditing.id)
      : await supabase.from("clubs").insert(payload);
    if (result.error) setError(result.error.message);
    else {
      if (clubEditing && clubEditing.name !== payload.name) {
        const { error: renameError } = await supabase.from("players").update({club:payload.name}).eq("club_id", clubEditing.id);
        if (renameError) setError(renameError.message);
      }
      setShowClubForm(false); await loadClubs(); await loadPlayers();
    }
    setClubBusy(false);
  }
  async function deleteClub(club) {
    if (!window.confirm(`Möchtest du ${club.name} wirklich löschen? Die Spieler bleiben erhalten.`)) return;
    const {error: deleteError} = await supabase.from("clubs").delete().eq("id",club.id);
    if (deleteError) setError(deleteError.message);
    else { await loadClubs(); await loadPlayers(); }
  }

  function chooseSort(value) {
    if (sort === value) setDirection(d => d === "desc" ? "asc" : "desc");
    else { setSort(value); setDirection(value === "name" || value === "club" || value === "nationality" ? "asc" : "desc"); }
  }

  const navItems = [
    {id:"database",label:"Datenbank",icon:Database},
    {id:"top",label:"Top-Spieler",icon:Trophy},
    {id:"stats",label:"Statistiken",icon:ChartNoAxesCombined},
    {id:"clubs",label:"Vereine",icon:Building2}
  ];

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setSelected(null);setActiveTab("database");}}>
        <span className="brand-mark"><Footprints size={21}/></span><span>Football<span className="brand-light">DB</span></span>
      </a>
      <nav className="desktop-nav">
        {navItems.map(item=><button key={item.id} className={`nav-link ${activeTab===item.id&&!selected?"active":""}`} onClick={()=>{setSelected(null);setActiveTab(item.id);}}><item.icon size={17}/>{item.label}</button>)}
      </nav>
      <div className="top-actions">
        {session ? <><span className="admin-pill"><Shield size={14}/> Admin</span><button className="icon-button" title="Abmelden" onClick={logout}><LogOut size={18}/></button></> :
          <button className="login-button" onClick={()=>setShowLogin(true)}><Shield size={16}/> Admin-Login</button>}
        <button className="mobile-menu-button" onClick={()=>setMobileMenu(v=>!v)} aria-label="Menü"><Menu/></button>
      </div>
    </header>

    {mobileMenu && <div className="mobile-nav">{navItems.map(item=><button key={item.id} onClick={()=>{setActiveTab(item.id);setSelected(null);setMobileMenu(false);}}>{item.label}</button>)}</div>}

    <main className="main-content">
      {selected ? <PlayerDetail player={selected} clubs={clubsData} isAdmin={!!session} onBack={()=>setSelected(null)} onEdit={()=>openEdit(selected)} onDelete={()=>deletePlayer(selected)} /> :
      <>
        <section className="page-heading">
          <div><div className="eyebrow">DIE WELT DES FUSSBALLS</div><h1>{activeTab==="database"?"Spielerdatenbank":activeTab==="top"?"Top-Spieler":activeTab==="clubs"?"Vereine":"Statistiken"}</h1>
            <p>Alle Spieler, Werte und Leistungen auf einen Blick.</p></div>
          {session && activeTab==="database" && <button className="primary-button" onClick={openAdd}><Plus size={18}/> Spieler hinzufügen</button>}
          {session && activeTab==="clubs" && <button className="primary-button" onClick={openAddClub}><Plus size={18}/> Verein hinzufügen</button>}
        </section>

        <section className="stats-grid">
          <StatCard icon={<Users/>} label="Spieler insgesamt" value={number(players.length)} note="In der Datenbank"/>
          <StatCard icon={<Euro/>} label="Gesamtmarktwert" value={money(totalValue)} note="Summe aller Spieler"/>
          <StatCard icon={<TrendingUp/>} label="Ø Marktwert" value={money(averageValue)} note="Durchschnitt pro Spieler"/>
        </section>

        {error && <div className="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}

        {activeTab==="database" && <section className="panel">
          <div className="panel-heading"><div><h2>Alle Spieler</h2><p>{filtered.length} {filtered.length===1?"Spieler":"Spieler"} gefunden</p></div><button className="subtle-button" onClick={loadPlayers}><RefreshCw size={16}/> Aktualisieren</button></div>
          <div className="toolbar">
            <label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Spieler, Verein oder Nationalität suchen..."/>{search&&<button onClick={()=>setSearch("")}><X size={15}/></button>}</label>
            <div className="filter-wrap"><SlidersHorizontal size={17}/><select value={clubFilter} onChange={e=>setClubFilter(e.target.value)}><option value="all">Alle Vereine</option>{clubs.map(c=><option key={c}>{c}</option>)}</select><select value={nationFilter} onChange={e=>setNationFilter(e.target.value)}><option value="all">Alle Nationen</option>{nations.map(n=><option key={n}>{n}</option>)}</select></div>
          </div>
          <div className="sort-row"><span>Sortieren nach:</span>{[["market_value","Marktwert"],["age","Alter"],["goals","Tore"],["assists","Vorlagen"],["name","Name"]].map(([key,label])=><button key={key} className={`sort-chip ${sort===key?"selected":""}`} onClick={()=>chooseSort(key)}>{label}{sort===key&&<ArrowUpDown size={13}/>}</button>)}</div>
          <PlayerTable players={filtered} loading={loading} onSelect={setSelected} clubs={clubsData}/>
          {!loading&&filtered.length===0&&<div className="empty-state"><Users size={30}/><strong>Keine Spieler gefunden</strong><span>Ändere deine Suche oder füge im Admin-Modus Spieler hinzu.</span></div>}
        </section>}

        {activeTab==="top" && <div className="two-columns"><Ranking title="Meiste Tore" icon={<Target/>} players={topScorers} stat="goals" unit="Tore" onSelect={setSelected}/><Ranking title="Meiste Vorlagen" icon={<Footprints/>} players={topAssists} stat="assists" unit="Vorlagen" onSelect={setSelected}/></div>}

        {activeTab==="clubs" && <section className="panel">
          <div className="panel-heading"><div><h2>Alle Vereine</h2><p>{clubsData.length} {clubsData.length===1?"Verein":"Vereine"} in der Datenbank</p></div><button className="subtle-button" onClick={loadClubs}><RefreshCw size={16}/> Aktualisieren</button></div>
          {clubsData.length ? <div className="clubs-grid">{clubsData.map(club => {
            const squad = players.filter(p => p.club_id === club.id || (!p.club_id && p.club === club.name));
            const squadValue = squad.reduce((sum,p)=>sum+Number(p.market_value || 0),0);
            return <article className="club-card" key={club.id}>
              <div className="club-card-top">{club.logo_url ? <img src={club.logo_url} alt={`${club.name} Logo`} className="club-logo"/> : <div className="club-logo-placeholder"><Building2/></div>}
                <div className="club-card-info"><h3>{club.name}</h3><p>{[club.league,club.country].filter(Boolean).join(" · ") || "Vereinsprofil"}</p></div>
              </div>
              <div className="club-card-stats"><span><strong>{squad.length}</strong> Spieler</span><span><strong>{money(squadValue)}</strong> Kaderwert</span></div>
              {session && <div className="club-card-actions"><button className="secondary-button" onClick={()=>openEditClub(club)}><Pencil size={14}/> Bearbeiten</button><button className="danger-button" onClick={()=>deleteClub(club)}><Trash2 size={14}/> Löschen</button></div>}
            </article>;
          })}</div> : <div className="empty-state"><Building2 size={30}/><strong>Noch keine Vereine vorhanden</strong><span>{session ? "Lege deinen ersten Verein an und lade sein Logo hoch." : "Vereinsprofile werden hier angezeigt."}</span></div>}
        </section>}

        {activeTab==="stats" && <section className="panel"><div className="panel-heading"><div><h2>Datenbank-Überblick</h2><p>Ein paar Kennzahlen zu deinen Spielern</p></div></div>
          <div className="stats-detail-grid">
            <StatCard icon={<Users/>} label="Spieler" value={number(players.length)} note="Gespeicherte Profile"/>
            <StatCard icon={<Target/>} label="Tore gesamt" value={number(players.reduce((s,p)=>s+Number(p.goals||0),0))} note="Diese Saison"/>
            <StatCard icon={<Footprints/>} label="Vorlagen gesamt" value={number(players.reduce((s,p)=>s+Number(p.assists||0),0))} note="Diese Saison"/>
            <StatCard icon={<CalendarDays/>} label="Ø Alter" value={players.length?(players.reduce((s,p)=>s+Number(p.age||0),0)/players.length).toFixed(1).replace(".",","):"–"} note="Jahre"/>
          </div>
          <div className="club-breakdown"><h3>Spieler nach Verein</h3>{clubs.length?clubs.map(c=><div className="club-line" key={c}><span>{c}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(4,players.filter(p=>p.club===c).length/players.length*100)}%`}}/></div><b>{players.filter(p=>p.club===c).length}</b></div>):<p className="muted">Noch keine Spielerdaten vorhanden.</p>}</div>
        </section>}
      </>}
    </main>

    <footer className="footer"><span>Football DB</span><span>Deine Fußball-Datenbank</span></footer>

    {showLogin && <Modal title="Admin-Login" onClose={()=>setShowLogin(false)}><form onSubmit={login} className="form-stack"><p className="modal-intro">Melde dich an, um die Spielerdatenbank zu verwalten.</p><Field label="E-Mail"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@email.com"/></Field><Field label="Passwort"><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Dein Passwort"/></Field>{error&&<p className="form-error">{error}</p>}<button className="primary-button full" disabled={authBusy}>{authBusy?<LoaderCircle className="spin"/>:"Anmelden"}</button></form></Modal>}

    {showClubForm && <Modal title={clubEditing?"Verein bearbeiten":"Neuen Verein hinzufügen"} onClose={()=>setShowClubForm(false)} wide><form onSubmit={saveClub} className="form-stack">
      <div className="form-grid">
        <Field label="Vereinsname"><input required value={clubForm.name} onChange={e=>setClubForm({...clubForm,name:e.target.value})} placeholder="z. B. FC Bayern München"/></Field>
        <Field label="Land"><input value={clubForm.country} onChange={e=>setClubForm({...clubForm,country:e.target.value})} placeholder="z. B. Deutschland"/></Field>
        <Field label="Liga"><input value={clubForm.league} onChange={e=>setClubForm({...clubForm,league:e.target.value})} placeholder="z. B. Bundesliga"/></Field>
        <Field label="Vereinslogo"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setClubForm({...clubForm,logoFile:e.target.files?.[0] || null})}/></Field>
      </div>
      {clubForm.logo_url && !clubForm.logoFile && <div className="logo-preview-row"><img src={clubForm.logo_url} alt="Aktuelles Vereinslogo"/><span>Aktuelles Logo</span></div>}
      {clubForm.logoFile && <div className="logo-preview-row"><span>{clubForm.logoFile.name}</span></div>}
      <p className="helper-text">Empfohlen: PNG, JPG oder WebP. Am besten ein quadratisches Logo mit transparentem Hintergrund.</p>
      {error&&<p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowClubForm(false)}>Abbrechen</button><button className="primary-button" disabled={clubBusy}>{clubBusy?<LoaderCircle className="spin"/>:<><Plus size={17}/>{clubEditing?"Speichern":"Verein speichern"}</>}</button></div>
    </form></Modal>}

    {showForm && <Modal title={editing?"Spieler bearbeiten":"Neuen Spieler hinzufügen"} onClose={()=>setShowForm(false)} wide><form onSubmit={savePlayer} className="form-stack">
      <div className="form-grid">
        <Field label="Name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="z. B. Florian Wirtz"/></Field>
        <Field label="Verein"><select required value={form.club_id} onChange={e=>setForm({...form,club_id:e.target.value})}><option value="">Verein auswählen</option>{clubsData.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Marktwert (€)"><input required type="number" min="0" step="100000" value={form.market_value} onChange={e=>setForm({...form,market_value:e.target.value})} placeholder="z. B. 130000000"/></Field>
        <Field label="Alter"><input required type="number" min="15" max="60" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="z. B. 22"/></Field>
        <Field label="Tore (diese Saison)"><input required type="number" min="0" value={form.goals} onChange={e=>setForm({...form,goals:e.target.value})}/></Field>
        <Field label="Vorlagen (diese Saison)"><input required type="number" min="0" value={form.assists} onChange={e=>setForm({...form,assists:e.target.value})}/></Field>
        <Field label="Nationalität"><input required value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})} placeholder="z. B. Deutschland"/></Field>
        <Field label="Position"><input value={form.position} onChange={e=>setForm({...form,position:e.target.value})} placeholder="z. B. Stürmer"/></Field>
        <Field label="Geburtsdatum"><input type="date" value={form.birth_date} onChange={e=>setForm({...form,birth_date:e.target.value})}/></Field>
        <Field label="Größe (cm)"><input type="number" min="100" max="230" value={form.height_cm} onChange={e=>setForm({...form,height_cm:e.target.value})} placeholder="z. B. 184"/></Field>
        <Field label="Rückennummer"><input type="number" min="1" max="99" value={form.shirt_number} onChange={e=>setForm({...form,shirt_number:e.target.value})} placeholder="z. B. 10"/></Field>
      </div>
      {error&&<p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Abbrechen</button><button className="primary-button" disabled={formBusy}>{formBusy?<LoaderCircle className="spin"/>:<><Plus size={17}/>{editing?"Speichern":"Spieler speichern"}</>}</button></div>
    </form></Modal>}
  </div>;
}

function StatCard({icon,label,value,note}) { return <div className="stat-card"><span className="stat-icon">{icon}</span><div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div></div>; }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Modal({title,children,onClose,wide}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className={`modal ${wide?"modal-wide":""}`}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X/></button></div>{children}</section></div>; }

function PlayerTable({players,loading,onSelect,clubs}) {
  if (loading) return <div className="loading-state"><LoaderCircle className="spin"/>Spieler werden geladen...</div>;
  return <div className="table-scroll"><table className="players-table"><thead><tr><th>Spieler</th><th>Verein</th><th>Alter</th><th>Nationalität</th><th>Tore</th><th>Vorlagen</th><th className="align-right">Marktwert</th></tr></thead><tbody>{players.map(p=><tr key={p.id} onClick={()=>onSelect(p)}><td><div className="player-name-cell"><span className="avatar">{initials(p.name)}</span><strong>{p.name}</strong></div></td><td><span className="club-name-cell">{(clubs.find(c=>c.id===p.club_id)?.logo_url) && <img src={clubs.find(c=>c.id===p.club_id).logo_url} alt="" className="table-club-logo"/>}{p.club}</span></td><td>{p.age}</td><td><span className="nation">{flagFor(p.nationality)} {p.nationality}</span></td><td>{number(p.goals)}</td><td>{number(p.assists)}</td><td className="align-right value-cell">{money(p.market_value)}</td></tr>)}</tbody></table></div>;
}
function PlayerDetail({player,clubs,isAdmin,onBack,onEdit,onDelete}) {
  const club = clubs.find(c => c.id === player.club_id);
  return <section className="detail-page"><button className="back-button" onClick={onBack}><ChevronLeft size={17}/> Zurück zur Datenbank</button><div className="detail-hero"><div className="detail-avatar">{initials(player.name)}</div><div className="detail-main"><span className="eyebrow">SPIELERPROFIL</span><h1>{player.name}</h1><p>{club?.logo_url && <img src={club.logo_url} alt="" className="detail-club-logo"/>}{player.club} <span className="dot">·</span> {flagFor(player.nationality)} {player.nationality}</p></div><div className="detail-value"><span>Marktwert</span><strong>{money(player.market_value)}</strong></div></div><div className="detail-stats"><DetailStat icon={<CalendarDays/>} label="Alter" value={`${player.age} Jahre`}/><DetailStat icon={<Target/>} label="Tore" value={number(player.goals)}/><DetailStat icon={<Footprints/>} label="Vorlagen" value={number(player.assists)}/><DetailStat icon={<Shield/>} label="Nationalität" value={`${flagFor(player.nationality)} ${player.nationality}`}/></div>
    {(player.position || player.birth_date || player.height_cm || player.shirt_number) && <div className="detail-stats extra-player-stats">
      {player.position && <DetailStat icon={<UserRound/>} label="Position" value={player.position}/>}
      {player.birth_date && <DetailStat icon={<CalendarDays/>} label="Geburtsdatum" value={new Date(`${player.birth_date}T00:00:00`).toLocaleDateString("de-DE")}/>}
      {player.height_cm && <DetailStat icon={<Ruler/>} label="Größe" value={`${player.height_cm} cm`}/>}
      {player.shirt_number && <DetailStat icon={<Shirt/>} label="Rückennummer" value={`#${player.shirt_number}`}/>}
    </div>}
    {isAdmin&&<div className="detail-admin"><span>Admin-Aktionen</span><div><button className="secondary-button" onClick={onEdit}><Pencil size={16}/> Bearbeiten</button><button className="danger-button" onClick={onDelete}><Trash2 size={16}/> Löschen</button></div></div>}</section>;
}
function DetailStat({icon,label,value}) { return <div className="detail-stat"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></div>; }
function Ranking({title,icon,players,stat,unit,onSelect}) { return <section className="panel ranking-panel"><div className="panel-heading"><div className="ranking-title">{icon}<div><h2>{title}</h2><p>Aktuelle Saison</p></div></div></div>{players.length?players.map((p,i)=><button className="ranking-row" key={p.id} onClick={()=>onSelect(p)}><span className="rank-number">{i+1}</span><span className="avatar">{initials(p.name)}</span><span className="ranking-player"><strong>{p.name}</strong><small>{p.club}</small></span><strong className="ranking-score">{p[stat]} <small>{unit}</small></strong></button>):<div className="empty-state">Noch keine Spieler vorhanden.</div>}</section>; }
