-- ============================================================================
-- SWASTHYA SENSE — SUPABASE POSTGRESQL SCHEMA MIGRATION (WITH MULTI-TENANT RLS)
-- Target Project: https://givuusaxvalgcjaveobx.supabase.co
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  org_code TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  hexagon_id TEXT NOT NULL,
  adjacent_hexagons JSONB NOT NULL,
  tier TEXT NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 30,
  system_slots INTEGER NOT NULL DEFAULT 15,
  critical_slots INTEGER NOT NULL DEFAULT 5,
  walkin_slots INTEGER NOT NULL DEFAULT 10,
  clinician_on_duty BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  facility_id TEXT REFERENCES facilities(id),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  pseudonym TEXT NOT NULL,
  initials TEXT NOT NULL,
  age_band TEXT NOT NULL,
  village TEXT NOT NULL,
  facility_id TEXT REFERENCES facilities(id),
  hexagon_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  mobility TEXT NOT NULL DEFAULT 'independent',
  language TEXT NOT NULL DEFAULT 'en',
  assigned_worker_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  days_overdue INTEGER NOT NULL DEFAULT 0,
  consecutive_missed INTEGER NOT NULL DEFAULT 0,
  symptoms JSONB NOT NULL DEFAULT '[]',
  vitals_history JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS patient_contacts (
  patient_id TEXT PRIMARY KEY REFERENCES patients(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  phone_encrypted TEXT NOT NULL,
  phone_masked TEXT NOT NULL,
  preferred_channel TEXT NOT NULL DEFAULT 'whatsapp'
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  purpose TEXT NOT NULL,
  notice_version TEXT NOT NULL DEFAULT 'DPDP-2023-v1',
  channel TEXT NOT NULL,
  language TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TEXT NOT NULL,
  withdrawn_at TEXT
);

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  pseudonym TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  hexagon_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  priority_score INTEGER NOT NULL,
  why_flagged TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  clinician_id TEXT NOT NULL,
  status TEXT NOT NULL,
  sla_deadline TEXT NOT NULL,
  sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  outcome_note TEXT,
  referral_destination TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hex_broadcasts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  patient_id TEXT NOT NULL,
  pseudonym TEXT NOT NULL,
  origin_facility_id TEXT NOT NULL,
  origin_hexagon_id TEXT NOT NULL,
  target_hexagons JSONB NOT NULL,
  priority_score INTEGER NOT NULL,
  why_flagged TEXT NOT NULL,
  status TEXT NOT NULL,
  accepted_by_facility_id TEXT,
  accepted_by_clinician_id TEXT,
  accepted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ambulance_dispatches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  patient_id TEXT NOT NULL,
  pseudonym TEXT NOT NULL,
  village_landmark TEXT NOT NULL,
  cohort TEXT NOT NULL,
  mobility TEXT NOT NULL,
  origin_hexagon_id TEXT NOT NULL,
  destination_facility TEXT NOT NULL,
  paramedic_summary TEXT NOT NULL,
  vitals_snapshot TEXT NOT NULL,
  status TEXT NOT NULL,
  eta_minutes INTEGER NOT NULL,
  requested_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  patient_id TEXT NOT NULL,
  pseudonym TEXT NOT NULL,
  channel TEXT NOT NULL,
  language TEXT NOT NULL,
  template_key TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  reply_text TEXT,
  replied_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  patient_pseudonym TEXT,
  object_ref TEXT NOT NULL,
  result TEXT NOT NULL,
  reason TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  curr_hash TEXT NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — STRICT MULTI-TENANT ORGANIZATION ISOLATION
-- Prevents any public/anon read access and isolates tenants by organization_id
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hex_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_patients ON patients
  FOR ALL
  USING (organization_id = current_setting('request.jwt.claims', true)::json->>'organization_id');

CREATE POLICY tenant_isolation_contacts ON patient_contacts
  FOR ALL
  USING (
    organization_id = current_setting('request.jwt.claims', true)::json->>'organization_id'
    AND (current_setting('request.jwt.claims', true)::json->>'role') = 'worker'
  );
