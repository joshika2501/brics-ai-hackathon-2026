# 🌍 VAYUNET — Environmental Intelligence for India

<p align="center">
  <strong>Turning Environmental Data into Actionable Intelligence.</strong>
</p>

VAYUNET is an AI-powered environmental intelligence platform designed to make environmental monitoring more accessible, predictive, and actionable across India.

It brings together citizen-generated signals, public environmental datasets, atmospheric evidence, geospatial intelligence, and predictive AI to support hyperlocal pollution detection and forecasting.

The vision is to move beyond simply monitoring environmental conditions towards understanding environmental risks and enabling proactive decision-making.

---

## 🚀 Project Overview

Environmental challenges require more than isolated data points. VAYUNET aims to connect multiple environmental information sources through an integrated intelligence platform.

The platform provides an interactive environment to explore pollution hotspots, understand industrial contributions, submit citizen reports, and access AI-assisted environmental insights.

## ✨ Key Features

### 1. Environmental Intelligence Dashboard
- Centralized environmental monitoring interface.
- Environmental insights and key pollution indicators.
- Information designed to support environmental awareness and decision-making.

### 2. Pollution Hotspot Intelligence
- Geographical visualization of environmental hotspots.
- Location-oriented pollution exploration.
- Interactive mapping using Google Maps.

### 3. Industrial Source Intelligence
- Explore industrial sources and their potential environmental impact.
- Support geographical exploration of industrial pollution patterns.

### 4. Citizen Reporting System
- Interface for submitting environmental observations.
- Photograph-based environmental reporting.
- AI-assisted report analysis to support environmental monitoring.

### 5. AI Environmental Assistant
- Conversational interface for environmental queries.
- AI-assisted access to environmental information.
- Powered by Google Gemini.

### 6. Predictive Environmental Intelligence
- Machine learning-based environmental prediction.
- Exploration of pollution trends and hotspot forecasting.
- Integration of environmental datasets to support proactive monitoring.

### 7. Environmental Network
- Dedicated interface for exploring environmental information and connected monitoring capabilities.

---

## 🏗️ System Architecture

VAYUNET follows a frontend-backend-cloud architecture.

```text
                 VAYUNET
                    |
          React + Vite Frontend
                    |
             API Integration
                    |
              FastAPI Backend
                    |
        +-----------+-----------+
        |           |           |
      AI/ML       Gemini      External
     Models        API         APIs
        |           |           |
        +-----------+-----------+
                    |
          Environmental Insights
                    |
             Cloud Infrastructure
             /               \
       Google Cloud Run    Firebase
          Backend          Hosting
```

### Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| Machine Learning | Predictive ML models |
| Generative AI | Google Gemini API |
| Geospatial | Google Maps API, Places API |
| Cloud Backend | Google Cloud Run |
| Hosting | Firebase Hosting |
| Environmental Data | CPCB, data.gov.in and other environmental data sources |

---

## 🔄 Environmental Data Ecosystem

VAYUNET is designed around the integration of multiple environmental information sources:

- Public environmental datasets.
- CPCB and data.gov.in resources.
- Meteorological information.
- Citizen-generated environmental reports.
- Satellite and atmospheric evidence.

Combining these sources provides a foundation for developing more comprehensive environmental intelligence.

---

## ☁️ Deployment

VAYUNET uses Google Cloud and Firebase for its deployment infrastructure.

**Frontend:** Firebase Hosting

**Backend:** Google Cloud Run

**Backend service endpoint:**

```text
https://brics-environmental-api-1071571669263.asia-south1.run.app
```

The existing backend infrastructure retains its original BRICS project service naming.

---

## 💻 Getting Started

### Prerequisites

- Node.js and npm
- Python 3.11+
- Google Cloud account
- Firebase project
- Required API credentials

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Set up the frontend

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the frontend directory and configure the required application settings and API credentials.

Example:

```env
VITE_API_BASE_URL=<YOUR_BACKEND_API_URL>
VITE_GOOGLE_MAPS_API_KEY=<YOUR_MAPS_API_KEY>
VITE_FIREBASE_API_KEY=<YOUR_FIREBASE_API_KEY>
```

Use the actual variable names expected by your application configuration.

Never commit API keys, credentials, service-account files, or private configuration to GitHub.

### 4. Run the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Deploy frontend

```bash
firebase deploy --only hosting:vayunet
```

Backend deployment and configuration are managed separately through Google Cloud Run.

---

## 🧠 Development Approach

VAYUNET is being developed as an evolving independent technology project.

The development process combines:
- Independent application architecture and integration.
- AI/ML and Generative AI implementation.
- Backend API development.
- Cloud infrastructure configuration and deployment.
- AI-assisted frontend prototyping.

AI-assisted tools were used to accelerate the initial UI generation. The interface is an evolving version, with further improvements planned for visual consistency, accessibility, responsiveness, and user experience.

The focus remains on understanding the underlying systems, integrating technologies, and continuously improving the product.

---

## 🛣️ Future Enhancements

- Refine the overall UI/UX and responsive experience.
- Strengthen predictive model performance and validation.
- Expand hyperlocal environmental intelligence.
- Improve citizen-report analysis and verification.
- Enhance environmental data integration.
- Develop more comprehensive forecasting and risk analysis capabilities.

---

## 🎯 Vision

**Environmental intelligence should not only explain what is happening today; it should help us prepare for what may happen tomorrow.**

VAYUNET aims to bridge the gap between environmental data, artificial intelligence, and citizen-driven action.

---

## 👩‍💻 Project Development

**Developed independently by:** Joshika Parijat

Areas of contribution:
- AI/ML and predictive intelligence.
- Backend development and API integration.
- Generative AI integration.
- Google Cloud configuration and deployment.
- Application architecture and system integration.

---

## 🔗 Project Links

- **Live Application:** https://vayunet.web.app


---

<p align="center">
  <strong>VAYUNET — Building Intelligence for a Cleaner Tomorrow. 🌱</strong>
</p>
