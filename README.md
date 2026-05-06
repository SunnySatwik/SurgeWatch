<div align="center">
<img width="1200" height="475" alt="SurgeWatch Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ⚡ SurgeWatch
### Premium Healthcare Operational Intelligence & Predictive Surge Modeling

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Express-blue)](https://github.com/SunnySatwik/SurgeWatch)
[![Interface](https://img.shields.io/badge/UI-Vision%20Glassmorphism-purple)](https://github.com/SunnySatwik/SurgeWatch)
[![Intelligence](https://img.shields.io/badge/Engine-Scenario%20Lab%202.0-emerald)](https://github.com/SunnySatwik/SurgeWatch)

</div>

---

## 🚀 The Vision
SurgeWatch is a next-generation operational intelligence platform designed for high-density healthcare systems (specifically modeled for the **Bengaluru healthcare ecosystem**). It transforms raw environmental and logistical data into actionable, causal intelligence for hospital administrators and emergency teams.

Unlike static dashboards, SurgeWatch uses a non-linear **Operational State Layer** to predict not just *what* will happen, but *why* and *how* it will cascade through hospital resources.

---

## 💎 Key Features Implemented

### 🧠 1. Centralized Operational Intelligence Engine
The brain of SurgeWatch (`scenarioEngine.js`) processes complex variables into a unified operational state:
- **Non-linear Interaction Modeling**: Correlates disparate signals (e.g., Heavy Rain + Traffic Peak = Critical Staff Delay).
- **Operational Conditions Layer**: Infers high-level states like *ICU Saturation Risk*, *Ambulance Flow Degradation*, and *Triage Pressure*.
- **Confidence Reasoning**: Transparently explains the uncertainty in forecasts based on data volatility.

### 🧪 2. Scenario Lab (Predictive Simulator)
A dedicated workspace for "What-If" modeling:
- **Multidimensional Variables**: Adjust Weather, Traffic, Crowd Density, Viral Activity, and Staffing on the fly.
- **Real-time Impact Assessment**: Instantly visualize how changes affect the **Operational Stress Index (OSI)** and Surge Probabilities.
- **Regional Context**: Specific logic for Bengaluru-specific corridors (Silk Board, ORR) and waterlogging risk profiles.

### 📜 3. AI Executive Briefing System
Synthesizes complex simulation data into professional intelligence reports:
- **Multi-Modal Analysis**: Tailored briefings for *Executive Leadership*, *Clinical Ops*, *Emergency Response*, and *Public Health*.
- **Cascading Consequence Timelines**: Generates a causal sequence of events (e.g., Transit failure leads to staffing gaps, which leads to intake backlogs).
- **Briefing Playback**: High-quality Text-to-Speech synthesis for hands-free intelligence consumption.
- **Premium Controls**: Smooth-scrolling window with quick-jump navigation and audio stop/play.

### ⛅ 4. Weather Intelligence (Healthcare Optimized)
A location-aware system that goes beyond simple forecasts:
- **Medical Correlation**: Analyzes weather for healthcare risks (e.g., high humidity → respiratory OP spikes; extreme heat → dehydration triage).
- **Day/Night Awareness**: Visuals and icons (Sun/Moon) adapt dynamically to the time of day, including darkened premium gradients.
- **Backend Orchestration**: Proxied via a dedicated Express server for stable geocoding, reverse-lookup, and caching.

### 🎨 5. Premium VisionOS Aesthetic
- **Bento Grid Layout**: Content-driven independent heights for a sophisticated dashboard feel.
- **Glassmorphism**: High-density data visualization using `vision-glass` utilities and ambient glows.
- **Micro-animations**: Powered by `motion/react` for fluid, believable UI transitions.

---

## 🛠️ Architecture & Tech Stack

### Frontend (React + Vite)
- **Styling**: Vanilla CSS with a custom Design System tokens + Tailwind for layout.
- **Animation**: `motion/react` (formerly Framer Motion).
- **Icons**: `lucide-react`.
- **Speech**: Native Web Speech API.

### Backend (Node.js + Express)
- **Orchestration**: Centralized API layer for Weather and Geocoding.
- **Caching**: TTL-based in-memory caching to improve speed and prevent API rate-limits.
- **Normalization**: Ensures consistent data shapes regardless of the upstream provider (Open-Meteo, Nominatim, etc.).

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SunnySatwik/SurgeWatch.git
   cd SurgeWatch
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   npm run start
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the platform:**
   Open `http://localhost:3000` (or the port specified in your console).

---

## 📍 Regional Modeling (Bengaluru)
SurgeWatch includes specialized intelligence for the **Bengaluru metropolitan area**, accounting for:
- **Traffic Corridors**: Silk Board, Outer Ring Road, and Electronic City logistics.
- **Monsoon Dynamics**: Waterlogging-driven staff delays and trauma spikes during heavy precipitation.
- **Viral Signals**: Seasonal respiratory tracking specific to the region's climate patterns.

---

<div align="center">
Built with ❤️ for the future of Healthcare Operations.
</div>
