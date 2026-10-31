"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Ambulance,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Hexagon,
  PhoneCall,
  PlusCircle,
  RotateCcw,
  Send,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";
import { UI_TRANSLATIONS } from "@/lib/i18n";

const ITEMS_PER_PAGE = 6;

export default function WorklistPage() {
  const {
    snapshot,
    lang,
    busyAction,
    activeRole,
    activeUserName,
    workerScope,
    setWorkerScope,
    executeAction,
    openCheckinModal,
    openRegisterPatientModal,
    openSignInModal,
    clearPatient,
    restoreClearedPatient,
    openPhoneDrawer,
  } = useSwasthya();

  const [worklistFilter, setWorklistFilter] = useState<
    "all" | "immediate" | "flexible" | "homebound"
  >("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  if (!snapshot) return null;

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const { quickSortResult } = snapshot;

  const filtered = quickSortResult.combinedRanked
    .filter((item) => {
      if (worklistFilter === "immediate") return item.abovePivotThreshold;
      if (worklistFilter === "flexible") return !item.abovePivotThreshold;
      if (worklistFilter === "homebound")
        return item.mobility === "homebound" || item.exceedsLocalClinicCapability;
      return true;
    })
    .filter((item) => {
      if (cohortFilter === "all") return true;
      return item.cohort === cohortFilter;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      {/* Page Header, Multi-Tenant Organization Scope & Filter Controls */}
      <div className="bg-gradient-to-br from-teal-100/90 via-emerald-100/70 to-cyan-100/80 rounded-2xl border-2 border-teal-300 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Tenant & Registration Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-teal-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-200 border border-teal-400 text-teal-950 text-xs sm:text-sm font-bold">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>
                Tenant: {snapshot.activeOrganization.name} (
                {snapshot.stats.organizationPatients} Org Patients)
              </span>
            </span>

            {activeRole === "worker" && (
              <div className="inline-flex items-center rounded-xl bg-teal-200/60 p-1 border border-teal-300">
                <button
                  type="button"
                  onClick={() => {
                    setWorkerScope("assigned");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    workerScope === "assigned"
                      ? "bg-teal-700 text-white shadow-xs"
                      : "text-teal-950 hover:text-teal-850"
                  }`}
                >
                  My Assigned Patients
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkerScope("organization");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    workerScope === "organization"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    All {snapshot.activeOrganization.shortName} Team (
                    {snapshot.activeOrganization.teamSize} Workers)
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openRegisterPatientModal}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Patient</span>
            </button>
            <button
              type="button"
              onClick={openSignInModal}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Switch Org / Staff</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
              QuickSort Pivot Threshold = {snapshot.activeThresholds.pivotThreshold} •{" "}
              {quickSortResult.trace.executionMicros}µs
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-snug">
              {t.worklistTitle}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Active Queue for <strong>{activeUserName}</strong> in{" "}
              <strong>{snapshot.activeOrganization.shortName}</strong>. Showing{" "}
              <strong>{filtered.length}</strong> ranked patients (Page {safePage} of{" "}
              {totalPages}) •{" "}
              <strong className="text-emerald-700">
                {snapshot.stats.clearedPatients} Cleared Today
              </strong>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            {(
              [
                { id: "all", label: `All (${quickSortResult.combinedRanked.length})` },
                {
                  id: "immediate",
                  label: `Critical ≥ ${snapshot.activeThresholds.pivotThreshold} (${quickSortResult.trace.immediateCount})`,
                },
                {
                  id: "flexible",
                  label: `Flexible < ${snapshot.activeThresholds.pivotThreshold} (${quickSortResult.trace.flexibleCount})`,
                },
                { id: "homebound", label: "Homebound / Oncology" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setWorklistFilter(f.id);
                  setPage(1);
                }}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl text-base font-bold border transition-colors ${
                  worklistFilter === f.id
                    ? f.id === "immediate"
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-teal-100/80 border-teal-300 text-teal-950 hover:bg-teal-200/80"
                }`}
              >
                {f.label}
              </button>
            ))}

            <select
              value={cohortFilter}
              onChange={(e) => {
                setCohortFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-100/90 border border-teal-300 text-base font-semibold text-teal-950"
            >
              <option value="all">All Conditions</option>
              <option value="post_illness">{t.cohortPostIllness}</option>
              <option value="pregnancy">{t.cohortPregnancy}</option>
              <option value="hypertension">{t.cohortHypertension}</option>
              <option value="diabetes">{t.cohortDiabetes}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Paginated Patient Cards (6 per page — clean & scannable) */}
      <div className="space-y-6">
        {paginatedItems.map((pt, idx) => {
          const globalRank = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
          const isExpanded = expandedPatientId === pt.patientId;
          const isClinical = pt.flagClass === "clinical_review";
          const isMissedTwice = pt.flagClass === "administrative_escalation";

          const borderLeft = isClinical
            ? "border-l-red-600"
            : isMissedTwice
            ? "border-l-amber-500"
            : "border-l-emerald-600";

          const assignedSlot = snapshot.clinicAllocations[
            pt.facilityId
          ]?.slots.find((s) => s.patientId === pt.patientId);

          const slotWindowLabel =
            assignedSlot?.timeWindow ||
            (pt.abovePivotThreshold
              ? `IMMEDIATE PRIORITY SLOT #${globalRank}`
              : `Flexible Follow-Up Window (09:00–17:00)`);

          return (
            <article
              key={pt.patientId}
              className={`bg-teal-50/90 rounded-2xl border-2 border-teal-300 border-l-4 ${borderLeft} p-6 shadow-xs space-y-5`}
            >
              {/* Top Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`min-h-[44px] min-w-[44px] px-3 rounded-xl font-mono text-base font-bold flex items-center justify-center ${
                      pt.abovePivotThreshold
                        ? "bg-red-600 text-white"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    #{globalRank}
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-mono font-bold text-slate-900 text-xl">
                        {pt.pseudonym}
                      </h2>
                      <span className="text-base text-slate-600">
                        Age {pt.ageBand} • {pt.village} (
                        <strong className="text-slate-900 font-mono">
                          {pt.hexagonId}
                        </strong>
                        )
                      </span>

                      {isClinical ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-sm font-bold inline-flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {t.classClinical}
                        </span>
                      ) : isMissedTwice ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-sm font-bold">
                          {t.classMissed}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-bold">
                          {t.classReminder}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-sm font-semibold">
                        {pt.cohort === "post_illness"
                          ? t.cohortPostIllness
                          : pt.cohort === "pregnancy"
                          ? t.cohortPregnancy
                          : pt.cohort === "hypertension"
                          ? t.cohortHypertension
                          : t.cohortDiabetes}
                      </span>

                      {pt.mobility === "homebound" && (
                        <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-bold inline-flex items-center gap-1.5">
                          <Ambulance className="w-4 h-4" />
                          Homebound (Needs Transport)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slot & Score Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-bold flex items-center ${
                      pt.abovePivotThreshold
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    }`}
                  >
                    {slotWindowLabel}
                  </span>

                  <span className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-800 text-white text-base font-mono font-bold flex items-center shadow-md shadow-teal-800/20">
                    Score: {pt.totalScore} ({pt.primaryRuleId})
                  </span>

                  <button
                    onClick={() =>
                      setExpandedPatientId(isExpanded ? null : pt.patientId)
                    }
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-200/80 hover:bg-teal-300 text-base font-bold text-teal-950 flex items-center gap-2 border border-teal-300"
                  >
                    <span>5-Vital Breakdown</span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Concise Explanation Box */}
              <div className="p-4 rounded-xl bg-teal-100/70 border border-teal-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-base text-teal-950 leading-relaxed font-medium">
                  {pt.whyFlagged}
                </p>
                {pt.bpTrendValues.length >= 2 && (
                  <span className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-200/90 border border-teal-400 font-mono text-sm font-bold text-teal-950 inline-flex items-center gap-1.5 self-start md:self-auto">
                    <TrendingUp className="w-4 h-4 text-rose-700" />
                    BP Trend: {pt.bpTrendValues.join(" → ")} mmHg
                  </span>
                )}
              </div>

              {/* Collapsible 5-Category Clinical Grid */}
              {isExpanded && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {pt.categories.map((cat) => {
                    const isAlert = cat.points > 0;
                    return (
                      <div
                        key={cat.categoryId}
                        className={`p-4 rounded-xl border ${
                          isAlert
                            ? "bg-red-50/70 border-red-200"
                            : "bg-emerald-50/50 border-emerald-200"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-base text-slate-900">
                          <span>{cat.label}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-xs font-bold inline-flex items-center gap-0.5 ${
                              isAlert
                                ? "bg-red-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {cat.direction === "UP" && (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                            {cat.direction === "DOWN" && (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            +{cat.points}
                          </span>
                        </div>
                        <div className="mt-2 font-mono text-lg font-bold text-slate-900">
                          {cat.currentValue}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Normal: {cat.normalRange}
                        </div>
                        <p className="text-sm text-slate-800 mt-1.5 font-medium leading-relaxed">
                          {cat.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons (All >= 44px height, >= 8px gap) */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                  <button
                    disabled={busyAction}
                    onClick={() => openCheckinModal(pt)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-xs"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t.logCheckin}</span>
                  </button>

                  <button
                    disabled={busyAction}
                    onClick={() => {
                      openPhoneDrawer(pt.patientId);
                      void executeAction({
                        action: "SEND_REMINDER",
                        patientId: pt.patientId,
                        templateKey:
                          pt.flagClass === "administrative_reminder"
                            ? "due_today"
                            : "missed_visit",
                        overrideLanguage: lang,
                        windowText: slotWindowLabel,
                      });
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-base font-bold flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-emerald-700" />
                    <span>
                      {t.sendReminder} ({lang.toUpperCase()})
                    </span>
                  </button>

                  <button
                    disabled={busyAction}
                    onClick={() =>
                      executeAction({
                        action: "ESCALATE_TO_CLINICIAN",
                        patientId: pt.patientId,
                      })
                    }
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Stethoscope className="w-5 h-5" />
                    <span>{t.escalateClinician}</span>
                  </button>

                  {(pt.requiresRapidAmbulance ||
                    pt.mobility === "homebound" ||
                    pt.exceedsLocalClinicCapability) && (
                    <button
                      disabled={busyAction}
                      onClick={() =>
                        executeAction({
                          action: "DISPATCH_RAPID_AMBULANCE",
                          patientId: pt.patientId,
                        })
                      }
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-base font-bold flex items-center justify-center gap-2"
                    >
                      <Ambulance className="w-5 h-5 text-red-600" />
                      <span>{t.dispatchAmbulance} (108)</span>
                    </button>
                  )}

                  {pt.abovePivotThreshold && (
                    <button
                      disabled={busyAction}
                      onClick={() =>
                        executeAction({
                          action: "BROADCAST_HEXAGON_RING",
                          patientId: pt.patientId,
                        })
                      }
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-base font-semibold flex items-center justify-center gap-2"
                    >
                      <Hexagon className="w-4 h-4 text-emerald-700" />
                      <span>{t.broadcastHexagon}</span>
                    </button>
                  )}
                  <button
                    disabled={busyAction}
                    onClick={() => void clearPatient(pt.patientId)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-950 text-base font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Clear / Stabilize Patient</span>
                  </button>
                </div>

                <button
                  disabled={busyAction}
                  onClick={() =>
                    executeAction({
                      action: "VIEW_PATIENT_CONTACT",
                      patientId: pt.patientId,
                    })
                  }
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-base font-semibold text-slate-700 flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>Verify Contact (RBAC)</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination Bar (44px+ buttons) */}
      <div className="bg-teal-100/80 rounded-2xl border-2 border-teal-300 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-base text-teal-950 font-bold">
          Showing{" "}
          <strong>
            {(safePage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
          </strong>{" "}
          of <strong>{filtered.length}</strong> QuickSort-ranked patients
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-200/90 hover:bg-teal-300 border border-teal-400 disabled:opacity-40 text-base font-bold text-teal-950 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="font-mono text-base font-bold text-teal-950 px-2">
            Page {safePage} / {totalPages}
          </span>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-base font-bold text-white flex items-center gap-2 shadow-xs"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cleared / Stabilized Patients Section */}
      {snapshot.clearedPatients && snapshot.clearedPatients.length > 0 && (
        <div className="bg-emerald-50/90 rounded-2xl border-2 border-emerald-300 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase">
                Clinic Slot Freed &amp; Logged in SHA-256 Audit Trail
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                Cleared / Stabilized Patients Today ({snapshot.clearedPatients.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.clearedPatients.map((cp) => (
              <div
                key={cp.id}
                className="p-4 rounded-xl bg-emerald-100/70 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-mono font-bold text-base text-slate-950">
                      {cp.pseudonym} ({cp.initials})
                    </span>
                    <span className="text-xs text-slate-700 font-medium">
                      {cp.ageBand}y • {cp.village}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium">
                    {cp.clearedNotes || "Cleared from active queue."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() => void restoreClearedPatient(cp.id)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-200 hover:bg-emerald-300 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore to Queue</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

