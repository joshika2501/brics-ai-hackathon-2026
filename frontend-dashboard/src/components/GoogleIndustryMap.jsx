import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const CITY_CENTERS = {
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Johannesburg: { lat: -26.2041, lng: 28.0473 },
  "Sao Paulo": { lat: -23.5505, lng: -46.6333 },
};

const SEARCH_RADIUS_METERS = 5000;

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function BuildingIcon() {
  return (
    <span aria-hidden="true" style={{ fontSize: "22px" }}>
      🏭
    </span>
  );
}

export default function GoogleIndustryMap({ city = "Delhi" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingLocation, setUsingLocation] = useState(false);
  const [environmentData, setEnvironmentData] = useState({});

  const searchPlaces = async (center) => {
    setLoading(true);
    setError("");

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        throw new Error(
          "VITE_GOOGLE_MAPS_API_KEY is missing from the frontend environment."
        );
      }

      setOptions({
        key: apiKey,
        v: "weekly",
      });

      

      const [{ Map, InfoWindow }, { AdvancedMarkerElement, PinElement }, { Place }] =
        await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("places"),
        ]);

      let map = mapInstanceRef.current;

      if (!map) {
        map = new Map(mapRef.current, {
          center,
          zoom: 12,
          mapId: "DEMO_MAP_ID",
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new InfoWindow();
      } else {
        map.setCenter(center);
        map.setZoom(12);
      }

      markersRef.current.forEach((marker) => {
        marker.map = null;
      });

      markersRef.current = [];

      const request = {
        fields: [
          "displayName",
          "location",
          "formattedAddress",
          "primaryType",
          "primaryTypeDisplayName",
          "types",
          "googleMapsURI",
        ],
        locationRestriction: {
          center,
          radius: SEARCH_RADIUS_METERS,
        },
        includedPrimaryTypes: ["manufacturer", "supplier"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
      };

      const result = await Place.searchNearby(request);
      const foundPlaces = result?.places || [];

      const normalized = foundPlaces
        .filter((place) => place.location)
        .map((place) => {
          const location = {
            lat:
              typeof place.location.lat === "function"
                ? place.location.lat()
                : place.location.lat,
            lng:
              typeof place.location.lng === "function"
                ? place.location.lng()
                : place.location.lng,
          };

          return {
            id:
              place.id ||
              `${location.lat}-${location.lng}-${place.displayName?.text}`,
            name:
              place.displayName?.text ||
              place.displayName ||
              "Unnamed industrial business",
            address:
              place.formattedAddress ||
              "Address unavailable",
            type:
              place.primaryTypeDisplayName?.text ||
              place.primaryTypeDisplayName ||
              place.primaryType ||
              "Industrial business",
            uri: place.googleMapsURI || "",
            location,
            distanceKm: distanceKm(center, location),
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setPlaces(normalized);
            normalized.forEach((place) => {
        const pin = new PinElement({
          glyph: "🏭",
          scale: 1.05,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position: place.location,
          title: place.name,
          content: pin.element,
        });

        marker.addListener("click", () => {
          const mapsLink = place.uri
            ? `<a href="${place.uri}" target="_blank" rel="noopener noreferrer">View on Google Maps →</a>`
            : "";

          infoWindowRef.current.setContent(`
            <div style="max-width:300px;padding:6px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.4;">
              <strong style="font-size:15px;color:#111827;display:block;line-height:1.35;">${place.name}</strong>
              <div style="margin-top:5px;color:#4b5563;font-size:12px;">
                ${place.type}
              </div>
              <div style="margin-top:7px;font-size:12px;">
                $<span style={{ wordBreak: "normal", overflowWrap: "break-word" }}>{place.address}</span>
              </div>
              <div style="margin-top:7px;color:#111827;font-weight:600;font-size:12px;">
                ${place.distanceKm.toFixed(1)} km from search center
              </div>
              <div style="margin-top:8px;font-size:12px;">
                ${mapsLink}
              </div>
            </div>
          `);

          infoWindowRef.current.open({
            map,
            anchor: marker,
          });
        });

        markersRef.current.push(marker);
      });
    } catch (err) {
      console.error("Google industry search failed:", err);
      setPlaces([]);

      setError(
        err?.message ||
          "Google Places could not return nearby industrial businesses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const center = CITY_CENTERS[city] || CITY_CENTERS.Delhi;
    searchPlaces(center);

    return () => {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });

      markersRef.current = [];
    };
  }, [city]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not available.");
      return;
    }

    setUsingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        searchPlaces(center).finally(() => {
          setUsingLocation(false);
        });
      },
      () => {
        setUsingLocation(false);
        setError(
          "Location permission was not available. Using the selected city instead."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  return (
    <div style={{ width: "100%", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "520px",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            zIndex: 5,
            background: "rgba(8,20,29,.94)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "12px",
            padding: "10px 12px",
            color: "white",
            fontSize: "12px",
          }}
        >
          <strong>REAL-WORLD INDUSTRY SEARCH</strong>
          <div style={{ opacity: 0.7, marginTop: 3 }}>
            5 km radius • Google Places
          </div>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={usingLocation}
          style={{
            position: "absolute",
            right: "14px",
            top: "14px",
            zIndex: 5,
            border: "0",
            borderRadius: "10px",
            padding: "10px 13px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {usingLocation ? "Locating..." : "📍 Use My Location"}
        </button>
      </div>

      <div style={{ marginTop: "14px" }}>
        {loading ? (
          <div className="empty-state">
            Searching for nearby manufacturers and suppliers...
          </div>
        ) : error ? (
          <div className="empty-state">
            <strong>Industry search unavailable</strong>
            <p>{error}</p>
          </div>
        ) : places.length === 0 ? (
          <div className="empty-state">
            <strong>No nearby industrial businesses found</strong>
            <p>
              No Google Places results matched manufacturer/supplier
              categories within 5 km.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(260px,1fr))",
              gap: "12px",
            }}
          >
            {places.map((place) => (
              <div
                key={place.id}
                
                style={{ padding: "16px", minWidth: 0, overflow: "hidden", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", wordBreak: "normal", overflowWrap: "break-word" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div>
                    <strong style={{ display: "block", minWidth: 0, lineHeight: 1.35, wordBreak: "normal", overflowWrap: "break-word", fontSize: "15px" }}>{place.name}</strong>

                    <div
                      style={{
                        marginTop: "5px",
                        opacity: 0.7,
                        fontSize: "13px",
                      }}
                    >
                      {place.type}
                    </div>
                  </div>

                  <BuildingIcon />
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.75,
                    margin: "10px 0 6px",
                  }}
                >
                  <span style={{ wordBreak: "normal", overflowWrap: "break-word" }}>{place.address}</span>
                </p>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {place.distanceKm.toFixed(1)} km from search center
                </div>
                {environmentData[place.id] && (() => {
                  const env = environmentData[place.id];
                  const sensor = env.ambient_sensor || {};
                  const pollutants = sensor.pollutants || {};
                  return (
                    <div style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: "rgba(0,0,0,.04)" }}>
                      <strong style={{ fontSize: "13px" }}>📡 Environmental Evidence</strong>
                      <div style={{ marginTop: "7px", fontSize: "12px" }}>
                        <b>Ambient sensor:</b> {sensor.status === "LIVE_PUBLIC" ? "LIVE PUBLIC" : "UNAVAILABLE"}
                      </div>
                      {sensor.station && (
                        <div style={{ marginTop: "4px", fontSize: "12px" }}>
                          Station: {sensor.station} • {sensor.distance_km} km away
                        </div>
                      )}
                      {sensor.status === "LIVE_PUBLIC" && Object.keys(pollutants).length > 0 ? (
                        <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "4px" }}>
                          {Object.entries(pollutants).map(([name, data]) => (
                            <div key={name} style={{ fontSize: "11px" }}>
                              <b>{name}</b>: {data.value} {data.unit}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.7 }}>
                          Public sensor reading currently unavailable.
                        </div>
                      )}
                      <div style={{ marginTop: "8px", fontSize: "11px", opacity: 0.7 }}>
                        🏭 Facility monitoring: {env.facility_monitoring?.status || "UNAVAILABLE"}
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.7 }}>
                        ☣️ Waste/toxin measurements: {env.waste?.status || "UNAVAILABLE"}
                      </div>
                    </div>
                  );
                })()}

                {place.uri && (
                  <a
                    href={place.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                    }}
                  >
                    View on Google Maps →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}