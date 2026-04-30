export const DASHBOARD_DATA = [
  {
    day: "Mon",
    date: "May 1",
    load: 65,
    expectedPatients: 142,
    confidence: 98,
    risk: "Medium",
    riskColor: "text-yellow-400",
    shap: [
      { factor: "Local Festival (Lead-in)", value: 15, type: "negative" },
      { factor: "Historic HMIS Trend", value: 25, type: "negative" },
      { factor: "Weather: High Humidity", value: 10, type: "negative" },
      { factor: "IDSP Sentinel Data", value: -12, type: "positive" },
      { factor: "Discharge Efficiency", value: -8, type: "positive" }
    ],
    recommendations: [
      "Mobilize on-call staffing pool for ER triage",
      "Sync with ICU for elective clearance",
      "Ready ambulatory overflow units"
    ],
    departments: [
      { name: "Emergency", load: 78, status: "Critical", color: "bg-red-500" },
      { name: "ICU", load: 45, status: "Stable", color: "bg-green-500" },
      { name: "Pediatrics", load: 62, status: "Warning", color: "bg-yellow-500" },
      { name: "Radiology", load: 88, status: "Critical", color: "bg-red-500" }
    ]
  },
  {
    day: "Tue",
    date: "May 2",
    load: 72,
    expectedPatients: 158,
    confidence: 96,
    risk: "High",
    riskColor: "text-orange-500",
    shap: [
      { factor: "HMIS Monday Backlog", value: 18, type: "negative" },
      { factor: "Regional IDSP Spike", value: 32, type: "negative" },
      { factor: "Predicted Heat Event", value: 14, type: "negative" },
      { factor: "Mobile Health Units", value: -15, type: "positive" },
      { factor: "Step-down Velocity", value: -5, type: "positive" }
    ],
    recommendations: [
      "Initiate resource coordination with North Sector",
      "Review bed turnaround time targets",
      "Deploy secondary nursing supervisor"
    ],
    departments: [
      { name: "Emergency", load: 85, status: "Critical", color: "bg-red-500" },
      { name: "ICU", load: 52, status: "Stable", color: "bg-green-500" },
      { name: "Pediatrics", load: 70, status: "Warning", color: "bg-yellow-500" },
      { name: "Radiology", load: 92, status: "Critical", color: "bg-red-500" }
    ]
  },
  {
    day: "Wed",
    date: "May 3",
    load: 85,
    expectedPatients: 194,
    confidence: 94,
    risk: "Critical",
    riskColor: "text-red-500",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
    shap: [
      { factor: "Weather: Severe Storm", value: 28, type: "negative" },
      { factor: "Major Public Gathering", value: 42, type: "negative" },
      { factor: "Seasonal Viral Trend", value: 22, type: "negative" },
      { factor: "Pre-Shift Coordination", value: -10, type: "positive" },
      { factor: "Centralized Bed Mgmt", value: -14, type: "positive" }
    ],
    recommendations: [
      "Enable Surge Capacity Phase II",
      "Full staff recall for critical units",
      "Suspend non-essential imaging tasks"
    ],
    departments: [
      { name: "Emergency", load: 98, status: "Extreme", color: "bg-red-600" },
      { name: "ICU", load: 88, status: "Critical", color: "bg-red-500" },
      { name: "Pediatrics", load: 82, status: "Critical", color: "bg-red-500" },
      { name: "Radiology", load: 96, status: "Extreme", color: "bg-red-600" }
    ]
  },
  {
    day: "Thu",
    date: "May 4",
    load: 78,
    expectedPatients: 171,
    confidence: 92,
    risk: "High",
    riskColor: "text-orange-500",
    shap: [
      { factor: "Peak Surge Carry-over", value: 22, type: "negative" },
      { factor: "Local Event (Day 2)", value: 18, type: "negative" },
      { factor: "IDSP Cluster Warning", value: 12, type: "negative" },
      { factor: "Discharge Optimization", value: -25, type: "positive" },
      { factor: "Relief Team Deployment", value: -10, type: "positive" }
    ],
    recommendations: [
      "Target discharges before 11:00 AM",
      "Assign relief rotation for ER teams",
      "Audit surgical unit throughput"
    ],
    departments: [
      { name: "Emergency", load: 74, status: "Warning", color: "bg-yellow-500" },
      { name: "ICU", load: 82, status: "Critical", color: "bg-red-500" },
      { name: "Pediatrics", load: 68, status: "Warning", color: "bg-yellow-500" },
      { name: "Radiology", load: 84, status: "Critical", color: "bg-red-500" }
    ]
  },
  {
    day: "Fri",
    date: "May 5",
    load: 62,
    expectedPatients: 135,
    confidence: 95,
    risk: "Moderate",
    riskColor: "text-yellow-400",
    shap: [
      { factor: "Weekend Admissions", value: 12, type: "negative" },
      { factor: "HMIS Baseline Growth", value: 8, type: "negative" },
      { factor: "Minor Event Signal", value: 5, type: "negative" },
      { factor: "Capacity Recovery", value: -20, type: "positive" },
      { factor: "Staffing Re-alignment", value: -15, type: "positive" }
    ],
    recommendations: [
      "Review weekend staffing buffer",
      "Prepare inventory restock plans",
      "Brief department leads on recovery"
    ],
    departments: [
      { name: "Emergency", load: 58, status: "Stable", color: "bg-green-500" },
      { name: "ICU", load: 64, status: "Warning", color: "bg-yellow-500" },
      { name: "Pediatrics", load: 52, status: "Stable", color: "bg-green-500" },
      { name: "Radiology", load: 60, status: "Stable", color: "bg-green-500" }
    ]
  },
  {
    day: "Sat",
    date: "May 6",
    load: 54,
    expectedPatients: 118,
    confidence: 97,
    risk: "Low",
    riskColor: "text-green-400",
    shap: [
      { factor: "Routine Volume", value: 10, type: "negative" },
      { factor: "Weather: Clear Skies", value: -12, type: "positive" },
      { factor: "HMIS Stable Zone", value: -15, type: "positive" },
      { factor: "Maintenance Mode", value: -8, type: "positive" },
      { factor: "Flow Optimization", value: -5, type: "positive" }
    ],
    recommendations: [
      "Routine operational cadence",
      "Infrastructure safety audit",
      "Restock localized care points"
    ],
    departments: [
      { name: "Emergency", load: 48, status: "Stable", color: "bg-green-500" },
      { name: "ICU", load: 54, status: "Stable", color: "bg-green-500" },
      { name: "Pediatrics", load: 42, status: "Stable", color: "bg-green-500" },
      { name: "Radiology", load: 45, status: "Stable", color: "bg-green-500" }
    ]
  },
  {
    day: "Sun",
    date: "May 7",
    load: 58,
    expectedPatients: 126,
    confidence: 98,
    risk: "Low",
    riskColor: "text-green-400",
    shap: [
      { factor: "Monday Prep Load", value: 15, type: "negative" },
      { factor: "HMIS Prediction Cycle", value: 8, type: "negative" },
      { factor: "IDSP Quiet Signal", value: -10, type: "positive" },
      { factor: "Efficiency Guardrails", value: -12, type: "positive" },
      { factor: "Low Event Activity", value: -5, type: "positive" }
    ],
    recommendations: [
      "Monday readiness briefing",
      "Staff rotation handovers",
      "Capacity audit for Week 19"
    ],
    departments: [
      { name: "Emergency", load: 52, status: "Stable", color: "bg-green-500" },
      { name: "ICU", load: 58, status: "Stable", color: "bg-green-500" },
      { name: "Pediatrics", load: 48, status: "Stable", color: "bg-green-500" },
      { name: "Radiology", load: 50, status: "Stable", color: "bg-green-500" }
    ]
  }
];
