"use client";

import React from "react";
import { Ambulance, CheckCircle2, ExternalLink, PhoneCall, Stethoscope } from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";

export default function ClinicianPage() {
  const { snapshot, busyAction, executeAction, clearPatient } = useSwasthya();

  if (!snapshot) return null;

  // Dynamically resolve Clinicians, Supervisors, and Tertiary Hospital from API data
  const primaryClinician =
    snapshot.users.find((u) => u.role === "clinician") || snapshot.users[0];
  const backupClinician =
    snapshot.users.find(
      (u) => u.role === "clinician" && u.id !== primaryClinician?.id
    ) || primaryClinician;
  const primarySupervisor =
    snapshot.users.find((u) => u.role === "supervisor") || snapshot.users[0];
  const tertiaryFacility =
    snapshot.facilities.find((f) => f.tier === "TERTIARY_REFERRAL") ||
    snapshot.facilities[snapshot.facilities.length - 1];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-rose-100/90 via-teal-100/60 to-emerald-100/70 rounded-2xl border-2 border-rose-300 p-6 sm:p-8 shadow-xs space-y-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-200 border border-rose-300 text-rose-800 text-sm font-bold">
          <Stethoscope className="w-4 h-4 text-red-600" />
          Clinician Review & Emergency Transport Console
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-950 leading-snug">
          Doctor Review & 108 Rapid Ambulance Handover
        </h1>
        <p className="text-base text-slate-800 leading-relaxed max-w-3xl font-medium">
          Per data minimization, doctors view pseudonymous IDs, 5-category vital
          trajectories, and rule explanations—patient contact numbers remain masked.
        </p>
      </div>

      {/* Pending Rule Sign-Off Banner */}
      {snapshot.pendingRuleDraft && primaryClinician && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-bold uppercase text-emerald-800">
              Clinician Governance Gate Required
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Pending Rule Set {snapshot.pendingRuleDraft.id} Proposed by{" "}
              {snapshot.pendingRuleDraft.proposedBy}
            </h2>
            <p className="text-base text-slate-700">
              Proposed QuickSort Pivot:{" "}
              <strong>
                {snapshot.pendingRuleDraft.proposedThresholds.pivotThreshold}
              </strong>{" "}
              • BP Upper:{" "}
              <strong>
                {snapshot.pendingRuleDraft.proposedThresholds.bpSystolicHigh} mmHg
              </strong>
            </p>
          </div>
          <button
            disabled={busyAction}
            onClick={() =>
              executeAction({
                action: "CLINICIAN_APPROVE_THRESHOLDS",
                callerRole: "clinician",
                callerId: primaryClinician.id,
                callerName: `${primaryClinician.name} (${primaryClinician.title})`,
              })
            }
            className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold shrink-0 shadow-xs"
          >
            ✓ Sign Off & Activate Rule v
            {snapshot.pendingRuleDraft.proposedThresholds.version}
          </button>
        </div>
      )}

      {/* Section 1: 108 Rapid Ambulance Dispatches */}
      <section className="bg-rose-50/90 rounded-2xl border-2 border-rose-300 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center shrink-0">
              <Ambulance className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                108 Rapid Ambulance &amp; Paramedic Handover Tracker
              </h2>
              <p className="text-base text-slate-700 font-medium">
                Webhook Mode:{" "}
                <strong>
                  {snapshot.integrations?.ambulance108Dispatch.mode ??
                    "SIMULATED_108_DISPATCH"}
                </strong>{" "}
                • Bypasses under-equipped local sub-centres directly to{" "}
                <strong>GMCH &amp; BBCI Regional Tertiary Referral Hub (Hex-4)</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="tel:108"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial 108 Emergency Control Room</span>
            </a>
            <a
              href="https://esanjeevani.mohfw.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-bold inline-flex items-center gap-2"
            >
              <span>eSanjeevani Telemedicine Hub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {snapshot.ambulanceDispatches.map((amb) => (
            <div
              key={amb.id}
              className="p-6 rounded-2xl bg-red-50/50 border border-red-200 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-red-900 text-lg">
                  {amb.id} • {amb.pseudonym} (Age {amb.ageBand})
                </span>
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-mono text-xs font-bold">
                  {amb.status.replace(/_/g, " ")}{" "}
                  {amb.etaMinutes > 0 ? `• ETA ${amb.etaMinutes}m` : ""}
                </span>
              </div>

              <div className="text-base text-slate-800 space-y-1">
                <div>
                  <strong>Pickup Location:</strong> {amb.villageLandmark}
                </div>
                <div>
                  <strong>Receiving Hospital:</strong>{" "}
                  <span className="text-emerald-800 font-bold">
                    {amb.destinationFacility}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-100/90 border border-rose-300 font-mono text-base font-bold text-rose-800">
                {amb.vitalsSnapshot}
              </div>

              <p className="text-base text-slate-800 leading-relaxed font-medium">
                {amb.paramedicSummary}
              </p>

              {amb.status !== "HANDED_OVER_TERTIARY" && (
                <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-3">
                  {amb.status === "DISPATCHED_EN_ROUTE" && (
                    <button
                      disabled={busyAction}
                      onClick={() =>
                        executeAction({
                          action: "DISPATCH_RAPID_AMBULANCE",
                          advanceStatusId: amb.id,
                          nextStatus: "PATIENT_PICKED_UP",
                        })
                      }
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-bold"
                    >
                      Mark Patient Picked Up
                    </button>
                  )}
                  <button
                    disabled={busyAction}
                    onClick={() =>
                      executeAction({
                        action: "DISPATCH_RAPID_AMBULANCE",
                        advanceStatusId: amb.id,
                        nextStatus: "HANDED_OVER_TERTIARY",
                      })
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold"
                  >
                    ✓ Confirm Handover at Tertiary ER
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Escalated Clinical Cases */}
      <section className="bg-teal-50/90 rounded-2xl border-2 border-teal-300 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
            Escalated Clinical Cases ({snapshot.escalations.length})
          </h2>
          <p className="text-base text-teal-900 font-medium">
            Every escalation has a 4-hour acknowledgement SLA and 24-hour review SLA.
          </p>
        </div>

        <div className="space-y-6">
          {snapshot.escalations.map((esc) => (
            <div
              key={esc.id}
              className={`p-6 rounded-2xl border space-y-4 ${
                esc.slaBreached
                  ? "bg-red-50/60 border-red-300"
                  : "bg-teal-100/60 border-teal-300"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-950 text-lg">
                    {esc.id} • {esc.pseudonym}
                  </span>
                  <span className="px-3 py-1 rounded-md bg-teal-200 border border-teal-400 text-teal-950 text-sm font-bold">
                    Age {esc.ageBand} • {esc.cohort.toUpperCase()} • {esc.hexagonId}
                  </span>
                  <span className="px-3 py-1 rounded-md bg-red-100 text-red-800 font-mono text-sm font-bold border border-red-300">
                    {esc.ruleId} v{esc.ruleVersion} • Score {esc.priorityScore}
                  </span>
                </div>

                <span
                  className={`px-3.5 py-1.5 rounded-full font-mono text-sm font-bold ${
                    esc.slaBreached
                      ? "bg-red-600 text-white"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {esc.status.toUpperCase()} • SLA: {esc.slaElapsedHours}h /{" "}
                  {esc.slaHours}h
                </span>
              </div>

              <div className="p-4 rounded-xl bg-teal-100/90 border border-teal-300 font-mono text-base font-bold text-teal-950">
                {esc.latestVitalsSummary}
              </div>

              <p className="text-base text-slate-800 leading-relaxed font-medium">
                {esc.whyFlagged}
              </p>

              {esc.referralDestination && (
                <div className="text-base text-emerald-800">
                  <strong>Referral Destination:</strong> {esc.referralDestination}
                </div>
              )}
              {esc.outcomeNote && (
                <div className="text-base text-slate-800">
                  <strong>Doctor Outcome Note:</strong> {esc.outcomeNote}
                </div>
              )}

              {primaryClinician && (
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  <button
                    disabled={busyAction}
                    onClick={() =>
                      executeAction({
                        action: "CLINICIAN_ACTION",
                        callerRole: "clinician",
                        callerId: primaryClinician.id,
                        callerName: `${primaryClinician.name} (${primaryClinician.title})`,
                        escalationId: esc.id,
                        newStatus: "acknowledged",
                        outcomeNote:
                          "Acknowledged by Doctor within SLA window. Reviewing 5-vital trajectory.",
                      })
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold"
                  >
                    1. Acknowledge Case
                  </button>

                  <button
                    disabled={busyAction}
                    onClick={() =>
                      executeAction({
                        action: "CLINICIAN_ACTION",
                        callerRole: "clinician",
                        callerId: primaryClinician.id,
                        callerName: `${primaryClinician.name} (${primaryClinician.title})`,
                        escalationId: esc.id,
                        newStatus: "referred",
                        referralDestination: tertiaryFacility
                          ? `${tertiaryFacility.name} (${tertiaryFacility.hexagonId})`
                          : "Regional Tertiary Referral Hospital",
                        outcomeNote: `Reviewed: Direct referral issued to ${
                          tertiaryFacility?.name || "Tertiary Hospital"
                        }.`,
                      })
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-bold"
                  >
                    2. Refer to Tertiary Hospital
                  </button>

                  <button
                    disabled={busyAction}
                    onClick={() =>
                      executeAction({
                        action: "CLINICIAN_ACTION",
                        callerRole: "clinician",
                        callerId: primaryClinician.id,
                        callerName: `${primaryClinician.name} (${primaryClinician.title})`,
                        escalationId: esc.id,
                        newStatus: "returned",
                        outcomeNote:
                          "Reviewed remotely: No clinic trip needed today; assigned worker to re-check vitals in 48h.",
                      })
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-100 hover:bg-teal-200 border border-teal-300 text-teal-950 text-base font-bold"
                  >
                    3. Return to Worker (Remote Care)
                  </button>

                  <button
                    disabled={busyAction}
                    onClick={() =>
                      executeAction({
                        action: "CLINICIAN_ACTION",
                        callerRole: "clinician",
                        callerId: primaryClinician.id,
                        callerName: `${primaryClinician.name} (${primaryClinician.title})`,
                        escalationId: esc.id,
                        newStatus: "closed",
                        outcomeNote:
                          "Outcome confirmed: Patient stabilized and next follow-up scheduled.",
                      })
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-base font-bold"
                  >
                    ✓ Confirm Outcome & Close
                  </button>

                  <button
                    disabled={busyAction}
                    onClick={() =>
                      void clearPatient(
                        esc.patientId,
                        `Clinician reviewed & stabilized ${esc.pseudonym}. Cleared from active high-risk queue; clinic slot freed.`
                      )
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-950 text-base font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Clear / Discharge Patient</span>
                  </button>

                  {esc.slaBreached && primarySupervisor && backupClinician && (
                    <button
                      disabled={busyAction}
                      onClick={() =>
                        executeAction({
                          action: "CLINICIAN_ACTION",
                          callerRole: "supervisor",
                          callerId: primarySupervisor.id,
                          callerName: `${primarySupervisor.name} (${primarySupervisor.title})`,
                          escalationId: esc.id,
                          reassignToClinicianId: backupClinician.id,
                        })
                      }
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-bold"
                    >
                      ⚡ Supervisor: Reassign Stuck Case
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
