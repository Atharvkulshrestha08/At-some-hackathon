"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Ambulance,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Hexagon,
  Lock,
  PlusCircle,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";
import { UI_TRANSLATIONS } from "@/lib/i18n";

export default function HomePage() {
  const {
    snapshot,
    lang,
    busyAction,
    executeAction,
    openCheckinModal,
    openRegisterPatientModal,
    openSignInModal,
    clearPatient,
    openPhoneDrawer,
  } = useSwasthya();

  if (!snapshot) return null;

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const { quickSortResult, stats } = snapshot;
  const topThreeCritical = quickSortResult.immediatePartition.slice(0, 3);
  const defaultFacility = snapshot.facilities[1] || snapshot.facilities[0];
  const defaultPatient = quickSortResult.combinedRanked[0];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* =================================================================== */}
      {/* LANDING & MULTI-TENANT ORGANIZATION PORTAL HERO SECTION             */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-br from-teal-100/90 via-emerald-100/70 to-cyan-100/80 rounded-3xl border-2 border-teal-300 p-6 sm:p-10 lg:p-12 shadow-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-teal-300/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-200/90 border border-teal-400 text-teal-950 text-sm font-bold">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>
                Active Organization: {snapshot.activeOrganization.name} (
                {snapshot.activeOrganization.id})
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-200/90 text-emerald-950 text-xs font-bold border border-emerald-400">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {snapshot.activeOrganization.teamSize}-Worker Team • Strict
                Multi-Tenant Isolation ({stats.organizationPatients} Org
                Patients)
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openSignInModal}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20"
            >
              <Building2 className="w-4 h-4 text-emerald-200" />
              <span>Organization Sign-In / Switch Tenant</span>
            </button>
            <button
              type="button"
              onClick={openRegisterPatientModal}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Patient</span>
            </button>
          </div>
        </div>

        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-200/80 border border-teal-400 text-teal-950 text-base font-semibold">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <span>
              QuickSort Pivot Threshold ≥ {snapshot.activeThresholds.pivotThreshold} •
              MEOWS &amp; NEWS2 Single-Vital Override Active
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 leading-snug">
            Early Warning &amp; Follow-Up for High-Risk Patients
          </h1>

          <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
            {t.appSubtitle}. Evaluates <strong>5 bidirectional vital categories</strong>,
            partitions patients via <strong>QuickSort</strong> into immediate priority slots vs.
            50-minute to 2-hour flexible clinic windows, protects{" "}
            <strong>10 general walk-in slots</strong> per clinic, and routes overflow across{" "}
            <strong>5 connected village hexagon clinics</strong> with strict{" "}
            <strong>multi-organization tenant isolation</strong>.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <Link
              href="/worklist"
              className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Activity className="w-5 h-5" />
              <span>Open Morning Triage Queue</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              type="button"
              onClick={openRegisterPatientModal}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 border-2 border-teal-600 text-teal-950 text-base font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-5 h-5 text-teal-700" />
              <span>+ Register Patient in {snapshot.activeOrganization.shortName}</span>
            </button>

            <Link
              href="/network"
              className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 border-2 border-teal-300 text-teal-950 text-base font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Hexagon className="w-5 h-5 text-teal-700" />
              <span>View 5-Village Hexagon Network</span>
            </Link>

            <button
              disabled={busyAction || !defaultFacility}
              onClick={() =>
                defaultFacility &&
                executeAction({
                  action: "SIMULATE_31ST_PATIENT",
                  facilityId: defaultFacility.id,
                })
              }
              className="min-h-[48px] px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Test 31st Critical Patient</span>
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4-COLUMN FLUID KPI GRID (1 col xs/sm, 2 col md, 4 col xl)           */}
      {/* =================================================================== */}
      <section aria-label="Key Clinical Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-rose-100/80 rounded-2xl border-2 border-rose-300 border-l-4 border-l-red-600 p-6 shadow-xs">
            <div className="flex items-center justify-between text-base font-bold text-red-800">
              <span>Immediate Priority (≥ {snapshot.activeThresholds.pivotThreshold})</span>
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-4xl font-bold font-mono text-slate-950">
                {quickSortResult.trace.immediateCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-red-200 text-red-800 text-sm font-bold border border-red-300">
                Red Alerts
              </span>
            </div>
            <p className="text-base text-rose-950 mt-2 leading-relaxed font-medium">
              Immediate clinic intervention or 108 ambulance dispatch.
            </p>
          </div>

          <div className="bg-teal-100/80 rounded-2xl border-2 border-teal-300 border-l-4 border-l-teal-600 p-6 shadow-xs">
            <div className="flex items-center justify-between text-base font-bold text-teal-800">
              <span>Flexible Windows (&lt; {snapshot.activeThresholds.pivotThreshold})</span>
              <Clock className="w-5 h-5 text-teal-700 shrink-0" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-4xl font-bold font-mono text-slate-950">
                {quickSortResult.trace.flexibleCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-teal-200 text-teal-950 text-sm font-bold border border-teal-300">
                50m–2h Slots
              </span>
            </div>
            <p className="text-base text-teal-950 mt-2 leading-relaxed font-medium">
              Scheduled across clinic open (09:00) to close (17:00).
            </p>
          </div>

          <div className="bg-emerald-100/80 rounded-2xl border-2 border-emerald-300 border-l-4 border-l-emerald-600 p-6 shadow-xs">
            <div className="flex items-center justify-between text-base font-bold text-emerald-800">
              <span>30-Slot Clinic Isolation</span>
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-slate-950">
                {defaultFacility
                  ? `${defaultFacility.systemSlots} / ${defaultFacility.criticalSlots} / ${defaultFacility.walkInSlots}`
                  : "15 / 5 / 10"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-950 text-sm font-bold border border-emerald-300">
                Walk-In Safe
              </span>
            </div>
            <p className="text-base text-emerald-950 mt-2 leading-relaxed font-medium">
              15 Follow-up • 5 Critical • 10 General Walk-In untouched.
            </p>
          </div>

          <div className="bg-amber-100/80 rounded-2xl border-2 border-amber-300 border-l-4 border-l-amber-600 p-6 shadow-xs">
            <div className="flex items-center justify-between text-base font-bold text-amber-800">
              <span>Hex Broadcast & Ambulance</span>
              <Ambulance className="w-5 h-5 text-amber-700 shrink-0" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-4xl font-bold font-mono text-slate-950">
                {stats.activeHexBroadcasts + stats.activeAmbulances}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-950 text-sm font-bold border border-amber-300">
                Active Rescue
              </span>
            </div>
            <p className="text-base text-amber-950 mt-2 leading-relaxed font-medium">
              Neighbor hexagon clinic sharing & 108 paramedic sheets.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* TOP 3 PRIORITY CASES PREVIEW (Concise, Scannable, Zero Clutter)     */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 leading-snug">
              Top 3 Immediate Priority Cases Today
            </h2>
            <p className="text-base text-slate-700 font-medium">
              Ranked at the top of the QuickSort Upper Partition (Score ≥{" "}
              {snapshot.activeThresholds.pivotThreshold})
            </p>
          </div>
          <Link
            href="/worklist"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-200/90 hover:bg-teal-300/90 border border-teal-400 text-teal-950 text-base font-bold inline-flex items-center gap-2 self-start sm:self-auto shadow-2xs"
          >
            <span>View Full Ranked Worklist ({quickSortResult.trace.totalEvaluated})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {topThreeCritical.map((pt, idx) => (
            <div
              key={pt.patientId}
              className="bg-rose-50/90 rounded-2xl border-2 border-rose-300 border-t-4 border-t-red-600 p-6 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-lg bg-red-600 text-white font-mono text-sm font-bold">
                    SLOT #{idx + 1} • SCORE {pt.totalScore}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-sm font-semibold">
                    {pt.hexagonId} • {pt.village}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-mono">
                    {pt.pseudonym}
                  </h3>
                  <p className="text-base text-slate-600">
                    Age {pt.ageBand} • {pt.cohort.replace("_", " ").toUpperCase()} •{" "}
                    {pt.mobility === "homebound" ? "Homebound" : "Mobile"}
                  </p>
                </div>

                {pt.latestVitals && (
                  <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 font-mono text-sm font-bold text-red-900">
                    BP {pt.latestVitals.systolicBp}/{pt.latestVitals.diastolicBp} • HR{" "}
                    {pt.latestVitals.heartRate} • Temp {pt.latestVitals.temperature}°C •
                    SpO₂ {pt.latestVitals.spo2}%
                  </div>
                )}

                <p className="text-base text-slate-700 leading-relaxed line-clamp-3">
                  {pt.whyFlagged}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap gap-2">
                <button
                  onClick={() => openCheckinModal(pt)}
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                >
                  Log Vitals
                </button>
                <button
                  onClick={() =>
                    executeAction({
                      action: "ESCALATE_TO_CLINICIAN",
                      patientId: pt.patientId,
                    })
                  }
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
                >
                  Escalate
                </button>
                <button
                  disabled={busyAction}
                  onClick={() => void clearPatient(pt.patientId)}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Clear Patient</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* DEDICATED MULTI-PAGE SYSTEM DIRECTORY (Grid: 1 col sm, 2 md, 3 lg)  */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
            Platform Modules (Multi-Page Architecture)
          </h2>
          <p className="text-base text-slate-600">
            Navigate directly to each dedicated module designed for mobile, tablet, and desktop viewports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <Link
            href="/worklist"
            className="group bg-teal-100/70 rounded-2xl border-2 border-teal-300 p-6 shadow-xs hover:border-teal-500 hover:bg-teal-100/90 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-200 border border-teal-400 text-teal-800 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 group-hover:text-teal-900">
                1. Morning Triage Worklist
              </h3>
              <p className="text-base text-teal-950 leading-relaxed font-medium">
                Paginated QuickSort worklist separating Red clinical review alerts from
                Green routine reminders with 5-vital trajectories.
              </p>
            </div>
            <span className="text-base font-bold text-teal-800 inline-flex items-center gap-2">
              Open Module <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/network"
            className="group bg-emerald-100/70 rounded-2xl border-2 border-emerald-300 p-6 shadow-xs hover:border-emerald-500 hover:bg-emerald-100/90 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-200 border border-emerald-400 text-emerald-800 flex items-center justify-center">
                <Hexagon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 group-hover:text-emerald-900">
                2. 5-Village Hexagon Network & 30 Slots
              </h3>
              <p className="text-base text-emerald-950 leading-relaxed font-medium">
                Inspect the 15 Follow-Up / 5 Critical / 10 Walk-In slot isolator and
                claim overflow broadcasts across adjacent village hexagons.
              </p>
            </div>
            <span className="text-base font-bold text-emerald-800 inline-flex items-center gap-2">
              Open Module <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/clinician"
            className="group bg-rose-100/70 rounded-2xl border-2 border-rose-300 p-6 shadow-xs hover:border-red-500 hover:bg-rose-100/90 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-200 border border-rose-400 text-red-700 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 group-hover:text-red-900">
                3. Doctor Review & 108 Ambulance
              </h3>
              <p className="text-base text-rose-950 leading-relaxed font-medium">
                Clinician escalation console with 4-hour SLA tracking, remote care
                guidance, and 108 Rapid Ambulance paramedic handover sheets.
              </p>
            </div>
            <span className="text-base font-bold text-red-700 inline-flex items-center gap-2">
              Open Module <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/governance"
            className="group bg-indigo-100/70 rounded-2xl border-2 border-indigo-300 p-6 shadow-xs hover:border-indigo-500 hover:bg-indigo-100/90 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-200 border border-indigo-400 text-indigo-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 group-hover:text-indigo-900">
                4. Rule Governance & Audit Trail
              </h3>
              <p className="text-base text-indigo-950 leading-relaxed font-medium">
                Configure QuickSort pivot thresholds with mandatory doctor sign-off,
                inspect STOP consent locks, and verify the SHA-256 audit chain.
              </p>
            </div>
            <span className="text-base font-bold text-indigo-800 inline-flex items-center gap-2">
              Open Module <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/simulator"
            className="group bg-cyan-100/70 rounded-2xl border-2 border-cyan-300 p-6 shadow-xs hover:border-cyan-500 hover:bg-cyan-100/90 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-200 border border-cyan-400 text-cyan-800 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 group-hover:text-cyan-900">
                5. Interactive Scenario Lab
              </h3>
              <p className="text-base text-cyan-950 leading-relaxed font-medium">
                Test all 8 clinical & privacy scenarios in 1 tap: 31st-patient arrival,
                doctor absent fallback, RBAC 403 block, and multilingual WhatsApp replies.
              </p>
            </div>
            <span className="text-base font-bold text-cyan-800 inline-flex items-center gap-2">
              Open Module <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => openPhoneDrawer(defaultPatient?.patientId)}
            className="text-left group bg-emerald-600 hover:bg-emerald-700 rounded-2xl p-6 shadow-xs transition-colors flex flex-col justify-between space-y-4 text-white"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">
                Launch Patient Phone Simulator
              </h3>
              <p className="text-base text-emerald-50 leading-relaxed">
                Open the simulated patient WhatsApp/SMS handset to test 7 regional
                languages and reply with 1, 2, or STOP.
              </p>
            </div>
            <span className="text-base font-bold inline-flex items-center gap-2">
              Open Handset Drawer <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
