from pathlib import Path

p = Path(r"frontend-dashboard\src\App.jsx")
s = p.read_text(encoding="utf-8-sig")

start = s.find("function SensorsPage(){")
end = s.find("\nfunction App(", start)

if start == -1:
    raise SystemExit("ERROR: SensorsPage start not found")

if end == -1:
    raise SystemExit("ERROR: function App marker not found")

new_sensor_page = r'''function SensorsPage({city}) {
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
}'''

s = s[:start] + new_sensor_page + s[end:]

old_route = '{page==="reports"&&<ReportsPage/>} {page==="sensors"&&<SensorsPage/>}'
new_route = '{page==="reports"&&<ReportsPage/>} {page==="sensors"&&<SensorsPage city={city}/>}'
    
if old_route not in s:
    raise SystemExit("ERROR: Sensors route not found")

s = s.replace(old_route, new_route, 1)

p.write_text(s, encoding="utf-8")

print("OK: SensorsPage upgraded")
print("OK: SensorsPage receives selected city")
print("OK: One public sensor request per city")