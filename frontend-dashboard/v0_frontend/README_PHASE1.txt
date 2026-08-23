BRICS Environmental Intelligence — Phase 1 Frontend

This package replaces the current frontend shell with:
- v0-inspired dark/light dashboard
- persistent theme toggle
- city dropdown
- hash-based multi-page navigation (no react-router dependency)
- basic demo login
- AI Assistant page
- citizen report page
- industries page
- sensor page
- BRICS network page
- settings/language page
- existing Cloud Run prediction endpoint integration
- existing XGBoost/SHAP/Gemini/Open-Meteo dashboard data fields

IMPORTANT:
1. Keep your existing main.jsx.
2. Keep lucide-react and recharts dependencies.
3. Add the official BRICS India 2026 logo asset as src/assets/brics-2026-logo.svg.
4. The current shell uses a Leaf icon as a temporary logo placeholder until the official asset is inserted.
5. New industry/sensor/report/chat data are clearly prototype/demo UI and should not be presented as verified real-world evidence.
