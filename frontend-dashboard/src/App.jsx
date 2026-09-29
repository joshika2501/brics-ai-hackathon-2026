import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, Bot, Building2, Wind,
  CheckCircle2, ChevronDown, ChevronRight, Globe2, Leaf, LogIn, UserRound,
  LogOut, MapPin, Menu, Moon, Radio, RefreshCw, Send, Settings,
  ShieldAlert,
  ShieldCheck, Sparkles, Sun, Upload, Users, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import "./App.css";
import GoogleHotspotMap from "./components/GoogleHotspotMap";
import GoogleIndustryMap from "./components/GoogleIndustryMap";

const API_BASE_URL = "https://brics-environmental-api-1071571669263.asia-south1.run.app";

const CITIES = {
  Delhi: { country: "India", code: "IN", flag: "ðŸ‡®ðŸ‡³" },
  Johannesburg: { country: "South Africa", code: "ZA", flag: "ðŸ‡¿ðŸ‡¦" },
  "Sao Paulo": { country: "Brazil", code: "BR", flag: "ðŸ‡§ðŸ‡·" },
};

const TRANSLATIONS = {
  en: { dashboard:"Dashboard", hotspots:"Hotspots", industries:"Industries", reports:"Citizen Reports", sensors:"Sensors", assistant:"AI Assistant", network:"India Environmental Network", settings:"Settings", current:"Current PM2.5", forecast:"Forecast +6h", risk:"Risk Level", trend:"Trend", live:"LIVE", offline:"OFFLINE", refresh:"Refresh", predict:"Predict", explain:"Explain", decide:"Decide", selectCity:"Select city", signIn:"Sign In", email:"Email", password:"Password", continueDemo:"Continue as Demo User" },
  hi: { dashboard:"à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡", hotspots:"à¤ªà¥à¤°à¤¦à¥‚à¤·à¤£ à¤¹à¥‰à¤Ÿà¤¸à¥à¤ªà¥‰à¤Ÿ", industries:"à¤‰à¤¦à¥à¤¯à¥‹à¤—", reports:"à¤¨à¤¾à¤—à¤°à¤¿à¤• à¤¶à¤¿à¤•à¤¾à¤¯à¤¤à¥‡à¤‚", sensors:"à¤¸à¥‡à¤‚à¤¸à¤°", assistant:"AI à¤¸à¤¹à¤¾à¤¯à¤•", network:"India à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤•", settings:"à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—à¥à¤¸", current:"à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ PM2.5", forecast:"6 à¤˜à¤‚à¤Ÿà¥‡ à¤•à¤¾ à¤ªà¥‚à¤°à¥à¤µà¤¾à¤¨à¥à¤®à¤¾à¤¨", risk:"à¤œà¥‹à¤–à¤¿à¤® à¤¸à¥à¤¤à¤°", trend:"à¤°à¥à¤à¤¾à¤¨", live:"à¤²à¤¾à¤‡à¤µ", offline:"à¤‘à¤«à¤²à¤¾à¤‡à¤¨", refresh:"à¤°à¤¿à¤«à¥à¤°à¥‡à¤¶", predict:"à¤ªà¥‚à¤°à¥à¤µà¤¾à¤¨à¥à¤®à¤¾à¤¨", explain:"à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾", decide:"à¤¨à¤¿à¤°à¥à¤£à¤¯", selectCity:"à¤¶à¤¹à¤° à¤šà¥à¤¨à¥‡à¤‚", signIn:"à¤¸à¤¾à¤‡à¤¨ à¤‡à¤¨", email:"à¤ˆà¤®à¥‡à¤²", password:"à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡", continueDemo:"à¤¡à¥‡à¤®à¥‹ à¤¯à¥‚à¤œà¤¼à¤° à¤•à¥‡ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤œà¤¾à¤°à¥€ à¤°à¤–à¥‡à¤‚" },
  od: { dashboard:"à¬¡à­à­Ÿà¬¾à¬¸à¬¬à­‹à¬°à­à¬¡", hotspots:"à¬ªà­à¬°à¬¦à­‚à¬·à¬£ à¬¹à¬Ÿà¬¸à­à¬ªà¬Ÿ", industries:"à¬¶à¬¿à¬³à­à¬ª", reports:"à¬¨à¬¾à¬—à¬°à¬¿à¬• à¬…à¬­à¬¿à¬¯à­‹à¬—", sensors:"à¬¸à­‡à¬¨à­à¬¸à¬°", assistant:"AI à¬¸à¬¹à¬¾à­Ÿà¬•", network:"India à¬¨à­‡à¬Ÿà­±à¬°à­à¬•", settings:"à¬¸à­‡à¬Ÿà¬¿à¬‚à¬¸à­", current:"à¬¬à¬°à­à¬¤à­à¬¤à¬®à¬¾à¬¨ PM2.5", forecast:"6 à¬˜à¬£à­à¬Ÿà¬¿à¬† à¬ªà­‚à¬°à­à¬¬à¬¾à¬¨à­à¬®à¬¾à¬¨", risk:"à¬¬à¬¿à¬ªà¬¦ à¬¸à­à¬¤à¬°", trend:"à¬ªà­à¬°à¬¬à­ƒà¬¤à­à¬¤à¬¿", live:"à¬²à¬¾à¬‡à¬­à­", offline:"à¬…à¬«à¬²à¬¾à¬‡à¬¨à­", refresh:"à¬°à¬¿à¬«à­à¬°à­‡à¬¶", predict:"à¬ªà­‚à¬°à­à¬¬à¬¾à¬¨à­à¬®à¬¾à¬¨", explain:"à¬¬à­à­Ÿà¬¾à¬–à­à­Ÿà¬¾", decide:"à¬¨à¬¿à¬·à­à¬ªà¬¤à­à¬¤à¬¿", selectCity:"à¬¸à¬¹à¬° à¬¬à¬¾à¬›à¬¨à­à¬¤à­", signIn:"à¬¸à¬¾à¬‡à¬¨à­ à¬‡à¬¨à­", email:"à¬‡à¬®à­‡à¬²à­", password:"à¬ªà¬¾à¬¸à­±à¬¾à¬°à­à¬¡", continueDemo:"à¬¡à­‡à¬®à­‹ à­Ÿà­à¬œà¬° à¬­à¬¾à¬¬à­‡ à¬œà¬¾à¬°à¬¿ à¬°à¬–à¬¨à­à¬¤à­" }
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
              src="/vayunet-logo.png"
              alt="VAYUNET — Environmental Intelligence for India"
            />
          </div>

          <div className="login-brand-text">
            <h1>
              VAYUNET <span>Environmental Intelligence</span>
            </h1>

            <p>
              Environmental Intelligence
            </p>
          </div>

        </div>

        <div className="login-kicker">
          ENVIRONMENTAL INTELLIGENCE FOR INDIA
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

  const [showDecisionPanel, setShowDecisionPanel] = useState(false);
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

  const explanationData = data?.ai_explanation?.explanation;

  const explanation =
    typeof explanationData === "string"
      ? explanationData
      : explanationData?.situation ||
        data?.ai_explanation?.situation ||
        explanationData?.headline ||
        data?.ai_explanation?.headline ||
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
          <span className={`v0-status-pill ${online || data ? "online" : "offline"}`}>
            <i />
            {online || data ? "LIVE" : "OFFLINE"}
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

            <button
              className="v0-action-button"
              onClick={() => setShowDecisionPanel(true)}
            >
              View Suggested Actions
              <span>→</span>
            </button>

          </div>

        </article>

      </section>

      {/* =====================================================
          AUTHORITY DECISION PANEL
          ===================================================== */}

      {showDecisionPanel && (
        <div
          className="decision-modal-overlay"
          onClick={() => setShowDecisionPanel(false)}
        >

          <div
            className="decision-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="decision-modal-header">

              <div>

                <span className="v0-eyebrow">
                  DECISION SUPPORT
                </span>

                <h2>
                  Authority Decision
                </h2>

                <p>
                  Recommended actions based on the current environmental assessment.
                </p>

              </div>

              <button
                className="decision-close-button"
                onClick={() => setShowDecisionPanel(false)}
                aria-label="Close decision panel"
              >
                ×
              </button>

            </div>


            <div className="decision-summary-grid">

              <div className="decision-summary-item">

                <span>
                  PRIORITY
                </span>

                <strong className={
                  String(decision?.priority || risk).toLowerCase() === "high"
                    ? "decision-high"
                    : "decision-normal"
                }>
                  {String(decision?.priority || risk).toUpperCase()}
                </strong>

              </div>


              <div className="decision-summary-item">

                <span>
                  CURRENT PM2.5
                </span>

                <strong>
                  {current.toFixed(1)}
                  <small> µg/m³</small>
                </strong>

              </div>


              <div className="decision-summary-item">

                <span>
                  FORECAST +6H
                </span>

                <strong>
                  {predicted.toFixed(1)}
                  <small> µg/m³</small>
                </strong>

              </div>


              <div className="decision-summary-item">

                <span>
                  TREND
                </span>

                <strong>
                  {trend}
                </strong>

              </div>

            </div>


            <div className="decision-section">

              <span className="decision-section-label">
                RECOMMENDED ACTIONS
              </span>

              <div className="decision-actions-list">

                {recommendedActions.length > 0 ? (

                  recommendedActions.map((action, index) => (

                    <div
                      className="decision-action-item"
                      key={index}
                    >

                      <div className="decision-action-number">
                        {index + 1}
                      </div>

                      <div>
                        {action}
                      </div>

                    </div>

                  ))

                ) : (

                  <div className="decision-action-item">
                    <div className="decision-action-number">
                      1
                    </div>

                    <div>
                      Continue environmental monitoring.
                    </div>
                  </div>

                )}

              </div>

            </div>


            <div className="decision-section">

              <span className="decision-section-label">
                VULNERABLE GROUPS
              </span>

              <div className="decision-groups">

                {decision?.vulnerable_groups?.length > 0 ? (

                  decision.vulnerable_groups.map(
                    (group, index) => (
                      <span key={index}>
                        {group}
                      </span>
                    )
                  )

                ) : (

                  <span>
                    Follow appropriate local health guidance during elevated pollution conditions.
                  </span>

                )}

              </div>

            </div>


            <div className="decision-note">

              <ShieldAlert size={17} />

              <p>
                This is a decision-support recommendation generated from
                environmental model evidence. It is not a regulatory determination
                or a substitute for official environmental or health guidance.
              </p>

            </div>


            <div className="decision-modal-footer">

              <button
                className="decision-close-action"
                onClick={() => setShowDecisionPanel(false)}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

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
              India Regulatory Context
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

function HotspotsPage({city}){
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const loadHotspots=async()=>{
    setLoading(true);
    setError("");

    try{
      const response=await fetch(`${API_BASE_URL}/hotspots/${encodeURIComponent(city)}`);
      const payload=await response.json();

      if(!response.ok){
        throw new Error(payload?.detail || "Unable to load hotspot intelligence.");
      }

      setResult(payload?.data || null);
    }catch(err){
      setError(err?.message || "Unable to load hotspot intelligence.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    if(city)loadHotspots();
  },[city]);

  const hotspots=result?.hotspots || [];
  const summary=result?.fusion_summary || {};

  const levelClass=(level)=>{
    const value=String(level || "MONITORING").toLowerCase().replace(/\\s+/g,"-");
    return `hotspot-card ${value}`;
  };

  return (
    <SimplePage
      eyebrow="MULTIMODAL HYPERLOCAL INTELLIGENCE"
      title="Pollution Hotspots"
      description="AI-fused environmental signals combining ML forecasts, citizen observations, Gemini Vision evidence and atmospheric context."
      icon={<MapPin size={22}/>}>

      {loading ? (
        <div className="empty-state">
          Loading multimodal hotspot intelligence...
        </div>
      ) : error ? (
        <div className="empty-state">
          <strong>Hotspot intelligence unavailable</strong>
          <p>{error}</p>
          <button className="primary-button" onClick={loadHotspots}>
            <RefreshCw size={17}/> Retry
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              width: "100%",
              height: "520px",
              marginBottom: "20px",
              borderRadius: "18px",
              overflow: "hidden",
            }}
          >
            <GoogleHotspotMap
              hotspots={hotspots}
              city={city}
            />
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(3,minmax(0,1fr))",
            gap:"12px",
            marginBottom:"18px"
          }}>
            <div className="sensor-card">
              <span>Citizen reports</span>
              <strong>{result?.citizen_report_count ?? 0}</strong>
              <small>{result?.matched_citizen_report_count ?? 0} matched to hotspots</small>
            </div>

            <div className="sensor-card">
              <span>Fusion sources</span>
              <strong>{summary?.evidence_sources?.length || 4}</strong>
              <small>ML + citizen + Gemini + atmosphere</small>
            </div>

            <div className="sensor-card">
              <span>Matching radius</span>
              <strong>{summary?.matching_radius_km ?? 5} km</strong>
              <small>Geospatial evidence matching</small>
            </div>
          </div>

          {hotspots.length ? (
            <div className="hotspot-page-grid">
              {hotspots.map((h)=>(
                <div className={levelClass(h.fused_level)} key={h.id}>
                  <span className="eyebrow">
                    {String(h.zone_type || "ZONE").toUpperCase()}
                  </span>

                  <h3>{h.name}</h3>

                  <div style={{display:"flex",alignItems:"baseline",gap:"6px",margin:"8px 0"}}>
                    <strong style={{fontSize:"32px"}}>
                      {Number(h.fused_hotspot_score ?? h.hotspot_score ?? 0).toFixed(1)}
                    </strong>
                    <small>/100 fused</small>
                  </div>

                  <span>
                    {String(h.fused_level || "MONITORING")} • {h.estimated ? "MODEL + EVIDENCE" : "OBSERVED"}
                  </span>

                  <div style={{marginTop:"16px",display:"grid",gap:"8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span>ML model</span>
                      <strong>{Number(h.model_hotspot_score || 0).toFixed(1)}</strong>
                    </div>

                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span>Citizen evidence</span>
                      <strong>{Number(h.citizen_evidence_score || 0).toFixed(1)}</strong>
                    </div>

                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span>Atmospheric</span>
                      <strong>{Number(h.atmospheric_evidence_score || 0).toFixed(1)}</strong>
                    </div>

                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span>Nearby reports</span>
                      <strong>{h.citizen_reports_nearby || 0}</strong>
                    </div>
                  </div>

                  {h.citizen_evidence?.length > 0 && (
                    <div style={{
                      marginTop:"16px",
                      padding:"12px",
                      borderRadius:"10px",
                      border:"1px solid rgba(255,255,255,0.10)"
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"8px"}}>
                        <Sparkles size={16}/>
                        <strong>Gemini / Citizen Evidence</strong>
                      </div>

                      {h.citizen_evidence.slice(0,2).map((e,index)=>(
                        <div key={e.report_id || index} style={{marginBottom:"8px"}}>
                          <div>
                            <strong>{e.visual_ai?.event_type || e.event_type || "UNKNOWN"}</strong>
                            {e.visual_ai?.confidence != null && (
                              <span> • {Math.round(Number(e.visual_ai.confidence)*100)}% AI confidence</span>
                            )}
                          </div>

                          {e.visual_ai?.potential_environmental_signal && (
                            <small>{e.visual_ai.potential_environmental_signal}</small>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {h.atmospheric_evidence?.evidence && (
                    <div style={{marginTop:"12px"}}>
                      <small>
                        Atmospheric: AOD {Number(h.atmospheric_evidence.evidence.aerosol_optical_depth || 0).toFixed(2)} • PM2.5 {Number(h.atmospheric_evidence.evidence.pm25_context || 0).toFixed(1)}
                      </small>
                    </div>
                  )}

                  <div style={{marginTop:"12px"}}>
                    <small>{h.fusion_method}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No fused hotspot intelligence returned for {city}.
            </div>
          )}
        </>
      )}
    </SimplePage>
  );
}


function IndustriesPage({city}) {
  const [prediction, setPrediction] = useState(null);
  const [hotspotData, setHotspotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getErrorMessage = (value) => {
    if (!value) {
      return "Unable to load source intelligence.";
    }

    if (typeof value === "string") {
      return value;
    }

    if (value instanceof Error) {
      return value.message;
    }

    if (typeof value === "object") {
      return (
        value.message ||
        value.detail ||
        value.error ||
        value.reason ||
        (value.response && value.response.detail) ||
        JSON.stringify(value)
      );
    }

    return String(value);
  };

  const loadIndustryIntelligence = async () => {
    setLoading(true);
    setError("");

    try {
      const encodedCity = encodeURIComponent(city || "Delhi");

      const response = await fetch(
        `${API_BASE_URL}/hotspots/${encodedCity}`,
        {
          cache: "no-store"
        }
      );

      const responseText = await response.text();

      let payload = null;

      try {
        payload = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        throw new Error(
          `Hotspot API returned invalid JSON (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload?.detail ||
            payload?.error ||
            payload
          )
        );
      }

      const normalizedHotspots =
        payload?.data ||
        payload;

      const normalizedPrediction =
        normalizedHotspots?.model_prediction ||
        null;

      if (!normalizedPrediction || typeof normalizedPrediction !== "object") {
        throw new Error("Prediction API returned an empty response.");
      }

      if (!normalizedHotspots || typeof normalizedHotspots !== "object") {
        throw new Error("Hotspot API returned an empty response.");
      }

      setPrediction(normalizedPrediction);
      setHotspotData(normalizedHotspots);

    } catch (err) {
      console.error("Industries intelligence error:", err);
      setPrediction(null);
      setHotspotData(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (city) {
      loadIndustryIntelligence();
    }
  }, [city]);

  const hotspots = Array.isArray(hotspotData?.hotspots)
    ? hotspotData.hotspots
    : [];

  const industrialHotspots = hotspots.filter(
    (item) =>
      String(item?.zone_type || "").toLowerCase() === "industrial"
  );

  const currentPm25 = Number(prediction?.current_pm25 ?? 0);
  const predictedPm25 = Number(prediction?.predicted_pm25 ?? 0);

  const trend =
    prediction?.trend?.direction ||
    prediction?.trend ||
    "UNKNOWN";

  const anomaly =
    prediction?.anomaly?.status ||
    prediction?.anomaly_status ||
    "UNKNOWN";

  const riskClass = (level) =>
    `risk-pill ${String(level || "MONITORING")
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  return (
    <SimplePage
      eyebrow="SOURCE INTELLIGENCE"
      title="Industrial Source Intelligence"
      description="Environmental source-risk intelligence for industrial areas identified from modelled hotspot evidence, atmospheric context and available citizen observations."
      icon={<Building2 size={22}/>}
    >
      {loading ? (
        <div className="empty-state">
          <RefreshCw size={22} className="spin" />
          <strong>Loading source intelligence...</strong>
          <p>
            Combining city prediction and multimodal hotspot evidence.
          </p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertTriangle size={28} />
          <h3>Source intelligence unavailable</h3>
          <p>{error}</p>
          <button
            className="primary-button"
            onClick={loadIndustryIntelligence}
          >
            <RefreshCw size={17} />
            Retry
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "18px" }}><GoogleIndustryMap city={city}/></div>

          <div
            className="sensor-banner"
            style={{ marginBottom: "18px" }}
          >
            <span className="status-dot online-dot" />
            <b>MODEL-BACKED SOURCE INTELLIGENCE</b>
            <span>
              Evidence is fused from prediction, hotspot and atmospheric
              signals.
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,minmax(0,1fr))",
              gap: "12px",
              marginBottom: "18px"
            }}
          >
            <div className="sensor-card">
              <span>Current PM2.5</span>
              <strong>{currentPm25.toFixed(1)}</strong>
              <small>µg/m³</small>
            </div>

            <div className="sensor-card">
              <span>+6h Forecast</span>
              <strong>{predictedPm25.toFixed(1)}</strong>
              <small>µg/m³</small>
            </div>

            <div className="sensor-card">
              <span>Forecast Trend</span>
              <strong>{String(trend).toUpperCase()}</strong>
              <small>Model forecast</small>
            </div>

            <div className="sensor-card">
              <span>Anomaly Status</span>
              <strong>{String(anomaly).toUpperCase()}</strong>
              <small>Model signal</small>
            </div>
          </div>

          <section className="v0-card">
            <div className="v0-card-icon">
              <Building2 size={22} />
            </div>

            <div className="v0-card-content">
              <span className="v0-eyebrow">
                INDUSTRIAL RISK AREAS
              </span>

              <h3>
                {industrialHotspots.length} industrial area
                {industrialHotspots.length === 1 ? "" : "s"} identified
              </h3>

              {industrialHotspots.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={25} />
                  <p>
                    No industrial hotspot records are currently available
                    for {city}.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(280px,1fr))",
                    gap: "14px",
                    marginTop: "16px"
                  }}
                >
                  {industrialHotspots.map((item, index) => {
                    const fused = Number(
                      item?.fused_hotspot_score ??
                      item?.hotspot_score ??
                      0
                    );

                    const modelScore = Number(
                      item?.model_hotspot_score ??
                      item?.hotspot_score ??
                      0
                    );

                    const atmosphericScore = Number(
                      item?.atmospheric_evidence_score ?? 0
                    );

                    const citizenReports = Number(
                      item?.citizen_reports_nearby ?? 0
                    );

                    const level =
                      item?.fused_level ||
                      item?.hotspot_level ||
                      "MONITORING";

                    return (
                      <article
                        key={
                          item?.name ||
                          item?.id ||
                          `industrial-${index}`
                        }
                        className="sensor-card"
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "10px"
                          }}
                        >
                          <div>
                            <span>Industrial area</span>
                            <strong
                              style={{
                                display: "block",
                                marginTop: "5px"
                              }}
                            >
                              {item?.name || "Unnamed industrial area"}
                            </strong>
                          </div>

                          <b className={riskClass(level)}>
                            {String(level).toUpperCase()}
                          </b>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(2,minmax(0,1fr))",
                            gap: "10px",
                            marginTop: "16px"
                          }}
                        >
                          <div>
                            <small>Fused score</small>
                            <strong>{fused.toFixed(1)}</strong>
                          </div>

                          <div>
                            <small>Model score</small>
                            <strong>{modelScore.toFixed(1)}</strong>
                          </div>

                          <div>
                            <small>Atmospheric</small>
                            <strong>
                              {atmosphericScore.toFixed(1)}
                            </strong>
                          </div>

                          <div>
                            <small>Citizen reports</small>
                            <strong>{citizenReports}</strong>
                          </div>
                        </div>

                        {item?.evidence_basis && (
                          <p style={{ marginTop: "14px" }}>
                            <b>Evidence basis:</b>{" "}
                            {Array.isArray(item.evidence_basis)
                              ? item.evidence_basis.join(", ")
                              : String(item.evidence_basis)}
                          </p>
                        )}

                        {item?.atmospheric_context && (
                          <p>
                            <b>Atmospheric context:</b>{" "}
                            {typeof item.atmospheric_context ===
                            "object"
                              ? JSON.stringify(
                                  item.atmospheric_context
                                )
                              : String(item.atmospheric_context)}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section
            className="v0-card"
            style={{ marginTop: "18px" }}
          >
            <div className="v0-card-icon">
              <ShieldAlert size={22} />
            </div>

            <div className="v0-card-content">
              <span className="v0-eyebrow">
                EVIDENCE INTERPRETATION
              </span>

              <h3>How to interpret source-risk signals</h3>

              <p>
                Industrial areas are surfaced using modelled hotspot
                evidence and supporting environmental signals. These
                signals indicate where additional investigation or
                monitoring may be useful.
              </p>

              <p>
                They are <b>not causal source attribution</b> and do not
                establish a regulatory violation by an individual
                facility.
              </p>
            </div>
          </section>

          <div style={{ marginTop: "18px" }}>
            <button
              className="primary-button"
              onClick={loadIndustryIntelligence}
            >
              <RefreshCw size={17} />
              Refresh Intelligence
            </button>
          </div>
        </>
      )}
    </SimplePage>
  );
}

function ReportsPage({city}) {
  const [submitted, setSubmitted] = useState(false);
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("SMOKE");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);

  const normalizeAnalysis = (data) => {
    const outer = data?.analysis || data?.result || data?.data || data || {};
    const a =
      outer?.visual_analysis ||
      outer?.visualAnalysis ||
      outer?.analysis ||
      outer;

    return {
      event_type:
        a?.event_type ||
        a?.eventType ||
        a?.detected_event ||
        a?.detectedEvent ||
        a?.event ||
        "UNKNOWN",
      confidence:
        a?.confidence ??
        a?.ai_confidence ??
        a?.aiConfidence ??
        a?.confidence_score ??
        a?.score ??
        null,
      scene_summary:
        a?.scene_summary ||
        a?.sceneSummary ||
        a?.summary ||
        a?.description ||
        "",
      environmental_signal:
        a?.potential_environmental_signal ||
        a?.environmental_signal ||
        a?.environmentalSignal ||
        a?.signal ||
        a?.environmental_evidence ||
        "",
      visual_evidence:
        Array.isArray(a?.visual_evidence)
          ? a.visual_evidence
          : []
    };
  };

  const analyzePhoto = async () => {
    if (!file) {
      setError("Please attach a photo first.");
      return;
    }
    setError("");
    setAnalyzing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/citizen/analyze-photo", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `Gemini analysis failed: ${response.status}`);
      }
      const normalized = normalizeAnalysis(data);
      setAnalysis(normalized);
      const allowed = ["SMOKE","DUST","BURNING","INDUSTRIAL_EMISSION","HAZE","UNKNOWN"];
      if (allowed.includes(normalized.event_type)) setEventType(normalized.event_type);
    } catch (err) {
      setError(err.message || "Unable to analyze the photo.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Location services are not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocation(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
        setError("");
      },
      () => setError("Please allow location access to submit the report."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitReport = async () => {
    if (!location.trim() || !description.trim()) {
      setError("Please provide a location and description.");
      return;
    }
    if (!coords) {
      setError("Please click 'Use my location' before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("city", city || "Delhi");
      form.append("latitude", String(coords.latitude));
      form.append("longitude", String(coords.longitude));
      form.append("event_type", eventType);
      form.append("description", description);
      form.append("sensor_source", "CITIZEN_WEB_REPORT");
      if (file) form.append("file", file);

      const response = await fetch("/api/citizen/report-with-photo", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `Report submission failed: ${response.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit the report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SimplePage
      eyebrow="CITIZEN INTELLIGENCE"
      title="Report an Environmental Issue"
      description="Help authorities investigate pollution events with location, description and supporting evidence."
      icon={<AlertTriangle size={22}/>}
    >
      {submitted ? (
        <div className="success-panel">
          <CheckCircle2 size={34}/>
          <h3>Report submitted</h3>
          <p>Your report has been added to the demonstration incident queue.</p>
          <button className="primary-button" onClick={() => {
            setSubmitted(false);
            setAnalysis(null);
            setFile(null);
            setPreviewUrl("");
            setDescription("");
            setLocation("");
            setCoords(null);
            setError("");
          }}>
            File another report
          </button>
        </div>
      ) : (
        <div className="report-form">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or landmark"/>

          <button type="button" className="upload-button" onClick={getLocation}>
            <MapPin size={17}/> Use my location
          </button>

          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="SMOKE">Air pollution / smoke</option>
            <option value="DUST">Dust pollution</option>
            <option value="BURNING">Open burning</option>
            <option value="INDUSTRIAL_EMISSION">Industrial emission</option>
            <option value="HAZE">Haze / smog</option>
            <option value="UNKNOWN">Other environmental issue</option>
          </select>

          <textarea rows="5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you observed..."/>

          <label className="upload-button" style={{cursor:"pointer"}}>
            <Upload size={17}/>
            {file ? file.name : "Attach photo"}
            <input
              type="file"
              accept="image/*"
              style={{display:"none"}}
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                setAnalysis(null);
                setError("");
                setPreviewUrl(selected ? URL.createObjectURL(selected) : "");
              }}
            />
          </label>

          {previewUrl && (
            <div style={{marginTop:"12px",borderRadius:"14px",overflow:"hidden",border:"1px solid rgba(255,255,255,.12)",background:"#0d1c26"}}>
              <img
                src={previewUrl}
                alt="Selected environmental evidence"
                style={{width:"100%",maxHeight:"360px",objectFit:"contain",display:"block"}}
              />
            </div>
          )}

          <button type="button" className="upload-button" onClick={analyzePhoto} disabled={!file || analyzing}>
            <Sparkles size={17}/>
            {analyzing ? "Analyzing with Gemini..." : "Analyze Photo with Gemini"}
          </button>

          {analysis && (
            <div className="success-panel" style={{marginTop:"12px",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <Sparkles size={18}/>
                <strong>Gemini Environmental Analysis</strong>
              </div>
              <p><b>Detected event:</b> {analysis.event_type}</p>
              <p><b>Confidence:</b> {
                typeof analysis.confidence === "number"
                  ? `${Math.round(analysis.confidence <= 1 ? analysis.confidence * 100 : analysis.confidence)}%`
                  : analysis.confidence || "N/A"
              }</p>
              {analysis.scene_summary && <p><b>Scene:</b> {analysis.scene_summary}</p>}
              {analysis.environmental_signal && (
                <p>
                  <b>Environmental signal:</b> {analysis.environmental_signal}
                </p>
              )}

              {analysis.visual_evidence?.length > 0 && (
                <div>
                  <p><b>Visual evidence:</b></p>
                  <ul style={{marginTop:"6px", paddingLeft:"22px"}}>
                    {analysis.visual_evidence.map((item, index) => (
                      <li key={index} style={{marginBottom:"5px"}}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="success-panel" style={{marginTop:"12px",textAlign:"left"}}>
              <p>{error}</p>
            </div>
          )}

          <button className="primary-button" onClick={submitReport} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Environmental Complaint"}
          </button>
        </div>
      )}
    </SimplePage>
  );
}

function AssistantPage() {

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi! I'm the VAYUNET Environmental Intelligence Assistant. I can help you understand air quality, PM2.5 forecasts, environmental risk, pollution drivers, hotspots, industries, sensors and recommended actions."
    }
  ]);

  const [input, setInput] = useState("");
  const [city, setCity] = useState("Delhi");
  const [loading, setLoading] = useState(false);

  const askEnvironmentalAssistant = async (question) => {

    const q = question.toLowerCase().trim();

    /*
     * ------------------------------------------------------
     * DOMAIN GUARD
     * ------------------------------------------------------
     */

    const environmentalKeywords = [
      "air",
      "pollution",
      "pollut",
      "pm2.5",
      "pm25",
      "pm10",
      "quality",
      "aqi",
      "environment",
      "environmental",
      "forecast",
      "risk",
      "trend",
      "hotspot",
      "industry",
      "industrial",
      "factory",
      "sensor",
      "smoke",
      "emission",
      "emissions",
      "health",
      "respiratory",
      "weather",
      "wind",
      "humidity",
      "temperature",
      "report",
      "complaint",
      "cpcb",
      "monitor",
      "monitoring",
      "driver",
      "drivers",
      "vulnerable",
      "children",
      "elderly",
      "outdoor",
      "brics",
      "delhi",
      "mumbai",
      "bengaluru",
      "bangalore",
      "kolkata",
      "chennai",
      "hyderabad",
      "johannesburg",
      "moscow",
      "beijing",
      "rio"
    ];

    const isEnvironmental =
      environmentalKeywords.some(keyword =>
        q.includes(keyword)
      );

    if (!isEnvironmental) {
      return {
        text:
          "I'm the VAYUNET Environmental Intelligence Assistant. I can only help with environmental topics such as air quality, PM2.5, pollution forecasts, environmental risk, hotspots, industrial sources, sensors, health precautions and citizen reporting."
      };
    }

    /*
     * ------------------------------------------------------
     * FETCH LIVE ENVIRONMENTAL DATA
     * ------------------------------------------------------
     */

    let data = null;

    try {

      const response = await fetch(
        `${API_BASE_URL}/predict/${encodeURIComponent(city)}`
      );

      if (!response.ok) {
        throw new Error(
          `Environmental API returned ${response.status}`
        );
      }

      data = await response.json();

    } catch (error) {

      return {
        text:
          "I couldn't retrieve the latest environmental data right now. The environmental API may be temporarily unavailable. Please try again in a moment."
      };

    }

    /*
     * ------------------------------------------------------
     * NORMALIZED DATA
     * ------------------------------------------------------
     */

    const current = Number(
      data?.current_pm25 ??
      data?.forecast?.current_pm25 ??
      0
    );

    const predicted = Number(
      data?.predicted_pm25 ??
      data?.forecast?.predicted_pm25 ??
      0
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

    const change = Number(
      data?.trend?.percentage_change ??
      data?.risk?.percentage_change ??
      0
    );

    const drivers =
      data?.drivers ??
      data?.evidence ??
      [];

    const hotspots =
      data?.hotspots ??
      [];

    const actions =
      data?.decision?.actions ??
      [];

    const vulnerableGroups =
      data?.decision?.vulnerable_groups ??
      [];

    const reference =
      Number(
        data?.brics_context?.reference_value ??
        60
      );

    /*
     * ------------------------------------------------------
     * QUESTION INTENTS
     * ------------------------------------------------------
     */

    if (
      q.includes("current") ||
      q.includes("right now") ||
      q.includes("currently") ||
      q.includes("pm2.5") ||
      q.includes("pm25")
    ) {

      return {
        text:
          `For ${city}, the current PM2.5 level is approximately ` +
          `${current.toFixed(1)} µg/m³. The current environmental risk ` +
          `is ${risk}.`
      };

    }

    if (
      q.includes("forecast") ||
      q.includes("predict") ||
      q.includes("next") ||
      q.includes("future")
    ) {

      return {
        text:
          `${city} is forecast to reach approximately ` +
          `${predicted.toFixed(1)} µg/m³ PM2.5 in ` +
          `${data?.forecast_horizon_hours ?? 6} hours. ` +
          `The expected trend is ${trend.toLowerCase()} ` +
          `with a ${Math.abs(change).toFixed(1)}% change from the current level.`
      };

    }

    if (
      q.includes("risk") ||
      q.includes("danger") ||
      q.includes("safe") ||
      q.includes("risky")
    ) {

      return {
        text:
          `The current environmental risk for ${city} is ${risk}. ` +
          `PM2.5 is currently ${current.toFixed(1)} µg/m³ and the ` +
          `forecast is ${predicted.toFixed(1)} µg/m³. ` +
          `The trend is ${trend.toLowerCase()}.`
      };

    }

    if (
      q.includes("trend") ||
      q.includes("changing") ||
      q.includes("change")
    ) {

      const directionText =
        trend === "FALLING"
          ? "improving"
          : trend === "RISING"
          ? "deteriorating"
          : "relatively stable";

      return {
        text:
          `The PM2.5 trend in ${city} is ${trend.toLowerCase()}. ` +
          `The forecast indicates a ${Math.abs(change).toFixed(1)}% ` +
          `change from the current level, suggesting that conditions are ` +
          `${directionText}.`
      };

    }

    if (
      q.includes("driver") ||
      q.includes("why") ||
      q.includes("cause") ||
      q.includes("factor")
    ) {

      if (!drivers.length) {
        return {
          text:
            "No model driver information is currently available."
        };
      }

      const topDrivers = drivers
        .slice(0, 3)
        .map(d => d.feature)
        .join(", ");

      return {
        text:
          `The main model-attributed drivers for the current ` +
          `${city} forecast include ${topDrivers}. ` +
          `These are model evidence variables and should not automatically ` +
          `be interpreted as confirmed pollution sources.`
      };

    }

    if (
      q.includes("hotspot") ||
      q.includes("hot spots") ||
      q.includes("area")
    ) {

      if (!hotspots.length) {
        return {
          text:
            "No hotspot information is currently available."
        };
      }

      const hotspotText = hotspots
        .slice(0, 4)
        .map(
          h =>
            `${h.name} (${String(h.hotspot_level || "MONITORING").toUpperCase()})`
        )
        .join(", ");

      return {
        text:
          `The current priority areas identified around ${city} are: ` +
          `${hotspotText}. These hotspot scores are model-based estimates ` +
          `and should be verified with local monitoring evidence.`
      };

    }

    if (
      q.includes("industry") ||
      q.includes("industrial") ||
      q.includes("factory")
    ) {

      return {
        text:
          `The Industries section is used to identify nearby industrial ` +
          `source-risk areas, their industry classification, location, ` +
          `sensor status and monitoring priority. Industrial proximity ` +
          `supports prioritization but does not by itself prove a pollution violation.`
      };

    }

    if (
      q.includes("sensor") ||
      q.includes("monitoring")
    ) {

      return {
        text:
          `The sensor network is intended to provide environmental ` +
          `observations that complement the prediction model. Sensor ` +
          `readings should be considered alongside PM2.5 forecasts, ` +
          `meteorological conditions and model evidence.`
      };

    }

    if (
      q.includes("health") ||
      q.includes("children") ||
      q.includes("elderly") ||
      q.includes("respiratory") ||
      q.includes("outdoor")
    ) {

      const groups =
        vulnerableGroups.length
          ? vulnerableGroups.join(", ")
          : "people with respiratory sensitivity, children, older adults and outdoor workers";

      return {
        text:
          `For ${city}, the current system priority is ${risk}. ` +
          `People who may require additional precautions include ${groups}. ` +
          `Follow appropriate local health guidance when pollution levels are elevated.`
      };

    }

    if (
      q.includes("what should") ||
      q.includes("what can") ||
      q.includes("recommend") ||
      q.includes("action") ||
      q.includes("do")
    ) {

      if (!actions.length) {
        return {
          text:
            `The current recommendation is to continue environmental ` +
            `monitoring and follow appropriate local health guidance.`
        };
      }

      return {
        text:
          `Based on the current ${city} assessment, recommended actions include: ` +
          actions.join(" ")
      };

    }

    if (
      q.includes("cpcb") ||
      q.includes("reference") ||
      q.includes("standard") ||
      q.includes("limit")
    ) {

      return {
        text:
          `The dashboard uses ${reference.toFixed(0)} µg/m³ as the ` +
          `informational CPCB reference value for the 24-hour PM2.5 context. ` +
          `The model's forecast should not be interpreted as a regulatory ` +
          `24-hour average.`
      };

    }

    if (
      q.includes("report") ||
      q.includes("complaint") ||
      q.includes("pollution event")
    ) {

      return {
        text:
          "You can use the Citizen Reports section to record an environmental observation. Include the location, issue type, severity, description and supporting image evidence when available."
      };

    }

    /*
     * ------------------------------------------------------
     * ENVIRONMENTAL FALLBACK
     * ------------------------------------------------------
     */

    return {
      text:
        `I can help interpret the ${city} environmental data. ` +
        `The current PM2.5 is ${current.toFixed(1)} µg/m³, ` +
        `the 6-hour forecast is ${predicted.toFixed(1)} µg/m³, ` +
        `and the current risk is ${risk}. ` +
        `Try asking me about the forecast, risk, trend, drivers, hotspots, ` +
        `industries, sensors or recommended actions.`
    };

  };


  const send = async () => {

    const question = input.trim();

    if (!question || loading) return;

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text: question
      }
    ]);

    setInput("");
    setLoading(true);

    const result =
      await askEnvironmentalAssistant(question);

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        text: result.text
      }
    ]);

    setLoading(false);
  };


  const askQuickQuestion = (question) => {
    setInput(question);
  };


  return (

    <SimplePage
      eyebrow="CONVERSATIONAL ENVIRONMENTAL INTELLIGENCE"
      title="AI Environmental Assistant"
      description="Ask questions about environmental conditions, forecasts, pollution risks and monitoring evidence."
      icon={<Bot size={22} />}
    >

      <div className="assistant-controls">

        <div className="assistant-city-selector">

          <span>
            CITY
          </span>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option>Delhi</option>
            <option>Mumbai</option>
            <option>Bengaluru</option>
            <option>Kolkata</option>
            <option>Chennai</option>
            <option>Hyderabad</option>
          </select>

        </div>

        <div className="assistant-scope">

          <ShieldCheck size={15} />

          ENVIRONMENTAL SCOPE ONLY

        </div>

      </div>


      <div className="chat-window">

        {messages.map((message, index) => (

          <div
            className={`chat-message ${message.role}`}
            key={index}
          >

            <div className="chat-avatar">

              {message.role === "assistant"
                ? <Bot size={16} />
                : <Users size={16} />
              }

            </div>

            <p>
              {message.text}
            </p>

          </div>

        ))}


        {loading && (

          <div className="chat-message assistant">

            <div className="chat-avatar">
              <Bot size={16} />
            </div>

            <p className="assistant-thinking">
              Analysing environmental data...
            </p>

          </div>

        )}

      </div>


      <div className="chat-input">

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              send();
            }
          }}
          placeholder={`Ask about ${city}'s environment...`}
        />

        <button
          onClick={send}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>

      </div>


      <div className="quick-prompts">

        <button
          onClick={() =>
            askQuickQuestion(
              `What is the current PM2.5 level in ${city}?`
            )
          }
        >
          Current PM2.5
        </button>

        <button
          onClick={() =>
            askQuickQuestion(
              `What is the ${city} forecast?`
            )
          }
        >
          6-hour forecast
        </button>

        <button
          onClick={() =>
            askQuickQuestion(
              `Why is the environmental risk changing in ${city}?`
            )
          }
        >
          Why is risk changing?
        </button>

        <button
          onClick={() =>
            askQuickQuestion(
              `Which hotspots need attention in ${city}?`
            )
          }
        >
          Priority hotspots
        </button>

      </div>

    </SimplePage>
  );
}

function SettingsPage({theme,setTheme,language,setLanguage,t}){return <SimplePage eyebrow="PREFERENCES" title={t.settings} description="Customize the prototype for your preferred viewing experience." icon={<Settings size={22}/>}><div className="settings-row"><div><b>Appearance</b><span>Switch between dark and light environmental intelligence views.</span></div><button className="theme-switch" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Moon size={17}/>:<Sun size={17}/>} {theme==="dark"?"Dark":"Light"}</button></div><div className="settings-row"><div><b>Language</b><span>UI language for the current prototype.</span></div><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">à¤¹à¤¿à¤¨à¥à¤¦à¥€</option><option value="od">à¬“à¬¡à¬¼à¬¿à¬†</option></select></div></SimplePage>}

function SensorsPage({city}) {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const CITY_COORDINATES = {
    Delhi: {lat: 28.6139, lng: 77.2090},
    Johannesburg: {lat: -26.2041, lng: 28.0473},
    "Sao Paulo": {lat: -23.5505, lng: -46.6333},
    Bhubaneswar: {lat: 20.2961, lng: 85.8245},
  };

  const loadSensorData = async () => {
    const coords = CITY_COORDINATES[city] || CITY_COORDINATES.Delhi;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        city,
        lat: String(coords.lat),
        lng: String(coords.lng),
        industry_name: `${city} monitoring network`,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `/api/industry/environment?${params.toString()}`,
        {signal: controller.signal}
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSensorData(await response.json());
    } catch (err) {
      setSensorData(null);
      setError(
        err.name === "AbortError"
          ? "Public sensor request timed out."
          : "Public sensor source is currently unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSensorData();
  }, [city]);

  const sensor = sensorData?.ambient_sensor || {};
  const pollutants = sensor.pollutants || {};
  const live = sensor.status === "LIVE_PUBLIC";

  return (
    <SimplePage
      eyebrow="INDUSTRIAL SENSOR NETWORK"
      title="Environmental Sensors"
      description="Public environmental monitoring evidence is shown when available. No simulated value is presented as verified industrial telemetry."
      icon={<Radio size={22}/>}
    >
      <div className="sensor-banner">
        <span className={`status-dot ${live ? "online-dot" : ""}`} />

        <b>
          {loading
            ? "CHECKING PUBLIC SENSORS"
            : live
              ? "LIVE PUBLIC SENSOR DATA"
              : "PUBLIC SENSOR DATA UNAVAILABLE"}
        </b>

        <span>{city} monitoring network</span>

        <button
          onClick={loadSensorData}
          disabled={loading}
          style={{marginLeft:"auto"}}
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {live ? (
        <>
          <div
            style={{
              marginBottom:"18px",
              padding:"14px 16px",
              border:"1px solid rgba(0,220,255,.2)",
              borderRadius:"12px"
            }}
          >
            <strong>
              {sensor.station || "Public monitoring station"}
            </strong>

            <div style={{marginTop:"6px",fontSize:"12px",opacity:.72}}>
              Source: {sensor.source || "CPCB / data.gov.in"} •{" "}
              {sensor.distance_km ?? "—"} km from city reference point
            </div>

            {sensor.last_update && (
              <div style={{marginTop:"4px",fontSize:"12px",opacity:.72}}>
                Last update: {sensor.last_update}
              </div>
            )}
          </div>

          <div className="sensor-grid">
            {Object.entries(pollutants).map(([name, data]) => (
              <div className="sensor-card" key={name}>
                <span>{name}</span>

                <strong>
                  {data.value} <small>{data.unit}</small>
                </strong>

                <b
                  className={`sensor-status ${
                    data.comparison === "ABOVE_REFERENCE"
                      ? "high"
                      : "normal"
                  }`}
                >
                  {data.comparison === "ABOVE_REFERENCE"
                    ? "ABOVE REFERENCE"
                    : "WITHIN REFERENCE"}
                </b>

                {data.cpcb_reference != null && (
                  <small style={{
                    display:"block",
                    marginTop:"8px",
                    opacity:.65
                  }}>
                    Reference: {data.cpcb_reference} {data.unit}
                  </small>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{
            padding:"16px",
            marginBottom:"18px",
            border:"1px solid rgba(255,180,0,.25)",
            borderRadius:"12px"
          }}>
            <strong>Public source unavailable</strong>

            <div style={{
              marginTop:"6px",
              fontSize:"12px",
              opacity:.72
            }}>
              {error ||
                sensorData?.reason ||
                "No verified public sensor reading is available right now."}
            </div>
          </div>

          <div style={{
            marginBottom:"10px",
            fontSize:"12px",
            opacity:.6
          }}>
            DEMO FALLBACK — simulated values are shown only for interface
            demonstration.
          </div>

          <div className="sensor-grid">
            {SENSOR_DATA.map(([name,value,unit,status]) => (
              <div className="sensor-card" key={name}>
                <span>{name}</span>

                <strong>
                  {value} <small>{unit}</small>
                </strong>

                <b className={`sensor-status ${status.toLowerCase()}`}>
                  DEMO {status}
                </b>
              </div>
            ))}
          </div>
        </>
      )}
    </SimplePage>
  );
}
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
  async function fetchPrediction(selected = city) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/predict/${encodeURIComponent(selected)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const result = await response.json();

      setData(result);
      setOnline(true);
      setError("");

    } catch (e) {
      console.error("Prediction API error:", e);

      if (!data) {
        setOnline(false);
      }

      setError(
        e?.message ||
        "Cloud Run API is currently unreachable."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(()=>{fetchPrediction(city)},[city]);
  const refresh=async()=>{setRefreshing(true);await fetchPrediction(city)};
  const login=()=>{localStorage.setItem("brics_demo_login","1");setLoggedIn(true)};
  const logout=()=>{localStorage.removeItem("brics_demo_login");setLoggedIn(false);navigate("dashboard")};
  if(!loggedIn)return <Login onLogin={login} t={t}/>;
  const page=route||"dashboard";
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?"open":""}`}><div className="sidebar-brand"><div className="logo-placeholder"><img src="/vayunet-logo.png" alt="VAYUNET — Environmental Intelligence for India" /></div><div>
  <b>VAYUNET</b>
  <span>Environmental Intelligence for India</span>
</div><button className="mobile-close" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div><nav>{NAV_ITEMS.map(([key,label,Icon])=><button className={page===key?"nav-item active":"nav-item"} key={key} onClick={()=>{navigate(key);setSidebarOpen(false)}}><Icon size={18}/><span>{t[label]}</span></button>)}</nav><div className="sidebar-bottom"><button className={page==="settings"?"nav-item active":"nav-item"} onClick={()=>navigate("settings")}><Settings size={18}/><span>{t.settings}</span></button><button className="nav-item" onClick={logout}><LogOut size={18}/><span>Logout</span></button></div></aside>
    {sidebarOpen&&<button className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <div className="main-shell"><header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}><Menu size={21}/></button><div className="brand"><div className="brand-icon"><img src="/vayunet-logo.png" alt="VAYUNET — Environmental Intelligence for India" /><span className="live-dot"/></div><div className="brand-text">
  <h1>VAYUNET</h1>
  <p>Environmental Intelligence for India</p>
</div></div><div className="header-actions"><div className={`connection ${online || data ? "online" : "offline"}`}>
  <span className="status-dot"/>
  <Activity size={16}/>
  {online || data ? t.live : t.offline}
</div><div className="city-select"><MapPin size={16}/><select value={city} onChange={e=>setCity(e.target.value)} aria-label={t.selectCity}>{Object.entries(CITIES).map(([name,info])=><option key={name} value={name}>
  {info.code} {name}, {info.country}
</option>)}</select><ChevronDown size={15}/></div><button className="icon-button" title="Toggle theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</button><select className="language-select" value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language"><option value="en">EN</option><option value="hi">à¤¹à¤¿</option><option value="od">à¬“</option></select><button className="refresh-button" onClick={refresh} disabled={refreshing}><RefreshCw size={17} className={refreshing?"spin":""}/>{t.refresh}</button></div></header>
      <main className="dashboard">
        {page==="dashboard"&&<Dashboard city={city} data={data} loading={loading} error={error} online={online} onRefresh={refresh} t={t}/>}
        {page==="hotspots"&&<HotspotsPage city={city}/>} {page==="industries"&&<IndustriesPage city={city}/>}
        {page==="reports"&&<ReportsPage/>} {page==="sensors"&&<SensorsPage city={city}/>}
        {page==="assistant"&&<AssistantPage/>} {page==="network"&&<NetworkPage/>}
        {page==="settings"&&<SettingsPage theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} t={t}/>}
      </main>
      <footer className="footer"><span>Predictions by XGBoost</span><span>•</span><span>Attribution by SHAP</span><span>•</span><span>Narration by Gemini</span><span>•</span><span>Environmental data via Open-Meteo</span></footer>
    </div>
  </div>;
}
export default App;




