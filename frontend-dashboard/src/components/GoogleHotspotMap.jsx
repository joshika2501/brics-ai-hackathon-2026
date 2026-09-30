import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const CITY_CENTERS = {
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Johannesburg: { lat: -26.2041, lng: 28.0473 },
  "Sao Paulo": { lat: -23.5505, lng: -46.6333 },
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
  Bhubaneswar: { lat: 20.2961, lng: 85.8245 },
};

function getPosition(hotspot) {
  const lat = Number(hotspot?.latitude ?? hotspot?.lat);
  const lng = Number(hotspot?.longitude ?? hotspot?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function getRiskLevel(hotspot) {
  return String(
    hotspot?.fused_level ||
    hotspot?.hotspot_level ||
    "MODERATE"
  ).toUpperCase();
}

function getRiskColor(level) {
  switch (level) {
    case "CRITICAL":
      return "#dc2626";
    case "VERY HIGH":
    case "VERY_HIGH":
      return "#ea580c";
    case "HIGH":
      return "#f59e0b";
    case "MODERATE":
      return "#eab308";
    case "LOW":
      return "#16a34a";
    default:
      return "#64748b";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createMarkerContent(color, level) {
  const wrapper = document.createElement("div");

  wrapper.style.width = "30px";
  wrapper.style.height = "30px";
  wrapper.style.borderRadius = "50%";
  wrapper.style.background = color;
  wrapper.style.border = "3px solid white";
  wrapper.style.boxShadow = "0 3px 10px rgba(0,0,0,0.35)";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.color = "white";
  wrapper.style.fontSize = "11px";
  wrapper.style.fontWeight = "800";
  wrapper.style.cursor = "pointer";
  wrapper.textContent =
    level === "CRITICAL"
      ? "!"
      : level === "VERY HIGH" || level === "VERY_HIGH"
        ? "!"
        : "•";

  return wrapper;
}

export default function GoogleHotspotMap({ hotspots = [], city }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const initializedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setError("Google Maps API key is not configured.");
        setLoading(false);
        return;
      }

      if (!mapRef.current) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * @googlemaps/js-api-loader v2.x
         *
         * Do NOT use:
         * new Loader(...)
         *
         * v2 uses setOptions() + importLibrary().
         */
        if (!initializedRef.current) {
          setOptions({
            key: apiKey,
            v: "weekly",
          });

          initializedRef.current = true;
        }

        const [{ Map, InfoWindow }, { AdvancedMarkerElement }, { LatLngBounds }] =
  await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("core"),
  ]);
        if (cancelled || !mapRef.current) {
          return;
        }

        const center =
          CITY_CENTERS[city] ||
          CITY_CENTERS.Delhi;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new Map(mapRef.current, {
            center,
            zoom: 11,
            mapId: "DEMO_MAP_ID",
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: "greedy",
          });

          infoWindowRef.current = new InfoWindow();
        }

        const map = mapInstanceRef.current;
        const infoWindow = infoWindowRef.current;

        map.setCenter(center);

        if (markersRef.current.length > 0) {
          markersRef.current.forEach((marker) => {
            marker.map = null;
          });

          markersRef.current = [];
        }

        const validHotspots = hotspots
          .map((hotspot) => ({
            hotspot,
            position: getPosition(hotspot),
          }))
          .filter((item) => item.position !== null);

        if (validHotspots.length === 0) {
          map.setCenter(center);
          map.setZoom(11);
          setLoading(false);
          return;
        }

        const bounds = new LatLngBounds();

        validHotspots.forEach(({ hotspot, position }) => {
          const level = getRiskLevel(hotspot);
          const color = getRiskColor(level);

          const content = createMarkerContent(color, level);

          const marker = new AdvancedMarkerElement({
            map,
            position,
            title: hotspot?.name || "Environmental hotspot",
            content,
            gmpClickable: true,
          });

          marker.addEventListener("gmp-click", () => {
            const name = escapeHtml(
              hotspot?.name || "Environmental hotspot"
            );

            const zone = escapeHtml(
              hotspot?.zone_type || "Environmental zone"
            );

            const fusedScore = Number(
              hotspot?.fused_hotspot_score ??
              hotspot?.hotspot_score
            );

            const modelScore = Number(
              hotspot?.model_hotspot_score
            );

            const citizenScore = Number(
              hotspot?.citizen_evidence_score
            );

            const atmosphericScore = Number(
              hotspot?.atmospheric_evidence_score
            );

            const reports = Number(
              hotspot?.citizen_reports_nearby ?? 0
            );

            const scoreText = Number.isFinite(fusedScore)
              ? fusedScore.toFixed(1)
              : "N/A";

            const modelText = Number.isFinite(modelScore)
              ? modelScore.toFixed(1)
              : "N/A";

            const citizenText = Number.isFinite(citizenScore)
              ? citizenScore.toFixed(1)
              : "N/A";

            const atmosphericText = Number.isFinite(atmosphericScore)
              ? atmosphericScore.toFixed(1)
              : "N/A";

            infoWindow.setContent(`
              <div style="
                width:280px;
                padding:6px;
                font-family:Arial,sans-serif;
                color:#17303b;
              ">
                <div style="
                  font-size:11px;
                  font-weight:800;
                  letter-spacing:0.08em;
                  color:#087f87;
                  margin-bottom:5px;
                ">
                  FUSED ENVIRONMENTAL HOTSPOT
                </div>

                <div style="
                  font-size:18px;
                  font-weight:800;
                  margin-bottom:4px;
                ">
                  ${name}
                </div>

                <div style="
                  font-size:12px;
                  color:#637983;
                  margin-bottom:12px;
                ">
                  ${zone}
                </div>

                <div style="
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  padding:10px;
                  border-radius:10px;
                  background:${color}18;
                  border:1px solid ${color}55;
                  margin-bottom:10px;
                ">
                  <span style="
                    font-size:11px;
                    font-weight:700;
                    color:#637983;
                  ">
                    FUSED RISK
                  </span>

                  <strong style="
                    color:${color};
                    font-size:18px;
                  ">
                    ${escapeHtml(level)}
                  </strong>
                </div>

                <div style="
                  font-size:13px;
                  line-height:1.8;
                ">
                  <div>
                    <b>Fused score:</b> ${scoreText}
                  </div>

                  <div>
                    <b>Model evidence:</b> ${modelText}
                  </div>

                  <div>
                    <b>Citizen evidence:</b> ${citizenText}
                  </div>

                  <div>
                    <b>Atmospheric evidence:</b> ${atmosphericText}
                  </div>

                  <div>
                    <b>Nearby citizen reports:</b> ${reports}
                  </div>
                </div>

                <div style="
                  margin-top:10px;
                  padding-top:8px;
                  border-top:1px solid #dbe7ea;
                  font-size:10px;
                  color:#71858d;
                ">
                  Evidence-fusion signal; not a regulatory
                  or causal source attribution.
                </div>
              </div>
            `);

            infoWindow.open({
              map,
              anchor: marker,
            });
          });

          markersRef.current.push(marker);
          bounds.extend(position);
        });

        if (validHotspots.length === 1) {
          map.setCenter(validHotspots[0].position);
          map.setZoom(12);
        } else {
          map.fitBounds(bounds, 70);
        }

        setLoading(false);
      } catch (err) {
        console.error("GoogleHotspotMap initialization failed:", err);

        if (!cancelled) {
          setError(
            err?.message ||
            "Unable to load Google Maps."
          );
          setLoading(false);
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, [city, hotspots]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid rgba(120,160,170,0.25)",
        background: "#eef4f5",
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(245,250,251,0.88)",
            backdropFilter: "blur(4px)",
            zIndex: 5,
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "white",
              border: "1px solid #c8dce2",
              color: "#17303b",
              fontWeight: 700,
              boxShadow: "0 8px 25px rgba(24,55,68,0.12)",
            }}
          >
            Loading environmental hotspot map...
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(245,250,251,0.94)",
            zIndex: 6,
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              padding: "20px",
              borderRadius: "14px",
              background: "white",
              border: "1px solid #efb5b5",
              color: "#7f1d1d",
              boxShadow: "0 8px 25px rgba(24,55,68,0.12)",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: "6px",
              }}
            >
              Google Maps could not load
            </div>

            <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
              {error}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          zIndex: 4,
          padding: "10px 14px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(200,220,226,0.9)",
          boxShadow: "0 5px 18px rgba(24,55,68,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#087f87",
          }}
        >
          FUSED ENVIRONMENTAL RISK
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#637983",
            marginTop: "3px",
          }}
        >
          {hotspots.length} hotspot{hotspots.length === 1 ? "" : "s"} detected
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: "14px",
          bottom: "14px",
          zIndex: 4,
          padding: "10px 12px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(200,220,226,0.9)",
          boxShadow: "0 5px 18px rgba(24,55,68,0.12)",
          backdropFilter: "blur(8px)",
          fontSize: "11px",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: "7px" }}>
          RISK
        </div>

        {[
          ["CRITICAL", "#dc2626"],
          ["VERY HIGH", "#ea580c"],
          ["HIGH", "#f59e0b"],
          ["MODERATE", "#eab308"],
          ["LOW", "#16a34a"],
        ].map(([label, color]) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "4px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: color,
              }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}