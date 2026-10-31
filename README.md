# SwasthyaSense — Early Warning, Follow-Up & Hexagonal Clinic Mesh Platform

> **Non-Diagnostic Clinical Decision-Support Prototype** • Built for Frontline Health Workers (ASHA / ANM), PHC Supervisors, Medical Officers, and Clinical Administrators across India & Global Primary Care Networks.

---

## 1. Overview & Core Problem Solved

Patients recovering from severe post-illness complications (including post-oncology recovery), high-risk pregnancies, hypertension, and diabetes frequently miss routine follow-ups or deteriorate silently at home. Meanwhile, frontline workers face fragmented records and village clinics suffer from unpredictable overcrowding.

**SwasthyaSense** solves this through an explainable, privacy-first, multi-page clinical coordination platform:

1. **5-Category Bidirectional Clinical Scoring (`UP ↑` & `DOWN ↓`):**
   - Evaluates **Blood Pressure** (hypertensive crisis $\ge 160/100$, 3-visit rising trajectory, or hypotensive shock $< 90/60$), **Heart Rate** ($> 110$ or $< 50\text{ bpm}$), **Blood Glucose** ($> 240$ or hypoglycemic $< 70\text{ mg/dL}$), **Temperature & $\text{SpO}_2$** (post-chemo neutropenic fever $\ge 38.0^\circ\text{C}$, hypothermia $< 35.5^\circ\text{C}$, hypoxia $< 93\%$), and **Danger Symptoms + Overdue Schedule Gap**.
2. **QuickSort Pivot Threshold Engine:**
   - Partitions patients around a clinician-governed **Pivot Threshold (`100`)** into an **Upper Partition (`Score >= 100` $\rightarrow$ Immediate Priority Slots)** and **Lower Partition (`Score < 100` $\rightarrow$ 50-minute to 2-hour flexible clinic windows between `09:00` and `17:00`)**, recursively sorting both partitions in descending priority order.
3. **3-Bucket (`15 / 5 / 10 = 30 Slots`) Clinic Capacity Isolation & "31st-Patient" Preemption:**
   - Every village clinic isolates its 30 daily slots into **15 Follow-Up System Slots**, **5 Reserved Critical Slots**, and **10 Protected Walk-In Slots** (for general villagers visiting for routine care—never interrupted by our system).
   - When a rapidly deteriorating **31st patient** arrives at a full clinic, QuickSort preempts the lowest-scoring routine follow-up slot to an ASHA home visit while keeping all **10 Walk-In Slots 100% untouched**.
4. **5-Village Hexagonal Spatial Mesh (`HEX-0` to `HEX-4`) & Equal Neighbor-Ring Broadcast:**
   - Clinics are connected in an H3-inspired hexagonal ring topology. When any village clinic reaches 100% critical capacity, the overflow request is **equally broadcasted to all adjacent Hexagon ring clinics**. The first neighbor clinic to accept immediately locks the referral and receives the clinical handover chart.
   - Includes a **Doctor-Absent Fallback**: if the local doctor is unavailable, the frontline worker logs vitals locally and routes the packet to an on-duty specialist in the neighboring hexagon.
5. **Homebound / Post-Cancer Recovery Rescue & 108 Rapid Ambulance Dispatch:**
   - Tracks patient mobility (`independent`, `assisted`, `homebound`). When a homebound or post-oncology patient triggers a critical alert that exceeds local sub-centre capability, the platform dispatches a **108 Rapid Ambulance** with a pre-filled **Paramedic Handover Sheet**, bypassing under-equipped clinics to go straight to Tertiary Care (`HEX-4`).
6. **7 Regional Languages & Two-Way WhatsApp / SMS Loop:**
   - Native UI and patient messaging templates in **English (`en`), Hindi (`hi`), Assamese (`as`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), and Marathi (`mr`)**.
   - Supports two-way patient replies: `1` (Confirm Check-In), `2` (Report Problem / Request Home Visit), and `STOP` (Instant Consent Revocation).
7. **Privacy, Consent Gate, RBAC & SHA-256 Hash-Chained Audit Log:**
   - Enforces purpose-bound consent (`STOP` immediately locks the record and blocks outbound messages with HTTP `403`), role-based access control (supervisors and clinicians see pseudonymous IDs while encrypted phone numbers are restricted to the assigned worker), clinician sign-off on all rule threshold changes, and a tamper-evident **SHA-256 hash-chained audit trail**.

---

## 2. Multi-Page Architecture

| Route | Module Name | Primary Persona & Capabilities |
| :--- | :--- | :--- |
| `/` | **Overview** | High-level KPI telemetry, top 3 immediate priority cases, and module directory. |
| `/worklist` | **Triage Queue** | Paginated QuickSort daily worklist (6 cards/page) with 5-vital trajectories, cohort filters, check-in modal, and 1-click escalation. |
| `/network` | **Hex Network** | Interactive **Honeycomb Spatial Radar**, Equal Neighbor-Ring Broadcast claim queue, and **30-Slot (`15 / 5 / 10`) Clinic Capacity Matrix**. |
| `/clinician` | **Clinician** | Doctor escalation console with 4-hour SLA tracking, remote care instructions, and **108 Rapid Ambulance Paramedic Handover Tracker**. |
| `/governance` | **Governance** | Clinician-owned QuickSort threshold editor (two-step Admin stage $\rightarrow$ Doctor sign-off), `STOP` consent lock registry, and responsive **SHA-256 Audit Log**. |
| `/simulator` | **Scenario Lab** | Live external API/database connector telemetry and 1-click verification of all 6 clinical, spatial, and privacy scenarios. |

---

## 3. Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Medical Icons (Mobile-first responsive design from `320px` xs to `4K` ultrawide in Doctor Red/Emerald/White palette).
- **Backend & Rule Engine:** Next.js REST API (`/api/swasthya`), deterministic 5-Category Bidirectional Evaluator & QuickSort Engine (`src/lib/quicksort-engine.ts`).
- **Database:** PostgreSQL 16 via `@electric-sql/pglite` (zero-config embedded PostgreSQL) + seamless cloud switch to **Supabase PostgreSQL** via `.env.local` (`src/lib/db.ts` & `src/lib/external-integrations.ts`).

---

## 4. Quick Start, Simultaneous Demo Accounts & Automated Testing

```bash
# 1. Install dependencies
npm install

# 2. Run the automated engine & end-to-end API scenario test suites (16/16 checks)
npm test

# 3. Start the development server on http://localhost:3000
npm run dev
```

### Simultaneous Multi-Tenant Demo Login Accounts (`DEMO ONLY`)

SwasthyaSense displays a dedicated **Product Landing Page** (with a Scroll-Driven 3D Patient Journey, 4-Step Interactive Pipeline, and 7-Language UI) before entering the clinical workspace. Three pre-seeded demo users can sign in **simultaneously** across separate tabs/browsers with independent HMAC-SHA256 session tokens and strict PostgreSQL Row-Level Security (RLS) tenant isolation:

| Person | Organization ID | User ID | Password | Role & Facility Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Clinic doctor** | `ORG-BOKO` | `doc.boko01` | `Boko@Demo#101` | Clinician, `HEX-0` Boko Central PHC |
| **Frontline worker** | `ORG-SEVAK` | `asha.sevak07` | `Sevak@Demo#207` | ASHA worker, Sevak 15-worker team |
| **Local clinic nurse** | `ORG-CHHAY` | `anm.chhay03` | `Chhay@Demo#303` | ANM nurse, `HEX-1` Chhaygaon North |

- Passwords are stored as cryptographic `scrypt` hashes (`src/lib/demo-seed-accounts.ts`), never plaintext.
- Entering 5 consecutive invalid passwords locks the account (`HTTP 423 Locked`).
- Attempting to access or mutate a patient belonging to another organization returns `HTTP 403 Not your organization (Cross-Tenant Isolation)` and logs the blocked attempt in the SHA-256 hash-chained audit ledger.

---

## 5. Connecting Live APIs & Cloud Credentials (`.env.local`)

Copy `.env.example` to `.env.local` and supply any of the following credentials to switch from the embedded sandbox to live cloud services:

```env
# 1. Supabase / PostgreSQL Database
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
DATABASE_URL="postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres"

# 2. WhatsApp Cloud API (Meta) or Twilio SMS Gateway
WHATSAPP_CLOUD_API_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""

# 3. 108 Rapid Ambulance Dispatch Webhook
AMBULANCE_108_WEBHOOK_URL=""
AMBULANCE_108_API_KEY=""

# 4. Health Facility Registry (HFR / H3 Hexagon Mesh)
FACILITY_REGISTRY_API_URL=""
FACILITY_REGISTRY_API_KEY=""
```

---

## 6. Safety & Non-Diagnostic Disclaimer

**SwasthyaSense is a non-diagnostic clinical decision-support and follow-up coordination prototype.** It does not diagnose disease, prescribe medication, or replace a qualified medical practitioner. All clinical alerts use transparent, clinician-authored rules and require human clinician oversight.

