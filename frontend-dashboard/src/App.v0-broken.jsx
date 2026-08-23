import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, Bot, Building2,
  CheckCircle2, ChevronDown, ChevronRight, Globe2, Leaf, LogIn,
  LogOut, MapPin, Menu, Moon, Radio, RefreshCw, Send, Settings,
  ShieldAlert, Sparkles, Sun, Upload, Users, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import "./App.css";

const API_BASE_URL = "https://brics-environmental-api-neulhenasa-el.a.run.app";

const CITIES = {
  Delhi: { country: "India", code: "IN", flag: "🇮🇳" },
  Johannesburg: { country: "South Africa", code: "ZA", flag: "🇿🇦" },
  "Sao Paulo": { country: "Brazil", code: "BR", flag: "🇧🇷" },
};

const TRANSLATIONS = {
  en: { dashboard:"Dashboard", hotspots:"Hotspots", industries:"Industries", reports:"Citizen Reports", sensors:"Sensors", assistant:"AI Assistant", network:"BRICS Network", settings:"Settings", current:"Current PM2.5", forecast:"Forecast +6h", risk:"Risk Level", trend:"Trend", live:"LIVE", offline:"OFFLINE", refresh:"Refresh", predict:"Predict", explain:"Explain", decide:"Decide", selectCity:"Select city", signIn:"Sign In", email:"Email", password:"Password", continueDemo:"Continue as Demo User" },
  hi: { dashboard:"डैशबोर्ड", hotspots:"प्रदूषण हॉटस्पॉट", industries:"उद्योग", reports:"नागरिक शिकायतें", sensors:"सेंसर", assistant:"AI सहायक", network:"BRICS नेटवर्क", settings:"सेटिंग्स", current:"वर्तमान PM2.5", forecast:"6 घंटे का पूर्वानुमान", risk:"जोखिम स्तर", trend:"रुझान", live:"लाइव", offline:"ऑफलाइन", refresh:"रिफ्रेश", predict:"पूर्वानुमान", explain:"व्याख्या", decide:"निर्णय", selectCity:"शहर चुनें", signIn:"साइन इन", email:"ईमेल", password:"पासवर्ड", continueDemo:"डेमो यूज़र के रूप में जारी रखें" },
  od: { dashboard:"ଡ୍ୟାସବୋର୍ଡ", hotspots:"ପ୍ରଦୂଷଣ ହଟସ୍ପଟ", industries:"ଶିଳ୍ପ", reports:"ନାଗରିକ ଅଭିଯୋଗ", sensors:"ସେନ୍ସର", assistant:"AI ସହାୟକ", network:"BRICS ନେଟୱର୍କ", settings:"ସେଟିଂସ୍", current:"ବର୍ତ୍ତମାନ PM2.5", forecast:"6 ଘଣ୍ଟିଆ ପୂର୍ବାନୁମାନ", risk:"ବିପଦ ସ୍ତର", trend:"ପ୍ରବୃତ୍ତି", live:"ଲାଇଭ୍", offline:"ଅଫଲାଇନ୍", refresh:"ରିଫ୍ରେଶ", predict:"ପୂର୍ବାନୁମାନ", explain:"ବ୍ୟାଖ୍ୟା", decide:"ନିଷ୍ପତ୍ତି", selectCity:"ସହର ବାଛନ୍ତୁ", signIn:"ସାଇନ୍ ଇନ୍", email:"ଇମେଲ୍", password:"ପାସୱାର୍ଡ", continueDemo:"ଡେମୋ ୟୁଜର ଭାବେ ଜାରି ରଖନ୍ତୁ" }
};

const NAV_ITEMS = [
  ["dashboard","dashboard",Activity], ["hotspots","hotspots",MapPin],
  ["industries","industries",Building2], ["reports","reports",AlertTriangle],
  ["sensors","sensors",Radio], ["assistant","assistant",Bot],
  ["network","network",Globe2]
];

const INDUSTRIES = [
  { name:"North Delhi Industrial Corridor", type:"Mixed manufacturing", distance:"2.4 km", status:"Under observation", sensor:"ONLINE" },
  { name:"Wazirpur Industrial Area", type:"Metal & engineering", distance:"5.1 km", status:"Normal", sensor:"ONLINE" },
  { name:"Okhla Industrial Estate", type:"Textile & processing", distance:"8.2 km", status:"Sensor anomaly", sensor:"ONLINE" }
];

const SENSOR_DATA = [
  ["PM2.5","82.4","µg/m³","HIGH"], ["PM10","164","µg/m³","HIGH"],
  ["SO₂","42.1","µg/m³","WATCH"], ["NO₂","31.2","µg/m³","NORMAL"]
];

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(1);
}
function riskClass(level="") {
  const v = String(level).toUpperCase();
  if (v.includes("VERY HIGH")) return "risk-critical";
  if (v.includes("HIGH")) return "risk-high";
  if (v.includes("MODERATE")) return "risk-moderate";
  if (v.includes("LOW")) return "risk-low";
  return "risk-neutral";
}
function trendIcon(direction) {
  if (direction === "RISING") return <ArrowUp size={16}/>;
  if (direction === "FALLING" || direction === "DECREASING") return <ArrowDown size={16}/>;
  return <Activity size={16}/>;
}
function useHashRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, "") || "dashboard";
  const [route,setRoute] = useState(get);
  useEffect(() => { const f=()=>setRoute(get()); window.addEventListener("hashchange",f); return()=>window.removeEventListener("hashchange",f); },[]);
  return [route,next=>{window.location.hash=`/${next}`}];
}
function Login({onLogin,t}) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  return <div className="login-shell"><div className="login-card">
    <div className="brand-mark"><Leaf size={30}/></div>
    <span className="eyebrow">BRICS 2026 • ENVIRONMENTAL INTELLIGENCE</span>
    <h1>Predict. Explain. Decide.</h1><p>Environmental early-warning and citizen intelligence platform.</p>
    <label>{t.email}</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <label>{t.password}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
    <button className="primary-button" onClick={onLogin}><LogIn size={17}/> {t.signIn}</button>
    <div className="or-divider"><span>OR</span></div>
    <button className="secondary-button" onClick={onLogin}>{t.continueDemo}</button>
  </div></div>;
}
function MetricCard({label,value,suffix,icon,sub,tone=""}) {
  return <div className={`metric-card glass-card ${tone}`}><div className="metric-top"><span className="eyebrow">{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value} {suffix&&<small>{suffix}</small>}</div><div className="metric-sub">{sub}</div></div>;
}
function CardTitle({eyebrow,title,icon}) {
  return <div className="card-title"><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div><span className="title-icon">{icon}</span></div>;
}
function SimplePage({eyebrow,title,description,icon,children}) {
  return <section className="page-card glass-card"><CardTitle eyebrow={eyebrow} title={title} icon={icon}/><p className="page-description">{description}</p>{children}</section>;
}
function Dashboard({city,data,loading,error,online,onRefresh,t}) {
  const forecast=data?.forecast||{}, risk=data?.risk||{}, decision=data?.decision||{}, ai=data?.ai_explanation||{}, explanation=ai?.explanation||{};
  const drivers=data?.drivers||data?.evidence||[], hotspots=data?.hotspots||[];
  const current=data?.current_pm25??forecast.current_pm25, predicted=data?.predicted_pm25??forecast.predicted_pm25;
  const trend=String(data?.trend?.direction||risk?.trend||"STABLE").toUpperCase();
  const pct=data?.trend?.percentage_change??risk?.percentage_change, change=data?.trend?.absolute_change??risk?.absolute_change;
  const riskLevel=data?.risk_level||risk?.level||"UNKNOWN";
  const chartData=useMemo(()=>{if(!Number.isFinite(Number(current))||!Number.isFinite(Number(predicted)))return[];const a=Number(current),b=Number(predicted);return[{label:"Now",value:a},{label:"+2h",value:a+(b-a)*.33},{label:"+4h",value:a+(b-a)*.66},{label:"+6h",value:b}]},[current,predicted]);
  return <>
    <section className="hero-intro"><div><span className="eyebrow">PREDICTIVE ENVIRONMENTAL EARLY-WARNING</span><h2>{city} environmental intelligence</h2><p>Forecast risk before it happens, surface the drivers, and recommend the next action.</p></div><div className="flow-strip"><span>01 <b>{t.predict}</b></span><ChevronRight/><span>02 <b>{t.explain}</b></span><ChevronRight/><span>03 <b>{t.decide}</b></span></div></section>
    <section className="metric-grid">
      <MetricCard label={t.current} value={formatNumber(current)} suffix="µg/m³" icon={<span className="wind-symbol">≋</span>} sub="Live observation • Open-Meteo"/>
      <MetricCard label={t.forecast} value={formatNumber(predicted)} suffix="µg/m³" icon={<Activity size={22}/>} sub={<span>Model projection <b className="accent-orange">{change>=0?"+":""}{formatNumber(change)} µg/m³</b></span>}/>
      <MetricCard label={t.risk} value={riskLevel} icon={<ShieldAlert size={22}/>} tone={riskClass(riskLevel)} sub={<span className="status-pill">{trend}</span>}/>
      <MetricCard label={t.trend} value={`${pct>=0?"+":""}${formatNumber(pct)}%`} icon={trendIcon(trend)} tone={pct>0?"risk-high":"risk-low"} sub={<span>{trend==="RISING"?"Worsening":trend==="FALLING"?"Improving":"Stable"} over 6h</span>}/>
    </section>
    {error&&<div className="error-banner"><AlertTriangle size={18}/><span>{error}</span><button onClick={onRefresh}>Retry</button></div>}
    <section className="dashboard-grid">
      <div className="glass-card chart-card large"><CardTitle eyebrow="PREDICT" title="6-hour forecast trajectory" icon={<Activity size={20}/>}/><div className="chart-wrap">{loading?<div className="empty-state">Retrieving live environmental data…</div>:chartData.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="pmGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity={.45}/><stop offset="100%" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="label" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={38}/><Tooltip formatter={v=>[`${Number(v).toFixed(1)} µg/m³`,"PM2.5"]}/><Area type="monotone" dataKey="value" stroke="var(--cyan)" strokeWidth={3} fill="url(#pmGradient)"/></AreaChart></ResponsiveContainer>:<div className="empty-state">No trajectory available.</div>}</div></div>
      <div className="glass-card intelligence-card"><CardTitle eyebrow="EXPLAIN" title="AI Environmental Intelligence" icon={<Sparkles size={20}/>}/><span className={`ai-badge ${ai.status==="generated"?"generated":"fallback"}`}>{ai.status==="generated"?"GEMINI GENERATED":"SYSTEM FALLBACK"}</span><h3>{explanation.headline||"Environmental forecast explanation unavailable."}</h3><p>{explanation.situation||"No explanation available."}</p><div className="why-box"><span>WHY IT MATTERS</span><p>{explanation.why_it_matters||"Use the forecast alongside current environmental evidence."}</p></div></div>
    </section>
    <section className="dashboard-grid three">
      <div className="glass-card"><CardTitle eyebrow="EVIDENCE" title="Key Drivers" icon={<Zap size={20}/>}/><div className="driver-list">{drivers.slice(0,5).map((d,i)=>{const impact=Number(d.impact||0);return <div className="driver-row" key={`${d.feature}-${i}`}><div><span>{String(d.feature||"feature").replaceAll("_"," ")}</span><b className={impact>=0?"positive":"negative"}>{impact>=0?"+":""}{impact.toFixed(2)}</b></div><div className="driver-track"><i style={{width:`${Math.min(Math.abs(impact)*3,100)}%`}}/></div>})}</div></div>
      <div className="glass-card"><CardTitle eyebrow="DECIDE" title="Authority Decision" icon={<ShieldAlert size={20}/>}/><div className="priority-box"><span>PRIORITY</span><strong>{decision.priority||"MONITOR"}</strong></div><div className="action-list">{(decision.actions||["Continue routine monitoring."]).slice(0,4).map((a,i)=><div className="action-row" key={i}><CheckCircle2 size={16}/><span>{a}</span></div>)}</div></div>
      <div className="glass-card"><CardTitle eyebrow="HYPERLOCAL" title="Pollution Hotspots" icon={<MapPin size={20}/>}/>{hotspots.length?hotspots.slice(0,4).map(h=><div className="hotspot-mini" key={h.id}><div><b>{h.name}</b><span>{h.zone_type} • {h.estimated?"MODEL ESTIMATE":"OBSERVED"}</span></div><strong>{formatNumber(h.hotspot_score)}</strong></div>):<div className="empty-state">Hotspot estimates will appear here.</div>}</div>
    </section>
    <section className="glass-card brics-context"><CardTitle eyebrow="BRICS CONTEXT" title="Regulatory Reference" icon={<Globe2 size={20}/>}/><div className="context-grid"><div><span>REFERENCE</span><b>{data?.brics_context?.regulatory_reference||"National ambient air quality reference"}</b></div><div><span>VALUE</span><b>{data?.brics_context?.reference_value??"—"} µg/m³</b></div><div><span>PERIOD</span><b>{data?.brics_context?.reference_period||"—"}</b></div><div><span>COMPARISON</span><b>{data?.brics_context?.comparison||"—"}</b></div></div><small>{data?.brics_context?.note||"Regulatory comparisons are informational only."}</small></section>
  </>;
}
function HotspotsPage({data}) {
  const hotspots=data?.hotspots||[];
  return <SimplePage eyebrow="HYPERLOCAL INTELLIGENCE" title="Pollution Hotspots" description="Estimated spatial risk derived from forecast evidence. These are model estimates, not direct sensor measurements." icon={<MapPin size={22}/>}><div className="map-placeholder"><div className="map-grid"><span className="map-pin p1">🔴</span><span className="map-pin p2">🟠</span><span className="map-pin p3">🟠</span><span className="map-pin p4">🟡</span><div className="map-label">DELHI • HYPERLOCAL VIEW</div></div></div><div className="hotspot-page-grid">{hotspots.length?hotspots.map(h=><div className={`hotspot-card ${riskClass(h.hotspot_level)}`} key={h.id}><span className="eyebrow">{String(h.zone_type||"ZONE").toUpperCase()}</span><h3>{h.name}</h3><strong>{formatNumber(h.hotspot_score)}<small>/100</small></strong><span>{h.hotspot_level} • {h.estimated?"MODEL ESTIMATE":"OBSERVED"}</span></div>):<div className="empty-state">No hotspot estimates returned by the API.</div>}</div></SimplePage>;
}
function IndustriesPage(){return <SimplePage eyebrow="SOURCE INTELLIGENCE" title="Nearby Industries" description="Industry information is presented for environmental context. A compliance concern must be verified with evidence before being treated as a violation." icon={<Building2 size={22}/>}><div className="industry-list">{INDUSTRIES.map(i=><div className="industry-card" key={i.name}><div className="industry-icon"><Building2 size={22}/></div><div className="industry-main"><h3>{i.name}</h3><span>{i.type} • {i.distance}</span><div className="industry-status"><b>{i.status}</b><span>Sensor {i.sensor}</span></div></div><ChevronRight/></div>)}</div></SimplePage>}
function ReportsPage(){const [submitted,setSubmitted]=useState(false);return <SimplePage eyebrow="CITIZEN INTELLIGENCE" title="Report an Environmental Issue" description="Help authorities investigate pollution events with location, description and supporting evidence." icon={<AlertTriangle size={22}/>} >{submitted?<div className="success-panel"><CheckCircle2 size={34}/><h3>Report submitted</h3><p>Your report has been added to the demonstration incident queue.</p><button className="primary-button" onClick={()=>setSubmitted(false)}>File another report</button></div>:<div className="report-form"><input placeholder="Location or landmark"/><select><option>Air pollution / smoke</option><option>Untreated waste discharge</option><option>Illegal dumping</option><option>Other environmental issue</option></select><textarea rows="5" placeholder="Describe what you observed…"/><button className="upload-button"><Upload size={17}/> Attach photo</button><button className="primary-button" onClick={()=>setSubmitted(true)}>Submit Environmental Complaint</button></div>}</SimplePage>}
function SensorsPage(){return <SimplePage eyebrow="INDUSTRIAL SENSOR NETWORK" title="Environmental Sensors" description="Prototype sensor view. Simulated streams are explicitly labelled and must not be presented as verified industrial telemetry." icon={<Radio size={22}/>}><div className="sensor-banner"><span className="status-dot online-dot"/><b>DEMO SENSOR STREAM</b><span>Simulated industrial-zone telemetry</span></div><div className="sensor-grid">{SENSOR_DATA.map(([name,value,unit,status])=><div className="sensor-card" key={name}><span>{name}</span><strong>{value} <small>{unit}</small></strong><b className={`sensor-status ${status.toLowerCase()}`}>{status}</b></div>)}</div></SimplePage>}
function AssistantPage(){const [messages,setMessages]=useState([{role:"assistant",text:"Hi! I can explain the current environmental risk, help you decide what to do, or guide you through filing a complaint."}]);const [input,setInput]=useState("");const send=()=>{const q=input.trim();if(!q)return;setMessages(m=>[...m,{role:"user",text:q},{role:"assistant",text:"I can help with that. For this prototype, I can use the dashboard evidence and guide you to the appropriate hotspot, sensor or citizen-report workflow."}]);setInput("")};return <SimplePage eyebrow="CONVERSATIONAL ENVIRONMENTAL INTELLIGENCE" title="AI Environmental Assistant" description="Personalized guidance plus a direct path to environmental reporting." icon={<Bot size={22}/>}><div className="chat-window">{messages.map((m,i)=><div className={`chat-message ${m.role}`} key={i}><div className="chat-avatar">{m.role==="assistant"?<Bot size={16}/>:<Users size={16}/>}</div><p>{m.text}</p></div>)}</div><div className="chat-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about your local environment…"/><button onClick={send}><Send size={18}/></button></div><div className="quick-prompts"><button onClick={()=>setInput("Why is the air quality changing?")}>Why is the air quality changing?</button><button onClick={()=>setInput("How can I report pollution?")}>How can I report pollution?</button><button onClick={()=>setInput("Is the forecast risky?")}>Is the forecast risky?</button></div></SimplePage>}
function NetworkPage(){return <SimplePage eyebrow="CROSS-BORDER INTELLIGENCE" title="BRICS Environmental Network" description="A shared interface for comparing environmental intelligence across BRICS cities and coordinating response." icon={<Globe2 size={22}/>}><div className="network-grid">{Object.entries(CITIES).map(([city,info])=><div className="network-card" key={city}><span>{info.flag} {info.code}</span><h3>{city}</h3><p>{info.country}</p><b>Connected intelligence node</b></div>)}</div></SimplePage>}
function SettingsPage({theme,setTheme,language,setLanguage,t}){return <SimplePage eyebrow="PREFERENCES" title={t.settings} description="Customize the prototype for your preferred viewing experience." icon={<Settings size={22}/>}><div className="settings-row"><div><b>Appearance</b><span>Switch between dark and light environmental intelligence views.</span></div><button className="theme-switch" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Moon size={17}/>:<Sun size={17}/>} {theme==="dark"?"Dark":"Light"}</button></div><div className="settings-row"><div><b>Language</b><span>UI language for the current prototype.</span></div><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option><option value="od">ଓଡ଼ିଆ</option></select></div></SimplePage>}

function App(){
  const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem("brics_demo_login")==="1");
  const [route,navigate]=useHashRoute();
  const [city,setCity]=useState(()=>localStorage.getItem("brics_city")||"Delhi");
  const [theme,setTheme]=useState(()=>localStorage.getItem("brics_theme")||"dark");
  const [language,setLanguage]=useState(()=>localStorage.getItem("brics_language")||"en");
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(""),[online,setOnline]=useState(false),[sidebarOpen,setSidebarOpen]=useState(false);
  const t=TRANSLATIONS[language]||TRANSLATIONS.en;
  useEffect(()=>{localStorage.setItem("brics_theme",theme);document.documentElement.dataset.theme=theme},[theme]);
  useEffect(()=>localStorage.setItem("brics_language",language),[language]);
  useEffect(()=>localStorage.setItem("brics_city",city),[city]);
  async function fetchPrediction(selected=city){setLoading(true);setError("");try{const response=await fetch(`${API_BASE_URL}/predict/${encodeURIComponent(selected)}`,{cache:"no-store"});if(!response.ok)throw new Error(`API returned HTTP ${response.status}`);const result=await response.json();setData(result);setOnline(true)}catch(e){setOnline(false);setError(e?.message||"Cloud Run API is currently unreachable.")}finally{setLoading(false);setRefreshing(false)}}
  useEffect(()=>{fetchPrediction(city)},[city]);
  const refresh=async()=>{setRefreshing(true);await fetchPrediction(city)};
  const login=()=>{localStorage.setItem("brics_demo_login","1");setLoggedIn(true)};
  const logout=()=>{localStorage.removeItem("brics_demo_login");setLoggedIn(false);navigate("dashboard")};
  if(!loggedIn)return <Login onLogin={login} t={t}/>;
  const page=route||"dashboard";
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?"open":""}`}><div className="sidebar-brand"><div className="logo-placeholder"><Leaf size={27}/></div><div><b>BRICS</b><span>Environmental Intelligence</span></div><button className="mobile-close" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div><nav>{NAV_ITEMS.map(([key,label,Icon])=><button className={page===key?"nav-item active":"nav-item"} key={key} onClick={()=>{navigate(key);setSidebarOpen(false)}}><Icon size={18}/><span>{t[label]}</span></button>)}</nav><div className="sidebar-bottom"><button className={page==="settings"?"nav-item active":"nav-item"} onClick={()=>navigate("settings")}><Settings size={18}/><span>{t.settings}</span></button><button className="nav-item" onClick={logout}><LogOut size={18}/><span>Logout</span></button></div></aside>
    {sidebarOpen&&<button className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <div className="main-shell"><header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}><Menu size={21}/></button><div className="brand"><div className="brand-icon"><Leaf size={25}/><span className="live-dot"/></div><div><h1>BRICS <span>Environmental Intelligence</span></h1><p>Predictive Environmental Early-Warning & Decision Intelligence</p></div></div><div className="header-actions"><div className={`connection ${online?"online":"offline"}`}><span className="status-dot"/><Activity size={16}/>{online?t.live:t.offline}</div><div className="city-select"><MapPin size={16}/><select value={city} onChange={e=>setCity(e.target.value)} aria-label={t.selectCity}>{Object.entries(CITIES).map(([name,info])=><option key={name} value={name}>{info.flag} {name}, {info.country}</option>)}</select><ChevronDown size={15}/></div><button className="icon-button" title="Toggle theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</button><select className="language-select" value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language"><option value="en">EN</option><option value="hi">हि</option><option value="od">ଓ</option></select><button className="refresh-button" onClick={refresh} disabled={refreshing}><RefreshCw size={17} className={refreshing?"spin":""}/>{t.refresh}</button></div></header>
      <main className="dashboard">
        {page==="dashboard"&&<Dashboard city={city} data={data} loading={loading} error={error} online={online} onRefresh={refresh} t={t}/>}
        {page==="hotspots"&&<HotspotsPage data={data}/>} {page==="industries"&&<IndustriesPage/>}
        {page==="reports"&&<ReportsPage/>} {page==="sensors"&&<SensorsPage/>}
        {page==="assistant"&&<AssistantPage/>} {page==="network"&&<NetworkPage/>}
        {page==="settings"&&<SettingsPage theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} t={t}/>}
      </main>
      <footer className="footer"><span>Predictions by XGBoost</span><span>•</span><span>Attribution by SHAP</span><span>•</span><span>Narration by Gemini</span><span>•</span><span>Environmental data via Open-Meteo</span></footer>
    </div>
  </div>;
}
export default App;
