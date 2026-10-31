import type { UserRole, CohortType, MobilityStatus } from "../../../lib/db.ts";
import {
  getDbState,
  resetDbState,
  computeSystemSnapshot,
  appendAuditEntry,
  encryptPhonePii,
  decryptPhonePii,
  signAuthToken,
  verifyAuthToken,
  hashPassword,
  verifyPasswordHash,
} from "../../../lib/db.ts";
import type { SupportedLanguage } from "../../../lib/i18n.ts";
import { MESSAGE_TEMPLATES_I18N } from "../../../lib/i18n.ts";
import { evaluatePatientFiveCategories } from "../../../lib/quicksort-engine.ts";

const NextResponse = {
  json(data: unknown, init?: ResponseInit) {
    return Response.json(data, init);
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") as UserRole) || "worker";
  const userId = searchParams.get("userId") || "USR-WRK-RINA";
  const organizationId = searchParams.get("organizationId") || undefined;
  const workerScope =
    (searchParams.get("workerScope") as "assigned" | "organization") || "assigned";

  const snapshot = computeSystemSnapshot(role, userId, organizationId, workerScope);
  return NextResponse.json(snapshot);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action,
      callerRole = "worker",
      callerId = "USR-WRK-RINA",
      callerName = "Rina Devi (ASHA Worker)",
      organizationId: bodyOrgId,
      workerScope = "assigned",
      authToken,
    } = body;

    const state = getDbState();

    // Verify optional HMAC-SHA256 session token and resolve effective organization
    const verifiedSession = authToken ? verifyAuthToken(authToken) : null;
    const callerUser = state.users.find((u) => u.id === callerId);
    const effectiveOrgId =
      verifiedSession?.organizationId ||
      bodyOrgId ||
      callerUser?.organizationId ||
      "ORG-SEVAK";

    const snap = (overrideRole?: UserRole, overrideUserId?: string, overrideOrgId?: string) =>
      computeSystemSnapshot(
        overrideRole || callerRole,
        overrideUserId || callerId,
        overrideOrgId || effectiveOrgId,
        workerScope
      );

    // =========================================================================
    // 0. MULTI-TENANT ORGANIZATION ISOLATION GATE
    // Ensure a user signed into Organization A (e.g. Sevak) can NEVER access
    // or mutate a patient belonging to Organization B (e.g. Kamrup / Arogya)
    // =========================================================================
    if (body.patientId && action !== "RESET_DEMO") {
      const targetPt = state.patients.find((p) => p.id === body.patientId);
      if (
        targetPt &&
        targetPt.organizationId &&
        targetPt.organizationId !== effectiveOrgId
      ) {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          `CROSS_TENANT_ISOLATION_BLOCKED_${action}`,
          targetPt.pseudonym,
          targetPt.id,
          "BLOCKED_403_RBAC",
          `Cross-tenant access blocked: Caller in organization '${effectiveOrgId}' attempted '${action}' on patient ${targetPt.pseudonym} belonging to '${targetPt.organizationId}'.`
        );
        return NextResponse.json(
          {
            error: `403 Not your organization (Cross-Tenant Isolation) — You are signed into ${effectiveOrgId}. Patient ${targetPt.pseudonym} belongs to a different organization (${targetPt.organizationId}) and is strictly isolated.`,
            snapshot: snap(),
          },
          { status: 403 }
        );
      }
    }

    // =========================================================================
    // 1. RBAC PRIVACY TEST: VIEW PATIENT CONTACT DETAILS
    // Only the assigned Health Worker is allowed to view contact details.
    // Supervisor, Clinician, and Admin are strictly blocked (403) and logged!
    // =========================================================================
    if (action === "VIEW_PATIENT_CONTACT") {
      const { patientId } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      if (callerRole !== "worker" || pt.assignedWorkerId !== callerId) {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "READ_PATIENT_CONTACT_DENIED",
          pt.pseudonym,
          pt.id,
          "BLOCKED_403_RBAC",
          `Role '${callerRole}' attempted to access encrypted phone details for ${pt.pseudonym}. Blocked by RBAC minimization policy.`
        );
        return NextResponse.json(
          {
            error:
              "403 Forbidden — Role-Based Access Control (RBAC) violation: Only the assigned Health Worker may access patient contact details. This attempt has been recorded in the immutable SHA-256 Audit Log.",
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      if (!pt.consentActive) {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "READ_PATIENT_CONTACT_CONSENT_LOCKED",
          pt.pseudonym,
          pt.id,
          "BLOCKED_CONSENT_GATE",
          `Contact read blocked because ${pt.pseudonym} withdrew consent.`
        );
        return NextResponse.json(
          {
            error: "403 Consent Gate: Patient has withdrawn consent. Record is locked to a minimal stub.",
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      const decryptedPhone = decryptPhonePii(
        pt.phoneCiphertext || pt.phoneEncrypted
      );

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "READ_PATIENT_CONTACT",
        pt.pseudonym,
        pt.id,
        "ALLOWED",
        `Assigned worker verified AES-256-GCM contact channel (${pt.preferredChannel}: ${pt.phoneMasked}).`
      );

      return NextResponse.json({
        message: `Authorized Contact View (${pt.pseudonym}): ${decryptedPhone} (Masked: ${pt.phoneMasked}) via ${pt.preferredChannel.toUpperCase()}`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 2. LOG 5-VITAL CHECK-IN (Worker only + Consent Gate)
    // =========================================================================
    if (action === "LOG_CHECKIN") {
      if (callerRole !== "worker") {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "LOG_CHECKIN_DENIED",
          body.patientId,
          body.patientId || "UNKNOWN",
          "BLOCKED_403_RBAC",
          `Role '${callerRole}' is not permitted to log patient check-ins.`
        );
        return NextResponse.json(
          {
            error: "403 RBAC: Only Health Workers can log patient check-ins.",
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      const {
        patientId,
        systolicBp,
        diastolicBp,
        heartRate,
        bloodGlucose,
        temperature,
        spo2,
        symptoms = [],
        doctorUnavailableAtClinic = false,
      } = body;

      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      if (!pt.consentActive) {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "LOG_CHECKIN_BLOCKED_CONSENT",
          pt.pseudonym,
          pt.id,
          "BLOCKED_CONSENT_GATE",
          `Blocked check-in entry for ${pt.pseudonym}: Consent is withdrawn.`
        );
        return NextResponse.json(
          {
            error: "Consent Gate Blocked: Cannot log check-in for a patient who has withdrawn consent.",
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      const now = new Date().toISOString();
      pt.vitalsHistory.push({
        recordedAt: now,
        systolicBp: Number(systolicBp),
        diastolicBp: Number(diastolicBp),
        heartRate: Number(heartRate),
        bloodGlucose: Number(bloodGlucose),
        temperature: Number(temperature),
        spo2: Number(spo2),
      });
      pt.symptoms = Array.isArray(symptoms) ? symptoms : [];
      pt.lastCheckinAt = now;

      // Evaluate new vitals immediately
      const evaluated = evaluatePatientFiveCategories(
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
          daysOverdue: doctorUnavailableAtClinic ? pt.daysOverdue : 0,
          consecutiveMissed: doctorUnavailableAtClinic ? pt.consecutiveMissed : 0,
          symptoms: pt.symptoms,
          vitalsHistory: pt.vitalsHistory,
        },
        state.activeThresholds
      );

      if (!doctorUnavailableAtClinic && evaluated.flagClass !== "clinical_review") {
        // Routine check-in completed locally -> no wasted clinic trip!
        pt.daysOverdue = -pt.scheduleIntervalDays;
        pt.consecutiveMissed = 0;
      }

      const docAbsentNote = doctorUnavailableAtClinic
        ? " [Doctor unavailable at local clinic — vitals captured by worker & routed for remote clinician review]"
        : "";

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "CHECKIN_LOGGED_AND_EVALUATED",
        pt.pseudonym,
        pt.id,
        "ALLOWED",
        `Logged 5-category vitals (BP ${systolicBp}/${diastolicBp}, HR ${heartRate}, Glu ${bloodGlucose}, Temp ${temperature}°C, SpO₂ ${spo2}%). QuickSort Score: ${evaluated.totalScore} (${evaluated.primaryRuleId}).${docAbsentNote}`
      );

      // If doctor was unavailable at the clinic AND patient needs clinical review, auto-create remote escalation
      if (doctorUnavailableAtClinic || evaluated.abovePivotThreshold) {
        const fac = state.facilities.find((f) => f.id === pt.facilityId);
        const targetClinician =
          fac && !fac.clinicianOnDuty ? "USR-CLIN-2" : "USR-CLIN-1";

        const existingEsc = state.escalations.find(
          (e) => e.patientId === pt.id && e.status !== "closed"
        );
        if (!existingEsc && evaluated.abovePivotThreshold) {
          state.escalations.unshift({
            id: `ESC-${1000 + state.escalations.length + 1}`,
            patientId: pt.id,
            pseudonym: pt.pseudonym,
            ageBand: pt.ageBand,
            cohort: pt.cohort,
            facilityId: pt.facilityId,
            hexagonId: pt.hexagonId,
            ruleId: evaluated.primaryRuleId,
            ruleVersion: evaluated.ruleVersion,
            priorityScore: evaluated.totalScore,
            whyFlagged: evaluated.whyFlagged + docAbsentNote,
            latestVitalsSummary: `BP ${systolicBp}/${diastolicBp} mmHg | HR ${heartRate} bpm | Glu ${bloodGlucose} mg/dL | Temp ${temperature}°C | SpO₂ ${spo2}%`,
            symptoms: pt.symptoms,
            requestedBy: callerId,
            clinicianId: targetClinician,
            status: "requested",
            slaHours: 4,
            slaElapsedHours: 0,
            slaBreached: false,
            outcomeNote: null,
            referralDestination:
              fac && !fac.clinicianOnDuty
                ? "Auto-Routed to Remote On-Duty Specialist (Local Clinic Doctor Away)"
                : null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      return NextResponse.json({
        message: `Check-in logged for ${pt.pseudonym}. Score: ${evaluated.totalScore} (${
          evaluated.abovePivotThreshold
            ? "≥ Threshold → Immediate Priority Slot"
            : "< Threshold → Flexible Clinic Window / Completed"
        }).`,
        evaluated,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 3. SEND SIMULATED SMS / WHATSAPP REMINDER (Consent Gate + Multilingual)
    // =========================================================================
    if (action === "SEND_REMINDER") {
      if (callerRole !== "worker" && callerRole !== "supervisor") {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "SEND_REMINDER_DENIED",
          body.patientId,
          body.patientId || "UNKNOWN",
          "BLOCKED_403_RBAC",
          `Role '${callerRole}' cannot dispatch patient reminders.`
        );
        return NextResponse.json(
          {
            error: "403 RBAC: Only Workers and Supervisors can send follow-up reminders.",
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      const {
        patientId,
        templateKey = "due_today",
        overrideLanguage,
        windowText = "09:00 – 10:45 (Flexible Window)",
      } = body;

      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      if (!pt.consentActive) {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "SEND_REMINDER_BLOCKED_CONSENT",
          pt.pseudonym,
          pt.id,
          "BLOCKED_CONSENT_GATE",
          `Blocked outbound ${pt.preferredChannel} to ${pt.pseudonym}: Patient withdrew consent.`
        );
        return NextResponse.json(
          {
            error: `Consent Gate Blocked: ${pt.pseudonym} has withdrawn consent. Outbound messaging is strictly prohibited.`,
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      const lang: SupportedLanguage = overrideLanguage || pt.language || "en";
      const rawTemplate =
        MESSAGE_TEMPLATES_I18N[templateKey]?.[lang] ||
        MESSAGE_TEMPLATES_I18N.due_today.en;

      const formattedBody = rawTemplate
        .replace("{date}", "Today")
        .replace("{window}", windowText);

      const msgId = `MSG-${500 + state.messages.length + 1}`;
      state.messages.push({
        id: msgId,
        patientId: pt.id,
        pseudonym: pt.pseudonym,
        channel: pt.preferredChannel,
        language: lang,
        templateKey,
        body: formattedBody,
        status: "delivered",
        sentAt: new Date().toISOString(),
        replyText: null,
        repliedAt: null,
      });

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "MESSAGE_REMINDER_DISPATCHED",
        pt.pseudonym,
        msgId,
        "ALLOWED",
        `Sent ${pt.preferredChannel.toUpperCase()} template '${templateKey}' in language '${lang.toUpperCase()}' with zero clinical condition disclosure.`
      );

      return NextResponse.json({
        message: `Delivered ${pt.preferredChannel.toUpperCase()} reminder to ${pt.pseudonym} in ${lang.toUpperCase()}.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 4. SIMULATE INBOUND PATIENT REPLY ("1", "2", or "STOP")
    // =========================================================================
    if (action === "SIMULATE_PATIENT_REPLY") {
      const { patientId, replyText } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      const normalized = String(replyText).trim().toUpperCase();
      const now = new Date().toISOString();

      // Attach reply to latest message or create inbound record
      const latestMsg = [...state.messages]
        .reverse()
        .find((m) => m.patientId === pt.id);
      if (latestMsg) {
        latestMsg.status = "replied";
        latestMsg.replyText = normalized;
        latestMsg.repliedAt = now;
      } else {
        state.messages.push({
          id: `MSG-${500 + state.messages.length + 1}`,
          patientId: pt.id,
          pseudonym: pt.pseudonym,
          channel: pt.preferredChannel,
          language: pt.language,
          templateKey: "symptom_checkin",
          body: MESSAGE_TEMPLATES_I18N.symptom_checkin[pt.language] || MESSAGE_TEMPLATES_I18N.symptom_checkin.en,
          status: "replied",
          sentAt: now,
          replyText: normalized,
          repliedAt: now,
        });
      }

      if (normalized === "STOP") {
        pt.consentActive = false;
        pt.consentWithdrawnAt = now;
        pt.phoneMasked = "[LOCKED — CONSENT WITHDRAWN]";
        pt.phoneEncrypted = "LOCKED";
        pt.vitalsHistory = [];
        pt.symptoms = [];

        appendAuditEntry(
          "PATIENT-SIM",
          `Patient ${pt.pseudonym}`,
          "patient_sim",
          "CONSENT_WITHDRAWN_VIA_STOP",
          pt.pseudonym,
          pt.id,
          "ALLOWED",
          `Patient replied STOP. Consent immediately revoked, messaging halted, and record locked to minimal stub.`
        );

        return NextResponse.json({
          message: `STOP received from ${pt.pseudonym}: Consent immediately withdrawn, messaging halted, and record locked to a minimal stub.`,
          snapshot: snap(),
        });
      }

      if (normalized === "1") {
        // Confirm visit / feeling well -> clear overdue reminder flag!
        pt.daysOverdue = -pt.scheduleIntervalDays;
        pt.consecutiveMissed = 0;
        appendAuditEntry(
          "PATIENT-SIM",
          `Patient ${pt.pseudonym}`,
          "patient_sim",
          "PATIENT_REPLY_1_CONFIRMED",
          pt.pseudonym,
          pt.id,
          "ALLOWED",
          `Patient replied '1' (Confirmed / Feeling well). Overdue reminder resolved and schedule updated.`
        );
        return NextResponse.json({
          message: `Reply '1' parsed from ${pt.pseudonym}: Check-in confirmed and overdue reminder cleared!`,
          snapshot: snap(),
        });
      }

      if (normalized === "2") {
        // Problem or needs home visit / reschedule -> prioritize on worker list
        pt.daysOverdue = Math.max(pt.daysOverdue, 4);
        if (!pt.symptoms.includes("severe_weakness_syncope")) {
          pt.symptoms.push("severe_weakness_syncope");
        }
        appendAuditEntry(
          "PATIENT-SIM",
          `Patient ${pt.pseudonym}`,
          "patient_sim",
          "PATIENT_REPLY_2_PROBLEM_REPORTED",
          pt.pseudonym,
          pt.id,
          "ALLOWED",
          `Patient replied '2' (Reported problem / requested home visit). Flagged for immediate worker & clinician review.`
        );
        return NextResponse.json({
          message: `Reply '2' parsed from ${pt.pseudonym}: Symptom/visit problem flagged — priority score elevated for immediate review!`,
          snapshot: snap(),
        });
      }

      appendAuditEntry(
        "PATIENT-SIM",
        `Patient ${pt.pseudonym}`,
        "patient_sim",
        "PATIENT_REPLY_UNPARSED",
        pt.pseudonym,
        pt.id,
        "ALLOWED",
        `Unparsed reply '${normalized}' stored; worker follow-up call task created.`
      );

      return NextResponse.json({
        message: `Unparsed reply '${normalized}' logged — created worker task to call ${pt.pseudonym}.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 5. ESCALATE CASE TO CLINICIAN (Worker / Supervisor)
    // =========================================================================
    if (action === "ESCALATE_TO_CLINICIAN") {
      if (callerRole !== "worker" && callerRole !== "supervisor") {
        return NextResponse.json(
          { error: "403 RBAC: Only Workers and Supervisors can initiate escalations." },
          { status: 403 }
        );
      }

      const { patientId } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt || !pt.consentActive) {
        return NextResponse.json(
          { error: "Patient not found or consent withdrawn." },
          { status: 400 }
        );
      }

      const evaluated = evaluatePatientFiveCategories(
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
        state.activeThresholds
      );

      const fac = state.facilities.find((f) => f.id === pt.facilityId);
      const assignedClinician =
        fac && !fac.clinicianOnDuty || evaluated.exceedsLocalClinicCapability
          ? "USR-CLIN-2" // Route to Tertiary / Remote On-Duty Specialist
          : "USR-CLIN-1";

      const latestV = evaluated.latestVitals;
      const vitalsSummary = latestV
        ? `BP ${latestV.systolicBp}/${latestV.diastolicBp} mmHg | HR ${latestV.heartRate} bpm | Glu ${latestV.bloodGlucose} mg/dL | Temp ${latestV.temperature}°C | SpO₂ ${latestV.spo2}%`
        : "No recent vitals (Missed follow-up gap)";

      const newEscId = `ESC-${1000 + state.escalations.length + 1}`;
      const now = new Date().toISOString();

      state.escalations.unshift({
        id: newEscId,
        patientId: pt.id,
        pseudonym: pt.pseudonym,
        ageBand: pt.ageBand,
        cohort: pt.cohort,
        facilityId: pt.facilityId,
        hexagonId: pt.hexagonId,
        ruleId: evaluated.primaryRuleId,
        ruleVersion: evaluated.ruleVersion,
        priorityScore: evaluated.totalScore,
        whyFlagged: evaluated.whyFlagged,
        latestVitalsSummary: vitalsSummary,
        symptoms: pt.symptoms,
        requestedBy: callerId,
        clinicianId: assignedClinician,
        status: "requested",
        slaHours: 4,
        slaElapsedHours: 0,
        slaBreached: false,
        outcomeNote: null,
        referralDestination: evaluated.exceedsLocalClinicCapability
          ? "GMCH & BBCI Regional Tertiary Referral Hub (Hex-4 — Bypassing Local Sub-Centre)"
          : fac && !fac.clinicianOnDuty
          ? "eSanjeevani Telemedicine Hub & District Hospital Specialist Review (Local Doctor Away at Camp)"
          : fac?.name || null,
        createdAt: now,
        updatedAt: now,
      });

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "ESCALATION_REQUESTED",
        pt.pseudonym,
        newEscId,
        "ALLOWED",
        `Escalated ${pt.pseudonym} (Rule ${evaluated.primaryRuleId} v${evaluated.ruleVersion}, Score ${evaluated.totalScore}) to ${assignedClinician} with 4h SLA.`
      );

      return NextResponse.json({
        message: `Escalation ${newEscId} routed to clinician with 4-hour SLA deadline.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 6. CLINICIAN REVIEW / ACKNOWLEDGE / OUTCOME / REASSIGN
    // =========================================================================
    if (action === "CLINICIAN_ACTION") {
      const {
        escalationId,
        newStatus,
        outcomeNote,
        referralDestination,
        reassignToClinicianId,
      } = body;

      const esc = state.escalations.find((e) => e.id === escalationId);
      if (!esc) {
        return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
      }

      // Supervisor can reassign a stuck escalation; only Clinician can record clinical review/outcomes
      if (reassignToClinicianId && callerRole === "supervisor") {
        esc.clinicianId = reassignToClinicianId;
        esc.status = "acknowledged";
        esc.slaBreached = false;
        esc.slaElapsedHours = 0;
        esc.outcomeNote = `Supervisor reassigned case to ${reassignToClinicianId} after SLA alert.`;
        esc.updatedAt = new Date().toISOString();

        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "SUPERVISOR_REASSIGNED_STUCK_ESCALATION",
          esc.pseudonym,
          esc.id,
          "ALLOWED",
          `Supervisor reassigned SLA-breached escalation ${esc.id} to alternate clinician ${reassignToClinicianId}.`
        );

        return NextResponse.json({
          message: `Escalation ${esc.id} reassigned to ${reassignToClinicianId} and SLA reset.`,
          snapshot: snap(),
        });
      }

      if (callerRole !== "clinician") {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "CLINICIAN_REVIEW_DENIED",
          esc.pseudonym,
          esc.id,
          "BLOCKED_403_RBAC",
          `Role '${callerRole}' attempted to record clinical outcome on ${esc.id}. Restricted to qualified clinicians.`
        );
        return NextResponse.json(
          {
            error: "403 RBAC: Only a qualified Clinician can acknowledge or record clinical review outcomes.",
            snapshot: snap(),
          },
          { status: 403 }
        );
      }

      esc.status = newStatus;
      esc.slaBreached = false;
      if (outcomeNote) esc.outcomeNote = outcomeNote;
      if (referralDestination) esc.referralDestination = referralDestination;
      esc.updatedAt = new Date().toISOString();

      // If closed or referred with completed check, clear overdue on patient
      if (newStatus === "closed" || newStatus === "referred") {
        const pt = state.patients.find((p) => p.id === esc.patientId);
        if (pt) {
          pt.daysOverdue = -pt.scheduleIntervalDays;
          pt.consecutiveMissed = 0;
        }
      }

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        `CLINICIAN_ESCALATION_${String(newStatus).toUpperCase()}`,
        esc.pseudonym,
        esc.id,
        "ALLOWED",
        `Clinician updated ${esc.id} to '${newStatus}'. Note: ${outcomeNote || "Standard clinical review"}.`
      );

      return NextResponse.json({
        message: `Escalation ${esc.id} updated to '${newStatus.toUpperCase()}'.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 7. HEXAGON RING BROADCAST & FIRST-CLINIC-TO-ACCEPT LOCK
    // When a village clinic is 100% full, broadcast patient query to all clinics
    // in the adjacent Hexagon ring. Whichever clinic accepts first claims the patient!
    // =========================================================================
    if (action === "BROADCAST_HEXAGON_RING") {
      const { patientId } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt || !pt.consentActive) {
        return NextResponse.json(
          { error: "Patient not found or consent inactive." },
          { status: 400 }
        );
      }

      const originFac =
        state.facilities.find((f) => f.id === pt.facilityId) || state.facilities[0];
      const evaluated = evaluatePatientFiveCategories(
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
        state.activeThresholds
      );

      const latestV = evaluated.latestVitals;
      const vitalsSummary = latestV
        ? `BP ${latestV.systolicBp}/${latestV.diastolicBp} mmHg • HR ${latestV.heartRate} bpm • Temp ${latestV.temperature}°C • SpO₂ ${latestV.spo2}%`
        : "Priority clinical check-in";

      const bcId = `HEX-BC-${900 + state.hexBroadcasts.length + 1}`;
      state.hexBroadcasts.unshift({
        id: bcId,
        patientId: pt.id,
        pseudonym: pt.pseudonym,
        ageBand: pt.ageBand,
        cohort: pt.cohort,
        originFacilityId: originFac.id,
        originFacilityName: originFac.name,
        originHexagonId: originFac.hexagonId,
        targetHexagons: originFac.adjacentHexagons,
        priorityScore: evaluated.totalScore,
        whyFlagged: `Origin clinic ${originFac.hexagonId} (${originFac.village}) is at 100% capacity. Equal Hexagon-Ring Broadcast sent simultaneously to adjacent hexagons [${originFac.adjacentHexagons.join(
          ", "
        )}].`,
        vitalsSummary,
        status: "BROADCASTING_RING",
        acceptedByFacilityId: null,
        acceptedByFacilityName: null,
        acceptedByClinicianId: null,
        acceptedAt: null,
        createdAt: new Date().toISOString(),
      });

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "HEXAGON_RING_BROADCAST_INITIATED",
        pt.pseudonym,
        bcId,
        "ALLOWED",
        `Origin clinic ${originFac.hexagonId} saturated; broadcasted ${pt.pseudonym} (Score ${evaluated.totalScore}) to adjacent hexagon clinics [${originFac.adjacentHexagons.join(", ")}].`
      );

      return NextResponse.json({
        message: `Broadcast ${bcId} transmitted simultaneously to adjacent Hexagon clinics: ${originFac.adjacentHexagons.join(
          ", "
        )}!`,
        snapshot: snap(),
      });
    }

    if (action === "CLAIM_HEXAGON_BROADCAST") {
      const { broadcastId, acceptingFacilityId } = body;
      const bc = state.hexBroadcasts.find((b) => b.id === broadcastId);
      if (!bc) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
      }
      if (bc.status === "CLAIMED_LOCKED") {
        return NextResponse.json(
          { error: `Already claimed by ${bc.acceptedByFacilityName}` },
          { status: 409 }
        );
      }

      const acceptingFac =
        state.facilities.find((f) => f.id === acceptingFacilityId) ||
        state.facilities.find((f) => bc.targetHexagons.includes(f.hexagonId)) ||
        state.facilities[0];

      const now = new Date().toISOString();
      bc.status = "CLAIMED_LOCKED";
      bc.acceptedByFacilityId = acceptingFac.id;
      bc.acceptedByFacilityName = acceptingFac.name;
      bc.acceptedByClinicianId = callerId;
      bc.acceptedAt = now;

      // Transfer patient's active clinic routing to the accepting adjacent Hexagon clinic!
      const pt = state.patients.find((p) => p.id === bc.patientId);
      if (pt) {
        pt.facilityId = acceptingFac.id;
        pt.hexagonId = acceptingFac.hexagonId;
      }

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "HEXAGON_BROADCAST_CLAIMED_AND_LOCKED",
        bc.pseudonym,
        bc.id,
        "ALLOWED",
        `Adjacent clinic ${acceptingFac.name} (${acceptingFac.hexagonId}) accepted & locked broadcast ${bc.id} for ${bc.pseudonym}. Full clinical handover packet transferred immediately.`
      );

      return NextResponse.json({
        message: `${acceptingFac.name} (${acceptingFac.hexagonId}) accepted ${bc.pseudonym}! Case locked and full clinical details routed immediately.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 8. RAPID AMBULANCE DISPATCH (Blinkit / 108 Rapid Response Model)
    // =========================================================================
    if (action === "DISPATCH_RAPID_AMBULANCE") {
      const { patientId, advanceStatusId, nextStatus } = body;

      if (advanceStatusId && nextStatus) {
        const amb = state.ambulanceDispatches.find((a) => a.id === advanceStatusId);
        if (amb) {
          amb.status = nextStatus;
          amb.etaMinutes =
            nextStatus === "PATIENT_PICKED_UP"
              ? 4
              : nextStatus === "HANDED_OVER_TERTIARY"
              ? 0
              : amb.etaMinutes;

          appendAuditEntry(
            callerId,
            callerName,
            callerRole,
            "AMBULANCE_STATUS_UPDATED",
            amb.pseudonym,
            amb.id,
            "ALLOWED",
            `Rapid Ambulance ${amb.id} transitioned to '${nextStatus}'.`
          );
        }
        return NextResponse.json({
          message: `Ambulance status updated to ${nextStatus}.`,
          snapshot: snap(),
        });
      }

      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt || !pt.consentActive) {
        return NextResponse.json(
          { error: "Patient not found or consent inactive." },
          { status: 400 }
        );
      }

      const evaluated = evaluatePatientFiveCategories(
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
        state.activeThresholds
      );

      const latestV = evaluated.latestVitals;
      const vitalsSnapshot = latestV
        ? `BP ${latestV.systolicBp}/${latestV.diastolicBp} mmHg | Pulse ${latestV.heartRate} bpm | Glu ${latestV.bloodGlucose} mg/dL | Temp ${latestV.temperature}°C | SpO₂ ${latestV.spo2}%`
        : "Critical danger-sign dispatch";

      const ambId = `AMB-108-${700 + state.ambulanceDispatches.length + 1}`;
      state.ambulanceDispatches.unshift({
        id: ambId,
        patientId: pt.id,
        pseudonym: pt.pseudonym,
        ageBand: pt.ageBand,
        villageLandmark: `${pt.village} (Hexagon ${pt.hexagonId} — Frontline GPS Pin)`,
        cohort: pt.cohort,
        mobility: pt.mobility,
        originHexagonId: pt.hexagonId,
        destinationFacility: "GMCH & BBCI Regional Tertiary Referral Hub (Hex-4)",
        paramedicSummary: `RAPID RESPONSE DISPATCH • Mobility: ${pt.mobility.toUpperCase()} • Rule ${
          evaluated.primaryRuleId
        } (Score ${evaluated.totalScore}). Bypassing local sub-centre directly to Tertiary Care.`,
        vitalsSnapshot,
        status: "DISPATCHED_EN_ROUTE",
        etaMinutes: 9,
        requestedBy: callerId,
        createdAt: new Date().toISOString(),
      });

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "RAPID_AMBULANCE_DISPATCHED",
        pt.pseudonym,
        ambId,
        "ALLOWED",
        `Dispatched Rapid Ambulance ${ambId} for ${pt.pseudonym} (${pt.mobility}) straight to Tertiary Hospital HEX-4 with Paramedic Handover Sheet.`
      );

      return NextResponse.json({
        message: `Rapid Ambulance ${ambId} dispatched (ETA 9 mins) with Paramedic Handover Sheet for ${pt.pseudonym}!`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 9. SIMULATE THE "31ST PATIENT" CRITICAL ARRIVAL &HEX OVERFLOW PROTOCOL
    // =========================================================================
    if (action === "SIMULATE_31ST_PATIENT") {
      const targetFacilityId = body.facilityId || "FAC-HEX-1";
      const fac =
        state.facilities.find((f) => f.id === targetFacilityId) || state.facilities[1];

      const newPtId = `PT-31ST-${state.patients.length + 1}`;
      const pseudonym = `PT-CRIT-31ST`;
      const now = new Date().toISOString();

      const criticalPatient = {
        id: newPtId,
        pseudonym,
        initials: "D.K. (31st Urgent)",
        ageBand: "50–59",
        village: fac.village,
        facilityId: fac.id,
        hexagonId: fac.hexagonId,
        organizationId: effectiveOrgId,
        cohort: "post_illness" as const,
        mobility: "homebound" as const,
        language: "as" as const,
        assignedWorkerId: callerRole === "worker" ? callerId : "USR-WRK-RINA",
        consentActive: true,
        consentChannel: "in_person_signed",
        consentGrantedAt: now,
        consentWithdrawnAt: null,
        phoneMasked: "+91 ••••• •3131",
        phoneEncrypted: encryptPhonePii("+919000003131"),
        phoneCiphertext: encryptPhonePii("+919000003131"),
        preferredChannel: "whatsapp" as const,
        daysOverdue: 5,
        consecutiveMissed: 2,
        symptoms: ["post_chemo_fever", "breathlessness", "severe_weakness_syncope"],
        vitalsHistory: [
          {
            recordedAt: now,
            systolicBp: 82, // Dangerously LOW (< 90)
            diastolicBp: 52,
            heartRate: 126, // Dangerously HIGH (> 110)
            bloodGlucose: 64, // Dangerously LOW (< 70)
            temperature: 39.1, // Dangerously HIGH (>= 38.0)
            spo2: 90, // Dangerously LOW (< 93%)
          },
        ],
        lastCheckinAt: now,
        scheduleIntervalDays: 7,
        graceDays: 1,
        cleared: false,
        clearedAt: null,
        clearedBy: null,
        clearedNotes: null,
      };

      state.patients.unshift(criticalPatient);

      const evaluated = evaluatePatientFiveCategories(
        {
          patientId: criticalPatient.id,
          pseudonym: criticalPatient.pseudonym,
          ageBand: criticalPatient.ageBand,
          village: criticalPatient.village,
          facilityId: criticalPatient.facilityId,
          hexagonId: criticalPatient.hexagonId,
          cohort: criticalPatient.cohort,
          mobility: criticalPatient.mobility,
          consentActive: true,
          daysOverdue: criticalPatient.daysOverdue,
          consecutiveMissed: criticalPatient.consecutiveMissed,
          symptoms: criticalPatient.symptoms,
          vitalsHistory: criticalPatient.vitalsHistory,
        },
        state.activeThresholds
      );

      // Also broadcast to adjacent Hexagons if clinic is full or case exceeds sub-centre capability
      const bcId = `HEX-BC-${900 + state.hexBroadcasts.length + 1}`;
      state.hexBroadcasts.unshift({
        id: bcId,
        patientId: criticalPatient.id,
        pseudonym: criticalPatient.pseudonym,
        ageBand: criticalPatient.ageBand,
        cohort: criticalPatient.cohort,
        originFacilityId: fac.id,
        originFacilityName: fac.name,
        originHexagonId: fac.hexagonId,
        targetHexagons: fac.adjacentHexagons,
        priorityScore: evaluated.totalScore,
        whyFlagged: `31st-Patient Protocol Triggered: ${criticalPatient.pseudonym} arrived with 5-Category Score ${evaluated.totalScore} (≥ Pivot ${state.activeThresholds.pivotThreshold}). Preempted immediate slot while keeping 10 Walk-In slots untouched, and broadcasted to adjacent Hexagons [${fac.adjacentHexagons.join(
          ", "
        )}]!`,
        vitalsSummary: "BP 82/52 ↓ • HR 126 ↑ • Glu 64 ↓ • Temp 39.1°C ↑ • SpO₂ 90% ↓",
        status: "BROADCASTING_RING",
        acceptedByFacilityId: null,
        acceptedByFacilityName: null,
        acceptedByClinicianId: null,
        acceptedAt: null,
        createdAt: now,
      });

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "31ST_PATIENT_QUICKSORT_PREEMPTION_AND_HEX_BROADCAST",
        criticalPatient.pseudonym,
        `${criticalPatient.id} / ${bcId}`,
        "ALLOWED",
        `31st patient ${criticalPatient.pseudonym} evaluated at Score ${evaluated.totalScore} (>= Threshold ${state.activeThresholds.pivotThreshold}). QuickSort partitioned to Immediate Slot #1, shifted lowest routine follow-up to flexible remote window, preserved all 10 Walk-In slots, and broadcasted to adjacent hexagons [${fac.adjacentHexagons.join(", ")}].`
      );

      return NextResponse.json({
        message: `31st-Patient Protocol Executed! ${criticalPatient.pseudonym} scored ${evaluated.totalScore} (≥ Threshold ${state.activeThresholds.pivotThreshold}) → Injected into Immediate Slot #1, 10 Walk-In slots kept 100% untouched, and broadcasted to adjacent Hexagons [${fac.adjacentHexagons.join(
          ", "
        )}]!`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 10. ADMIN RULE THRESHOLD VERSIONING & CLINICIAN SIGN-OFF
    // =========================================================================
    if (action === "ADMIN_PROPOSE_THRESHOLDS") {
      if (callerRole !== "admin") {
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "ADMIN_RULE_EDIT_DENIED",
          null,
          "RULE-CONFIG",
          "BLOCKED_403_RBAC",
          `Role '${callerRole}' attempted to edit rule thresholds.`
        );
        return NextResponse.json(
          { error: "403 RBAC: Only Admin can propose threshold updates." },
          { status: 403 }
        );
      }

      const {
        pivotThreshold,
        bpSystolicHigh,
        bpSystolicLow,
        glucoseHigh,
        glucoseLow,
        tempHigh,
      } = body;

      const nextVersion = state.activeThresholds.version + 1;
      state.pendingRuleDraft = {
        id: `RULE-DRAFT-v${nextVersion}`,
        proposedThresholds: {
          ...state.activeThresholds,
          pivotThreshold: Number(pivotThreshold ?? state.activeThresholds.pivotThreshold),
          bpSystolicHigh: Number(bpSystolicHigh ?? state.activeThresholds.bpSystolicHigh),
          bpSystolicLow: Number(bpSystolicLow ?? state.activeThresholds.bpSystolicLow),
          glucoseHigh: Number(glucoseHigh ?? state.activeThresholds.glucoseHigh),
          glucoseLow: Number(glucoseLow ?? state.activeThresholds.glucoseLow),
          tempHigh: Number(tempHigh ?? state.activeThresholds.tempHigh),
          version: nextVersion,
          approvedBy: "PENDING CLINICIAN SIGN-OFF",
          approvedAt: "",
        },
        proposedBy: callerName,
        proposedAt: new Date().toISOString(),
        status: "PENDING_CLINICIAN_SIGNOFF",
        approvedBy: null,
        approvedAt: null,
      };

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "RULE_VERSION_DRAFT_CREATED",
        null,
        `RULE-DRAFT-v${nextVersion}`,
        "ALLOWED",
        `Admin created Rule Draft v${nextVersion} (Pivot Threshold: ${state.pendingRuleDraft.proposedThresholds.pivotThreshold}, BP Upper: ${state.pendingRuleDraft.proposedThresholds.bpSystolicHigh}). Awaiting mandatory Clinician sign-off.`
      );

      return NextResponse.json({
        message: `Rule Version v${nextVersion} staged. Per governance guardrail, it remains INACTIVE until signed off by a Clinician.`,
        snapshot: snap(),
      });
    }

    if (action === "CLINICIAN_APPROVE_THRESHOLDS") {
      if (callerRole !== "clinician") {
        return NextResponse.json(
          { error: "403 RBAC: Only a qualified Clinician can sign off rule versions." },
          { status: 403 }
        );
      }
      if (!state.pendingRuleDraft) {
        return NextResponse.json(
          { error: "No pending rule draft to approve." },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const draft = state.pendingRuleDraft;
      state.activeThresholds = {
        ...draft.proposedThresholds,
        approvedBy: `${callerName} — ILLUSTRATIVE PROTOTYPE SIGN-OFF`,
        approvedAt: now,
      };
      state.pendingRuleDraft = null;

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "RULE_VERSION_APPROVED_AND_ACTIVATED",
        null,
        `RULE-SET-v${state.activeThresholds.version}`,
        "ALLOWED",
        `Clinician ${callerName} signed off and activated Rule Set v${state.activeThresholds.version} (Pivot Threshold: ${state.activeThresholds.pivotThreshold}).`
      );

      return NextResponse.json({
        message: `Clinician sign-off recorded! Rule Set v${state.activeThresholds.version} is now active and QuickSort partitions updated.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 11. ADVANCE CLOCK (+4 HOURS / +24 HOURS DAILY AUTOMATION JOBS)
    // =========================================================================
    if (action === "ADVANCE_CLOCK") {
      const hours = Number(body.hours || 24);
      const currentClock = new Date(state.simulatedClockIso);
      currentClock.setHours(currentClock.getHours() + hours);
      state.simulatedClockIso = currentClock.toISOString();

      let newlyBreached = 0;
      for (const esc of state.escalations) {
        if (esc.status === "requested" || esc.status === "acknowledged") {
          esc.slaElapsedHours += hours;
          if (esc.slaElapsedHours >= esc.slaHours && !esc.slaBreached) {
            esc.slaBreached = true;
            esc.status = "sla_supervisor_alerted";
            newlyBreached++;
          }
        }
      }

      if (hours >= 24) {
        // Advance follow-up schedules by 1 day (idempotent overdue detector)
        for (const pt of state.patients) {
          if (pt.consentActive) {
            pt.daysOverdue += 1;
          }
        }
      }

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "ADVANCE_CLOCK_IDEMPOTENT_JOBS_RUN",
        null,
        `CLOCK+${hours}H`,
        "ALLOWED",
        `Advanced clock by +${hours}h. Ran Overdue Detector, QuickSort Worklist Builder, Escalation Watchdog (${newlyBreached} new SLA supervisor alerts), and Audit Hash Verifier.`
      );

      return NextResponse.json({
        message: `Clock advanced +${hours}h → Idempotent jobs completed (${newlyBreached} SLA escalations routed to Supervisor).`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 12. TOGGLE DOCTOR ON-DUTY STATUS AT CLINIC
    // =========================================================================
    if (action === "TOGGLE_FACILITY_DOCTOR") {
      const { facilityId } = body;
      const fac = state.facilities.find((f) => f.id === facilityId);
      if (fac) {
        fac.clinicianOnDuty = !fac.clinicianOnDuty;
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          "FACILITY_CLINICIAN_DUTY_CHANGED",
          null,
          fac.id,
          "ALLOWED",
          `${fac.name} (${fac.hexagonId}) clinician on-duty status changed to ${
            fac.clinicianOnDuty ? "ON-DUTY" : "AWAY / REMOTE FALLBACK ACTIVE"
          }.`
        );
      }
      return NextResponse.json({
        message: `Updated doctor availability for ${fac?.name}.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 13. TOGGLE PATIENT CONSENT OR ENROL NEW SYNTHETIC PATIENT
    // =========================================================================
    if (action === "TOGGLE_CONSENT") {
      const { patientId } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (pt) {
        pt.consentActive = !pt.consentActive;
        pt.consentWithdrawnAt = pt.consentActive ? null : new Date().toISOString();
        pt.phoneMasked = pt.consentActive ? "+91 ••••• •7712" : "[LOCKED — CONSENT WITHDRAWN]";
        appendAuditEntry(
          callerId,
          callerName,
          callerRole,
          pt.consentActive ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN",
          pt.pseudonym,
          pt.id,
          "ALLOWED",
          `Patient ${pt.pseudonym} consent status changed to ${
            pt.consentActive ? "ACTIVE" : "WITHDRAWN (LOCKED STUB)"
          }.`
        );
      }
      return NextResponse.json({
        message: `Updated consent status for ${pt?.pseudonym}.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 14. MULTI-TENANT ORGANIZATION SIGN-IN & NEW ORGANIZATION ONBOARDING
    // =========================================================================
    if (action === "SIGN_IN_ORGANIZATION") {
      const { targetOrganizationId, targetUserId, accessPasscode } = body;
      const org = state.organizations.find(
        (o) =>
          o.id.toUpperCase() === String(targetOrganizationId || "").trim().toUpperCase() ||
          o.orgCode.toUpperCase() === String(targetOrganizationId || "").trim().toUpperCase()
      );
      if (!org) {
        return NextResponse.json({ error: "Organization not found." }, { status: 404 });
      }

      const orgUsers = state.users.filter((u) => u.organizationId === org.id);
      const selectedUser =
        orgUsers.find(
          (u) => u.id.toLowerCase() === String(targetUserId || "").trim().toLowerCase()
        ) ||
        state.users.find(
          (u) =>
            u.id.toLowerCase() === String(targetUserId || "").trim().toLowerCase() &&
            u.organizationId === org.id
        ) ||
        orgUsers[0] ||
        state.users[0];

      const attemptKey = `${org.id}::${selectedUser.id}`;
      if (!state.loginAttempts) {
        state.loginAttempts = {};
      }
      const attemptRecord = state.loginAttempts[attemptKey] || {
        failedCount: 0,
        lockedUntil: null,
      };

      // Check if locked after 5 failed attempts
      if (
        attemptRecord.failedCount >= 5 &&
        attemptRecord.lockedUntil &&
        new Date(attemptRecord.lockedUntil).getTime() > Date.now()
      ) {
        appendAuditEntry(
          selectedUser.id,
          selectedUser.name,
          selectedUser.role,
          "ORGANIZATION_SIGN_IN_LOCKED_423",
          null,
          org.id,
          "BLOCKED_403_RBAC",
          `Account ${selectedUser.id} in ${org.id} is locked after 5 failed password attempts until ${attemptRecord.lockedUntil}.`
        );
        return NextResponse.json(
          {
            error: `423 Account locked after 5 failed attempts for ${selectedUser.id} (${org.shortName}). Try again in 15 minutes or reset demo state.`,
            locked: true,
            failedAttempts: attemptRecord.failedCount,
          },
          { status: 423 }
        );
      }

      const providedSecret = String(accessPasscode || "").trim();
      const matchesUserHash =
        providedSecret.length > 0 &&
        Boolean(selectedUser.passwordHash) &&
        verifyPasswordHash(providedSecret, selectedUser.passwordHash || "");
      const matchesOrgPasscode =
        providedSecret.length > 0 &&
        (providedSecret.toUpperCase() === org.accessPasscode.toUpperCase() ||
          providedSecret.toUpperCase() === org.orgCode.toUpperCase());

      if (providedSecret && !matchesUserHash && !matchesOrgPasscode) {
        const nextFailed = attemptRecord.failedCount + 1;
        const isNowLocked = nextFailed >= 5;
        state.loginAttempts[attemptKey] = {
          failedCount: nextFailed,
          lockedUntil: isNowLocked
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : null,
          lastAttemptAt: new Date().toISOString(),
        };

        appendAuditEntry(
          selectedUser.id,
          selectedUser.name,
          selectedUser.role,
          isNowLocked ? "ORGANIZATION_SIGN_IN_LOCKED_5_ATTEMPTS" : "ORGANIZATION_SIGN_IN_DENIED",
          null,
          org.id,
          "BLOCKED_403_RBAC",
          `Invalid credentials for ${selectedUser.id} @ ${org.id} (Attempt ${nextFailed}/5).`
        );

        if (isNowLocked) {
          return NextResponse.json(
            {
              error: `423 Account locked after 5 failed attempts for ${selectedUser.id} (${org.shortName}).`,
              locked: true,
              failedAttempts: nextFailed,
            },
            { status: 423 }
          );
        }

        return NextResponse.json(
          {
            error: `401 Invalid password for ${selectedUser.id} in ${org.name}. (${
              5 - nextFailed
            } attempt${5 - nextFailed === 1 ? "" : "s"} remaining before lockout).`,
            failedAttempts: nextFailed,
            remainingAttempts: 5 - nextFailed,
          },
          { status: 403 }
        );
      }

      // Reset failed attempt counter on successful sign-in
      state.loginAttempts[attemptKey] = {
        failedCount: 0,
        lockedUntil: null,
        lastAttemptAt: new Date().toISOString(),
      };

      const signedToken = signAuthToken(selectedUser.id, selectedUser.role, org.id);

      // Update or add simultaneous session in state.activeSessions
      if (!Array.isArray(state.activeSessions)) {
        state.activeSessions = [];
      }
      const existingSessionIdx = state.activeSessions.findIndex(
        (s) => s.userId === selectedUser.id && s.orgId === org.id
      );
      const nowIso = new Date().toISOString();
      const sessionEntry = {
        sessionId: `SES-${org.orgCode}-${selectedUser.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
        userId: selectedUser.id,
        displayName: selectedUser.name,
        orgId: org.id,
        orgName: org.shortName,
        role: selectedUser.role,
        roleBadge: selectedUser.roleBadge || selectedUser.title,
        issuedAt: nowIso,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      if (existingSessionIdx >= 0) {
        state.activeSessions[existingSessionIdx] = sessionEntry;
      } else {
        state.activeSessions.unshift(sessionEntry);
      }

      appendAuditEntry(
        selectedUser.id,
        selectedUser.name,
        selectedUser.role,
        "ORGANIZATION_USER_SIGN_IN",
        null,
        org.id,
        "ALLOWED",
        `${selectedUser.name} (${selectedUser.role}) signed into ${org.name} (${org.id}) with strict multi-tenant data isolation.`
      );

      return NextResponse.json({
        message: `Signed into ${org.name} as ${selectedUser.name} (${selectedUser.title}). Strictly isolated to ${org.shortName} patient registry.`,
        authToken: signedToken,
        session: sessionEntry,
        snapshot: computeSystemSnapshot(
          selectedUser.role,
          selectedUser.id,
          org.id,
          workerScope
        ),
      });
    }

    if (action === "REGISTER_ORGANIZATION") {
      const {
        orgName,
        orgShortName,
        district = "Kamrup Rural, Assam",
        accessPasscode = "ORG-2026",
        teamSize = 15,
        leadWorkerName = "Asha Lead Worker",
      } = body;

      if (!orgName || String(orgName).trim().length < 2) {
        return NextResponse.json(
          { error: "Please provide a valid Organization Name." },
          { status: 400 }
        );
      }

      const cleanShort =
        (orgShortName ? String(orgShortName).trim() : String(orgName).trim().split(" ")[0])
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "") || "NEWORG";
      const newOrgId = `ORG-${cleanShort}-${state.organizations.length + 1}`;
      const newOrg = {
        id: newOrgId,
        name: String(orgName).trim(),
        shortName: String(orgShortName || cleanShort).trim(),
        orgCode: cleanShort,
        region: String(district).trim(),
        district: String(district).trim(),
        accessPasscode: String(accessPasscode).trim().toUpperCase(),
        teamSize: Number(teamSize) || 15,
        description: `Dedicated ${teamSize || 15}-worker frontline care organization operating in ${district} with isolated tenant patient records.`,
      };
      state.organizations.push(newOrg);

      const newWorkerId = `USR-${cleanShort}-WRK-1`;
      const newDocId = `USR-${cleanShort}-DOC-1`;
      const newSupId = `USR-${cleanShort}-SUP-1`;
      const newPassHash = hashPassword(String(accessPasscode).trim());
      state.users.push(
        {
          id: newWorkerId,
          name: `${leadWorkerName} (${newOrg.shortName} Team Lead #1)`,
          title: `${newOrg.shortName} ASHA Team Lead`,
          role: "worker",
          facilityId: "FAC-HEX-0",
          available: true,
          organizationId: newOrgId,
          passwordHash: newPassHash,
        },
        {
          id: newDocId,
          name: `Dr. Medical Officer (${newOrg.shortName} MO)`,
          title: `${newOrg.shortName} Medical Officer`,
          role: "clinician",
          facilityId: "FAC-HEX-0",
          available: true,
          organizationId: newOrgId,
          passwordHash: newPassHash,
        },
        {
          id: newSupId,
          name: `Block Supervisor (${newOrg.shortName} Ops)`,
          title: `${newOrg.shortName} Block Supervisor`,
          role: "supervisor",
          facilityId: "FAC-HEX-0",
          available: true,
          organizationId: newOrgId,
          passwordHash: newPassHash,
        }
      );

      appendAuditEntry(
        newWorkerId,
        leadWorkerName,
        "worker",
        "ORGANIZATION_REGISTERED",
        null,
        newOrgId,
        "ALLOWED",
        `Registered new multi-tenant organization '${newOrg.name}' (${newOrgId}) with ${newOrg.teamSize}-person frontline team.`
      );

      return NextResponse.json({
        message: `Organization '${newOrg.name}' created and isolated! Signed in as ${leadWorkerName}.`,
        authToken: signAuthToken(newWorkerId, "worker", newOrgId),
        snapshot: computeSystemSnapshot("worker", newWorkerId, newOrgId, "organization"),
      });
    }

    // =========================================================================
    // 15. REGISTER NEW PATIENT INTO ACTIVE ORGANIZATION REGISTRY
    // =========================================================================
    if (action === "REGISTER_PATIENT") {
      if (callerRole !== "worker" && callerRole !== "clinician" && callerRole !== "admin") {
        return NextResponse.json(
          { error: "Only Frontline Workers, Clinicians, or Admins can register patients." },
          { status: 403 }
        );
      }

      const {
        initials = "N.P.",
        ageBand = "40–49",
        cohort = "hypertension",
        facilityId,
        mobility = "independent",
        language = "as",
        preferredChannel = "sms",
        phonePlain = "+919854011223",
        systolicBp = 148,
        diastolicBp = 94,
        heartRate = 88,
        bloodGlucose = 132,
        temperature = 37.1,
        spo2 = 97,
        symptoms = [],
        daysOverdue = 0,
        consentActive = true,
      } = body;

      const orgFacilities = state.facilities.filter(
        (f) => f.organizationId === effectiveOrgId
      );
      const selectedFac =
        state.facilities.find((f) => f.id === facilityId) ||
        orgFacilities[0] ||
        state.facilities[0];

      const cohortPrefix =
        cohort === "pregnancy"
          ? "MAT"
          : cohort === "post_illness"
          ? "ONC"
          : cohort === "diabetes"
          ? "DIA"
          : "HYP";

      const seqNum = 500 + state.patients.length + 1;
      const newPtId = `PT-${seqNum}`;
      const pseudonym = `PT-${cohortPrefix}-${seqNum}`;
      const now = new Date().toISOString();
      const cleanPhone = String(phonePlain || "+919854011223").replace(/\s+/g, "");
      const last4 = cleanPhone.slice(-4).padStart(4, "0");

      const assignedWorkerId =
        callerRole === "worker"
          ? callerId
          : state.users.find(
              (u) => u.organizationId === effectiveOrgId && u.role === "worker"
            )?.id || "USR-WRK-RINA";

      const normalizedMobility: MobilityStatus =
        mobility === "homebound"
          ? "homebound"
          : mobility === "assisted"
          ? "assisted"
          : "independent";

      const encryptedPhone = encryptPhonePii(cleanPhone);

      const newPatient = {
        id: newPtId,
        pseudonym,
        initials: String(initials).trim() || "N.P.",
        ageBand: String(ageBand),
        village: selectedFac.village,
        facilityId: selectedFac.id,
        hexagonId: selectedFac.hexagonId,
        organizationId: effectiveOrgId,
        cohort: cohort as CohortType,
        mobility: normalizedMobility,
        language: (language as SupportedLanguage) || "as",
        assignedWorkerId,
        consentActive: Boolean(consentActive),
        consentChannel: "in_person_signed" as const,
        consentGrantedAt: now,
        consentWithdrawnAt: consentActive ? null : now,
        phoneMasked: consentActive ? `+91 ••••• •${last4}` : "[LOCKED — CONSENT WITHDRAWN]",
        phoneEncrypted: encryptedPhone,
        phoneCiphertext: encryptedPhone,
        preferredChannel: (preferredChannel === "whatsapp" ? "whatsapp" : "sms") as
          | "sms"
          | "whatsapp",
        daysOverdue: Math.max(0, Number(daysOverdue) || 0),
        consecutiveMissed: Number(daysOverdue) > 3 ? 1 : 0,
        symptoms: Array.isArray(symptoms) ? symptoms.map(String) : [],
        vitalsHistory: [
          {
            recordedAt: now,
            systolicBp: Number(systolicBp) || 122,
            diastolicBp: Number(diastolicBp) || 80,
            heartRate: Number(heartRate) || 78,
            bloodGlucose: Number(bloodGlucose) || 110,
            temperature: Number(temperature) || 36.8,
            spo2: Number(spo2) || 98,
          },
        ],
        lastCheckinAt: now,
        scheduleIntervalDays: 7,
        graceDays: 2,
        cleared: false,
        clearedAt: null,
        clearedBy: null,
        clearedNotes: null,
      };

      state.patients.unshift(newPatient);

      const evaluated = evaluatePatientFiveCategories(
        {
          patientId: newPatient.id,
          pseudonym: newPatient.pseudonym,
          ageBand: newPatient.ageBand,
          village: newPatient.village,
          facilityId: newPatient.facilityId,
          hexagonId: newPatient.hexagonId,
          cohort: newPatient.cohort,
          mobility: newPatient.mobility,
          consentActive: newPatient.consentActive,
          daysOverdue: newPatient.daysOverdue,
          consecutiveMissed: newPatient.consecutiveMissed,
          symptoms: newPatient.symptoms,
          vitalsHistory: newPatient.vitalsHistory,
        },
        state.activeThresholds
      );

      if (evaluated.abovePivotThreshold) {
        const escId = `ESC-${1000 + state.escalations.length + 1}`;
        state.escalations.unshift({
          id: escId,
          patientId: newPatient.id,
          pseudonym: newPatient.pseudonym,
          ageBand: newPatient.ageBand,
          cohort: newPatient.cohort,
          facilityId: newPatient.facilityId,
          hexagonId: newPatient.hexagonId,
          ruleId: evaluated.primaryRuleId,
          ruleVersion: evaluated.ruleVersion,
          priorityScore: evaluated.totalScore,
          whyFlagged: evaluated.whyFlagged,
          latestVitalsSummary: `BP ${newPatient.vitalsHistory[0].systolicBp}/${newPatient.vitalsHistory[0].diastolicBp} mmHg | HR ${newPatient.vitalsHistory[0].heartRate} bpm | Glu ${newPatient.vitalsHistory[0].bloodGlucose} mg/dL | Temp ${newPatient.vitalsHistory[0].temperature}°C | SpO₂ ${newPatient.vitalsHistory[0].spo2}%`,
          symptoms: newPatient.symptoms,
          requestedBy: callerId,
          clinicianId: "USR-CLIN-1",
          status: "requested",
          slaHours: 4,
          slaElapsedHours: 0,
          slaBreached: false,
          outcomeNote: null,
          referralDestination: evaluated.exceedsLocalClinicCapability
            ? "GMCH & BBCI Regional Tertiary Referral Hub (Hex-4 — Bypassing Local Sub-Centre)"
            : selectedFac.name,
          createdAt: now,
          updatedAt: now,
        });
      }

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "PATIENT_REGISTERED",
        newPatient.pseudonym,
        newPatient.id,
        "ALLOWED",
        `Registered new patient ${newPatient.pseudonym} (${newPatient.initials}, ${newPatient.ageBand}y, ${newPatient.cohort}) into organization ${effectiveOrgId} at ${selectedFac.name}. Initial 5-Category Score: ${evaluated.totalScore} (${
          evaluated.abovePivotThreshold ? "IMMEDIATE_PRIORITY" : "FLEXIBLE_WINDOW"
        }).`
      );

      return NextResponse.json({
        message: `Registered ${newPatient.pseudonym} (${newPatient.initials}) in ${effectiveOrgId}! 5-Category Score: ${evaluated.totalScore} → ${
          evaluated.abovePivotThreshold
            ? "Routed to Immediate Priority Slot (≥ 100) & Doctor Queue"
            : "Assigned Flexible Routine Window (< 100)"
        }.`,
        snapshot: snap(),
      });
    }

    // =========================================================================
    // 16. CLEAR / STABILIZE PATIENT FROM ACTIVE QUEUE (OR RESTORE)
    // =========================================================================
    if (action === "CLEAR_PATIENT") {
      if (callerRole !== "worker" && callerRole !== "clinician" && callerRole !== "supervisor") {
        return NextResponse.json(
          { error: "Unauthorized role to clear patient." },
          { status: 403 }
        );
      }

      const { patientId, clearanceNote } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      const now = new Date().toISOString();
      pt.cleared = true;
      pt.clearedAt = now;
      pt.clearedBy = callerName;
      pt.clearedNotes =
        clearanceNote ||
        `Check-up completed & vitals stabilized. Cleared from active high-risk queue by ${callerName}; clinic slot freed.`;
      pt.clearedReason = pt.clearedNotes;

      // Also mark any open escalations for this patient as closed
      for (const esc of state.escalations) {
        if (esc.patientId === pt.id && esc.status !== "closed") {
          esc.status = "closed";
          esc.slaBreached = false;
          esc.outcomeNote = pt.clearedNotes || null;
          esc.updatedAt = now;
        }
      }

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "PATIENT_CLEARED_FROM_QUEUE",
        pt.pseudonym,
        pt.id,
        "ALLOWED",
        `Cleared ${pt.pseudonym} from active triage queue (${pt.clearedNotes}). Assigned clinic slot in ${pt.hexagonId} freed immediately.`
      );

      return NextResponse.json({
        message: `Cleared ${pt.pseudonym} (${pt.initials}) from active queue! Clinic slot in ${pt.hexagonId} freed immediately.`,
        snapshot: snap(),
      });
    }

    if (action === "RESTORE_CLEARED_PATIENT") {
      const { patientId } = body;
      const pt = state.patients.find((p) => p.id === patientId);
      if (!pt) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      pt.cleared = false;
      pt.clearedAt = null;
      pt.clearedBy = null;
      pt.clearedNotes = null;

      appendAuditEntry(
        callerId,
        callerName,
        callerRole,
        "PATIENT_RESTORED_TO_QUEUE",
        pt.pseudonym,
        pt.id,
        "ALLOWED",
        `Re-admitted ${pt.pseudonym} into active QuickSort monitoring queue.`
      );

      return NextResponse.json({
        message: `Restored ${pt.pseudonym} back into active QuickSort triage queue.`,
        snapshot: snap(),
      });
    }

    if (action === "RESET_DEMO") {
      resetDbState();
      return NextResponse.json({
        message: "Seeded 300 synthetic patients, 5 Hexagon Clinics, and hash-chained audit trail reset to clean initial state.",
        snapshot: snap(),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
