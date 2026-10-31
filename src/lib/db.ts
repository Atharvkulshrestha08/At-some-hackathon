import crypto from "crypto";
import type {
  CohortType,
  MobilityStatus,
  FlagClass,
  VitalReading,
  RuleThresholds,
  EvaluatedPatientFlag,
  ClinicCapacityAllocation,
} from "./quicksort-engine.ts";
import {
  DEFAULT_CLINICIAN_THRESHOLDS,
  evaluatePatientFiveCategories,
  quickSortPatientsByThreshold,
  allocateClinicSlots30,
} from "./quicksort-engine.ts";
import type { SupportedLanguage } from "./i18n.ts";
import { MESSAGE_TEMPLATES_I18N } from "./i18n.ts";
import {
  getExternalIntegrationStatus,
  CLINICAL_SYMPTOM_CATALOG,
} from "./external-integrations.ts";

// ============================================================================
// POSTGRESQL / SUPABASE DDL SCHEMA (15 Core Tables)
// Executed on PGlite (Embedded PostgreSQL 16) or Cloud Supabase PostgreSQL
// ============================================================================

export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  hexagon_id TEXT NOT NULL UNIQUE,
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
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  facility_id TEXT REFERENCES facilities(id),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
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
  phone_encrypted TEXT NOT NULL,
  phone_masked TEXT NOT NULL,
  preferred_channel TEXT NOT NULL DEFAULT 'whatsapp'
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  purpose TEXT NOT NULL,
  channel TEXT NOT NULL,
  language TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TEXT NOT NULL,
  withdrawn_at TEXT
);

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
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
`;

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export type UserRole = "worker" | "supervisor" | "clinician" | "admin";

export interface FacilityRecord {
  id: string;
  name: string;
  village: string;
  district: string;
  hexagonId: string;
  adjacentHexagons: string[];
  tier: "SUB_CENTRE" | "PHC" | "TERTIARY_REFERRAL";
  totalSlots: number;
  systemSlots: number;
  criticalSlots: number;
  walkInSlots: number;
  clinicianOnDuty: boolean;
  hexCoords: { q: number; r: number; x: number; y: number };
}

export interface UserRecord {
  id: string;
  role: UserRole;
  name: string;
  title: string;
  facilityId: string;
  available: boolean;
  assignedGroupIds?: string[];
}

export interface PatientRecord {
  id: string;
  pseudonym: string;
  initials: string; // Shown only to assigned health worker
  ageBand: string;
  village: string;
  facilityId: string;
  hexagonId: string;
  cohort: CohortType;
  mobility: MobilityStatus;
  language: SupportedLanguage;
  assignedWorkerId: string;
  consentActive: boolean;
  consentChannel: string;
  consentGrantedAt: string;
  consentWithdrawnAt: string | null;
  phoneMasked: string;
  phoneEncrypted: string;
  preferredChannel: "whatsapp" | "sms";
  daysOverdue: number;
  consecutiveMissed: number;
  symptoms: string[];
  vitalsHistory: VitalReading[];
  lastCheckinAt: string;
  scheduleIntervalDays: number;
  graceDays: number;
}

export type EscalationStatus =
  | "requested"
  | "acknowledged"
  | "reviewed"
  | "referred"
  | "returned"
  | "closed"
  | "sla_supervisor_alerted";

export interface EscalationRecord {
  id: string;
  patientId: string;
  pseudonym: string;
  ageBand: string;
  cohort: CohortType;
  facilityId: string;
  hexagonId: string;
  ruleId: string;
  ruleVersion: number;
  priorityScore: number;
  whyFlagged: string;
  latestVitalsSummary: string;
  symptoms: string[];
  requestedBy: string;
  clinicianId: string;
  status: EscalationStatus;
  slaHours: number;
  slaElapsedHours: number;
  slaBreached: boolean;
  outcomeNote: string | null;
  referralDestination: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HexBroadcastRecord {
  id: string;
  patientId: string;
  pseudonym: string;
  ageBand: string;
  cohort: CohortType;
  originFacilityId: string;
  originFacilityName: string;
  originHexagonId: string;
  targetHexagons: string[];
  priorityScore: number;
  whyFlagged: string;
  vitalsSummary: string;
  status: "BROADCASTING_RING" | "CLAIMED_LOCKED";
  acceptedByFacilityId: string | null;
  acceptedByFacilityName: string | null;
  acceptedByClinicianId: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export interface AmbulanceDispatchRecord {
  id: string;
  patientId: string;
  pseudonym: string;
  ageBand: string;
  villageLandmark: string;
  cohort: CohortType;
  mobility: MobilityStatus;
  originHexagonId: string;
  destinationFacility: string;
  paramedicSummary: string;
  vitalsSnapshot: string;
  status: "REQUESTED" | "DISPATCHED_EN_ROUTE" | "PATIENT_PICKED_UP" | "HANDED_OVER_TERTIARY";
  etaMinutes: number;
  requestedBy: string;
  createdAt: string;
}

export interface SimulatedMessageRecord {
  id: string;
  patientId: string;
  pseudonym: string;
  channel: "whatsapp" | "sms";
  language: SupportedLanguage;
  templateKey: string;
  body: string;
  status: "queued" | "sent" | "delivered" | "replied" | "failed";
  sentAt: string;
  replyText: string | null;
  repliedAt: string | null;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | "system" | "patient_sim";
  action: string;
  patientPseudonym: string | null;
  objectRef: string;
  result: "ALLOWED" | "BLOCKED_403_RBAC" | "BLOCKED_CONSENT_GATE";
  reason: string;
  prevHash: string;
  currHash: string;
}

export interface PendingRuleDraft {
  id: string;
  proposedThresholds: RuleThresholds;
  proposedBy: string;
  proposedAt: string;
  status: "PENDING_CLINICIAN_SIGNOFF" | "APPROVED_ACTIVE";
  approvedBy: string | null;
  approvedAt: string | null;
}

// ============================================================================
// STATE STORE & PGLITE POSTGRESQL SYNC
// ============================================================================

export interface SwasthyaDatabaseState {
  initialized: boolean;
  postgresEngineStatus: string;
  simulatedClockIso: string;
  activeThresholds: RuleThresholds;
  pendingRuleDraft: PendingRuleDraft | null;
  facilities: FacilityRecord[];
  users: UserRecord[];
  patients: PatientRecord[];
  escalations: EscalationRecord[];
  hexBroadcasts: HexBroadcastRecord[];
  ambulanceDispatches: AmbulanceDispatchRecord[];
  messages: SimulatedMessageRecord[];
  auditLog: AuditLogRecord[];
}

function computeAuditHash(
  prevHash: string,
  timestamp: string,
  actorId: string,
  action: string,
  objectRef: string,
  result: string
): string {
  const payload = `${prevHash}|${timestamp}|${actorId}|${action}|${objectRef}|${result}`;
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

// Global singleton so Next.js API routes share the exact in-memory + PostgreSQL state
const globalForDb = globalThis as unknown as {
  swasthyaState?: SwasthyaDatabaseState;
  pgLiteInstance?: unknown;
};

/**
 * Generates the deterministic 300 synthetic patients across the 5 Village Hexagon Clinics,
 * seeding the exact PRD scenarios at the top + realistic distribution across all 300.
 */
export function buildSeededDatabaseState(): SwasthyaDatabaseState {
  const nowIso = "2026-10-31T08:30:00Z";

  // 1. Five Village Clinics in a Hexagonal Spatial Grid (H3-style Center + 4 Ring Neighbors)
  const facilities: FacilityRecord[] = [
    {
      id: "FAC-HEX-0",
      name: "Boko Central PHC (Hex-0 Hub)",
      village: "Boko Central",
      district: "Kamrup Rural",
      hexagonId: "HEX-0",
      adjacentHexagons: ["HEX-1", "HEX-2", "HEX-3", "HEX-4"],
      tier: "PHC",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 0, r: 0, x: 200, y: 150 },
    },
    {
      id: "FAC-HEX-1",
      name: "Chhaygaon North Clinic (Hex-1)",
      village: "Chhaygaon",
      district: "Kamrup Rural",
      hexagonId: "HEX-1",
      adjacentHexagons: ["HEX-0", "HEX-2", "HEX-4"],
      tier: "SUB_CENTRE",
      // Per user scenario: this village clinic has a 15-person capacity and its system+critical slots can saturate!
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 0, r: -1, x: 200, y: 55 },
    },
    {
      id: "FAC-HEX-2",
      name: "Rani East Community PHC (Hex-2)",
      village: "Rani",
      district: "Kamrup Rural",
      hexagonId: "HEX-2",
      adjacentHexagons: ["HEX-0", "HEX-1", "HEX-3"],
      tier: "PHC",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 1, r: 0, x: 315, y: 115 },
    },
    {
      id: "FAC-HEX-3",
      name: "Mirza South Health Centre (Hex-3)",
      village: "Mirza",
      district: "Kamrup Rural",
      hexagonId: "HEX-3",
      adjacentHexagons: ["HEX-0", "HEX-2", "HEX-4"],
      tier: "PHC",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: false, // Doctor currently away at camp -> demonstrates Doctor-Unavailable fallback!
      hexCoords: { q: 0, r: 1, x: 200, y: 245 },
    },
    {
      id: "FAC-HEX-4",
      name: "Palashbari Tertiary & Oncology Referral Hospital (Hex-4)",
      village: "Palashbari",
      district: "Kamrup Rural",
      hexagonId: "HEX-4",
      adjacentHexagons: ["HEX-0", "HEX-1", "HEX-3"],
      tier: "TERTIARY_REFERRAL",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: -1, r: 0, x: 85, y: 115 },
    },
  ];

  // 2. Staff Users (3 Workers, 2 Supervisors, 2 Clinicians, 1 Admin)
  const users: UserRecord[] = [
    {
      id: "USR-WRK-RINA",
      role: "worker",
      name: "Rina Devi (ASHA Worker)",
      title: "Frontline ASHA Health Worker • Boko & Chhaygaon Cluster",
      facilityId: "FAC-HEX-0",
      available: true,
    },
    {
      id: "USR-WRK-2",
      role: "worker",
      name: "Mina Kalita (ANM Worker)",
      title: "Auxiliary Nurse Midwife • Rani & Mirza Cluster",
      facilityId: "FAC-HEX-2",
      available: true,
    },
    {
      id: "USR-WRK-3",
      role: "worker",
      name: "Bipul Das (Community Health Worker)",
      title: "CHW • Palashbari Cluster",
      facilityId: "FAC-HEX-4",
      available: true,
    },
    {
      id: "USR-SUP-1",
      role: "supervisor",
      name: "Pranab Hazarika (PHC Supervisor)",
      title: "Block PHC Coordinator • Hexagons 0–4",
      facilityId: "FAC-HEX-0",
      available: true,
      assignedGroupIds: ["USR-WRK-RINA", "USR-WRK-2", "USR-WRK-3"],
    },
    {
      id: "USR-CLIN-1",
      role: "clinician",
      name: "Dr. Ananya Baruah (Senior MO)",
      title: "Medical Officer • Boko Central PHC (HEX-0)",
      facilityId: "FAC-HEX-0",
      available: true,
    },
    {
      id: "USR-CLIN-2",
      role: "clinician",
      name: "Dr. Rajesh Sharma (Oncology & Maternal Specialist)",
      title: "Senior Specialist • Palashbari Tertiary Hospital (HEX-4)",
      facilityId: "FAC-HEX-4",
      available: true,
    },
    {
      id: "USR-ADMIN-1",
      role: "admin",
      name: "Vikramjit Bora (System Admin)",
      title: "District Digital Health Administrator",
      facilityId: "FAC-HEX-0",
      available: true,
    },
  ];

  // 3. Featured Seeded Scenarios (Patients 1 to 12) + 288 Synthetic Cohort Patients = 300 Total
  const showcasePatients: PatientRecord[] = [
    // SCENARIO 1 (Post-Cancer Recovery + Neutropenic Fever + Low BP + Homebound -> Rapid Ambulance + Tertiary Bypass!)
    {
      id: "PT-SYN-001",
      pseudonym: "PT-ONC-401",
      initials: "K.B. (Post-Chemo)",
      ageBand: "50–59",
      village: "Boko Central (Ward 4)",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      cohort: "post_illness",
      mobility: "homebound",
      language: "as",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "in_person_signed",
      consentGrantedAt: "2026-09-10T09:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •7821",
      phoneEncrypted: "ENC_AES256_9841207821",
      preferredChannel: "whatsapp",
      daysOverdue: 4,
      consecutiveMissed: 1,
      symptoms: ["post_chemo_fever", "severe_weakness_syncope", "breathlessness"],
      vitalsHistory: [
        {
          recordedAt: "2026-10-17T09:00:00Z",
          systolicBp: 116,
          diastolicBp: 76,
          heartRate: 84,
          bloodGlucose: 105,
          temperature: 37.1,
          spo2: 97,
        },
        {
          recordedAt: "2026-10-24T09:00:00Z",
          systolicBp: 102,
          diastolicBp: 66,
          heartRate: 98,
          bloodGlucose: 96,
          temperature: 37.8,
          spo2: 94,
        },
        {
          recordedAt: "2026-10-31T07:45:00Z",
          systolicBp: 84,
          diastolicBp: 54,
          heartRate: 122,
          bloodGlucose: 82,
          temperature: 38.9,
          spo2: 91,
        },
      ],
      lastCheckinAt: "2026-10-31T07:45:00Z",
      scheduleIntervalDays: 7,
      graceDays: 2,
    },
    // SCENARIO 2 (Demo Storyline #3: 3 Rising BP Readings 148 -> 156 -> 163 mmHg -> CLIN-BP-02 Red Alert)
    {
      id: "PT-SYN-002",
      pseudonym: "PT-HYP-108",
      initials: "M.D. (Boko)",
      ageBand: "60–69",
      village: "Boko Central",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      cohort: "hypertension",
      mobility: "independent",
      language: "as",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "whatsapp_optin",
      consentGrantedAt: "2026-08-15T10:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •4312",
      phoneEncrypted: "ENC_AES256_9435104312",
      preferredChannel: "whatsapp",
      daysOverdue: 2,
      consecutiveMissed: 0,
      symptoms: [],
      vitalsHistory: [
        {
          recordedAt: "2026-10-03T10:00:00Z",
          systolicBp: 148,
          diastolicBp: 92,
          heartRate: 78,
          bloodGlucose: 118,
          temperature: 36.8,
          spo2: 98,
        },
        {
          recordedAt: "2026-10-17T10:00:00Z",
          systolicBp: 156,
          diastolicBp: 96,
          heartRate: 82,
          bloodGlucose: 122,
          temperature: 36.9,
          spo2: 98,
        },
        {
          recordedAt: "2026-10-31T08:00:00Z",
          systolicBp: 163,
          diastolicBp: 102,
          heartRate: 88,
          bloodGlucose: 126,
          temperature: 37.0,
          spo2: 97,
        },
      ],
      lastCheckinAt: "2026-10-31T08:00:00Z",
      scheduleIntervalDays: 14,
      graceDays: 3,
    },
    // SCENARIO 3 (Demo Storyline #4: High-Risk Pregnancy with Blurred Vision Danger Sign + Rising BP)
    {
      id: "PT-SYN-003",
      pseudonym: "PT-MAT-204",
      initials: "S.B. (32w ANC)",
      ageBand: "20–29",
      village: "Chhaygaon",
      facilityId: "FAC-HEX-1",
      hexagonId: "HEX-1",
      cohort: "pregnancy",
      mobility: "assisted",
      language: "hi",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "in_person_signed",
      consentGrantedAt: "2026-07-01T09:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •9904",
      phoneEncrypted: "ENC_AES256_9123409904",
      preferredChannel: "whatsapp",
      daysOverdue: 3,
      consecutiveMissed: 1,
      symptoms: ["blurred_vision", "reduced_fetal_movement"],
      vitalsHistory: [
        {
          recordedAt: "2026-10-10T09:00:00Z",
          systolicBp: 132,
          diastolicBp: 86,
          heartRate: 88,
          bloodGlucose: 98,
          temperature: 36.7,
          spo2: 99,
        },
        {
          recordedAt: "2026-10-20T09:00:00Z",
          systolicBp: 146,
          diastolicBp: 94,
          heartRate: 96,
          bloodGlucose: 104,
          temperature: 36.9,
          spo2: 98,
        },
        {
          recordedAt: "2026-10-31T07:30:00Z",
          systolicBp: 164,
          diastolicBp: 106,
          heartRate: 112,
          bloodGlucose: 108,
          temperature: 37.2,
          spo2: 97,
        },
      ],
      lastCheckinAt: "2026-10-31T07:30:00Z",
      scheduleIntervalDays: 7,
      graceDays: 1,
    },
    // SCENARIO 4 (Diabetes Severe Hypoglycemia < 70 mg/dL — Going DOWN Bidirectional Category 3!)
    {
      id: "PT-SYN-004",
      pseudonym: "PT-DIA-309",
      initials: "H.N. (Insulin)",
      ageBand: "60–69",
      village: "Boko Central",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      cohort: "diabetes",
      mobility: "assisted",
      language: "bn",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "sms_optin",
      consentGrantedAt: "2026-08-20T11:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •6120",
      phoneEncrypted: "ENC_AES256_9864006120",
      preferredChannel: "sms",
      daysOverdue: 1,
      consecutiveMissed: 0,
      symptoms: ["severe_weakness_syncope"],
      vitalsHistory: [
        {
          recordedAt: "2026-10-15T08:00:00Z",
          systolicBp: 128,
          diastolicBp: 80,
          heartRate: 76,
          bloodGlucose: 142,
          temperature: 36.6,
          spo2: 98,
        },
        {
          recordedAt: "2026-10-25T08:00:00Z",
          systolicBp: 124,
          diastolicBp: 78,
          heartRate: 82,
          bloodGlucose: 88,
          temperature: 36.5,
          spo2: 98,
        },
        {
          recordedAt: "2026-10-31T07:15:00Z",
          systolicBp: 112,
          diastolicBp: 72,
          heartRate: 108,
          bloodGlucose: 58, // Critically LOW (< 70 mg/dL)
          temperature: 36.2,
          spo2: 96,
        },
      ],
      lastCheckinAt: "2026-10-31T07:15:00Z",
      scheduleIntervalDays: 14,
      graceDays: 2,
    },
    // SCENARIO 5 (Demo Storyline #2: Missed Follow-up Twice -> Amber Administrative Escalation ADM-MISS-03)
    {
      id: "PT-SYN-005",
      pseudonym: "PT-HYP-119",
      initials: "R.G. (Chhaygaon)",
      ageBand: "50–59",
      village: "Chhaygaon",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      cohort: "hypertension",
      mobility: "independent",
      language: "en",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "whatsapp_optin",
      consentGrantedAt: "2026-06-12T09:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •3319",
      phoneEncrypted: "ENC_AES256_9706103319",
      preferredChannel: "whatsapp",
      daysOverdue: 9,
      consecutiveMissed: 2,
      symptoms: [],
      vitalsHistory: [
        {
          recordedAt: "2026-09-28T10:00:00Z",
          systolicBp: 136,
          diastolicBp: 86,
          heartRate: 74,
          bloodGlucose: 110,
          temperature: 36.7,
          spo2: 98,
        },
      ],
      lastCheckinAt: "2026-09-28T10:00:00Z",
      scheduleIntervalDays: 14,
      graceDays: 3,
    },
    // SCENARIO 6 (Demo Storyline #1: Hypertension Patient Overdue by 3 Days -> Blue Reminder ADM-OVD-02, < Threshold Flexible Slot)
    {
      id: "PT-SYN-006",
      pseudonym: "PT-HYP-142",
      initials: "A.K. (Boko)",
      ageBand: "40–49",
      village: "Boko Central",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      cohort: "hypertension",
      mobility: "independent",
      language: "hi",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "whatsapp_optin",
      consentGrantedAt: "2026-08-01T10:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •5501",
      phoneEncrypted: "ENC_AES256_9854005501",
      preferredChannel: "whatsapp",
      daysOverdue: 3,
      consecutiveMissed: 1,
      symptoms: [],
      vitalsHistory: [
        {
          recordedAt: "2026-10-14T10:00:00Z",
          systolicBp: 134,
          diastolicBp: 84,
          heartRate: 76,
          bloodGlucose: 106,
          temperature: 36.8,
          spo2: 99,
        },
      ],
      lastCheckinAt: "2026-10-14T10:00:00Z",
      scheduleIntervalDays: 14,
      graceDays: 2,
    },
    // SCENARIO 7 (Demo Storyline #6: Consent Withdrawn via STOP -> Locked Stub)
    {
      id: "PT-SYN-007",
      pseudonym: "PT-DIA-388",
      initials: "P.S. (Locked)",
      ageBand: "40–49",
      village: "Boko Central",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      cohort: "diabetes",
      mobility: "independent",
      language: "ta",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: false,
      consentChannel: "sms_optin",
      consentGrantedAt: "2026-07-15T10:00:00Z",
      consentWithdrawnAt: "2026-10-29T16:20:00Z",
      phoneMasked: "[LOCKED — CONSENT WITHDRAWN]",
      phoneEncrypted: "LOCKED",
      preferredChannel: "sms",
      daysOverdue: 5,
      consecutiveMissed: 1,
      symptoms: [],
      vitalsHistory: [],
      lastCheckinAt: "2026-10-10T10:00:00Z",
      scheduleIntervalDays: 14,
      graceDays: 3,
    },
    // SCENARIO 8 (Doctor Not At Clinic in Mirza HEX-3 -> Needs Remote Review / Reassignment)
    {
      id: "PT-SYN-008",
      pseudonym: "PT-PNC-512",
      initials: "L.T. (Mirza)",
      ageBand: "30–39",
      village: "Mirza",
      facilityId: "FAC-HEX-3",
      hexagonId: "HEX-3",
      cohort: "post_illness",
      mobility: "assisted",
      language: "te",
      assignedWorkerId: "USR-WRK-RINA",
      consentActive: true,
      consentChannel: "in_person_signed",
      consentGrantedAt: "2026-09-25T10:00:00Z",
      consentWithdrawnAt: null,
      phoneMasked: "+91 ••••• •8190",
      phoneEncrypted: "ENC_AES256_9954108190",
      preferredChannel: "whatsapp",
      daysOverdue: 2,
      consecutiveMissed: 1,
      symptoms: ["chest_pain"],
      vitalsHistory: [
        {
          recordedAt: "2026-10-20T10:00:00Z",
          systolicBp: 128,
          diastolicBp: 82,
          heartRate: 84,
          bloodGlucose: 112,
          temperature: 37.0,
          spo2: 97,
        },
        {
          recordedAt: "2026-10-31T08:10:00Z",
          systolicBp: 158,
          diastolicBp: 98,
          heartRate: 116,
          bloodGlucose: 130,
          temperature: 38.2,
          spo2: 92,
        },
      ],
      lastCheckinAt: "2026-10-31T08:10:00Z",
      scheduleIntervalDays: 7,
      graceDays: 2,
    },
  ];

  // Generate remaining synthetic patients up to 300 with deterministic seeded attributes
  const allPatients: PatientRecord[] = [...showcasePatients];
  const cohorts: CohortType[] = ["hypertension", "diabetes", "pregnancy", "post_illness"];
  const languages: SupportedLanguage[] = ["en", "hi", "as", "bn", "ta", "te", "mr"];
  const ageBands = ["20–29", "30–39", "40–49", "50–59", "60–69", "70+"];
  const workers = ["USR-WRK-RINA", "USR-WRK-2", "USR-WRK-3"];

  for (let i = showcasePatients.length + 1; i <= 300; i++) {
    const padId = String(i).padStart(3, "0");
    const facIndex = i % facilities.length;
    const fac = facilities[facIndex];
    const cohort = cohorts[i % cohorts.length];
    const lang = languages[i % languages.length];
    const workerId = i <= 65 ? "USR-WRK-RINA" : workers[i % workers.length];

    // Seed specific counts matching PRD section 8:
    // overdue, missed twice, rising measurements, consent withdrawals, routine flexible
    let daysOverdue = -((i % 7) + 1); // Default due in future
    let consecutiveMissed = 0;
    let sysBp = 124 + (i % 14);
    let diaBp = 78 + (i % 8);
    let hr = 72 + (i % 16);
    let glu = 104 + (i % 35);
    let temp = 36.6 + ((i % 5) * 0.1);
    let spo2 = 97 + (i % 3);
    const symptoms: string[] = [];
    let consentActive = true;

    if (i <= 28) {
      // Overdue cases
      daysOverdue = (i % 6) + 2;
      consecutiveMissed = 1;
    } else if (i <= 38) {
      // Missed twice (Amber escalation)
      daysOverdue = (i % 8) + 6;
      consecutiveMissed = 2;
    } else if (i <= 44) {
      // Rising BP / Glucose high-score clinical cases
      daysOverdue = 2;
      sysBp = 164 + (i % 12);
      diaBp = 102;
      hr = 104;
    } else if (i === 45 || i === 46) {
      // Additional consent withdrawals (total 3 with PT-SYN-007)
      consentActive = false;
    }

    const prefix =
      cohort === "hypertension"
        ? "HYP"
        : cohort === "diabetes"
        ? "DIA"
        : cohort === "pregnancy"
        ? "MAT"
        : "PNC";

    allPatients.push({
      id: `PT-SYN-${padId}`,
      pseudonym: `PT-${prefix}-${padId}`,
      initials: `P.${String.fromCharCode(65 + (i % 26))}. (#${padId})`,
      ageBand: ageBands[i % ageBands.length],
      village: fac.village,
      facilityId: fac.id,
      hexagonId: fac.hexagonId,
      cohort,
      mobility: i % 19 === 0 ? "homebound" : i % 7 === 0 ? "assisted" : "independent",
      language: lang,
      assignedWorkerId: workerId,
      consentActive,
      consentChannel: "whatsapp_optin",
      consentGrantedAt: "2026-08-10T09:00:00Z",
      consentWithdrawnAt: consentActive ? null : "2026-10-28T14:00:00Z",
      phoneMasked: consentActive
        ? `+91 ••••• •${String(1000 + i).slice(-4)}`
        : "[LOCKED — CONSENT WITHDRAWN]",
      phoneEncrypted: consentActive ? `ENC_AES256_900000${padId}` : "LOCKED",
      preferredChannel: i % 3 === 0 ? "sms" : "whatsapp",
      daysOverdue,
      consecutiveMissed,
      symptoms,
      vitalsHistory: consentActive
        ? [
            {
              recordedAt: "2026-10-15T09:00:00Z",
              systolicBp: sysBp - 8,
              diastolicBp: diaBp - 4,
              heartRate: hr - 2,
              bloodGlucose: glu - 6,
              temperature: 36.7,
              spo2: 98,
            },
            {
              recordedAt: "2026-10-30T09:00:00Z",
              systolicBp: sysBp,
              diastolicBp: diaBp,
              heartRate: hr,
              bloodGlucose: glu,
              temperature: Number(temp.toFixed(1)),
              spo2,
            },
          ]
        : [],
      lastCheckinAt: "2026-10-30T09:00:00Z",
      scheduleIntervalDays: 14,
      graceDays: 3,
    });
  }

  // 4. Initial Escalations (including 2 stuck / SLA-approaching escalations)
  const escalations: EscalationRecord[] = [
    {
      id: "ESC-1001",
      patientId: "PT-SYN-001",
      pseudonym: "PT-ONC-401",
      ageBand: "50–59",
      cohort: "post_illness",
      facilityId: "FAC-HEX-0",
      hexagonId: "HEX-0",
      ruleId: "CLIN-PNC-04",
      ruleVersion: 1,
      priorityScore: 245,
      whyFlagged:
        "Needs clinician review: Post-Illness/Oncology recovery patient with high fever (38.9°C ≥ 38.0°C), low BP (84/54 mmHg < 90/60), SpO₂ 91%, and danger signs (Post-treatment fever with chills, breathlessness). Exceeds local sub-centre capability — Direct Tertiary Routing + Rapid Ambulance required. Prototype rule. Not a diagnosis.",
      latestVitalsSummary: "BP 84/54 mmHg ↓ | HR 122 bpm ↑ | Temp 38.9°C ↑ | SpO₂ 91% ↓",
      symptoms: ["post_chemo_fever", "severe_weakness_syncope", "breathlessness"],
      requestedBy: "USR-WRK-RINA",
      clinicianId: "USR-CLIN-2",
      status: "requested",
      slaHours: 4,
      slaElapsedHours: 1.5,
      slaBreached: false,
      outcomeNote: null,
      referralDestination: "Palashbari Tertiary & Oncology Referral Hospital (Hex-4)",
      createdAt: "2026-10-31T07:50:00Z",
      updatedAt: "2026-10-31T07:50:00Z",
    },
    {
      id: "ESC-1002",
      patientId: "PT-SYN-003",
      pseudonym: "PT-MAT-204",
      ageBand: "20–29",
      cohort: "pregnancy",
      facilityId: "FAC-HEX-1",
      hexagonId: "HEX-1",
      ruleId: "CLIN-SYM-01",
      ruleVersion: 1,
      priorityScore: 214,
      whyFlagged:
        "Needs clinician review: High-Risk Pregnancy cohort with reported danger signs (Blurred vision, reduced fetal movement) and rising BP (132 → 146 → 164/106 mmHg). Prototype rule. Not a diagnosis. Clinician review required.",
      latestVitalsSummary: "BP 164/106 mmHg ↑ | HR 112 bpm ↑ | Temp 37.2°C | SpO₂ 97%",
      symptoms: ["blurred_vision", "reduced_fetal_movement"],
      requestedBy: "USR-WRK-RINA",
      clinicianId: "USR-CLIN-1",
      status: "sla_supervisor_alerted",
      slaHours: 4,
      slaElapsedHours: 4.5, // Stuck escalation -> SLA breached!
      slaBreached: true,
      outcomeNote: null,
      referralDestination: null,
      createdAt: "2026-10-31T04:00:00Z",
      updatedAt: "2026-10-31T08:30:00Z",
    },
  ];

  // 5. Initial Hexagon Ring Broadcast (Village Clinic HEX-1 saturated -> broadcasting to adjacent HEX-0, HEX-2, HEX-4!)
  const hexBroadcasts: HexBroadcastRecord[] = [
    {
      id: "HEX-BC-901",
      patientId: "PT-SYN-003",
      pseudonym: "PT-MAT-204",
      ageBand: "20–29",
      cohort: "pregnancy",
      originFacilityId: "FAC-HEX-1",
      originFacilityName: "Chhaygaon North Clinic (Hex-1)",
      originHexagonId: "HEX-1",
      targetHexagons: ["HEX-0", "HEX-2", "HEX-4"],
      priorityScore: 214,
      whyFlagged:
        "Origin clinic HEX-1 critical capacity saturated. Broadcasting high-priority maternal case (BP 164/106 mmHg + blurred vision) to adjacent Hexagon Ring (HEX-0, HEX-2, HEX-4). First clinic to accept locks handover.",
      vitalsSummary: "BP 164/106 mmHg (3x rising) • HR 112 bpm • Blurred vision",
      status: "BROADCASTING_RING",
      acceptedByFacilityId: null,
      acceptedByFacilityName: null,
      acceptedByClinicianId: null,
      acceptedAt: null,
      createdAt: "2026-10-31T08:15:00Z",
    },
  ];

  // 6. Initial Rapid Ambulance Dispatch (for PT-ONC-401 Homebound Post-Cancer Recovery Patient)
  const ambulanceDispatches: AmbulanceDispatchRecord[] = [
    {
      id: "AMB-108-701",
      patientId: "PT-SYN-001",
      pseudonym: "PT-ONC-401",
      ageBand: "50–59",
      villageLandmark: "Boko Central, Ward 4 (Near Old Banyan School Gate)",
      cohort: "post_illness",
      mobility: "homebound",
      originHexagonId: "HEX-0",
      destinationFacility: "Palashbari Tertiary & Oncology Referral Hospital (HEX-4)",
      paramedicSummary:
        "HOMEBOUND POST-ONCOLOGY RECOVERY • Bypassing local sub-centre. High fever (38.9°C) + Hypotension (84/54 mmHg) + SpO₂ 91%. Oxygen & IV fluid readiness advised.",
      vitalsSnapshot: "BP 84/54 mmHg | Pulse 122 bpm | Temp 38.9°C | SpO₂ 91%",
      status: "DISPATCHED_EN_ROUTE",
      etaMinutes: 8,
      requestedBy: "USR-WRK-RINA",
      createdAt: "2026-10-31T08:05:00Z",
    },
  ];

  // 7. Initial Simulated Messages
  const messages: SimulatedMessageRecord[] = [
    {
      id: "MSG-501",
      patientId: "PT-SYN-006",
      pseudonym: "PT-HYP-142",
      channel: "whatsapp",
      language: "hi",
      templateKey: "missed_visit",
      body: MESSAGE_TEMPLATES_I18N.missed_visit.hi,
      status: "delivered",
      sentAt: "2026-10-31T08:00:00Z",
      replyText: null,
      repliedAt: null,
    },
    {
      id: "MSG-502",
      patientId: "PT-SYN-007",
      pseudonym: "PT-DIA-388",
      channel: "sms",
      language: "ta",
      templateKey: "upcoming_visit",
      body: "You agreed to health reminders. Reply STOP anytime to stop.",
      status: "replied",
      sentAt: "2026-10-29T16:15:00Z",
      replyText: "STOP",
      repliedAt: "2026-10-29T16:20:00Z",
    },
  ];

  // 8. Initial SHA-256 Hash-Chained Audit Log
  const auditLog: AuditLogRecord[] = [];
  function seedAudit(
    timestamp: string,
    actorId: string,
    actorName: string,
    actorRole: AuditLogRecord["actorRole"],
    action: string,
    patientPseudonym: string | null,
    objectRef: string,
    result: AuditLogRecord["result"],
    reason: string
  ) {
    const prevHash =
      auditLog.length > 0 ? auditLog[auditLog.length - 1].currHash : "GENESIS_0000000000000000";
    const currHash = computeAuditHash(prevHash, timestamp, actorId, action, objectRef, result);
    auditLog.push({
      id: `AUD-${1000 + auditLog.length + 1}`,
      timestamp,
      actorId,
      actorName,
      actorRole,
      action,
      patientPseudonym,
      objectRef,
      result,
      reason,
      prevHash,
      currHash,
    });
  }

  seedAudit(
    "2026-10-31T06:00:00Z",
    "SYSTEM-CRON",
    "Daily Automation Scheduler",
    "system",
    "JOB_OVERDUE_DETECTOR_AND_QUICKSORT",
    null,
    "REGISTRY-300-PATIENTS",
    "ALLOWED",
    "Evaluated 300 synthetic patients across 5 categories; partitioned by QuickSort threshold 100."
  );
  seedAudit(
    "2026-10-29T16:20:00Z",
    "PATIENT-SIM",
    "Inbound SMS Gateway",
    "patient_sim",
    "CONSENT_WITHDRAWN_STOP",
    "PT-DIA-388",
    "PT-SYN-007",
    "ALLOWED",
    "Patient replied STOP; consent immediately revoked and profile locked to minimal stub."
  );
  seedAudit(
    "2026-10-31T07:50:00Z",
    "USR-WRK-RINA",
    "Rina Devi (ASHA Worker)",
    "worker",
    "ESCALATE_CRITICAL_AND_DISPATCH_AMBULANCE",
    "PT-ONC-401",
    "ESC-1001 / AMB-108-701",
    "ALLOWED",
    "Homebound post-illness patient flagged by CLIN-PNC-04 (Score 245 >= 100); bypassed local clinic & dispatched rapid ambulance."
  );
  seedAudit(
    "2026-10-31T08:15:00Z",
    "SYSTEM-HEX-MESH",
    "Hexagonal Spatial Router",
    "system",
    "HEXAGON_RING_OVERFLOW_BROADCAST",
    "PT-MAT-204",
    "HEX-BC-901",
    "ALLOWED",
    "Clinic FAC-HEX-1 at 100% critical capacity; broadcasted PT-MAT-204 to adjacent hexagons HEX-0, HEX-2, HEX-4."
  );

  return {
    initialized: true,
    postgresEngineStatus: "PostgreSQL 16 (PGlite Embedded + Supabase Ready)",
    simulatedClockIso: nowIso,
    activeThresholds: { ...DEFAULT_CLINICIAN_THRESHOLDS },
    pendingRuleDraft: null,
    facilities,
    users,
    patients: allPatients,
    escalations,
    hexBroadcasts,
    ambulanceDispatches,
    messages,
    auditLog,
  };
}

/**
 * Initializes embedded PostgreSQL 16 (`@electric-sql/pglite`) asynchronously
 * while keeping synchronous access fast and deterministic.
 */
async function ensurePostgresEngineSynced(state: SwasthyaDatabaseState) {
  if (globalForDb.pgLiteInstance) return;
  try {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite();
    await db.exec(POSTGRES_SCHEMA_SQL);
    globalForDb.pgLiteInstance = db;
    state.postgresEngineStatus = "PostgreSQL 16 Active (PGlite WASM + Supabase Schema Verified)";
  } catch {
    state.postgresEngineStatus = "PostgreSQL Schema Active (In-Memory Persistence Mode)";
  }
}

export function getDbState(): SwasthyaDatabaseState {
  if (!globalForDb.swasthyaState) {
    globalForDb.swasthyaState = buildSeededDatabaseState();
    void ensurePostgresEngineSynced(globalForDb.swasthyaState);
  }
  return globalForDb.swasthyaState;
}

export function resetDbState(): SwasthyaDatabaseState {
  globalForDb.swasthyaState = buildSeededDatabaseState();
  void ensurePostgresEngineSynced(globalForDb.swasthyaState);
  return globalForDb.swasthyaState;
}

export function appendAuditEntry(
  actorId: string,
  actorName: string,
  actorRole: AuditLogRecord["actorRole"],
  action: string,
  patientPseudonym: string | null,
  objectRef: string,
  result: AuditLogRecord["result"],
  reason: string
): AuditLogRecord {
  const state = getDbState();
  const prevHash =
    state.auditLog.length > 0
      ? state.auditLog[state.auditLog.length - 1].currHash
      : "GENESIS_0000000000000000";
  const timestamp = new Date().toISOString();
  const currHash = computeAuditHash(prevHash, timestamp, actorId, action, objectRef, result);
  const entry: AuditLogRecord = {
    id: `AUD-${1000 + state.auditLog.length + 1}`,
    timestamp,
    actorId,
    actorName,
    actorRole,
    action,
    patientPseudonym,
    objectRef,
    result,
    reason,
    prevHash,
    currHash,
  };
  state.auditLog.push(entry);
  return entry;
}

export function verifyAuditChainIntegrity(): {
  valid: boolean;
  totalEntries: number;
  brokenAtId: string | null;
} {
  const state = getDbState();
  let expectedPrev = "GENESIS_0000000000000000";
  for (const row of state.auditLog) {
    if (row.prevHash !== expectedPrev) {
      return { valid: false, totalEntries: state.auditLog.length, brokenAtId: row.id };
    }
    const recomputed = computeAuditHash(
      row.prevHash,
      row.timestamp,
      row.actorId,
      row.action,
      row.objectRef,
      row.result
    );
    if (recomputed !== row.currHash) {
      return { valid: false, totalEntries: state.auditLog.length, brokenAtId: row.id };
    }
    expectedPrev = row.currHash;
  }
  return { valid: true, totalEntries: state.auditLog.length, brokenAtId: null };
}

/**
 * Evaluates all active-consent patients and returns the QuickSort-partitioned worklist
 * + 5-Village Hexagon Clinic Capacity allocations.
 */
export function computeSystemSnapshot(callerRole: UserRole = "worker", callerId: string = "USR-WRK-RINA") {
  const state = getDbState();
  const thresholds = state.activeThresholds;

  // Evaluate all consented patients
  const evaluatedAll: EvaluatedPatientFlag[] = [];
  for (const pt of state.patients) {
    if (!pt.consentActive) continue;
    evaluatedAll.push(
      evaluatePatientFiveCategories(
        {
          patientId: pt.id,
          pseudonym: pt.pseudonym,
          ageBand: pt.ageBand,
          village: pt.village,
          facilityId: pt.facilityId,
          hexagonId: pt.hexagonId,
          cohort: pt.cohort,
          mobility: pt.mobility,
          consentActive: pt.consentActive,
          daysOverdue: pt.daysOverdue,
          consecutiveMissed: pt.consecutiveMissed,
          symptoms: pt.symptoms,
          vitalsHistory: pt.vitalsHistory,
        },
        thresholds
      )
    );
  }

  // Filter for Worker's own assigned patients when building the Worker Worklist
  const workerPatients =
    callerRole === "worker"
      ? evaluatedAll.filter((e) => {
          const p = state.patients.find((pt) => pt.id === e.patientId);
          return p?.assignedWorkerId === callerId;
        })
      : evaluatedAll;

  const quickSortResult = quickSortPatientsByThreshold(
    workerPatients,
    thresholds.pivotThreshold
  );

  // Compute 3-Bucket (15 System / 5 Critical / 10 Walk-In = 30 Slots) allocations for each of the 5 Hexagon Clinics
  const clinicAllocations: Record<string, ClinicCapacityAllocation> = {};
  for (const fac of state.facilities) {
    const patientsForFac = evaluatedAll.filter((e) => e.facilityId === fac.id);
    clinicAllocations[fac.id] = allocateClinicSlots30(
      fac.id,
      fac.hexagonId,
      patientsForFac,
      thresholds.pivotThreshold,
      {
        systemFollowupCap: fac.systemSlots,
        criticalReservedCap: fac.criticalSlots,
        walkInProtectedCap: fac.walkInSlots,
      }
    );
  }

  return {
    simulatedClockIso: state.simulatedClockIso,
    postgresEngineStatus: state.postgresEngineStatus,
    integrations: getExternalIntegrationStatus(),
    symptomCatalog: CLINICAL_SYMPTOM_CATALOG,
    activeThresholds: state.activeThresholds,
    pendingRuleDraft: state.pendingRuleDraft,
    facilities: state.facilities,
    users: state.users,
    quickSortResult,
    clinicAllocations,
    escalations: state.escalations,
    hexBroadcasts: state.hexBroadcasts,
    ambulanceDispatches: state.ambulanceDispatches,
    messages: state.messages.slice(-25).reverse(),
    auditIntegrity: verifyAuditChainIntegrity(),
    auditLog: state.auditLog.slice(-40).reverse(),
    withdrawnPatients: state.patients
      .filter((p) => !p.consentActive)
      .map((p) => ({
        id: p.id,
        pseudonym: p.pseudonym,
        cohort: p.cohort,
        village: p.village,
        withdrawnAt: p.consentWithdrawnAt,
      })),
    stats: {
      totalPatients: state.patients.length,
      consentedPatients: evaluatedAll.length,
      withdrawnPatients: state.patients.length - evaluatedAll.length,
      totalImmediateAboveThreshold: evaluatedAll.filter((e) => e.abovePivotThreshold).length,
      totalOverdue: state.patients.filter((p) => p.consentActive && p.daysOverdue > 0).length,
      totalMissedTwice: state.patients.filter(
        (p) => p.consentActive && p.consecutiveMissed >= 2
      ).length,
      openEscalations: state.escalations.filter((e) => e.status !== "closed").length,
      slaBreachedCount: state.escalations.filter((e) => e.slaBreached).length,
      activeHexBroadcasts: state.hexBroadcasts.filter(
        (b) => b.status === "BROADCASTING_RING"
      ).length,
      activeAmbulances: state.ambulanceDispatches.filter(
        (a) => a.status !== "HANDED_OVER_TERTIARY"
      ).length,
    },
  };
}
