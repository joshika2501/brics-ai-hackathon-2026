import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, Bot, Building2, Wind,
  CheckCircle2, ChevronDown, ChevronRight, Globe2, Leaf, LogIn, UserRound,
  LogOut, MapPin, Menu, Moon, Radio, RefreshCw, Send, Settings,
  ShieldAlert, Sparkles, Sun, Upload, Users, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import "./App.css";

const API_BASE_URL = "https://brics-environmental-api-neulhenasa-el.a.run.app";

const CITIES = {
  Delhi: { country: "India", code: "IN", flag: "ðŸ‡®ðŸ‡³" },
  Johannesburg: { country: "South Africa", code: "ZA", flag: "ðŸ‡¿ðŸ‡¦" },
  "Sao Paulo": { country: "Brazil", code: "BR", flag: "ðŸ‡§ðŸ‡·" },
};

const TRANSLATIONS = {
  en: { dashboard:"Dashboard", hotspots:"Hotspots", industries:"Industries", reports:"Citizen Reports", sensors:"Sensors", assistant:"AI Assistant", network:"BRICS Network", settings:"Settings", current:"Current PM2.5", forecast:"Forecast +6h", risk:"Risk Level", trend:"Trend", live:"LIVE", offline:"OFFLINE", refresh:"Refresh", predict:"Predict", explain:"Explain", decide:"Decide", selectCity:"Select city", signIn:"Sign In", email:"Email", password:"Password", continueDemo:"Continue as Demo User" },
  hi: { dashboard:"à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡", hotspots:"à¤ªà¥à¤°à¤¦à¥‚à¤·à¤£ à¤¹à¥‰à¤Ÿà¤¸à¥à¤ªà¥‰à¤Ÿ", industries:"à¤‰à¤¦à¥à¤¯à¥‹à¤—", reports:"à¤¨à¤¾à¤—à¤°à¤¿à¤• à¤¶à¤¿à¤•à¤¾à¤¯à¤¤à¥‡à¤‚", sensors:"à¤¸à¥‡à¤‚à¤¸à¤°", assistant:"AI à¤¸à¤¹à¤¾à¤¯à¤•", network:"BRICS à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤•", settings:"à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—à¥à¤¸", current:"à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ PM2.5", forecast:"6 à¤˜à¤‚à¤Ÿà¥‡ à¤•à¤¾ à¤ªà¥‚à¤°à¥à¤µà¤¾à¤¨à¥à¤®à¤¾à¤¨", risk:"à¤œà¥‹à¤–à¤¿à¤® à¤¸à¥à¤¤à¤°", trend:"à¤°à¥à¤à¤¾à¤¨", live:"à¤²à¤¾à¤‡à¤µ", offline:"à¤‘à¤«à¤²à¤¾à¤‡à¤¨", refresh:"à¤°à¤¿à¤«à¥à¤°à¥‡à¤¶", predict:"à¤ªà¥‚à¤°à¥à¤µà¤¾à¤¨à¥à¤®à¤¾à¤¨", explain:"à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾", decide:"à¤¨à¤¿à¤°à¥à¤£à¤¯", selectCity:"à¤¶à¤¹à¤° à¤šà¥à¤¨à¥‡à¤‚", signIn:"à¤¸à¤¾à¤‡à¤¨ à¤‡à¤¨", email:"à¤ˆà¤®à¥‡à¤²", password:"à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡", continueDemo:"à¤¡à¥‡à¤®à¥‹ à¤¯à¥‚à¤œà¤¼à¤° à¤•à¥‡ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤œà¤¾à¤°à¥€ à¤°à¤–à¥‡à¤‚" },
  od: { dashboard:"à¬¡à­à­Ÿà¬¾à¬¸à¬¬à­‹à¬°à­à¬¡", hotspots:"à¬ªà­à¬°à¬¦à­‚à¬·à¬£ à¬¹à¬Ÿà¬¸à­à¬ªà¬Ÿ", industries:"à¬¶à¬¿à¬³à­à¬ª", reports:"à¬¨à¬¾à¬—à¬°à¬¿à¬• à¬…à¬­à¬¿à¬¯à­‹à¬—", sensors:"à¬¸à­‡à¬¨à­à¬¸à¬°", assistant:"AI à¬¸à¬¹à¬¾à­Ÿà¬•", network:"BRICS à¬¨à­‡à¬Ÿà­±à¬°à­à¬•", settings:"à¬¸à­‡à¬Ÿà¬¿à¬‚à¬¸à­", current:"à¬¬à¬°à­à¬¤à­à¬¤à¬®à¬¾à¬¨ PM2.5", forecast:"6 à¬˜à¬£à­à¬Ÿà¬¿à¬† à¬ªà­‚à¬°à­à¬¬à¬¾à¬¨à­à¬®à¬¾à¬¨", risk:"à¬¬à¬¿à¬ªà¬¦ à¬¸à­à¬¤à¬°", trend:"à¬ªà­à¬°à¬¬à­ƒà¬¤à­à¬¤à¬¿", live:"à¬²à¬¾à¬‡à¬­à­", offline:"à¬…à¬«à¬²à¬¾à¬‡à¬¨à­", refresh:"à¬°à¬¿à¬«à­à¬°à­‡à¬¶", predict:"à¬ªà­‚à¬°à­à¬¬à¬¾à¬¨à­à¬®à¬¾à¬¨", explain:"à¬¬à­à­Ÿà¬¾à¬–à­à­Ÿà¬¾", decide:"à¬¨à¬¿à¬·à­à¬ªà¬¤à­à¬¤à¬¿", selectCity:"à¬¸à¬¹à¬° à¬¬à¬¾à¬›à¬¨à­à¬¤à­", signIn:"à¬¸à¬¾à¬‡à¬¨à­ à¬‡à¬¨à­", email:"à¬‡à¬®à­‡à¬²à­", password:"à¬ªà¬¾à¬¸à­±à¬¾à¬°à­à¬¡", continueDemo:"à¬¡à­‡à¬®à­‹ à­Ÿà­à¬œà¬° à¬­à¬¾à¬¬à­‡ à¬œà¬¾à¬°à¬¿ à¬°à¬–à¬¨à­à¬¤à­" }
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
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "””";
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
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const submit=(e)=>{
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="login-card">

        <div className="login-brand">

          <div className="login-logo">
            <img
              src="/brics-logo.svg"
              alt="BRICS India 2026"
            />
          </div>

          <div className="login-brand-text">
            <h1>
              BRICS <span>EcoSphere</span>
            </h1>

            <p>
              Environmental Intelligence
            </p>
          </div>

        </div>

        <div className="login-kicker">
          BRICS 2026 • ENVIRONMENTAL INTELLIGENCE
        </div>

        <h2 className="login-title">
          Predict. Explain. Decide.
        </h2>

        <p className="login-description">
          Environmental early-warning and citizen intelligence platform.
        </p>

        <form onSubmit={submit} className="login-form">

          <label>
            <span>{t.email}</span>

            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>{t.password}</span>

            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            className="login-submit"
          >
            <LogIn size={20}/>
            <span>{t.signIn}</span>
          </button>

        </form>

        <div className="login-divider">
          <span></span>
          <b>OR</b>
          <span></span>
        </div>

        <button
          type="button"
          className="demo-button"
          onClick={onLogin}
        >
          <UserRound size={20}/>
          <span>{t.continueDemo}</span>
        </button>

      </div>
    </div>
  );
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
function Dashboard({ city, data, loading, error, online, onRefresh, t }) {
  const current = Number(data?.current_pm25 ?? 0);
  const predicted = Number(data?.predicted_pm25 ?? 0);
  const change = Number(
    data?.trend?.percentage_change ??
    (current ? ((predicted - current) / current) * 100 : 0)
  );

  const risk = String(
    data?.risk_level ??
    data?.risk?.level ??
    "UNKNOWN"
  ).toUpperCase();

  const trend = String(
    data?.trend?.direction ??
    data?.risk?.trend ??
    "STABLE"
  ).toUpperCase();

  const drivers = data?.drivers || data?.evidence || [];

  const explanation =
    data?.ai_explanation?.explanation ||
    data?.ai_explanation?.situation ||
    "Environmental conditions are being evaluated using current observations, forecast evidence, and model attribution.";

  const decision = data?.decision || {};

  const recommendedActions =
    decision?.actions ||
    ["Continue routine monitoring."];

  const referenceValue =
    data?.brics_context?.reference_value ?? 60;

  const cityInfo = CITIES[city] || {
    country: "India",
    code: "IN"
  };

  /*
   * Build a smooth six-hour trajectory from the current
   * observation to the predicted value.
   */
  const trajectory = Array.from({ length: 7 }, (_, i) => {
    const progress = i / 6;
    const value =
      current + (predicted - current) * progress;

    return {
      hour: i === 0 ? "Now" : `+${i}h`,
      value: Number(value.toFixed(1))
    };
  });

  const riskClass =
    risk === "HIGH"
      ? "risk-high"
      : risk === "MODERATE"
      ? "risk-moderate"
      : "risk-normal";

  return (
    <div className="v0-dashboard">

      {/* =====================================================
          DASHBOARD INTRO
          ===================================================== */}

      <section className="v0-dashboard-intro">

        <div>
          <span className="v0-eyebrow">
            MONITORING
          </span>

          <h2 className="v0-city-title">
            {city}, {cityInfo.country}
          </h2>

          <div className="v0-intelligence-flow">
            <span>Predict</span>
            <b>→</b>
            <span>Explain</span>
            <b>→</b>
            <span>Decide</span>
          </div>

          <div className={`v0-live-status ${online ? "online" : "offline"}`}>
            <span />
            {online ? "LIVE DATA" : "CONNECTING"}
          </div>
        </div>

        <div className="v0-dashboard-status">
          <span className={`v0-status-pill ${online ? "online" : "offline"}`}>
            <i />
            {online ? "LIVE" : "OFFLINE"}
          </span>
        </div>

      </section>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="v0-error">
          <strong>Connection issue</strong>
          <span>{error}</span>

          <button onClick={onRefresh}>
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          TOP 3 CARDS
          ===================================================== */}

      <section className="v0-grid v0-grid-three">

        {/* PM2.5 FORECAST */}

        <article className="v0-card v0-predict-card">

          <div className="v0-card-icon">
            <Wind size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              PREDICT
            </span>

            <h3>
              6-hour PM2.5 Forecast
            </h3>

            {loading ? (
              <div className="v0-loading">
                Loading...
              </div>
            ) : (
              <>
                <div className="v0-big-value">
                  {predicted.toFixed(1)}
                  <small>µg/m³</small>
                </div>

                <div className="v0-divider" />

                <div className="v0-stat-row">
                  <span>Current</span>
                  <strong>
                    {current.toFixed(1)} µg/m³
                  </strong>
                </div>

                <div className="v0-stat-row">
                  <span>Change</span>
                  <strong className={change >= 0 ? "negative-value" : "positive-value"}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </strong>
                </div>

                <div className="v0-stat-row">
                  <span>Trend</span>
                  <strong>{trend}</strong>
                </div>
              </>
            )}

          </div>

        </article>

        {/* ENVIRONMENTAL RISK */}

        <article className={`v0-card v0-risk-card ${riskClass}`}>

          <div className="v0-card-icon">
            <ShieldAlert size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              RISK STATUS
            </span>

            <h3>
              Environmental Risk
            </h3>

            {loading ? (
              <div className="v0-loading">
                Evaluating...
              </div>
            ) : (
              <>
                <div className="v0-risk-value">
                  {risk}
                </div>

                <div className="v0-divider" />

                <div className="v0-risk-change">
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}% change
                </div>
              </>
            )}

          </div>

        </article>

        {/* FORECAST TRAJECTORY */}

        <article className="v0-card v0-chart-card">

          <div className="v0-card-icon">
            <Activity size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              FORECAST TRAJECTORY
            </span>

            <h3>
              Forecast Trajectory
            </h3>

            <div className="v0-chart">
              <ResponsiveContainer width="100%" height={175}>
                <AreaChart data={trajectory}>
                  <defs>
                    <linearGradient
                      id="v0ForecastGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    hide
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(1)} µg/m³`,
                      "PM2.5"
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    strokeWidth={2.5}
                    fill="url(#v0ForecastGradient)"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

        </article>

      </section>

      {/* =====================================================
          EXPLAIN / DECIDE
          ===================================================== */}

      <section className="v0-grid v0-grid-three">

        {/* EXPLANATION */}

        <article className="v0-card v0-explanation-card">

          <div className="v0-card-icon">
            <Bot size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              EXPLAIN
            </span>

            <h3>
              Explanation
            </h3>

            <p>
              {explanation}
            </p>

          </div>

        </article>

        {/* KEY DRIVERS */}

        <article className="v0-card">

          <div className="v0-card-icon">
            <Zap size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              EXPLAIN
            </span>

            <h3>
              Key Drivers
            </h3>

            <div className="v0-drivers">

              {drivers.length > 0 ? (
                drivers.slice(0, 5).map((driver, index) => {

                  const impact = Number(
                    driver?.impact ?? 0
                  );

                  const width = Math.min(
                    Math.max(Math.abs(impact) * 3, 8),
                    100
                  );

                  return (
                    <div
                      className="v0-driver"
                      key={`${driver?.feature || "driver"}-${index}`}
                    >

                      <div className="v0-driver-label">
                        <span>
                          {String(
                            driver?.feature || "Feature"
                          ).replaceAll("_", " ")}
                        </span>

                        <strong>
                          {impact >= 0 ? "+" : ""}
                          {impact.toFixed(2)}
                        </strong>
                      </div>

                      <div className="v0-driver-track">
                        <i style={{ width: `${width}%` }} />
                      </div>

                    </div>
                  );
                })
              ) : (
                <p className="v0-muted">
                  Driver evidence will appear here.
                </p>
              )}

            </div>

          </div>

        </article>

        {/* AUTHORITY DECISION */}

        <article className="v0-card v0-decision-card">

          <div className="v0-card-icon">
            <ShieldAlert size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              DECIDE
            </span>

            <h3>
              Authority Decision
            </h3>

            <p>
              {recommendedActions[0] ||
                "Continue environmental monitoring."}
            </p>

            <button className="v0-action-button">
              View Suggested Actions
              <span>→</span>
            </button>

          </div>

        </article>

      </section>

      {/* =====================================================
          BOTTOM SECTION
          ===================================================== */}

      <section className="v0-grid v0-grid-two">

        {/* REGULATORY */}

        <article className="v0-card v0-regulatory-card">

          <div className="v0-card-icon">
            <Globe2 size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              REGULATORY REFERENCE
            </span>

            <h3>
              BRICS Regulatory Context
            </h3>

            <p>
              Aligned with CPCB National Ambient Air
              Quality Standards.
            </p>

            <p>
              24-hour reference value for PM2.5:
            </p>

            <strong className="v0-reference-value">
              {referenceValue} µg/m³
            </strong>

          </div>

          <div className="v0-map-decoration">
            <Globe2 size={105} />
          </div>

        </article>

        {/* INTELLIGENCE PIPELINE */}

        <article className="v0-card v0-pipeline-card">

          <div className="v0-card-icon">
            <Activity size={25} />
          </div>

          <div className="v0-card-content">

            <span className="v0-eyebrow">
              INTELLIGENCE PIPELINE
            </span>

            <h3>
              Intelligence Pipeline
            </h3>

            <div className="v0-pipeline">

              <div className="v0-pipeline-step">
                <span>◉</span>
                <strong>Data Ingestion</strong>
                <small>Open-Meteo</small>
              </div>

              <i />

              <div className="v0-pipeline-step">
                <span>◉</span>
                <strong>Prediction</strong>
                <small>XGBoost</small>
              </div>

              <i />

              <div className="v0-pipeline-step">
                <span>◉</span>
                <strong>Attribution</strong>
                <small>SHAP</small>
              </div>

              <i />

              <div className="v0-pipeline-step">
                <span>◉</span>
                <strong>Narration</strong>
                <small>Gemini</small>
              </div>

            </div>

          </div>

        </article>

      </section>

    </div>
  );
}

function HotspotsPage({data}) {
  const hotspots=data?.hotspots||[];
  return <SimplePage eyebrow="HYPERLOCAL INTELLIGENCE" title="Pollution Hotspots" description="Estimated spatial risk derived from forecast evidence. These are model estimates, not direct sensor measurements." icon={<MapPin size={22}/>}><div className="map-placeholder"><div className="map-grid"><span className="map-pin p1"><i></i></span><span className="map-pin p2"><i></i></span><span className="map-pin p3"><i></i></span><span className="map-pin p4"><i></i></span><div className="map-label">DELHI • HYPERLOCAL VIEW</div></div></div><div className="hotspot-page-grid">{hotspots.length?hotspots.map(h=><div className={`hotspot-card ${riskClass(h.hotspot_level)}`} key={h.id}><span className="eyebrow">{String(h.zone_type||"ZONE").toUpperCase()}</span><h3>{h.name}</h3><strong>{formatNumber(h.hotspot_score)}<small>/100</small></strong><span>{h.hotspot_level} • {h.estimated?"MODEL ESTIMATE":"OBSERVED"}</span></div>):<div className="empty-state">No hotspot estimates returned by the API.</div>}</div></SimplePage>;
}
function IndustriesPage(){return <SimplePage eyebrow="SOURCE INTELLIGENCE" title="Nearby Industries" description="Industry information is presented for environmental context. A compliance concern must be verified with evidence before being treated as a violation." icon={<Building2 size={22}/>}><div className="industry-list">{INDUSTRIES.map(i=><div className="industry-card" key={i.name}><div className="industry-icon"><Building2 size={22}/></div><div className="industry-main"><h3>{i.name}</h3><span>{i.type} • {i.distance}</span><div className="industry-status"><b>{i.status}</b><span>Sensor {i.sensor}</span></div></div><ChevronRight/></div>)}</div></SimplePage>}
function ReportsPage(){const [submitted,setSubmitted]=useState(false);return <SimplePage eyebrow="CITIZEN INTELLIGENCE" title="Report an Environmental Issue" description="Help authorities investigate pollution events with location, description and supporting evidence." icon={<AlertTriangle size={22}/>} >{submitted?<div className="success-panel"><CheckCircle2 size={34}/><h3>Report submitted</h3><p>Your report has been added to the demonstration incident queue.</p><button className="primary-button" onClick={()=>setSubmitted(false)}>File another report</button></div>:<div className="report-form"><input placeholder="Location or landmark"/><select><option>Air pollution / smoke</option><option>Untreated waste discharge</option><option>Illegal dumping</option><option>Other environmental issue</option></select><textarea rows="5" placeholder="Describe what you observed”¦"/><button className="upload-button"><Upload size={17}/> Attach photo</button><button className="primary-button" onClick={()=>setSubmitted(true)}>Submit Environmental Complaint</button></div>}</SimplePage>}
function SensorsPage(){return <SimplePage eyebrow="INDUSTRIAL SENSOR NETWORK" title="Environmental Sensors" description="Prototype sensor view. Simulated streams are explicitly labelled and must not be presented as verified industrial telemetry." icon={<Radio size={22}/>}><div className="sensor-banner"><span className="status-dot online-dot"/><b>DEMO SENSOR STREAM</b><span>Simulated industrial-zone telemetry</span></div><div className="sensor-grid">{SENSOR_DATA.map(([name,value,unit,status])=><div className="sensor-card" key={name}><span>{name}</span><strong>{value} <small>{unit}</small></strong><b className={`sensor-status ${status.toLowerCase()}`}>{status}</b></div>)}</div></SimplePage>}
function AssistantPage(){const [messages,setMessages]=useState([{role:"assistant",text:"Hi! I can explain the current environmental risk, help you decide what to do, or guide you through filing a complaint."}]);const [input,setInput]=useState("");const send=()=>{const q=input.trim();if(!q)return;setMessages(m=>[...m,{role:"user",text:q},{role:"assistant",text:"I can help with that. For this prototype, I can use the dashboard evidence and guide you to the appropriate hotspot, sensor or citizen-report workflow."}]);setInput("")};return <SimplePage eyebrow="CONVERSATIONAL ENVIRONMENTAL INTELLIGENCE" title="AI Environmental Assistant" description="Personalized guidance plus a direct path to environmental reporting." icon={<Bot size={22}/>}><div className="chat-window">{messages.map((m,i)=><div className={`chat-message ${m.role}`} key={i}><div className="chat-avatar">{m.role==="assistant"?<Bot size={16}/>:<Users size={16}/>}</div><p>{m.text}</p></div>)}</div><div className="chat-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about your local environment”¦"/><button onClick={send}><Send size={18}/></button></div><div className="quick-prompts"><button onClick={()=>setInput("Why is the air quality changing?")}>Why is the air quality changing?</button><button onClick={()=>setInput("How can I report pollution?")}>How can I report pollution?</button><button onClick={()=>setInput("Is the forecast risky?")}>Is the forecast risky?</button></div></SimplePage>}
function NetworkPage(){return <SimplePage eyebrow="CROSS-BORDER INTELLIGENCE" title="BRICS Environmental Network" description="A shared interface for comparing environmental intelligence across BRICS cities and coordinating response." icon={<Globe2 size={22}/>}><div className="network-grid">{Object.entries(CITIES).map(([city,info])=><div className="network-card" key={city}><span>{info.flag} {info.code}</span><h3>{city}</h3><p>{info.country}</p><b>Connected intelligence node</b></div>)}</div></SimplePage>}
function SettingsPage({theme,setTheme,language,setLanguage,t}){return <SimplePage eyebrow="PREFERENCES" title={t.settings} description="Customize the prototype for your preferred viewing experience." icon={<Settings size={22}/>}><div className="settings-row"><div><b>Appearance</b><span>Switch between dark and light environmental intelligence views.</span></div><button className="theme-switch" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Moon size={17}/>:<Sun size={17}/>} {theme==="dark"?"Dark":"Light"}</button></div><div className="settings-row"><div><b>Language</b><span>UI language for the current prototype.</span></div><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">à¤¹à¤¿à¤¨à¥à¤¦à¥€</option><option value="od">à¬“à¬¡à¬¼à¬¿à¬†</option></select></div></SimplePage>}

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
    <aside className={`sidebar ${sidebarOpen?"open":""}`}><div className="sidebar-brand"><div className="logo-placeholder"><img src="/assets/brics-india-2026.svg" alt="BRICS India 2026" /></div><div><b>BRICS EcoSphere</b><span>Environmental Intelligence</span></div><button className="mobile-close" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div><nav>{NAV_ITEMS.map(([key,label,Icon])=><button className={page===key?"nav-item active":"nav-item"} key={key} onClick={()=>{navigate(key);setSidebarOpen(false)}}><Icon size={18}/><span>{t[label]}</span></button>)}</nav><div className="sidebar-bottom"><button className={page==="settings"?"nav-item active":"nav-item"} onClick={()=>navigate("settings")}><Settings size={18}/><span>{t.settings}</span></button><button className="nav-item" onClick={logout}><LogOut size={18}/><span>Logout</span></button></div></aside>
    {sidebarOpen&&<button className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <div className="main-shell"><header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}><Menu size={21}/></button><div className="brand"><div className="brand-icon"><img src="/assets/brics-india-2026.svg" alt="BRICS India 2026" /><span className="live-dot"/></div><div><h1>BRICS <span>EcoSphere</span></h1><p>Predictive Environmental Intelligence</p></div></div><div className="header-actions"><div className={`connection ${online?"online":"offline"}`}><span className="status-dot"/><Activity size={16}/>{online?t.live:t.offline}</div><div className="city-select"><MapPin size={16}/><select value={city} onChange={e=>setCity(e.target.value)} aria-label={t.selectCity}>{Object.entries(CITIES).map(([name,info])=><option key={name} value={name}>
  {info.code} {name}, {info.country}
</option>)}</select><ChevronDown size={15}/></div><button className="icon-button" title="Toggle theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</button><select className="language-select" value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language"><option value="en">EN</option><option value="hi">à¤¹à¤¿</option><option value="od">à¬“</option></select><button className="refresh-button" onClick={refresh} disabled={refreshing}><RefreshCw size={17} className={refreshing?"spin":""}/>{t.refresh}</button></div></header>
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




