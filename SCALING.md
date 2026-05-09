# SurgeWatch Multi-Hospital Scaling Architecture

## Design Document — Phase 10

> This document outlines the architectural design for scaling SurgeWatch from a single-hospital to a multi-hospital, region-wide operational intelligence platform. **This is a design document only — implementation is deferred.**

---

## Current Foundation

The database schema already includes `hospital_id` on every table, enabling:
- **Tenant isolation**: Every query can be scoped by `hospital_id`
- **Cross-hospital aggregation**: Region-wide dashboards can query across all hospitals
- **Independent operational contexts**: Each hospital has its own protocols, alerts, and risk state

---

## Architecture Vision

```
                    ┌──────────────────────────────────┐
                    │    Regional Command Center        │
                    │    (Cross-hospital aggregation)   │
                    └──────────┬───────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────┴────────┐    ┌────────┴───────┐    ┌────────┴───────┐
│  Hospital A    │    │  Hospital B    │    │  Hospital C    │
│  SHIV-DH       │    │  BLORE-MS      │    │  MANG-DH       │
│                │    │                │    │                │
│ ┌─Connectors─┐ │    │ ┌─Connectors─┐ │    │ ┌─Connectors─┐ │
│ │ EHR/Beds/  │ │    │ │ EHR/Beds/  │ │    │ │ EHR/Beds/  │ │
│ │ Staff/Labs │ │    │ │ Staff/Labs │ │    │ │ Staff/Labs │ │
│ └────────────┘ │    │ └────────────┘ │    │ └────────────┘ │
│ ┌─Intelligence┐│    │ ┌─Intelligence┐│    │ ┌─Intelligence┐│
│ │ Risk Engine │ │    │ │ Risk Engine │ │    │ │ Risk Engine │ │
│ │ Protocols   │ │    │ │ Protocols   │ │    │ │ Protocols   │ │
│ └─────────────┘│    │ └─────────────┘│    │ └─────────────┘│
└────────────────┘    └────────────────┘    └────────────────┘
```

---

## Data Model (Already Implemented)

### Hospital Registry
```sql
-- Already exists in schema.sql
CREATE TABLE hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,  -- 'SHIV-DH', 'BLORE-MS'
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    total_beds INTEGER,
    icu_beds INTEGER,
    er_beds INTEGER
);
```

### Query Isolation Pattern
```javascript
// Every service function already accepts hospitalId
const risk = riskEngine.evaluateRisk(hospitalId);
const protocols = protocolEngine.getProtocols(hospitalId);
const forecasts = forecastService.getForecasts(hospitalId);
```

---

## Future API Changes

### Hospital CRUD
```
POST   /api/hospitals           — Register a new hospital
GET    /api/hospitals           — List all hospitals
GET    /api/hospitals/:id       — Get hospital details
PUT    /api/hospitals/:id       — Update hospital config
DELETE /api/hospitals/:id       — Decommission hospital
```

### Regional Aggregation
```
GET /api/regional/risk          — Risk levels across all hospitals
GET /api/regional/bed-census    — Aggregated bed availability
GET /api/regional/alerts        — Cross-hospital active alerts
GET /api/regional/capacity      — Region-wide capacity report
```

---

## Frontend Changes (Future)

1. **Hospital Selector** — Dropdown in header to switch hospital context
2. **Regional Dashboard** — New mode showing all hospitals on a map
3. **Cross-Hospital Alerts** — Unified alert stream from all hospitals
4. **Capacity Coordination** — "This hospital is full → divert to Hospital B"

---

## Authentication Model (Future)

```
Admin       → All hospitals, all actions
Hospital    → Single hospital, all actions
Operator    → Single hospital, read + acknowledge
Viewer      → Single hospital, read only
Regional    → All hospitals, read + coordinate
```

---

## Implementation Sequence

1. Add hospital CRUD API
2. Add hospital selector to frontend header
3. Add regional aggregation endpoints
4. Build Regional Command Center dashboard
5. Add role-based access control
6. Add inter-hospital coordination (patient transfer protocols)

---

## Key Principle

> The architecture is already multi-hospital-ready. Every table has `hospital_id`, every service function accepts it as a parameter. Scaling is a matter of adding CRUD endpoints and a frontend selector — not a database redesign.
