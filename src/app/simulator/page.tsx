"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Database,
  EyeOff,
  Hexagon,
  PlusCircle,
  RefreshCw,
  Smartphone,
  Zap,
} from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";

export default function SimulatorPage() {
  const { snapshot, busyAction, executeAction, openPhoneDrawer } = useSwasthya();

  if (!snapshot) return null;

  // Dynamically resolve targets from API state (zero hardcoded IDs)
  const targetFacility = snapshot.facilities[1] || snapshot.facilities[0];
  const tertiaryFacility =
    snapshot.facilities.find((f) => f.tier === "TERTIARY_REFERRAL") ||
    snapshot.facilities[snapshot.facilities.length - 1];
  const routinePatient =
    snapshot.quickSortResult.flexiblePartition[0] ||
    snapshot.quickSortResult.combinedRanked[0];
  const criticalPatient =
    snapshot.quickSortResult.immediatePartition[0] ||
    snapshot.quickSortResult.combinedRanked[0];
  const supervisorUser =
    snapshot.users.find((u) => u.role === "supervisor") || snapshot.users[0];
  const clinicianUser =
    snapshot.users.find((u) => u.role === "clinician") || snapshot.users[0];
  const activeBroadcast =
    snapshot.hexBroadcasts.find((b) => b.status === "BROADCASTING_RING") ||
    snapshot.hexBroadcasts[0];

  const scenarios = [
    {
      id: "scen-31st",
      title: "1. Critical Overflow Arrival & Neighbor Hexagon Broadcast",
      description:
        "Injects a rapidly deteriorating patient into a village clinic. QuickSort places them into Immediate Slot #1, converts the lowest-risk routine slot to an ASHA visit, leaves all Walk-In slots untouched, and broadcasts to adjacent Hexagon clinics.",
      badge: "Flagship USP",
      badgeRed: true,
      icon: Zap,
      onRun: () =>
        targetFacility &&
        executeAction({
          action: "SIMULATE_31ST_PATIENT",
          facilityId: targetFacility.id,
        }),
    },
    {
      id: "scen-whatsapp",
      title: "2. Multilingual WhatsApp Reminder & Reply '1' (Clears Overdue)",
      description:
        "Sends a WhatsApp reminder in the patient's regional language and simulates the patient replying '1' to confirm their flexible window check-in.",
      badge: "SMS / WhatsApp Loop",
      badgeRed: false,
      icon: Smartphone,
      onRun: () => {
        if (!routinePatient) return;
        openPhoneDrawer(routinePatient.patientId);
        void executeAction({
          action: "SEND_REMINDER",
          patientId: routinePatient.patientId,
          templateKey: "due_today",
        });
      },
    },
    {
      id: "scen-stop",
      title: "3. Patient Replies 'STOP' → Instant Consent Lock",
      description:
        "Simulates a patient replying STOP via SMS. Immediately revokes consent, halts all automated reminders, locks the record to a minimal stub, and logs to the SHA-256 audit chain.",
      badge: "Privacy & Consent",
      badgeRed: true,
      icon: Smartphone,
      onRun: () =>
        routinePatient &&
        executeAction({
          action: "SIMULATE_PATIENT_REPLY",
          patientId: routinePatient.patientId,
          replyText: "STOP",
        }),
    },
    {
      id: "scen-rbac",
      title: "4. Wrong-Role Contact Read Attempt (403 RBAC Block)",
      description:
        "Simulates a Supervisor attempting to open a patient's encrypted phone number. The API blocks the request with a uniform 403 and records BLOCKED_403_RBAC in the SHA-256 audit log.",
      badge: "Security Wall",
      badgeRed: true,
      icon: EyeOff,
      onRun: () =>
        supervisorUser &&
        criticalPatient &&
        executeAction({
          action: "VIEW_PATIENT_CONTACT",
          callerRole: "supervisor",
          callerId: supervisorUser.id,
          callerName: `${supervisorUser.name} (${supervisorUser.title})`,
          patientId: criticalPatient.patientId,
        }),
    },
    {
      id: "scen-sla",
      title: "5. Advance Clock +4 Hours (Trigger Doctor SLA Breach)",
      description:
        "Advances the system clock by 4 hours so unacknowledged clinical escalations breach their SLA window and automatically alert the PHC Supervisor for reassignment.",
      badge: "Closed-Loop SLA",
      badgeRed: false,
      icon: Clock,
      onRun: () => executeAction({ action: "ADVANCE_CLOCK", hours: 4 }),
    },
    {
      id: "scen-hex",
      title: "6. Neighbor Hexagon Clinic Accepts & Locks Patient",
      description:
        "Claims an active Hexagon-Ring overflow broadcast at an adjacent village clinic, locking the referral and transferring the full clinical packet immediately.",
      badge: "Spatial Mesh",
      badgeRed: false,
      icon: Hexagon,
      onRun: () =>
        activeBroadcast &&
        tertiaryFacility &&
        clinicianUser &&
        executeAction({
          action: "CLAIM_HEXAGON_BROADCAST",
          callerRole: "clinician",
          callerId: clinicianUser.id,
          callerName: `${clinicianUser.name} (${clinicianUser.title})`,
          broadcastId: activeBroadcast.id,
          acceptingFacilityId: tertiaryFacility.id,
        }),
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
            Interactive Verification & API Connector Lab
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-snug">
            Live Scenario & Integration Center
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            Inspect active API connectors and verify clinical, spatial, and privacy
            workflows in one tap.
          </p>
        </div>

        <button
          disabled={busyAction}
          onClick={() => executeAction({ action: "RESET_DEMO" })}
          className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Reset Database State ({snapshot.stats.totalPatients} Records)</span>
        </button>
      </div>

      {/* Live API & Database Integration Status Grid */}
      {snapshot.integrations && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Live External API & Database Connectors (`.env.local`)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                1. PostgreSQL / Supabase
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {snapshot.integrations.supabasePostgres.mode}
              </div>
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>15 Tables Active</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                2. WhatsApp / SMS Gateway
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {snapshot.integrations.messagingGateway.provider}
              </div>
              <div className="text-xs text-emerald-700 font-semibold">
                7 Regional Languages Ready
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                3. 108 Ambulance Webhook
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {snapshot.integrations.ambulance108Dispatch.mode}
              </div>
              <div className="text-xs text-emerald-700 font-semibold">
                Paramedic JSON Handover Ready
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                4. Facility & H3 Registry
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {snapshot.integrations.facilityRegistryApi.mode}
              </div>
              <div className="text-xs text-emerald-700 font-semibold">
                {snapshot.facilities.length} Hexagon Clinics Synced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive 1 / 2 / 3 Column Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {scenarios.map((scen) => {
          const Icon = scen.icon;
          return (
            <div
              key={scen.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      scen.badgeRed
                        ? "bg-red-50 border border-red-200 text-red-600"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      scen.badgeRed
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {scen.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {scen.title}
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  {scen.description}
                </p>
              </div>

              <button
                disabled={busyAction}
                onClick={scen.onRun}
                className={`w-full min-h-[48px] px-5 py-3 rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 shadow-xs transition-colors ${
                  scen.badgeRed
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                <span>Run Scenario</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
