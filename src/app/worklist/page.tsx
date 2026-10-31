"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Ambulance,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Hexagon,
  PhoneCall,
  PlusCircle,
  Send,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";
import { UI_TRANSLATIONS } from "@/lib/i18n";

const ITEMS_PER_PAGE = 6;

export default function WorklistPage() {
  const {
    snapshot,
    lang,
    busyAction,
    activeUserName,
    executeAction,
    openCheckinModal,
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
      {/* Page Header & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
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
              Assigned Queue for <strong>{activeUserName}</strong>. Showing{" "}
              <strong>{filtered.length}</strong> ranked patients (Page {safePage} of{" "}
              {totalPages}).
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
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
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
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-base font-semibold text-slate-900"
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
              className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderLeft} p-6 shadow-xs space-y-5`}
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

                  <span className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 text-white text-base font-mono font-bold flex items-center">
                    Score: {pt.totalScore} ({pt.primaryRuleId})
                  </span>

                  <button
                    onClick={() =>
                      setExpandedPatientId(isExpanded ? null : pt.patientId)
                    }
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-base font-semibold text-slate-800 flex items-center gap-2"
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
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-base text-slate-800 leading-relaxed font-medium">
                  {pt.whyFlagged}
                </p>
                {pt.bpTrendValues.length >= 2 && (
                  <span className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-sm font-bold text-slate-900 inline-flex items-center gap-1.5 self-start md:self-auto">
                    <TrendingUp className="w-4 h-4 text-red-600" />
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
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-base text-slate-700 font-medium">
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
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-base font-bold text-slate-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="font-mono text-base font-bold text-slate-900 px-2">
            Page {safePage} / {totalPages}
          </span>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-base font-bold text-white flex items-center gap-2"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

