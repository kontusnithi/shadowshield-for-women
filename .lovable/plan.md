
## Stack decision

Your spec calls for Python Flask + SQLite, but this Lovable project runs on **TanStack Start (React/TypeScript) + Lovable Cloud (Postgres, auth, storage, server functions) + Lovable AI Gateway**. I'll build ShadowShield+ on this stack — same capabilities, fully deployable from here. If you later want a Flask reference backend, I can export a spec doc.

## Scope for v1

A polished, demo-ready safety platform with the **core MVP + AI risk scoring engine**. Shadow detection, silent SOS, evidence vault, voice stress, and heatmaps will be staged for follow-up iterations to keep v1 shippable.

### Included in v1
- Auth (email/password + Google), trusted-contacts-aware profiles
- Landing page (futuristic dark UI, hero, feature breakdown, CTA)
- Dashboard with real-time risk indicator, current zone, quick SOS
- Live tracking page (real map via Leaflet + OpenStreetMap, route trail, isolation/zone overlay)
- Trusted contacts CRUD
- Emergency logs (timeline of triggers, escalation stage reached, location)
- Settings (night guardian toggle, sensitivity, silent SOS shake threshold, dark mode)
- AI risk analytics page (score breakdown, factor history charts)
- Multi-stage escalation flow (in-app stages 1→4, simulated SMS/call with toast + log entry)
- Silent SOS via shake detection (DeviceMotion) and secret phrase (Web Speech API)
- Dynamic safety zones (seeded zone polygons; risk multiplier per zone)

### Deferred to later iterations
Shadow/follower detection, evidence vault uploads, voice stress ML, community heatmaps, real Twilio SMS, offline SMS, push notifications.

## Risk Scoring Engine

Implemented as a pure TS module + Lovable AI fallback for "panic detection" on user-submitted text/voice transcript.

```text
RiskScore = TimeFactor + IsolationFactor + TrackingFactor
          + PanicFactor + RouteMirroringFactor + ZoneFactor
```
- TimeFactor: 0–25 (peak 22:00–05:00)
- IsolationFactor: 0–25 (derived from zone + crowd-density mock)
- TrackingFactor: 0–15 (repeated similar routes)
- PanicFactor: 0–20 (manual panic press, AI text classification)
- RouteMirroringFactor: 0–15 (placeholder hook, returns 0 in v1)
- ZoneFactor: 0–10 (safe/medium/high/extreme)

Thresholds → Stage 1 (≥40), Stage 2 (≥60), Stage 3 (≥80), Stage 4 (≥95).

## Pages & routes

```text
/                     Landing
/login                Auth
/dashboard            Risk indicator, quick actions, status
/tracking             Live map + route trail + zone overlay
/contacts             Trusted contacts CRUD
/logs                 Emergency event timeline
/analytics            Risk factor charts (recharts)
/settings             Preferences, silent SOS config
```

All app routes behind `_authenticated` layout; landing + login public.

## Database (Lovable Cloud / Postgres)

```text
profiles              id, full_name, phone, night_guardian, sensitivity, silent_phrase
trusted_contacts      id, user_id, name, phone, relation, priority
location_pings        id, user_id, lat, lng, accuracy, created_at
risk_events           id, user_id, score, factors_json, stage, lat, lng, created_at
safety_zones          id, name, polygon_geojson, level (safe|medium|high|extreme)
escalations           id, user_id, risk_event_id, stage, action, status, created_at
```
RLS: user-scoped on all tables. `safety_zones` readable to all authenticated users. `has_role` pattern reserved for future admin.

## Server functions

- `computeRisk` — accepts current ping + recent history, returns score + factor breakdown
- `triggerEscalation` — records escalation stage, simulates SMS/call, returns next-stage timer
- `classifyPanicText` — calls Lovable AI Gateway (`google/gemini-3-flash-preview`) to score panic likelihood from transcript

## Design direction

Futuristic dark-first safety UI: deep navy/near-black background, electric violet + signal-cyan accents, soft red for danger states, subtle aurora gradients on hero, mono-display font for risk score, Inter for body. Glassy cards, animated risk ring (Framer Motion), pulsing SOS button. Light mode supported via tokens.

## Out-of-scope clarifications
- SMS/voice calls are simulated (toast + log row). Wiring Twilio is a one-step later add.
- Map uses Leaflet + OSM tiles (no API key). Mapbox can be swapped in later.
- "Police alert" Stage 4 is a logged action, not a real dispatch.
