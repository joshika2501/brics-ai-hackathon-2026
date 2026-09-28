import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function getRiskColor(level) {
  const value = String(level || "").toUpperCase();

  if (value.includes("CRITICAL")) return "#dc2626";
  if (value.includes("VERY HIGH")) return "#ef4444";
  if (value.includes("HIGH")) return "#f97316";
  if (value.includes("MODERATE")) return "#eab308";
  return "#22c55e";
}

function getCoordinates(hotspot) {
  const lat = Number(hotspot.latitude);
  const lng = Number(hotspot.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return null;
}

function createMarkerContent(hotspot) {
  const score = Number(
    hotspot.fused_hotspot_score ??
      hotspot.hotspot_score ??
      hotspot.fused_score ??
      0
  );

  const level =
    hotspot.fused_level ||
    hotspot.hotspot_level ||
    hotspot.risk_level ||
    "UNKNOWN";

  const color = getRiskColor(level);

  const element = document.createElement("div");

  element.style.width = "46px";
  element.style.height = "46px";
  element.style.borderRadius = "50%";
  element.style.background = color;
  element.style.border = "4px solid white";
  element.style.boxShadow =
    `0 0 0 7px ${color}33, 0 5px 18px rgba(0,0,0,0.35)`;
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.color = "white";
  element.style.fontSize = "12px";
  element.style.fontWeight = "800";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.cursor = "pointer";
  element.style.transition = "transform 0.2s ease";

  element.textContent = Math.round(score);

  element.addEventListener("mouseenter", () => {
    element.style.transform = "scale(1.15)";
  });

  element.addEventListener("mouseleave", () => {
    element.style.transform = "scale(1)";
  });

  return element;
}

function createInfoWindowContent(hotspot) {
  const score = Number(
    hotspot.fused_hotspot_score ??
      hotspot.hotspot_score ??
      hotspot.fused_score ??
      0
  );

  const mlScore = Number(
    hotspot.model_hotspot_score ??
      hotspot.model_score ??
      hotspot.hotspot_score ??
      0
  );

  const citizenScore = Number(
    hotspot.citizen_evidence_score ?? 0
  );

  const atmosphericScore = Number(
    hotspot.atmospheric_evidence_score ?? 0
  );

  const nearbyReports = Number(
    hotspot.citizen_reports_nearby ?? 0
  );

  const level =
    hotspot.fused_level ||
    hotspot.hotspot_level ||
    hotspot.risk_level ||
    "UNKNOWN";

  const color = getRiskColor(level);

  const evidence = hotspot.citizen_evidence || {};
  const visualAI = evidence.visual_ai || {};

  const eventType =
    visualAI.event_type ||
    evidence.event_type ||
    hotspot.event_type ||
    "NONE";

  const confidence = Number(
    visualAI.confidence || 0
  );

  return `
    <div style="
      width:300px;
      padding:4px;
      font-family:Arial,sans-serif;
      color:#111827;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:12px;
        margin-bottom:10px;
      ">

        <div>
          <div style="
            font-size:11px;
            font-weight:800;
            letter-spacing:0.08em;
            color:#6b7280;
            margin-bottom:4px;
          ">
            AI HOTSPOT
          </div>

          <div style="
            font-size:17px;
            font-weight:800;
            line-height:1.2;
          ">
            ${hotspot.name || "Environmental Hotspot"}
          </div>
        </div>

        <div style="
          min-width:55px;
          text-align:center;
          background:${color};
          color:white;
          border-radius:10px;
          padding:7px 5px;
          font-weight:900;
        ">
          ${score.toFixed(1)}
        </div>

      </div>

      <div style="
        display:inline-block;
        padding:4px 9px;
        border-radius:999px;
        background:${color}22;
        color:${color};
        font-size:11px;
        font-weight:800;
        margin-bottom:12px;
      ">
        ${String(level).toUpperCase()}
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:7px;
        margin-bottom:12px;
      ">

        <div style="
          background:#f3f4f6;
          border-radius:8px;
          padding:8px;
        ">
          <div style="font-size:10px;color:#6b7280;">
            ML MODEL
          </div>
          <strong>${mlScore.toFixed(1)}</strong>
        </div>

        <div style="
          background:#f3f4f6;
          border-radius:8px;
          padding:8px;
        ">
          <div style="font-size:10px;color:#6b7280;">
            CITIZEN
          </div>
          <strong>${citizenScore.toFixed(1)}</strong>
        </div>

        <div style="
          background:#f3f4f6;
          border-radius:8px;
          padding:8px;
        ">
          <div style="font-size:10px;color:#6b7280;">
            ATMOSPHERIC
          </div>
          <strong>${atmosphericScore.toFixed(1)}</strong>
        </div>

        <div style="
          background:#f3f4f6;
          border-radius:8px;
          padding:8px;
        ">
          <div style="font-size:10px;color:#6b7280;">
            REPORTS
          </div>
          <strong>${nearbyReports}</strong>
        </div>

      </div>

      ${
        eventType !== "NONE"
          ? `
            <div style="
              border-top:1px solid #e5e7eb;
              padding-top:10px;
            ">

              <div style="
                font-size:10px;
                color:#6b7280;
                font-weight:700;
              ">
                GEMINI VISION
              </div>

              <div style="
                font-size:13px;
                font-weight:800;
                margin-top:3px;
              ">
                ${eventType}
                ${
                  confidence
                    ? ` • ${(confidence * 100).toFixed(0)}% confidence`
                    : ""
                }
              </div>

            </div>
          `
          : ""
      }

    </div>
  `;
}

export default function GoogleHotspotMap({
  hotspots = [],
  city = "Delhi",
}) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        if (!API_KEY) {
          throw new Error(
            "Google Maps API key is missing. Check your .env file."
          );
        }

        setOptions({
          key: API_KEY,
          v: "weekly",
        });

        const [{ Map }, { AdvancedMarkerElement }] =
          await Promise.all([
            importLibrary("maps"),
            importLibrary("marker"),
          ]);

        if (cancelled || !mapRef.current) return;

        const validHotspots = hotspots
          .map((hotspot) => ({
            hotspot,
            position: getCoordinates(hotspot),
          }))
          .filter((item) => item.position);

        const defaultCenter = {
          lat: 28.6139,
          lng: 77.2090,
        };

        const center =
          validHotspots.length > 0
            ? validHotspots[0].position
            : defaultCenter;

        const map = new Map(mapRef.current, {
          center,
          zoom: validHotspots.length > 1 ? 11 : 12,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });

        markersRef.current.forEach((marker) => {
          marker.map = null;
        });

        markersRef.current = [];

        const infoWindow =
          new google.maps.InfoWindow();

        const bounds =
          new google.maps.LatLngBounds();

        validHotspots.forEach(
          ({ hotspot, position }) => {
            const marker =
              new AdvancedMarkerElement({
                map,
                position,
                title:
                  hotspot.name ||
                  "Environmental hotspot",
                content:
                  createMarkerContent(hotspot),
                gmpClickable: true,
              });

            marker.addEventListener(
              "gmp-click",
              () => {
                infoWindow.setContent(
                  createInfoWindowContent(hotspot)
                );

                infoWindow.open({
                  map,
                  anchor: marker,
                });
              }
            );

            markersRef.current.push(marker);
            bounds.extend(position);
          }
        );

        if (validHotspots.length > 1) {
          map.fitBounds(bounds, 70);
        }

        setLoading(false);
      } catch (err) {
        console.error(
          "Google Maps initialization failed:",
          err
        );

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

      markersRef.current.forEach((marker) => {
        marker.map = null;
      });

      markersRef.current = [];
    };
  }, [hotspots, city]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "520px",
        overflow: "hidden",
        borderRadius: "18px",
        background: "#e5e7eb",
      }}
    >

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "520px",
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
            background: "rgba(255,255,255,0.82)",
            fontWeight: 700,
            color: "#374151",
          }}
        >
          Loading {city} environmental map...
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 18,
            padding: "14px 16px",
            borderRadius: 12,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Google Maps error: {error}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "9px 13px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.94)",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.15)",
          fontSize: 12,
          fontWeight: 800,
          color: "#111827",
          pointerEvents: "none",
        }}
      >
        {city.toUpperCase()} • AI HOTSPOT INTELLIGENCE
      </div>

      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.94)",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.15)",
          fontSize: 11,
          color: "#374151",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            marginBottom: 5,
          }}
        >
          FUSED RISK
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <span>
            <b style={{ color: "#dc2626" }}>●</b>{" "}
            Critical
          </span>

          <span>
            <b style={{ color: "#f97316" }}>●</b>{" "}
            High
          </span>

          <span>
            <b style={{ color: "#eab308" }}>●</b>{" "}
            Moderate
          </span>
        </div>
      </div>

    </div>
  );
}