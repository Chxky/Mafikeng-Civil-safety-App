# Mahikeng Civic Safety PWA

> The definitive civic super-app for Mahikeng, North West Province, South Africa — a single digital platform connecting residents, businesses, and government for infrastructure reporting, community safety, emergency response, service delivery, and disaster resilience.

**Author:** Pardon Mahara  
**License:** Source-Available (c) 2026 — All Rights Reserved  
**Location:** Mahikeng, North West Province, South Africa  
**Compliance:** POPI Act (Protection of Personal Information Act, 2013)

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000 — runs in demo mode with mock data
npm test             # 43 tests across 3 test files
npm run build        # Production build in dist/
```

The app works fully in **demo mode** without any configuration. Add `.env` values to connect to Supabase, Africa's Talking, and other services.

---

## The Problem

Mahikeng, the capital of South Africa's North West Province, faces severe challenges: raw sewage spills flowing into yards, chronic water shortages, potholes damaging vehicles, broken streetlights leaving neighborhoods in darkness, power outages with no communication, illegal dumping on vacant lots, and crime that residents have lost trust in SAPS to address. The SAHRC found thousands of learners deprived of school transport, widespread use of unroadworthy vehicles, and over R1 billion paid for services never rendered. The municipality held its inaugural Disaster Management Summit in 2025, acknowledging the need to shift from reactive to proactive disaster management.

**This app is the answer.** Not a prototype — a working, installable Progressive Web App built specifically for the people of Mahikeng.

---

## Modules (10 Integrated Modules)

### 1. Civic Infrastructure Reporting

Report infrastructure problems with geotagged photos, status tracking, and offline queuing.

- **Categories:** Pothole, Water Leak, Sewage, Streetlight, Electricity, Illegal Dumping, Housing, Other
- **Flow:** Select category → fill details + capture photos → submit (or save offline) → auto-routed to responsible municipal department → track status (Pending → Acknowledged → In Progress → Resolved)
- **Features:** GPS auto-detection, Nominatim reverse geocoding, photo compression, offline draft saving, automatic department routing, department notifications

### 2. SOS & Community Safety

Emergency SOS, anonymous safety feed, and live crime map.

- **SOS Button:** One-tap (3-second hold) or discreet triple-tap. Sends GPS to emergency contacts via SMS, triggers siren alarm, vibrates device, pushes notifications
- **Safety Feed:** Anonymous incident reporting with community verification (confirm/flag). Types: Suspicious Activity, Theft, Vandalism, Assault, Break-in, Car Theft, Drug Activity, Noise
- **Crime Map:** Leaflet map with color-coded markers, heatmap hotspots, location fuzzing for privacy (~111m grid)

### 3. Neighbourhood Watch Toolkit

Community patrol management with real-time coordination.

- Patrol groups with live GPS location sharing
- End-to-end encrypted group chat (Supabase Realtime)
- Emergency button alerting all parents on a route
- Step-by-step CPF registration guide
- Community Leaders directory (Ward Councillors, CPF, Safety Forums, Patrol Leaders)

### 4. Mahikeng Power — Electricity Outage Intelligence

Real-time load shedding schedules, outage reporting, and business continuity alerts.

- **EskomSePush Integration:** Current stage display, daily schedule timeline, tomorrow's preview, 15-minute reminders
- **Outage Reporting:** Scheduled (Load Shedding), Unscheduled (Fault), Unknown — with estimated restoration time
- **Business Continuity Alerts:** Register business → set alert radius (1-5km) → get push + SMS when outages reported nearby
- **Live Outage Map:** Color-coded markers (red=fault, orange=load shedding, yellow=unknown) with community confirmation
- **Vehicle Permit Check:** Public lookup by registration — permit status, roadworthiness, driver PrDP

### 5. Mahikeng EduTrans — School Transport Tracking & Safety

Addressing systemic failures in North West Province's scholar transport system (SAHRC Investigative Report, January 2026).

- **Parent Features:** Register child → live map tracking of school transport → trip status (On Time/Delayed/Arrived/Cancelled) → push notification when vehicle 5 minutes away → "My child is stranded" alert
- **Driver Features:** Start/stop trip sessions → live GPS sharing → emergency button → trip history for compliance
- **Vehicle Verification:** Public lookup by registration — permit status, roadworthiness, driver PrDP status
- **Privacy:** Learner data encrypted at rest (PBKDF2 + AES-GCM-256), trip locations auto-purged after 24 hours

### 6. Mahikeng Disaster Shield — Early Warning & Community Resilience

Aligned with South Africa's EW4All Roadmap and Mahikeng's Disaster Management Summit goals.

- **Weather Warnings:** AfriGIS/SAWS integration — Flooding, Damaging Winds, Fire Danger, Severe Thunderstorm, Extreme Heat, Heavy Rain. Severity levels: Advisory (yellow), Watch (orange), Warning (red). Push notifications, 31-day history
- **Damage Reporting:** Flood, Veld Fire, Storm Damage, Structural Collapse — geotagged photos, urgency levels, evacuation needed flag
- **Safety Status:** "I'm Safe" / "Need Help" markers on disaster map
- **Volunteer Coordination:** Register with skills (First Aid, Firefighting, Shelter Management, Logistics, Counselling) → municipality deploys to specific areas
- **Preparedness Library:** Offline guides — Flood Safety, Firebreak Construction, Evacuation Planning, First Aid, Emergency Kit
- **Firebreak Reporting:** Self-report firebreak maintenance (National Veld and Forest Fire Act compliance)

### 7. Healthcare Access

- Facility directory with locations
- Crowd-sourced queue/wait times
- Appointment reminders
- Medicine availability tracker
- Facility fault reporting

### 8. Water Quality Monitoring

- Public dashboard of sensor readings (pH, turbidity, E. coli)
- Treatment plant and river monitoring points
- Community water issue reporting
- Threshold alerts when parameters exceed safe levels

### 9. Jobs & Tenders Portal

- Municipal job and tender listings
- Saved favourites
- Keyword alerts for new postings

### 10. Business Directory & Marketplace

- Verified local business profiles
- Classifieds: For Sale, Wanted, Services
- Anonymous posting option

### 11. Municipal Document Vault

- IDP, SDBIP, Annual Reports, By-laws, Budgets, Disaster Plans, Council Minutes
- Downloadable for offline reading
- Keyword search and category filtering

---

## Services Hub — Home Screen

The home screen features a 4-column Services Hub grid with 8 tappable service cards:

| Icon | Module | Badge Behaviour |
|------|--------|----------------|
| ⚡ | Mahikeng Power | Red when active outage |
| 📝 | Report Issue | — |
| 🛡️ | Safety Feed | — |
| 🗺️ | Crime Map | — |
| 🚌 | EduTrans | Active trip status for your child |
| 🛡️ | Disaster Shield | Red pulse when active warning |
| 👥 | Leaders | — |
| 📞 | SAPS 10111 | Direct phone call |

Below the grid, contextual widgets show:
- **TransportWidget** — Child's trip status when active
- **DisasterWidget** — Highest-severity active weather warning
- **PowerWidget** — Current load shedding stage and next scheduled block

Bottom navigation: 🏠 Home, 📝 Report, 🛡️ Safety, 🗺️ Map, ⚡ Power, 👤 Profile

---

## Government Admin Dashboard

Protected route (`/admin`) accessible only to users with `is_moderator` flag.

**Tabs:**
1. **Overview** — Municipality-wide stats, department performance bars, category breakdown, recent notifications
2. **Departments** — 7 real Mahikeng municipal departments with stats, contacts, category assignments
3. **Reports** — All civic reports with filters by department, status, urgency, category. Status update buttons with response notes
4. **Incidents** — Safety incident moderation
5. **Scholar Transport** — Route management, trip history, vehicle permits
6. **Disaster Management** — Active warnings, damage reports map, volunteer coordination

**Municipal Departments:**

| Department | Handles | Phone |
|-----------|---------|-------|
| Roads & Stormwater | Pothole | 018 381 8200 |
| Water Services | Water Leak | 018 381 8300 |
| Sanitation & Sewerage | Sewage | 018 381 8310 |
| Electricity & Energy | Streetlight, Electricity | 018 381 8320 |
| Waste Management | Illegal Dumping | 018 381 8330 |
| Housing & Human Settlements | Housing | 018 381 8340 |
| Community & Customer Services | Other | 018 381 8100 |

---

## USSD/SMS Bot

Feature phone support via USSD menu tree and SMS commands.

| Command | Action |
|---------|--------|
| `#REPORT [description] at [address]` | Submit a civic report |
| `#SOS` | Trigger emergency SOS |
| `#TRACK [child name]` | Get latest trip status |
| `#CHECK [vehicle reg]` | Check vehicle permit status |
| `#WARNINGS` | Get active weather warnings |
| `#DISASTER [type] at [location]` | Submit a damage report |
| `#SAFE` | Mark yourself as safe |
| `#HELP` | Request help |

---

## Architecture

| Layer | Technology |
|-------|-----------|
| UI | React 18 + Vite 5 + Tailwind CSS 3 |
| Maps | Leaflet + React-Leaflet + OpenStreetMap |
| Database | Supabase (PostgreSQL + PostGIS) with mock fallback |
| Offline | IndexedDB via `idb` library (12 stores, version 3) |
| Encryption | Web Crypto API (AES-GCM-256 + PBKDF2) |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest + React Testing Library |
| SMS/USSD | Africa's Talking (mock when not configured) |
| Push | Web Push API with VAPID keys |
| Weather | AfriGIS/SAWS API (mock when not configured) |
| Load Shedding | EskomSePush API (mock when not configured) |

### Dual-Mode Architecture

Every API module uses a dual-mode pattern: when Supabase environment variables are set, the app connects to a live database. When they're not, it uses in-memory arrays with simulated latency. This means:

- **Demo mode:** Works immediately with `npm run dev` — no accounts, no database
- **Live mode:** Add `.env` values and the same code connects to Supabase

---

## Offline-First

The app is designed for areas with poor connectivity:

- **12 IndexedDB stores:** pending reports, cached data, drafts, transport cache, disaster cache, learner data, business profiles, power cache
- **Auto-sync:** `SyncManager` listens for the browser `online` event and submits queued reports
- **Draft saving:** Failed submissions saved as drafts for later completion
- **Cache-first loading:** Widgets load cached data instantly, then refresh from API
- **Offline resources:** Preparedness guides and weather warnings cached for offline access

---

## Privacy & Security (POPI Act Compliance)

| Principle | Implementation |
|-----------|---------------|
| **Data minimization** | No email, phone, or ID required. Random token generated on device. |
| **Anonymity** | Safety reports show as "Community Member". Identity never exposed. |
| **Location privacy** | Coordinates fuzzed to ~111m grid on public maps. |
| **Encryption at rest** | Emergency contacts + learner data encrypted with AES-GCM-256. |
| **Encryption in transit** | TLS 1.3 for all API calls in production. |
| **Storage limitation** | Contacts and learner data never uploaded unencrypted. |
| **Auto-purge** | Trip location history deleted after 24 hours. |
| **Right to erasure** | User can clear all local data from Profile page. |
| **Open source** | Privacy practices auditable by anyone. |

---

## Database Schema

29 tables across 6 domains:

**Core:** `user_tokens`, `civic_reports`, `safety_incidents`, `incident_confirmations`, `sos_alerts`

**Patrol:** `patrol_groups`, `patrol_members`, `patrol_sessions`, `patrol_locations`, `patrol_messages`

**Admin:** `department_notifications`, `sms_reports`, `push_subscriptions`

**Power:** `business_profiles`, `outage_confirmations`, `business_alerts`

**EduTrans:** `transport_routes`, `learners`, `trip_sessions`, `vehicle_permits`, `stranded_reports`

**Disaster:** `weather_warnings`, `disaster_reports`, `user_safety_status`, `volunteers`, `volunteer_deployments`, `resilience_resources`, `firebreak_reports`, `municipal_alerts`

**Materialized View:** `municipality_scorecard` — aggregated stats by category and department

All tables use Row Level Security (RLS). PostGIS spatial indexes on location columns.

---

## API Reference

**55 exported functions across 4 modules:**

| Module | File | Functions |
|--------|------|-----------|
| Core | `src/db/mockApi.js` | 21 functions — reports, incidents, SOS, SMS, patrols, leaders, departments |
| Power | `src/db/powerApi.js` | 9 functions — outages, business profiles, confirmations, alerts |
| EduTrans | `src/db/transportApi.js` | 12 functions — learners, routes, trips, permits, stranded |
| Disaster | `src/db/disasterApi.js` | 13 functions — warnings, damage reports, volunteers, resources, firebreaks |

---

## Environment Variables

```bash
# Required for live mode
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# SMS/USSD (Africa's Talking)
VITE_AT_API_KEY=your-api-key
VITE_AT_USERNAME=your-username
VITE_AT_SENDER_ID=your-sender-id

# Push Notifications (VAPID)
VITE_VAPID_PUBLIC_KEY=your-public-key
VITE_VAPID_PRIVATE_KEY=your-private-key

# EskomSePush (optional — mock when not set)
VITE_ESP_API_KEY=your-eskomsepush-key

# AfriGIS Weather Warnings (optional — mock when not set)
VITE_AFRIGIS_API_KEY=your-afrigis-key
```

**Without any `.env` values, the app runs fully in demo mode with mock data.**

---

## Going Live

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `src/db/schema.sql` in the SQL Editor
3. Create a Storage bucket named `report-photos` (public)
4. Copy Supabase URL + anon key into `.env`
5. Deploy edge function: `supabase functions deploy send-sms`
6. Set secrets: `supabase secrets set AT_API_KEY=xxx AT_USERNAME=xxx`
7. Generate VAPID keys: `npx web-push generate-vapid-keys`
8. (Optional) Get free EskomSePush key at [developer.eskom.sepush.co.za](https://developer.eskom.sepush.co.za/)
9. (Optional) Get AfriGIS key at [afrigis.co.za](https://www.afrigis.co.za/)
10. Deploy to Vercel, Netlify, or any static host (must be HTTPS)

---

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

- `helpers.test.js` — 11 tests (timeAgo, formatDate, debounce, constants)
- `geolocation.test.js` — 12 tests (fuzzLocation, getDistance, isWithinMahikeng, reverseGeocode)
- `mockApi.test.js` — 20 tests (reports, incidents, SOS, SMS, dashboard stats)

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) on push/PR to `main`/`master`:
1. `npm ci` → `npm run lint` → `npm test` → `npm run build`
2. Upload `dist/` as artifact (7-day retention)

---

## Project Structure

```
mafikeng/
├── public/
│   ├── icons/                    # PWA icons (SVG)
│   ├── leaflet/                  # Bundled Leaflet marker assets
│   └── manifest.json             # PWA manifest
├── src/
│   ├── api/
│   │   └── esp.js                # EskomSePush API service
│   ├── components/
│   │   ├── BottomNav.jsx         # 6-tab bottom navigation
│   │   ├── BusinessSignup.jsx    # 2-step business registration
│   │   ├── ChildTracker.jsx      # Live school transport map
│   │   ├── CopyrightFooter.jsx   # Footer with POPIA notice
│   │   ├── DisasterMap.jsx       # Disaster damage map
│   │   ├── DisasterWidget.jsx    # Home screen warning widget
│   │   ├── ESPWidget.jsx         # Load shedding schedule widget
│   │   ├── ErrorBoundary.jsx     # React error boundary
│   │   ├── Layout.jsx            # Page layout wrapper
│   │   ├── OfflineBanner.jsx     # Offline status banner
│   │   ├── OutageMap.jsx         # Power outage map
│   │   ├── PowerWidget.jsx       # Home screen power widget
│   │   ├── PreparednessLibrary.jsx # Disaster preparedness guides
│   │   ├── SOSButton.jsx         # Emergency SOS button
│   │   ├── Toast.jsx             # Global toast notifications
│   │   ├── TransportWidget.jsx   # Home screen transport widget
│   │   └── VehicleCheck.jsx      # Vehicle permit lookup
│   ├── db/
│   │   ├── disasterApi.js        # Disaster Shield API (13 functions)
│   │   ├── mockApi.js            # Core civic API (21 functions)
│   │   ├── offline.js            # IndexedDB stores (12 stores)
│   │   ├── powerApi.js           # Power module API (9 functions)
│   │   ├── schema.sql            # PostgreSQL schema (29 tables)
│   │   ├── supabase.js           # Supabase client
│   │   └── transportApi.js       # EduTrans API (12 functions)
│   ├── hooks/
│   │   ├── useAuth.jsx           # Pseudonymous auth context
│   │   └── useNetwork.js         # Online/offline detection
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── CommunityLeaders.jsx
│   │   ├── DisasterShieldScreen.jsx
│   │   ├── EduTransScreen.jsx
│   │   ├── Home.jsx
│   │   ├── MapView.jsx
│   │   ├── MyReports.jsx
│   │   ├── PatrolMode.jsx
│   │   ├── PowerScreen.jsx
│   │   ├── Profile.jsx
│   │   ├── Report.jsx
│   │   ├── SafetyFeed.jsx
│   │   ├── SignUp.jsx
│   │   └── USSDBot.jsx
│   ├── utils/
│   │   ├── encryption.js         # Web Crypto encryption
│   │   ├── geolocation.js        # GPS + Nominatim geocoding
│   │   ├── helpers.js            # Constants + utilities
│   │   └── notifications.js      # Push notification management
│   ├── App.jsx                   # Routes + providers
│   └── main.jsx                  # Entry point
├── supabase/
│   └── functions/
│       └── send-sms/             # Edge function for Africa's Talking
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD
├── .env.example
├── .eslintrc.json
├── vitest.config.js
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── LICENSE                       # MIT License (c) 2026 Pardon Mahara
└── README.md                     # This file
```

---

## Emergency Numbers

| Service | Number | Notes |
|---------|--------|-------|
| SAPS Emergency | **10111** | National police emergency line |
| Mahikeng SAPS Station | **018 381 8200** | Local police station |
| Ambulance / Fire | **10177** | Medical & fire emergencies |
| Municipality Hotline | **018 381 8200** | Service delivery issues |
| North West PDMC | **066 030 8026** | Provincial Disaster Management |
| SAWS | **012 367 6041** | South African Weather Service |
| NW Transport | **018 388 4546** | Scholar transport |
| NW Education | **018 388 2543** | Department of Education |

All numbers are one-tap callable from the app.

---

## Dependencies

**Runtime (8):** `@supabase/supabase-js`, `date-fns`, `idb`, `leaflet`, `react`, `react-dom`, `react-leaflet`, `react-router-dom`

**Dev (11):** `@testing-library/jest-dom`, `@testing-library/react`, `@vitejs/plugin-react`, `autoprefixer`, `jsdom`, `postcss`, `tailwindcss`, `vite`, `vite-plugin-pwa`, `vitest`, `workbox-window`

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run tests (`npm test`)
4. Commit with a descriptive message
5. Push and create a Pull Request

---

## Acknowledgements

- The residents of Mahikeng who deserve better service delivery and a safer community
- Community safety forums and neighbourhood watch groups who self-organize to protect their neighbors
- SAHRC for the scholar transport investigative report (January 2026)
- Mahikeng Disaster Management Summit (October 2025) and the EW4All Roadmap
- OpenStreetMap contributors for free, open map data
- EskomSePush for load shedding data
- AfriGIS and SAWS for weather warning data
- Africa's Talking for SMS/USSD gateway
- Supabase for open-source backend infrastructure

---

## License

**Source-Available — All Rights Reserved**

Copyright (c) 2026 Pardon Mahara

This is **not open-source software**. The source code is made available for transparency and auditability, but all rights are reserved by the author.

**You may:** Install, run, and deploy the Software for civic/community use. View and read the source code.

**You may not:** Modify, redistribute, sell, sublicense, or create derivative works without explicit written permission from the author. Only Pardon Mahara has the right to modify and update this Software.

For commercial licensing, modifications, or redistribution, contact the author.

See [LICENSE](./LICENSE) for full terms.

---

*Built with care by Pardon Mahara for the Mahikeng Community, 2026.*
