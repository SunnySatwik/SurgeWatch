# SurgeWatch: Deep Learning Orchestration & Operational Intelligence

## 1. Architectural Inference Flow
SurgeWatch is an **Inference-First** platform that treats hospital operations as a high-dimensional state-space problem. The architecture is a multi-stage pipeline designed to handle non-linear dependencies between environmental signals and clinical throughput.

### 🧠 The Intelligence Pipeline
1.  **Feature Ingestion (`IntegrationHub.jsx`)**:
    *   Acts as the **Feature Store** for the system.
    *   Consumes multi-modal streams (FHIR, HL7, GPS, REST) via `operationsService.js`.
    *   **Data States**: Raw Telemetry (IoT/DB) → Normalized Buffers.
2.  **State Reconstruction (`riskEngine.js`)**:
    *   Aggregates normalized features into a **Composite Latent State** (Risk Score).
    *   Performs domain-weighted pooling across Bed Occupancy (30%), Admission Trends (20%), and Staffing Stability (20%).
3.  **Causal Reasoning Engine (`intelligenceEngine.js`)**:
    *   Employs a **Deterministic Causal Model** to project "Operational Conditions."
    *   Models the **Covariate Shift** between regional signals (e.g., Bengaluru Monsoon) and hospital intake velocity.
    *   **Inferred States**: Baseline → Strained → Volatile.
4.  **Neural Attribution & Explainability (`SHAPPanel.jsx`)**:
    *   Surfaces **SHAP (SHapley Additive exPlanations)** values to identify the primary drivers of a surge (e.g., "Severe Storm Impact" vs. "Clinical Staff Shortage").
    *   Provides **Model Interpretability**, allowing admins to understand *why* a risk level is critical.
5.  **Actuation & Alerting (`protocolEngine.js`)**:
    *   A **Threshold-Based Policy Engine** that executes interventions based on high-confidence triggers.
    *   **Majority Threshold Logic**: A robust voting mechanism where $\ge 50\%$ feature activation triggers a state transition (e.g., Standby → Active).

---

## 2. Readiness & Protocol Connectivity

### A. Operational Readiness Page
The Readiness page (powered by `OperationalReadiness.jsx`) is the primary interface for **Real-Time State Monitoring**.
*   **Data Consumption**: Aggregates `fetchRisk()` and `fetchOperationalMetrics()` from the backend.
*   **KPI Visualization**: Displays `RiskGauge` (0-100 score), `Bed Census` (real-time occupancy), and `Staffing Status` (nurse-to-patient ratios).
*   **System Link**: Directly feeds into the `ProtocolEngine`. A critical score here (e.g., >80) is the primary trigger for the "Surge Response Control" state.

### B. Surge Protocols Page
The Protocols page (powered by `ProtocolPanel.jsx`) is the **Actuation Layer** of the system.
*   **State Machine**: Manages the lifecycle of protocols (`STANDBY`, `ACTIVE`, `COOLDOWN`).
*   **Trigger Mechanism**: Uses a majority-threshold system. For example, the `CODE_RESP_01` protocol triggers if at least 2 of 4 conditions (ER Occupancy, Lab Positivity, Admissions Trend, Wait Time) are breached.
*   **Alert Feedback**: Every activation/deactivation generates an immutable entry in the `Alerts` table, ensuring a complete audit trail of operational decisions.

---

## 3. Geographic Domain Adaptation (Bengaluru Realism)
The system uses **Geographic Feature Engineering** to specialize its reasoning for the **Bengaluru** metropolitan area.

*   **Spatial Correlation**: The engine models the specific causal relationship between **ORR (Outer Ring Road)** congestion and **Ambulance Diversion** probability.
*   **Metrological Intelligence**: Maps "Monsoon Intensity" to "Trauma Presentation Spikes" (e.g., Indiranagar and Hebbal underpass flooding incidents).
*   **Temporal Anchoring**: The `TemporalEngine.js` provides a **Canonical Time Reference**, ensuring that all predictive windows (e.g., "7-Day Surge Forecast") are synchronized with the session's "Ground Truth" now.

---

## 4. Data Maturity & Integration Matrix

### Data Maturity Levels
| Data State | Source | Processing Level | Integration Point |
| :--- | :--- | :--- | :--- |
| **Raw Telemetry** | IoT / DB | Level 0: Unfiltered | `IntegrationHub` |
| **Engineered Features**| `forecastService.js` | Level 1: Domain-Mapped | `predict.py` |
| **Inferred Intelligence**| XGBoost Model | Level 2: Predictive | `Dashboard UI` |
| **Prescriptive Directives**| `protocolEngine.js` | Level 3: Actuated | `ProtocolPanel` |

### Integration Depth
The system is designed for **Modular Interchangeability**:
*   **ML Decoupling**: The Python XGBoost stack (`ml/`) is decoupled from the Node.js backend. The `predict.py` script can be swapped with a TensorFlow/PyTorch serving endpoint with zero frontend changes.
*   **Database Schema**: The SQLite schema (`backend/db/index.js`) is optimized for time-series feature storage, supporting rapid retraining via `retrain_model.py`.

---

## 5. Critical Files & Contributors

### Core Engines
*   **Risk Engine**: `backend/services/riskEngine.js` — Composite latent state calculation.
*   **Intelligence Engine**: `backend/services/intelligenceEngine.js` — Causal reasoning & scenario logic.
*   **Forecast Service**: `backend/services/forecastService.js` — ML model bridging & feature engineering.
*   **Protocol Engine**: `backend/services/protocolEngine.js` — State-machine for response automation.

### ML Stack
*   **Inference Pipeline**: `ml/predict.py` — The core inference script.
*   **Feature Engineering**: `ml/feature_engineering.py` — Python-side feature transformations.
*   **Model Store**: `ml/model/` — Pre-trained ensemble weights.

### Frontend Orchestration
*   **Command Center**: `frontend/src/components/dashboard/Dashboard.jsx` — 5-mode dashboard controller.
*   **Operational Readiness**: `frontend/src/components/dashboard/OperationalReadiness.jsx` — State monitoring UI.
*   **Protocol Management**: `frontend/src/components/dashboard/ProtocolPanel.jsx` — Intervention actuation UI.
