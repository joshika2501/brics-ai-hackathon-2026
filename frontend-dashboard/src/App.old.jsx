import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Globe2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wind,
  CloudRain,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL =
  "https://brics-environmental-api-neulhenasa-el.a.run.app";

const CITIES = {
  Delhi: {
    country: "India",
    code: "IN",
    flag: "🇮🇳",
  },
  Johannesburg: {
    country: "South Africa",
    code: "ZA",
    flag: "🇿🇦",
  },
  "Sao Paulo": {
    country: "Brazil",
    code: "BR",
    flag: "🇧🇷",
  },
};

function riskClass(level = "") {
  const value = level.toUpperCase();

  if (value.includes("VERY HIGH")) return "risk-critical";
  if (value.includes("HIGH")) return "risk-high";
  if (value.includes("MODERATE")) return "risk-moderate";
  if (value.includes("LOW")) return "risk-low";

  return "risk-neutral";
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(1);
}

function getTrendDirection(data) {
  const direction =
    data?.trend?.direction ||
    data?.risk?.trend ||
    "STABLE";

  return String(direction).toUpperCase();
}

function TrendIcon({ direction }) {
  if (direction === "RISING") {
    return <ArrowUp size={17} />;
  }

  if (direction === "FALLING" || direction === "DECREASING") {
    return <ArrowDown size={17} />;
  }

  return <Activity size={17} />;
}

function App() {
  const [city, setCity] = useState("Delhi");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const cityInfo = CITIES[city];

  async function checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("API health check failed");
      }

      setApiOnline(true);
      return true;
    } catch {
      setApiOnline(false);
      return false;
    }
  }

  async function fetchPrediction(selectedCity = city) {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/predict/${encodeURIComponent(selectedCity)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || `API returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      setData(result);
      setApiOnline(true);
      setLastUpdated(new Date());
    } catch (err) {
      setApiOnline(false);
      setError(
        err?.message ||
          "Unable to connect to the environmental intelligence API."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshDashboard() {
    setRefreshing(true);

    const healthy = await checkHealth();

    if (healthy) {
      await fetchPrediction(city);
    } else {
      setRefreshing(false);
      setError("Cloud Run API is currently unreachable.");
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchPrediction(city);
  }, [city]);

  const forecast = data?.forecast || {};
  const risk = data?.risk || {};
  const decision = data?.decision || {};
  const brics = data?.brics_context || {};
  const ai = data?.ai_explanation || {};
  const explanation = ai?.explanation || {};

  const predicted =
    data?.predicted_pm25 ??
    forecast?.predicted_pm25 ??
    null;

  const current =
    data?.current_pm25 ??
    forecast?.current_pm25 ??
    null;

  const riskLevel =
    data?.risk_level ||
    risk?.level ||
    "UNKNOWN";

  const trend = getTrendDirection(data);

  const absoluteChange =
    data?.trend?.absolute_change ??
    risk?.absolute_change ??
    null;

  const percentageChange =
    data?.trend?.percentage_change ??
    risk?.percentage_change ??
    null;

  const drivers =
    data?.drivers ||
    data?.evidence ||
    [];

const hotspots = data?.hotspots || [];

  const actions =
    decision?.actions ||
    [];

  const vulnerableGroups =
    decision?.vulnerable_groups ||
    [];

  const chartData = useMemo(() => {
    const currentValue = Number(current);
    const predictedValue = Number(predicted);

    if (
      Number.isFinite(currentValue) &&
      Number.isFinite(predictedValue)
    ) {
      return [
        {
          label: "Now",
          value: currentValue,
        },
        {
          label: "+2h",
          value:
            currentValue +
            (predictedValue - currentValue) * 0.33,
        },
        {
          label: "+4h",
          value:
            currentValue +
            (predictedValue - currentValue) * 0.66,
        },
        {
          label: "+6h",
          value: predictedValue,
        },
      ];
    }

    return [];
  }, [current, predicted]);

  const riskTone = riskClass(riskLevel);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Globe2 size={29} />
            <span className="live-dot" />
          </div>

          <div>
            <h1>
              BRICS <span>Environmental Intelligence</span>
            </h1>
            <p>
              Predictive Environmental Early-Warning & Decision Intelligence
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`connection ${apiOnline ? "online" : "offline"}`}>
            <span className="status-dot" />
            <Activity size={17} />
            {apiOnline ? "LIVE" : "OFFLINE"}
          </div>

          <button
            className="refresh-button"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "spin" : ""}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="monitor-strip">
          <div className="monitor-location">
            <span className="eyebrow">MONITORING</span>
            <strong>
              {cityInfo.flag} {city}, {cityInfo.country}
            </strong>
          </div>

          <div className="updated">
            <span className="eyebrow">LAST UPDATED</span>
            <strong>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"}
            </strong>
          </div>

          <div className="system-flow">
            <span className="flow-active">Predict</span>
            <span>→</span>
            <span className="flow-active">Explain</span>
            <span>→</span>
            <span className="flow-active">Decide</span>
          </div>
        </section>

        <section className="city-selector">
          <div className="selector-label">
            <Globe2 size={19} />
            BRICS CITIES
          </div>

          <div className="city-tabs">
            {Object.entries(CITIES).map(([name, info]) => (
              <button
                key={name}
                className={city === name ? "city-tab active" : "city-tab"}
                onClick={() => setCity(name)}
              >
                <span className="country-code">
                  {info.code}
                </span>
                {name}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={20} />
            <div>
              <strong>Connection issue</strong>
              <p>{error}</p>
            </div>
            <button onClick={refreshDashboard}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <section className="loading-card">
            <div className="loader" />
            <h2>Connecting to Environmental Intelligence...</h2>
            <p>Retrieving live environmental data from Cloud Run.</p>
          </section>
        ) : data ? (
          <>
            <section className="hero-grid">
              <div className="forecast-card glass-card">
                <div className="card-header">
                  <div>
                    <span className="eyebrow">PREDICT</span>
                    <h2>6-hour PM2.5 Forecast</h2>
                  </div>

                  <div className="forecast-icon">
                    <Wind size={23} />
                  </div>
                </div>

                <div className="forecast-number">
                  <strong>{formatNumber(predicted)}</strong>
                  <span>µg/m³</span>
                </div>

                <div className="forecast-meta">
                  <div>
                    <span>Current</span>
                    <strong>{formatNumber(current)} µg/m³</strong>
                  </div>

                  <div>
                    <span>Change</span>
                    <strong>
                      {absoluteChange !== null
                        ? `${absoluteChange > 0 ? "+" : ""}${formatNumber(
                            absoluteChange
                          )}`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Trend</span>
                    <strong className="trend-value">
                      <TrendIcon direction={trend} />
                      {trend}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={`risk-card glass-card ${riskTone}`}>
                <div className="card-header">
                  <div>
                    <span className="eyebrow">RISK STATUS</span>
                    <h2>Environmental Risk</h2>
                  </div>

                  <ShieldAlert size={27} />
                </div>

                <div className="risk-value">
                  {riskLevel}
                </div>

                <div className="risk-summary">
                  <span>
                    {percentageChange !== null
                      ? `${percentageChange > 0 ? "+" : ""}${formatNumber(
                          percentageChange
                        )}% change`
                      : "Forecast assessment"}
                  </span>

                  <span className="risk-trend">
                    <TrendIcon direction={trend} />
                    {trend}
                  </span>
                </div>

                <div className="risk-bar">
                  <div
                    className="risk-bar-fill"
                    style={{
                      width:
                        riskLevel === "VERY HIGH"
                          ? "92%"
                          : riskLevel === "HIGH"
                          ? "72%"
                          : riskLevel === "MODERATE"
                          ? "50%"
                          : "25%",
                    }}
                  />
                </div>
              </div>

              <div className="chart-card glass-card">
                <div className="card-header">
                  <div>
                    <span className="eyebrow">TRAJECTORY</span>
                    <h2>Forecast trajectory</h2>
                  </div>
                  <Activity size={23} />
                </div>

                <div className="chart">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="pmGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="100%"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#718096", fontSize: 12 }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#718096", fontSize: 11 }}
                          width={38}
                        />

                        <Tooltip
                          contentStyle={{
                            background: "#111c26",
                            border: "1px solid #263746",
                            borderRadius: "10px",
                            color: "#fff",
                          }}
                          formatter={(value) => [
                            `${Number(value).toFixed(1)} µg/m³`,
                            "PM2.5",
                          ]}
                        />

                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#20d4d8"
                          strokeWidth={3}
                          fill="url(#pmGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-empty">
                      No trajectory available
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="hotspot-section glass-card">
              <div className="card-header">
                <div>
                  <span className="eyebrow">HYPERLOCAL INTELLIGENCE</span>
                  <h2>Pollution Hotspots</h2>
                  <p className="card-subtitle">
                    Estimated spatial pollution risk based on current
                    environmental conditions and model evidence.
                  </p>
                </div>

                <div className="forecast-icon">
                  <Globe2 size={23} />
                </div>
              </div>

              {hotspots.length === 0 ? (
                <div className="hotspot-empty">
                  <Activity size={20} />
                  <span>No hotspot estimates available.</span>
                </div>
              ) : (
                <div className="hotspot-grid">
                  {hotspots.map((hotspot) => {
                    const level =
                      String(
                        hotspot.hotspot_level || "UNKNOWN"
                      ).toUpperCase();

                    const levelClass =
                      level.includes("VERY HIGH")
                        ? "risk-critical"
                        : level.includes("HIGH")
                        ? "risk-high"
                        : level.includes("MODERATE")
                        ? "risk-moderate"
                        : level.includes("LOW")
                        ? "risk-low"
                        : "risk-neutral";

                    return (
                      <div
                        key={hotspot.id}
                        className={`hotspot-card ${levelClass}`}
                      >
                        <div className="hotspot-card-top">
                          <div>
                            <span className="hotspot-type">
                              {String(
                                hotspot.zone_type || "ZONE"
                              ).toUpperCase()}
                            </span>

                            <h3>{hotspot.name}</h3>
                          </div>

                          <div className="hotspot-score">
                            <strong>
                              {formatNumber(
                                hotspot.hotspot_score
                              )}
                            </strong>
                            <span>/ 100</span>
                          </div>
                        </div>

                        <div className="hotspot-risk-row">
                          <span className="hotspot-risk-label">
                            {level}
                          </span>

                          <span className="hotspot-estimated">
                            {hotspot.estimated
                              ? "MODEL ESTIMATE"
                              : "OBSERVED"}
                          </span>
                        </div>

                        <div className="hotspot-bar">
                          <div
                            className="hotspot-bar-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Number(
                                    hotspot.hotspot_score || 0
                                  )
                                )
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="hotspot-location">
                          <span>
                            Lat:{" "}
                            {Number(
                              hotspot.latitude
                            ).toFixed(4)}
                          </span>

                          <span>
                            Lon:{" "}
                            {Number(
                              hotspot.longitude
                            ).toFixed(4)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="hotspot-disclaimer">
                <AlertTriangle size={16} />
                <span>
                  Hotspot scores are model-derived estimates and
                  should not be interpreted as direct sensor
                  measurements or regulatory determinations.
                </span>
              </div>
            </section>



            <section className="three-column">
              <div className="glass-card intelligence-card">
                <div className="section-title">
                  <div className="title-icon cyan">
                    <Sparkles size={19} />
                  </div>
                  <div>
                    <span className="eyebrow">EXPLAIN</span>
                    <h3>AI Environmental Intelligence</h3>
                  </div>
                </div>

                <div className="ai-status">
                  <span
                    className={
                      ai.status === "generated"
                        ? "generated"
                        : "fallback"
                    }
                  >
                    {ai.status === "generated"
                      ? "GEMINI GENERATED"
                      : "SYSTEM FALLBACK"}
                  </span>

                  {ai.model && (
                    <span>{ai.model}</span>
                  )}
                </div>

                <h4 className="headline">
                  {explanation.headline ||
                    "Environmental forecast explanation unavailable."}
                </h4>

                <p className="body-text">
                  {explanation.situation ||
                    "No explanation available."}
                </p>

                <div className="why-box">
                  <span>WHY IT MATTERS</span>
                  <p>
                    {explanation.why_it_matters ||
                      "Use the forecast alongside current environmental evidence."}
                  </p>
                </div>

                <div className="confidence">
                  <Clock3 size={15} />
                  <span>
                    {explanation.confidence_note ||
                      "Forecasts should be interpreted with appropriate uncertainty."}
                  </span>
                </div>
              </div>

              <div className="glass-card drivers-card">
                <div className="section-title">
                  <div className="title-icon purple">
                    <Zap size={19} />
                  </div>
                  <div>
                    <span className="eyebrow">EVIDENCE</span>
                    <h3>Key Drivers</h3>
                  </div>
                </div>

                <div className="drivers-list">
                  {drivers.length > 0 ? (
                    drivers.slice(0, 6).map((item, index) => {
                      const feature =
                        item?.feature ||
                        item?.name ||
                        `Feature ${index + 1}`;

                      const impact = Number(
                        item?.impact ?? 0
                      );

                      return (
                        <div
                          className="driver"
                          key={`${feature}-${index}`}
                        >
                          <div className="driver-top">
                            <span>
                              {feature.replaceAll("_", " ")}
                            </span>
                            <strong
                              className={
                                impact >= 0
                                  ? "impact-positive"
                                  : "impact-negative"
                              }
                            >
                              {impact >= 0 ? "+" : ""}
                              {impact.toFixed(2)}
                            </strong>
                          </div>

                          <div className="driver-track">
                            <div
                              className="driver-fill"
                              style={{
                                width: `${Math.min(
                                  Math.abs(impact) * 3,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="muted">
                      No driver evidence available.
                    </p>
                  )}
                </div>
              </div>

              <div className="glass-card decision-card">
                <div className="section-title">
                  <div className="title-icon orange">
                    <ShieldAlert size={19} />
                  </div>
                  <div>
                    <span className="eyebrow">DECIDE</span>
                    <h3>Authority Decision</h3>
                  </div>
                </div>

                <div className="priority">
                  <span>PRIORITY</span>
                  <strong>
                    {decision.priority || "MONITOR"}
                  </strong>
                </div>

                <div className="action-list">
                  <span className="list-heading">
                    RECOMMENDED ACTIONS
                  </span>

                  {actions.length > 0 ? (
                    actions.slice(0, 4).map((action, index) => (
                      <div className="action" key={index}>
                        <CheckCircle2 size={16} />
                        <span>
                          {typeof action === "string"
                            ? action
                            : action?.action ||
                              action?.description ||
                              JSON.stringify(action)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="action">
                      <CheckCircle2 size={16} />
                      <span>
                        Follow the system priority and continue monitoring.
                      </span>
                    </div>
                  )}
                </div>

                {vulnerableGroups.length > 0 && (
                  <div className="vulnerable">
                    <div>
                      <Users size={16} />
                      <span>VULNERABLE GROUPS</span>
                    </div>

                    <p>
                      {vulnerableGroups.join(" • ")}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="bottom-grid">
              <div className="glass-card brics-card">
                <div className="section-title">
                  <div className="title-icon green">
                    <Globe2 size={19} />
                  </div>
                  <div>
                    <span className="eyebrow">BRICS CONTEXT</span>
                    <h3>Regulatory Reference</h3>
                  </div>
                </div>

                <div className="brics-content">
                  <div>
                    <span>REFERENCE</span>
                    <strong>
                      {brics.regulatory_reference ||
                        "National ambient air quality reference"}
                    </strong>
                  </div>

                  <div>
                    <span>REFERENCE VALUE</span>
                    <strong>
                      {brics.reference_value ?? "—"}
                      {brics.reference_value !== undefined
                        ? " µg/m³"
                        : ""}
                    </strong>
                  </div>

                  <div>
                    <span>PERIOD</span>
                    <strong>
                      {brics.reference_period || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>COMPARISON</span>
                    <strong>
                      {brics.comparison || "—"}
                    </strong>
                  </div>
                </div>

                <p className="regulatory-note">
                  {brics.note ||
                    "Regulatory comparisons are informational only. Model forecasts are not regulatory averages."}
                </p>
              </div>

              <div className="glass-card system-card">
                <div className="section-title">
                  <div className="title-icon blue">
                    <Activity size={19} />
                  </div>
                  <div>
                    <span className="eyebrow">SYSTEM</span>
                    <h3>Intelligence Pipeline</h3>
                  </div>
                </div>

                <div className="pipeline">
                  <div className="pipeline-step active">
                    <span>01</span>
                    <strong>Predict</strong>
                    <small>XGBoost</small>
                  </div>

                  <div className="pipeline-line" />

                  <div className="pipeline-step active">
                    <span>02</span>
                    <strong>Explain</strong>
                    <small>SHAP + Gemini</small>
                  </div>

                  <div className="pipeline-line" />

                  <div className="pipeline-step active">
                    <span>03</span>
                    <strong>Decide</strong>
                    <small>Risk Engine</small>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        <footer>
          <span>
            Predictions by XGBoost
          </span>
          <span>•</span>
          <span>
            Attribution by SHAP
          </span>
          <span>•</span>
          <span>
            Narration by Gemini
          </span>
          <span>•</span>
          <span>
            Environmental data via Open-Meteo
          </span>
          <span>•</span>
          <span>
            Regulatory comparisons are informational only
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
