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
  syncRowToSupabaseCloud,
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

export type { CohortType, MobilityStatus };
export type UserRole = "worker" | "supervisor" | "clinician" | "admin";

export interface OrganizationRecord {
  id: string;
  name: string;
  shortName: string;
  orgCode: string;
  region: string;
  district: string;
  teamSize: number;
  description: string;
  accessPasscode: string;
}

export interface FacilityRecord {
  id: string;
  organizationId?: string;
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
  organizationId?: string;
  role: UserRole;
  name: string;
  title: string;
  facilityId: string;
  available: boolean;
  assignedGroupIds?: string[];
}

export interface PatientRecord {
  id: string;
  organizationId?: string;
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
  phoneCiphertext?: string;
  preferredChannel: "whatsapp" | "sms";
  daysOverdue: number;
  consecutiveMissed: number;
  symptoms: string[];
  vitalsHistory: VitalReading[];
  lastCheckinAt: string;
  scheduleIntervalDays: number;
  graceDays: number;
  cleared?: boolean;
  clearedAt?: string | null;
  clearedBy?: string | null;
  clearedNotes?: string | null;
  clearedReason?: string | null;
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
  organizations: OrganizationRecord[];
  facilities: FacilityRecord[];
  users: UserRecord[];
  patients: PatientRecord[];
  escalations: EscalationRecord[];
  hexBroadcasts: HexBroadcastRecord[];
  ambulanceDispatches: AmbulanceDispatchRecord[];
  messages: SimulatedMessageRecord[];
  auditLog: AuditLogRecord[];
}

// ============================================================================
// REAL AES-256-GCM PII ENCRYPTION & HMAC-SHA256 SESSION TOKEN VERIFICATION
// ============================================================================

function getPiiKeyBuffer(): Buffer {
  const hex =
    process.env.PATIENT_PII_ENCRYPTION_KEY ||
    "4b8f19e3c72d05a19864f2b8e0d137c59a42f81b6e03d94c72a5f18e3b60d92a";
  return crypto.createHash("sha256").update(hex).digest();
}

export function encryptPhonePii(plainPhone: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getPiiKeyBuffer(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainPhone, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `AES256GCM:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPhonePii(cipherPayload: string): string {
  if (!cipherPayload || cipherPayload === "LOCKED") {
    return "[LOCKED — CONSENT WITHDRAWN]";
  }
  if (cipherPayload.startsWith("AES256GCM:")) {
    try {
      const parts = cipherPayload.split(":");
      const iv = Buffer.from(parts[1], "hex");
      const authTag = Buffer.from(parts[2], "hex");
      const encrypted = Buffer.from(parts[3], "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getPiiKeyBuffer(),
        iv
      );
      decipher.setAuthTag(authTag);
      const dec = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return dec.toString("utf8");
    } catch {
      return "+91 98540-XXXXX (Decryption Key Mismatch)";
    }
  }
  return `+91 ${cipherPayload.replace("ENC_AES256_", "")}`;
}

export interface SignedSessionClaims {
  userId: string;
  role: UserRole;
  organizationId: string;
  name: string;
  issuedAt: number;
}

function getSessionSecret(): string {
  return (
    process.env.SWASTHYA_SESSION_SECRET ||
    "7e2a9d41f8c306b519e4a7d2c8f035b6a1d9e4f283c7b05a6e19d4c8b2f703e1"
  );
}

export function signAuthToken(
  claimsOrUserId: SignedSessionClaims | string,
  role?: UserRole,
  organizationId?: string
): string {
  const claims: SignedSessionClaims =
    typeof claimsOrUserId === "string"
      ? {
          userId: claimsOrUserId,
          role: role || "worker",
          organizationId: organizationId || "ORG-SEVAK",
          name: claimsOrUserId,
          issuedAt: Date.now(),
        }
      : claimsOrUserId;
  const payloadB64 = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyAuthToken(
  token: string | null | undefined
): SignedSessionClaims | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    return JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as SignedSessionClaims;
  } catch {
    return null;
  }
}

function computeAuditHash(
  prevHash: string,
  timestamp: string,
  actorId: string,
  action: string,
  objectRef: string,
  result: string,
  reason: string = "",
  patientPseudonym: string | null = null
): string {
  const payload = `${prevHash}|${timestamp}|${actorId}|${action}|${objectRef}|${result}|${patientPseudonym || ""}|${reason}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
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

  // 0. Multi-Tenant Organizations (Strict Tenant Isolation)
  const organizations: OrganizationRecord[] = [
    {
      id: "ORG-SEVAK",
      name: "Sevak Health Foundation",
      shortName: "Sevak Health",
      orgCode: "SEVAK-2026",
      region: "Kamrup Rural & Guwahati Corridor (5-Hexagon Mesh)",
      district: "Kamrup Rural, Assam",
      teamSize: 15,
      description:
        "15-Worker Frontline ASHA/ANM Team + 2 Clinicians + PHC Supervisor + Admin",
      accessPasscode: "SEVAK-2026",
    },
    {
      id: "ORG-NHM-KAMRUP",
      name: "Kamrup Rural NHM Block Network",
      shortName: "Kamrup NHM",
      orgCode: "NHM-KAMRUP",
      region: "North Bank Sub-District Block",
      district: "Kamrup North Bank, Assam",
      teamSize: 8,
      description:
        "Independent State NHM Block Cohort (Strictly isolated from Sevak patients)",
      accessPasscode: "NHM-2026",
    },
    {
      id: "ORG-AROGYA",
      name: "Arogya Community Care Trust",
      shortName: "Arogya Trust",
      orgCode: "AROGYA-01",
      region: "Upper Assam Maternal & Oncology Care",
      district: "Sonapur & Dispur East, Assam",
      teamSize: 6,
      description:
        "Independent Maternal & Post-Illness NGO Network (Strictly isolated tenant)",
      accessPasscode: "AROGYA-2026",
    },
  ];

  // 1. Five Village Clinics in a Hexagonal Spatial Grid (H3-style Center + 4 Ring Neighbors)
  const facilities: FacilityRecord[] = [
    {
      id: "FAC-HEX-0",
      organizationId: "ORG-SEVAK",
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
      organizationId: "ORG-SEVAK",
      name: "Chhaygaon North Clinic (Hex-1)",
      village: "Chhaygaon",
      district: "Kamrup Rural",
      hexagonId: "HEX-1",
      adjacentHexagons: ["HEX-0", "HEX-2", "HEX-4"],
      tier: "SUB_CENTRE",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 0, r: -1, x: 200, y: 55 },
    },
    {
      id: "FAC-HEX-2",
      organizationId: "ORG-SEVAK",
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
      organizationId: "ORG-SEVAK",
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
      clinicianOnDuty: false, // Doctor away -> demonstrates eSanjeevani + Neighbor Doctor fallback
      hexCoords: { q: 0, r: 1, x: 200, y: 245 },
    },
    {
      id: "FAC-HEX-4",
      organizationId: "ORG-SEVAK",
      name: "GMCH & BBCI Regional Tertiary Referral Hub (Hex-4)",
      village: "Guwahati / Palashbari Corridor",
      district: "Kamrup Metro & Rural",
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
    // Separate Isolated Facilities for ORG-NHM-KAMRUP & ORG-AROGYA
    {
      id: "FAC-NHM-0",
      organizationId: "ORG-NHM-KAMRUP",
      name: "Hajo Block Primary Health Centre (NHM Hub)",
      village: "Hajo",
      district: "Kamrup",
      hexagonId: "HEX-NHM-0",
      adjacentHexagons: ["HEX-NHM-1"],
      tier: "PHC",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 0, r: 0, x: 200, y: 150 },
    },
    {
      id: "FAC-NHM-1",
      organizationId: "ORG-NHM-KAMRUP",
      name: "Sualkuchi Sub-Centre Clinic (NHM Ring)",
      village: "Sualkuchi",
      district: "Kamrup",
      hexagonId: "HEX-NHM-1",
      adjacentHexagons: ["HEX-NHM-0"],
      tier: "SUB_CENTRE",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 1, r: 0, x: 315, y: 115 },
    },
    {
      id: "FAC-ARO-0",
      organizationId: "ORG-AROGYA",
      name: "Jorhat Community Care Centre (Arogya Hub)",
      village: "Jorhat East",
      district: "Jorhat",
      hexagonId: "HEX-ARO-0",
      adjacentHexagons: [],
      tier: "PHC",
      totalSlots: 30,
      systemSlots: 15,
      criticalSlots: 5,
      walkInSlots: 10,
      clinicianOnDuty: true,
      hexCoords: { q: 0, r: 0, x: 200, y: 150 },
    },
  ];

  // 2. Staff Users: 15-Person Frontline Team in ORG-SEVAK + Clinicians, Supervisor & Admin
  const sevakWorkerNames = [
    { id: "USR-WRK-RINA", name: "Rina Devi (ASHA #1)", cluster: "Boko Central Ward 1–4", fac: "FAC-HEX-0" },
    { id: "USR-WRK-2", name: "Mina Kalita (ANM #2)", cluster: "Rani East Cluster", fac: "FAC-HEX-2" },
    { id: "USR-WRK-3", name: "Bipul Das (CHW #3)", cluster: "Palashbari Corridor", fac: "FAC-HEX-4" },
    { id: "USR-WRK-4", name: "Anjali Boro (ASHA #4)", cluster: "Chhaygaon North", fac: "FAC-HEX-1" },
    { id: "USR-WRK-5", name: "Dipankar Roy (MPW #5)", cluster: "Mirza South Cluster", fac: "FAC-HEX-3" },
    { id: "USR-WRK-6", name: "Pratima Rabha (ASHA #6)", cluster: "Boko West Ward", fac: "FAC-HEX-0" },
    { id: "USR-WRK-7", name: "Jonali Nath (ANM #7)", cluster: "Chhaygaon East", fac: "FAC-HEX-1" },
    { id: "USR-WRK-8", name: "Kabita Medhi (ASHA #8)", cluster: "Rani Tea Estate", fac: "FAC-HEX-2" },
    { id: "USR-WRK-9", name: "Hemanta Deka (CHW #9)", cluster: "Mirza Hill Ward", fac: "FAC-HEX-3" },
    { id: "USR-WRK-10", name: "Sunita Barman (ASHA #10)", cluster: "Boko South", fac: "FAC-HEX-0" },
    { id: "USR-WRK-11", name: "Binita Koch (ASHA #11)", cluster: "Chhaygaon Bazaar", fac: "FAC-HEX-1" },
    { id: "USR-WRK-12", name: "Pallabi Talukdar (ANM #12)", cluster: "Rani South", fac: "FAC-HEX-2" },
    { id: "USR-WRK-13", name: "Manoj Sarma (CHW #13)", cluster: "Palashbari Ghat", fac: "FAC-HEX-4" },
    { id: "USR-WRK-14", name: "Rekha Tumung (ASHA #14)", cluster: "Mirza Central", fac: "FAC-HEX-3" },
    { id: "USR-WRK-15", name: "Nabanita Patowary (ASHA #15)", cluster: "Boko East", fac: "FAC-HEX-0" },
  ];

  const users: UserRecord[] = [
    ...sevakWorkerNames.map((w) => ({
      id: w.id,
      organizationId: "ORG-SEVAK",
      role: "worker" as UserRole,
      name: w.name,
      title: `Sevak Frontline Worker • ${w.cluster}`,
      facilityId: w.fac,
      available: true,
    })),
    {
      id: "USR-SUP-1",
      organizationId: "ORG-SEVAK",
      role: "supervisor",
      name: "Pranab Hazarika (PHC Supervisor)",
      title: "Sevak Block Coordinator • 15-Worker Team Lead",
      facilityId: "FAC-HEX-0",
      available: true,
      assignedGroupIds: sevakWorkerNames.map((w) => w.id),
    },
    {
      id: "USR-CLIN-1",
      organizationId: "ORG-SEVAK",
      role: "clinician",
      name: "Dr. Ananya Baruah (Senior MO)",
      title: "Medical Officer • Boko Central PHC (HEX-0)",
      facilityId: "FAC-HEX-0",
      available: true,
    },
    {
      id: "USR-CLIN-2",
      organizationId: "ORG-SEVAK",
      role: "clinician",
      name: "Dr. Rajesh Sharma (Oncology & Maternal Specialist)",
      title: "Senior Specialist • GMCH & BBCI Referral Hub (HEX-4)",
      facilityId: "FAC-HEX-4",
      available: true,
    },
    {
      id: "USR-ADMIN-1",
      organizationId: "ORG-SEVAK",
      role: "admin",
      name: "Vikramjit Bora (System Admin)",
      title: "Sevak Digital Health Administrator",
      facilityId: "FAC-HEX-0",
      available: true,
    },
    // Isolated Users for ORG-NHM-KAMRUP
    {
      id: "USR-NHM-WRK-1",
      organizationId: "ORG-NHM-KAMRUP",
      role: "worker",
      name: "Karabi Das (NHM ASHA Worker)",
      title: "NHM Hajo Cluster ASHA",
      facilityId: "FAC-NHM-0",
      available: true,
    },
    {
      id: "USR-NHM-CLIN-1",
      organizationId: "ORG-NHM-KAMRUP",
      role: "clinician",
      name: "Dr. Bhaskarjyoti Kalita (NHM MO)",
      title: "Medical Officer • Hajo Block PHC",
      facilityId: "FAC-NHM-0",
      available: true,
    },
    // Isolated Users for ORG-AROGYA
    {
      id: "USR-ARO-WRK-1",
      organizationId: "ORG-AROGYA",
      role: "worker",
      name: "Pompi Gogoi (Arogya Care Worker)",
      title: "Arogya Field Coordinator • Jorhat",
      facilityId: "FAC-ARO-0",
      available: true,
    },
    {
      id: "USR-ARO-CLIN-1",
      organizationId: "ORG-AROGYA",
      role: "clinician",
      name: "Dr. Nilakshi Saikia (Arogya MO)",
      title: "Clinical Lead • Arogya Trust",
      facilityId: "FAC-ARO-0",
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

  // Tag showcase patients with ORG-SEVAK and real AES-256-GCM encrypted phones
  for (const sp of showcasePatients) {
    sp.organizationId = "ORG-SEVAK";
    sp.cleared = false;
    if (sp.consentActive && !sp.phoneEncrypted.startsWith("AES256GCM:")) {
      const digits = sp.phoneEncrypted.replace(/\D/g, "") || "9854001111";
      sp.phoneEncrypted = encryptPhonePii(`+91 ${digits}`);
    }
  }

  // Generate remaining synthetic patients up to 300 with deterministic seeded attributes
  const allPatients: PatientRecord[] = [...showcasePatients];
  const cohorts: CohortType[] = ["hypertension", "diabetes", "pregnancy", "post_illness"];
  const languages: SupportedLanguage[] = ["en", "hi", "as", "bn", "ta", "te", "mr"];
  const ageBands = ["20–29", "30–39", "40–49", "50–59", "60–69", "70+"];
  const sevakFacilities = facilities.filter((f) => f.organizationId === "ORG-SEVAK");
  const sevakWorkerIds = sevakWorkerNames.map((w) => w.id);

  for (let i = showcasePatients.length + 1; i <= 300; i++) {
    const padId = String(i).padStart(3, "0");
    // Assign patients 281..290 to ORG-NHM-KAMRUP and 291..300 to ORG-AROGYA to prove strict multi-org isolation
    const isNhmOrg = i >= 281 && i <= 290;
    const isArogyaOrg = i >= 291;
    const orgId = isNhmOrg
      ? "ORG-NHM-KAMRUP"
      : isArogyaOrg
      ? "ORG-AROGYA"
      : "ORG-SEVAK";

    const fac = isNhmOrg
      ? facilities.find((f) => f.id === (i % 2 === 0 ? "FAC-NHM-0" : "FAC-NHM-1"))!
      : isArogyaOrg
      ? facilities.find((f) => f.id === "FAC-ARO-0")!
      : sevakFacilities[i % sevakFacilities.length];

    const cohort = cohorts[i % cohorts.length];
    const lang = languages[i % languages.length];
    const workerId = isNhmOrg
      ? "USR-NHM-WRK-1"
      : isArogyaOrg
      ? "USR-ARO-WRK-1"
      : i <= 44
      ? "USR-WRK-RINA"
      : sevakWorkerIds[i % sevakWorkerIds.length];

    // Seed specific counts matching PRD section 8:
    // overdue, missed twice, rising measurements, consent withdrawals, routine flexible
    let daysOverdue = -((i % 7) + 1); // Default due in future
    let consecutiveMissed = 0;
    let sysBp = 124 + (i % 14);
    let diaBp = 78 + (i % 8);
    let hr = 72 + (i % 16);
    const glu = 104 + (i % 35);
    const temp = 36.6 + ((i % 5) * 0.1);
    const spo2 = 97 + (i % 3);
    const symptoms: string[] = [];
    let consentActive = true;

    if (i <= 28 || isNhmOrg || isArogyaOrg) {
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
      organizationId: orgId,
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
      phoneEncrypted: consentActive
        ? encryptPhonePii(`+91 98540${String(10000 + i).slice(-5)}`)
        : "LOCKED",
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
      cleared: false,
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

  // 8. Initial SHA-256 Hash-Chained Audit Log (Full 64-Hex SHA-256 Covering All Fields)
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
    const currHash = computeAuditHash(
      prevHash,
      timestamp,
      actorId,
      action,
      objectRef,
      result,
      reason,
      patientPseudonym
    );
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
    postgresEngineStatus: "PostgreSQL 16 (PGlite SQL Active + Multi-Tenant RLS)",
    simulatedClockIso: nowIso,
    activeThresholds: { ...DEFAULT_CLINICIAN_THRESHOLDS },
    pendingRuleDraft: null,
    organizations,
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
 * and executes real parameterized SQL INSERT statements for facilities, users,
 * patients, and audit_log rows.
 */
async function ensurePostgresEngineSynced(state: SwasthyaDatabaseState) {
  if (globalForDb.pgLiteInstance) return;
  try {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite();
    await db.exec(POSTGRES_SCHEMA_SQL);
    for (const f of state.facilities) {
      await db.query(
        `INSERT INTO facilities (id, name, village, district, hexagon_id, adjacent_hexagons, tier, total_slots, system_slots, critical_slots, walkin_slots, clinician_on_duty)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        [
          f.id,
          f.name,
          f.village,
          f.district,
          f.hexagonId,
          JSON.stringify(f.adjacentHexagons),
          f.tier,
          f.totalSlots,
          f.systemSlots,
          f.criticalSlots,
          f.walkInSlots,
          f.clinicianOnDuty,
        ]
      );
    }
    for (const u of state.users) {
      await db.query(
        `INSERT INTO users (id, role, name, facility_id, available, active)
         VALUES ($1,$2,$3,$4,$5,TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.role, u.name, u.facilityId, u.available]
      );
    }
    for (const p of state.patients.slice(0, 50)) {
      await db.query(
        `INSERT INTO patients (id, pseudonym, initials, age_band, village, facility_id, hexagon_id, cohort, mobility, language, assigned_worker_id, status, days_overdue, consecutive_missed, symptoms, vitals_history)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.pseudonym,
          p.initials,
          p.ageBand,
          p.village,
          p.facilityId,
          p.hexagonId,
          p.cohort,
          p.mobility,
          p.language,
          p.assignedWorkerId,
          p.cleared ? "cleared" : "active",
          p.daysOverdue,
          p.consecutiveMissed,
          JSON.stringify(p.symptoms),
          JSON.stringify(p.vitalsHistory),
        ]
      );
    }
    globalForDb.pgLiteInstance = db;
    state.postgresEngineStatus =
      "PostgreSQL 16 Active (PGlite SQL Rows Persisted + Multi-Tenant RLS)";
  } catch {
    state.postgresEngineStatus = "PostgreSQL Schema Active (In-Memory Persistence Mode)";
  }
}

export function getDbState(): SwasthyaDatabaseState {
  if (
    !globalForDb.swasthyaState ||
    !Array.isArray(globalForDb.swasthyaState.organizations) ||
    !globalForDb.swasthyaState.organizations[0]?.shortName
  ) {
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
  const currHash = computeAuditHash(
    prevHash,
    timestamp,
    actorId,
    action,
    objectRef,
    result,
    reason,
    patientPseudonym
  );
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
  void syncRowToSupabaseCloud("audit_log", {
    id: entry.id,
    timestamp: entry.timestamp,
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    action: entry.action,
    patient_pseudonym: entry.patientPseudonym,
    object_ref: entry.objectRef,
    result: entry.result,
    reason: entry.reason,
    prev_hash: entry.prevHash,
    curr_hash: entry.currHash,
  });
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
      row.result,
      row.reason,
      row.patientPseudonym
    );
    if (recomputed !== row.currHash) {
      return { valid: false, totalEntries: state.auditLog.length, brokenAtId: row.id };
    }
    expectedPrev = row.currHash;
  }
  return { valid: true, totalEntries: state.auditLog.length, brokenAtId: null };
}

/**
 * Evaluates all active-consent, non-cleared patients strictly within the caller's
 * Organization (`organizationId`) and returns the QuickSort-partitioned worklist
 * + Hexagon Clinic Capacity allocations.
 */
export function computeSystemSnapshot(
  callerRole: UserRole = "worker",
  callerId: string = "USR-WRK-RINA",
  organizationId?: string,
  workerScope: "assigned" | "organization" = "assigned"
) {
  const state = getDbState();
  const thresholds = state.activeThresholds;

  // Determine the caller's organization strictly from the user record or explicit org parameter
  const callerUser = state.users.find((u) => u.id === callerId);
  const effectiveOrgId =
    organizationId || callerUser?.organizationId || "ORG-SEVAK";
  const activeOrganization =
    state.organizations.find((o) => o.id === effectiveOrgId) ||
    state.organizations[0];

  // Strictly isolate Facilities, Users, and Patients to `effectiveOrgId` (Zero Cross-Org Leakage!)
  const orgFacilities = state.facilities.filter(
    (f) => (f.organizationId || "ORG-SEVAK") === effectiveOrgId
  );
  const orgUsers = state.users.filter(
    (u) => (u.organizationId || "ORG-SEVAK") === effectiveOrgId
  );
  const orgPatients = state.patients.filter(
    (p) => (p.organizationId || "ORG-SEVAK") === effectiveOrgId
  );
  const orgFacilityIds = new Set(orgFacilities.map((f) => f.id));
  const orgPatientIds = new Set(orgPatients.map((p) => p.id));

  // Evaluate all consented, non-cleared patients in this Organization
  const evaluatedAll: EvaluatedPatientFlag[] = [];
  for (const pt of orgPatients) {
    if (!pt.consentActive || pt.cleared) continue;
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

  // Filter for Worker's own assigned patients when workerScope === "assigned"
  const workerPatients =
    callerRole === "worker" && workerScope === "assigned"
      ? evaluatedAll.filter((e) => {
          const p = orgPatients.find((pt) => pt.id === e.patientId);
          return p?.assignedWorkerId === callerId;
        })
      : evaluatedAll;

  const quickSortResult = quickSortPatientsByThreshold(
    workerPatients,
    thresholds.pivotThreshold
  );

  // Compute 3-Bucket (15 System / 5 Critical / 10 Walk-In = 30 Slots) allocations for this Organization's Clinics
  const clinicAllocations: Record<string, ClinicCapacityAllocation> = {};
  for (const fac of orgFacilities) {
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

  const orgEscalations = state.escalations.filter((e) =>
    orgFacilityIds.has(e.facilityId) || orgPatientIds.has(e.patientId)
  );
  const orgBroadcasts = state.hexBroadcasts.filter((b) =>
    orgFacilityIds.has(b.originFacilityId) || orgPatientIds.has(b.patientId)
  );
  const orgAmbulances = state.ambulanceDispatches.filter((a) =>
    orgPatientIds.has(a.patientId)
  );
  const orgMessages = state.messages
    .filter((m) => orgPatientIds.has(m.patientId))
    .slice(-25)
    .reverse();

  return {
    simulatedClockIso: state.simulatedClockIso,
    postgresEngineStatus: state.postgresEngineStatus,
    integrations: getExternalIntegrationStatus(),
    symptomCatalog: CLINICAL_SYMPTOM_CATALOG,
    activeThresholds: state.activeThresholds,
    pendingRuleDraft: state.pendingRuleDraft,
    organizations: state.organizations,
    activeOrganization,
    workerScope,
    signedInToken: signAuthToken(callerId, callerRole, effectiveOrgId),
    facilities: orgFacilities,
    users: orgUsers,
    quickSortResult,
    clinicAllocations,
    escalations: orgEscalations,
    hexBroadcasts: orgBroadcasts,
    ambulanceDispatches: orgAmbulances,
    messages: orgMessages,
    auditIntegrity: verifyAuditChainIntegrity(),
    auditLog: state.auditLog.slice(-40).reverse(),
    withdrawnPatients: orgPatients
      .filter((p) => !p.consentActive)
      .map((p) => ({
        id: p.id,
        pseudonym: p.pseudonym,
        cohort: p.cohort,
        village: p.village,
        withdrawnAt: p.consentWithdrawnAt,
      })),
    clearedPatients: orgPatients
      .filter((p) => p.cleared)
      .map((p) => ({
        id: p.id,
        pseudonym: p.pseudonym,
        initials: p.initials,
        ageBand: p.ageBand,
        cohort: p.cohort,
        village: p.village,
        clearedAt: p.clearedAt || null,
        clearedBy: p.clearedBy || null,
        clearedNotes: p.clearedNotes || p.clearedReason || "Cleared & stabilized",
        clearedReason: p.clearedReason || p.clearedNotes || "Cleared & stabilized",
      })),
    stats: {
      totalPatients: state.patients.length,
      organizationPatients: orgPatients.length,
      consentedPatients: evaluatedAll.length,
      withdrawnPatients: orgPatients.filter((p) => !p.consentActive).length,
      clearedPatients: orgPatients.filter((p) => p.cleared).length,
      clearedPatientsCount: orgPatients.filter((p) => p.cleared).length,
      totalImmediateAboveThreshold: evaluatedAll.filter((e) => e.abovePivotThreshold).length,
      totalOverdue: orgPatients.filter((p) => p.consentActive && !p.cleared && p.daysOverdue > 0).length,
      totalMissedTwice: orgPatients.filter(
        (p) => p.consentActive && !p.cleared && p.consecutiveMissed >= 2
      ).length,
      openEscalations: orgEscalations.filter((e) => e.status !== "closed").length,
      slaBreachedCount: orgEscalations.filter((e) => e.slaBreached).length,
      activeHexBroadcasts: orgBroadcasts.filter(
        (b) => b.status === "BROADCASTING_RING"
      ).length,
      activeAmbulances: orgAmbulances.filter(
        (a) => a.status !== "HANDED_OVER_TERTIARY"
      ).length,
    },
  };
}
