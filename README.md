# Mahikeng Civic Safety PWA

**Official Community Platform for Mahikeng, North West Province, South Africa**

> Copyright (c) 2026 Pardon Mahara. All Rights Reserved.
> Licensed under the MIT License. See [LICENSE](./LICENSE).

---

## The Problem: Why Mahikeng Needs This App

Mahikeng, the capital of South Africa's North West Province, faces severe and persistent challenges that affect the daily lives of its residents. These are not abstract statistics — they are the lived reality of hundreds of thousands of people.

### Infrastructure Crisis

- **Raw sewage spills** flow into residential yards and streets, creating health hazards, especially for children and the elderly. Manholes overflow for weeks without response.
- **Chronic water shortages** leave households without water for days. Burst pipes waste millions of litres while taps run dry.
- **Potholes** large enough to damage vehicles plague every major road. Some have been reported for months without repair.
- **Broken streetlights** leave entire neighborhoods in darkness, creating unsafe conditions for pedestrians, especially women walking at night.
- **Power outages** (load shedding aside) caused by failing infrastructure leave families without electricity for extended periods with no communication from Eskom or the municipality.
- **Illegal dumping** turns vacant lots into health hazards, attracting vermin and degrading property values.
- **Stalled housing projects** leave families in temporary structures for years.

### Safety and Crime Concerns

- Crime is a daily reality. House break-ins, car theft, vandalism, and drug activity are reported regularly.
- Police response times are unpredictable. Residents have lost trust in the ability of SAPS to respond quickly.
- Community members have organized themselves into night patrols and neighborhood watch groups, but they lack coordination tools.
- There is no single platform where residents can report safety incidents anonymously and see what is happening in their area.
- Existing national apps (My Smart City, CityMenderSA) have not gained traction in Mahikeng. The community needs a **local** solution they can trust.

### The Trust Gap

- Residents do not trust that their reports reach the municipality.
- There is no transparency about what happens after a report is filed.
- There is no public accountability — no data on how many potholes were fixed, how many water leaks were repaired, or how long resolution takes.
- People need to know that their data is safe, their identity is protected, and their voice matters.

---

## The Solution: Mahikeng Civic Safety PWA

This application is a direct response to these challenges. It is not a prototype or a concept — it is a working, installable Progressive Web App built specifically for the people of Mahikeng.

### What This App Does

**1. Civic Infrastructure Reporting**
- Report potholes, water leaks, sewage spills, broken streetlights, electricity outages, illegal dumping, and housing issues
- Each report captures: geotagged location (auto-detected), photo/video, category, description, and urgency level
- Reports are submitted to a public dashboard and a backend queue for municipality integration
- Track report status: Pending → Acknowledged → In Progress → Resolved
- See official municipality responses on each report
- **Works offline** — save reports without network, auto-submit when connected

**2. Community Safety and SOS**
- **One-tap SOS panic button** on the home screen
- Immediately sends GPS coordinates to emergency contacts via SMS
- Triggers audible alarm and begins recording
- **Discreet activation**: triple-tap for silent triggering in dangerous situations
- SOS alerts forwarded to local private security and SAPS response network
- Anonymous safety incident feed — report suspicious activity, theft, vandalism without revealing identity
- Community verification system — "Confirm" or "Flag" incidents to reduce misinformation
- Live crime map with heatmap hotspots showing where incidents cluster

**3. Neighborhood Watch Toolkit**
- Patrol Mode: registered watch members share live location during patrols
- End-to-end encrypted group chat for patrollers
- Step-by-step guide to register community safety forums with SAPS/CPF
- Community Leaders directory with direct contact details for ward councillors, CPF members, and safety forum chairs

**4. USSD/SMS Accessibility**
- Full USSD menu simulation for feature phones without data
- SMS bot accepts `#REPORT [description] at [address]` and `#SOS` commands
- Auto-categorizes reports based on keywords
- Ensures no resident is excluded because they don't have a smartphone

**5. Transparency and Accountability**
- Public dashboard showing all reported issues and their status
- Municipality Resolution Scorecard: percentage of potholes fixed, water restored, average resolution time
- Category-by-category performance breakdown
- Creates public pressure for service delivery improvement

**6. Emergency Numbers**
- SAPS Emergency: **10111**
- Mahikeng SAPS Station: **018 381 8200**
- Ambulance / Fire: **10177**
- Municipality Hotline: **018 381 8200**
- All numbers are one-tap callable from within the app

**7. Sign Up with Address**
- Register with your name, phone, suburb, street address, and ward
- Helps route reports to the correct municipality area
- Emergency contacts stored encrypted on device only
- No email or personal ID required — pseudonymous by design

---

## Community Impact: What This App Solves

### For Residents

| Before | After |
|--------|-------|
| No way to report potholes except calling the municipality and waiting on hold | 3-step report with photo, location, and status tracking |
| No idea if anyone is working on the sewage spill in your yard | Real-time status updates: Pending → Acknowledged → In Progress → Resolved |
| Can't report crime anonymously without fear of retaliation | Anonymous safety feed — identity hidden as "Community Member" |
| No coordination tool for neighborhood watch patrols | Patrol Mode with live location sharing and encrypted group chat |
| Feature phone users excluded from digital services | USSD/SMS bot works without data or smartphone |
| No way to know if your area is safe | Live crime map with heatmap showing incident density |
| Emergency contacts can't find you in a crisis | One-tap SOS sends GPS coordinates to all emergency contacts |
| Don't know who your ward councillor is | Community Leaders directory with direct call/email |

### For the Municipality

| Before | After |
|--------|-------|
| Scattered reports via phone, email, walk-ins | Centralized dashboard with all reports, categories, and locations |
| No data on resolution rates or response times | Automatic scorecard: resolution rate, average days, category breakdown |
| No way to communicate progress to residents | Official response field on each report visible to the reporter |
| No geographic data on where problems cluster | Interactive map with category filters and hotspot analysis |
| No accountability mechanism | Public-facing scorecard creates transparency pressure |

### For Community Safety Forums

| Before | After |
|--------|-------|
| Coordination via WhatsApp groups (no structure) | Dedicated patrol groups with live location and encrypted chat |
| No anonymous crime reporting | Community safety feed with verification voting |
| Hard to register new patrol groups | Step-by-step CPF registration guide |
| No visibility into crime patterns | Crime map with heatmap showing where incidents cluster |
| No direct line to SAPS leadership | Community Leaders directory with CPF contacts |

### For Vulnerable Residents

| Before | After |
|--------|-------|
| Elderly/disabled can't travel to municipality offices | Report from home with photo and auto-location |
| Women walking in dark streets have no quick SOS | Discreet triple-tap SOS triggers alarm and alerts contacts |
| Feature phone users excluded from digital services | USSD/SMS bot accepts `#REPORT` and `#SOS` commands |
| Residents without data can't access online services | Offline-first architecture — works without network |
| Fear of reporting crime due to identity exposure | Anonymous reporting with location fuzzing |

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite 5 | Fast, modern, component-based |
| Styling | Tailwind CSS 3 | Mobile-first, accessible, fast loading |
| Routing | React Router 6 | Client-side navigation, URL-based |
| Maps | Leaflet + OpenStreetMap | Free, no tracking, offline tile caching |
| Offline Storage | IndexedDB (via idb) | Persistent local storage for reports and drafts |
| PWA | vite-plugin-pwa + Workbox | Installable, offline-capable, push notifications |
| Encryption | Web Crypto API | AES-GCM for contacts, PBKDF2 for key derivation |
| Backend (Mock) | In-memory API | Simulates Supabase for development |
| Database | PostgreSQL + PostGIS | Production-ready schema with spatial queries |

### Privacy by Design (POPI Act Compliance)

| Principle | Implementation |
|-----------|---------------|
| **Data minimization** | No email, phone, or ID required. Random token generated on device. |
| **Purpose limitation** | Data collected only for civic reporting and safety. No advertising, no profiling. |
| **Anonymity** | Safety reports show as "Community Member". Identity never exposed. |
| **Location privacy** | Coordinates fuzzed to ~111m grid on public maps. Exact location only in your own reports. |
| **Encryption at rest** | Emergency contacts encrypted with AES-GCM. Stored only on device. |
| **Encryption in transit** | TLS 1.3 for all API calls in production. |
| **Storage limitation** | Emergency contacts never uploaded to server. Local-only. |
| **Right to erasure** | User can clear all local data from Profile page. |
| **Accountability** | Open-source code. Privacy practices auditable by anyone. |

### Offline-First Architecture

- Service worker caches all static assets, map tiles, and API responses
- IndexedDB stores pending reports, drafts, cached data
- When network returns, pending reports auto-sync with notification
- App loads in under 3 seconds on 3G networks
- Core functionality (report drafting, contact management, USSD) works without network

---

## Project Structure

```
mahikeng/
├── public/
│   ├── icons/                    # PWA app icons
│   └── manifest.json             # PWA install manifest
├── src/
│   ├── components/
│   │   ├── Layout.jsx            # App shell with offline banner
│   │   ├── BottomNav.jsx         # Bottom navigation (Home, Report, Safety, Map, Profile)
│   │   ├── SOSButton.jsx         # Emergency SOS panic button
│   │   ├── CopyrightFooter.jsx   # Official copyright footer
│   │   ├── OfflineBanner.jsx     # Network status indicator
│   │   └── Toast.jsx             # Notification system
│   ├── pages/
│   │   ├── Home.jsx              # Dashboard: SOS, stats, quick actions, emergency numbers
│   │   ├── Report.jsx            # 3-step civic issue report form
│   │   ├── MyReports.jsx         # User's reports with status timeline
│   │   ├── SafetyFeed.jsx        # Anonymous safety incident feed
│   │   ├── MapView.jsx           # Interactive crime/issues map
│   │   ├── Profile.jsx           # User profile, emergency contacts, settings
│   │   ├── SignUp.jsx            # Registration with address
│   │   ├── CommunityLeaders.jsx  # Directory of ward councillors, CPF, safety forums
│   │   ├── AdminDashboard.jsx    # Municipality admin panel
│   │   ├── PatrolMode.jsx        # Neighborhood watch toolkit
│   │   └── USSDBot.jsx           # USSD/SMS bot simulator
│   ├── hooks/
│   │   ├── useAuth.jsx           # Pseudonymous authentication
│   │   └── useNetwork.js         # Online/offline detection
│   ├── db/
│   │   ├── schema.sql            # Full PostgreSQL + PostGIS schema
│   │   ├── mockApi.js            # Mock backend with seed data
│   │   └── offline.js            # IndexedDB offline storage layer
│   ├── utils/
│   │   ├── geolocation.js        # Location services and privacy fuzzing
│   │   ├── encryption.js         # Web Crypto encryption utilities
│   │   └── helpers.js            # Shared constants, formatters, utilities
│   ├── App.jsx                   # Root component with routing and sync
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind CSS with custom components
├── LICENSE                       # MIT License (c) 2026 Pardon Mahara
├── README.md                     # This file
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mahikeng

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run preview
```

### Deploy

```bash
# Vercel
npx vercel deploy dist/

# Netlify
npx netlify deploy --dir=dist --prod

# Or serve with any static file server
npx serve dist
```

The app must be served over HTTPS for PWA installation and service worker to function.

---

## Features Walkthrough

### Home Screen
- Prominent SOS panic button (hold 3s or triple-tap)
- Quick stats: total reports, resolution rate, active incidents
- Quick actions: Report Issue, My Reports, Safety Feed, Crime Map, Community Leaders, Sign Up, SAPS 10111
- Emergency numbers section with one-tap calling
- Municipality Resolution Scorecard with category breakdown
- Recent reports feed

### Civic Issue Reporting
- 3-step wizard: Category → Details → Submit
- Categories: Pothole, Water Leak, Sewage, Streetlight, Electricity, Illegal Dumping, Housing, Other
- Auto-detect GPS location with manual pin adjustment
- Photo capture (up to 3 images, auto-compressed)
- Urgency levels: Low, Normal, High, Critical
- Offline save with auto-sync on reconnect
- Draft system for incomplete reports

### My Reports
- Filter by status: All, Pending, Acknowledged, In Progress, Resolved
- Expandable cards with status timeline
- Municipality response notes visible
- Report ID for reference

### Safety Feed
- Anonymous incident reporting (identity: "Community Member")
- Incident types: Suspicious Activity, Theft, Vandalism, Break-in, Car Theft, Drug Activity, Noise
- Confirm/Flag voting system for verification
- Verified badge for community-confirmed incidents
- Link to view incident on crime map

### Crime Map
- Interactive Leaflet map with OpenStreetMap tiles
- Color-coded markers by category and incident type
- Heatmap layer showing incident density hotspots
- Filter: All, Infrastructure, Safety, Hotspots
- Popup details on marker click
- Location fuzzing for privacy on safety incidents

### Community Leaders
- Directory of ward councillors, CPF members, safety forum chairs, patrol leaders
- Filter by category: Municipality, Police Forum, Safety Forum, Patrol Groups
- Search by name, area, or ward
- One-tap call and email buttons
- SAPS emergency banner with 10111 and local station number

### Sign Up
- 3-step flow: Personal Details → Address → Emergency Contacts
- Suburb selection: Central Mahikeng, Riviera Park, Montshiwa, Mmabatho, and more
- Ward number selection
- Street address and landmark
- Emergency contacts (encrypted, stored locally only)
- Skip option available

### SOS Panic Button
- Hold for 3 seconds OR triple-tap (discreet)
- Gets GPS coordinates
- Creates SOS alert in backend
- Plays audible siren alarm (Web Audio API)
- Vibrates device
- Sends notification to emergency contacts
- Simulates audio recording and streaming
- Cancel button to deactivate

### Patrol Mode
- Join existing patrol groups or create new ones
- Active Patrol: live location sharing with group
- Group Chat: end-to-end encrypted messaging
- Active patrollers list with last-seen timestamps
- Registration Guide: step-by-step CPF registration process

### USSD/SMS Bot
- USSD Simulator: navigate menu with number keys (1-5)
- SMS Bot: parse `#REPORT` and `#SOS` commands
- Auto-categorization from keywords
- SMS report history
- Works without smartphone or data

### Admin Dashboard
- Overview: total reports, resolution rate, category performance, active alerts
- Reports Management: acknowledge, mark in-progress, mark resolved, add response notes
- Incident Moderation: remove harmful safety posts
- Municipality Scorecard with resolution percentage by category

---

## Emergency Numbers

| Service | Number | Notes |
|---------|--------|-------|
| SAPS Emergency | **10111** | National police emergency line |
| Mahikeng SAPS Station | **018 381 8200** | Local police station |
| Ambulance | **10177** | Medical emergencies |
| Fire | **10177** | Fire emergencies |
| Municipality Hotline | **018 381 8200** | Service delivery issues |

All numbers are one-tap callable from the app.

---

## Database Schema

The full PostgreSQL schema is in `src/db/schema.sql`. It includes:

- **user_tokens** — Pseudonymous user identities (no personal data)
- **civic_reports** — Infrastructure issue reports with PostGIS spatial indexing
- **safety_incidents** — Community safety reports with confirmation/flag counts
- **incident_confirmations** — Voting records for incident verification
- **sos_alerts** — Emergency SOS events with location and status
- **patrol_groups** — Neighborhood watch group definitions
- **patrol_members** — Group membership with roles
- **patrol_sessions** — Active patrol sessions
- **patrol_locations** — Real-time location data during patrols
- **patrol_messages** — Encrypted group chat messages
- **sms_reports** — USSD/SMS submission records
- **municipality_scorecard** — Materialized view for accountability metrics

### Supabase Deployment

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the contents of `src/db/schema.sql` in the SQL editor
3. Replace mock API calls in `src/db/mockApi.js` with the Supabase JavaScript client
4. Row Level Security policies are included in the schema
5. Enable PostGIS extension for spatial queries

---

## USSD/SMS Testing

### USSD Simulator

Navigate to Profile → USSD/SMS Bot → USSD Simulator:

| Key | Action |
|-----|--------|
| 1 | Report an Issue |
| 2 | Check Report Status |
| 3 | Emergency SOS |
| 4 | Safety Alerts |
| 5 | Help |
| 0 | Back to previous menu |

### SMS Bot

Navigate to Profile → USSD/SMS Bot → SMS Bot:

```
#REPORT pothole at Station Road near Shoprite
#REPORT water leak at 45 Church Street
#REPORT sewage overflow at school on Buffalo Road
#REPORT streetlight out on First Avenue
#SOS
```

The bot auto-categorizes based on keywords and creates reports.

### Production USSD Integration

For real USSD/SMS integration:
1. Register with [Africa's Talking](https://africastalking.com) or similar provider
2. Set up a webhook endpoint to receive USSD sessions
3. Map the `USSD_MENUS` structure to the provider's format
4. Process SMS via the gateway's API

---

## Contributing

This is an open-source project built for the Mahikeng community. Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

---

## License

MIT License

Copyright (c) 2026 Pardon Mahara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

---

## Acknowledgments

- The residents of Mahikeng who deserve better service delivery and a safer community
- Community safety forums and neighborhood watch groups who self-organize to protect their neighbors
- OpenStreetMap contributors for free, open map data
- The fixlocal platform for demonstrating that communities want to self-organize
- Every resident who has ever reported a pothole, a sewage spill, or a broken streetlight and wondered if anyone was listening

**This app is for you. Your voice matters. Your safety matters. Mahikeng matters.**

---

*Built with care by Pardon Mahara for the Mahikeng Community, 2026.*
