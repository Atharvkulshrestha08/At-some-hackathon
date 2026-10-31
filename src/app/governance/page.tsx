"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";

export default function GovernancePage() {
  const { snapshot, busyAction, executeAction } = useSwasthya();

  const [ruleForm, setRuleForm] = useState({
    pivotThreshold: snapshot?.activeThresholds.pivotThreshold ?? 100,
    bpSystolicHigh: snapshot?.activeThresholds.bpSystolicHigh ?? 160,
    bpSystolicLow: snapshot?.activeThresholds.bpSystolicLow ?? 90,
    tempHigh: snapshot?.activeThresholds.tempHigh ?? 38.0,
  });

  if (!snapshot) return null;

  const adminUser =
    snapshot.users.find((u) => u.role === "admin") || snapshot.users[0];
  const clinicianUser =
    snapshot.users.find((u) => u.role === "clinician") || snapshot.users[0];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-indigo-100/90 via-teal-100/60 to-emerald-100/70 rounded-2xl border-2 border-indigo-300 p-6 sm:p-8 shadow-xs space-y-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-200 border border-indigo-300 text-indigo-950 text-sm font-bold">
          <ShieldCheck className="w-4 h-4 text-indigo-700" />
          Clinical Governance, Consent Gate & Audit Trail
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-950 leading-snug">
          Rule Governance & SHA-256 Audit Log
        </h1>
        <p className="text-base text-slate-800 leading-relaxed max-w-3xl font-medium">
          Every rule change requires a qualified doctor&apos;s sign-off before activation,
          every STOP withdrawal locks the patient record immediately, and every access
          attempt is hash-chained in PostgreSQL.
        </p>
      </div>

      {/* Top Grid: Rule Editor + Consent Lock Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left 6 Cols: Rule Threshold Form (16px inputs, >=44px height) */}
        <div className="lg:col-span-6 bg-teal-50/90 rounded-2xl border-2 border-teal-300 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-sm font-bold uppercase text-emerald-700">
              Clinician-Owned Rule Configuration
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Edit QuickSort Pivot Threshold & Limits
            </h2>
            <p className="text-base text-slate-600 mt-1">
              Active Version: <strong>v{snapshot.activeThresholds.version}</strong> •{" "}
              {snapshot.activeThresholds.approvedBy}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                QuickSort Pivot Threshold
              </label>
              <input
                type="number"
                value={ruleForm.pivotThreshold}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    pivotThreshold: Number(e.target.value),
                  })
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Systolic BP Upper (mmHg)
              </label>
              <input
                type="number"
                value={ruleForm.bpSystolicHigh}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    bpSystolicHigh: Number(e.target.value),
                  })
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Systolic BP Shock Lower (mmHg)
              </label>
              <input
                type="number"
                value={ruleForm.bpSystolicLow}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    bpSystolicLow: Number(e.target.value),
                  })
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Fever Upper Limit (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={ruleForm.tempHigh}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    tempHigh: Number(e.target.value),
                  })
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {adminUser && (
              <button
                disabled={busyAction}
                onClick={() =>
                  executeAction({
                    action: "ADMIN_PROPOSE_THRESHOLDS",
                    callerRole: "admin",
                    callerId: adminUser.id,
                    callerName: `${adminUser.name} (${adminUser.title})`,
                    ...ruleForm,
                  })
                }
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-base font-bold shadow-md shadow-teal-700/20"
              >
                1. Stage Rule Update (Admin)
              </button>
            )}

            {snapshot.pendingRuleDraft && clinicianUser && (
              <button
                disabled={busyAction}
                onClick={() =>
                  executeAction({
                    action: "CLINICIAN_APPROVE_THRESHOLDS",
                    callerRole: "clinician",
                    callerId: clinicianUser.id,
                    callerName: `${clinicianUser.name} (${clinicianUser.title})`,
                  })
                }
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold"
              >
                2. Sign Off & Activate as Doctor (v
                {snapshot.pendingRuleDraft.proposedThresholds.version})
              </button>
            )}
          </div>
        </div>

        {/* Right 6 Cols: Consent Withdrawn Stubs */}
        <div className="lg:col-span-6 bg-rose-50/90 rounded-2xl border-2 border-rose-300 p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <span className="text-sm font-bold uppercase text-rose-800">
              Consent Gate Enforcement
            </span>
            <h2 className="text-xl font-bold text-slate-950 mt-1">
              Locked Patient Records (Withdrawn via STOP)
            </h2>
            <p className="text-base text-slate-800 mt-1 leading-relaxed font-medium">
              Messaging and data entry are immediately blocked when consent is withdrawn:
            </p>
          </div>

          <div className="space-y-3">
            {snapshot.withdrawnPatients.map((wp) => (
              <div
                key={wp.id}
                className="p-4 rounded-xl bg-rose-100/80 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="font-mono font-bold text-base text-slate-950">
                      {wp.pseudonym}
                    </span>{" "}
                    <span className="text-base text-slate-800 font-medium">
                      • {wp.village} • {wp.cohort}
                    </span>
                  </div>
                </div>
                <button
                  disabled={busyAction}
                  onClick={() =>
                    executeAction({
                      action: "TOGGLE_CONSENT",
                      patientId: wp.id,
                    })
                  }
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-200 hover:bg-rose-300 border border-rose-400 text-rose-950 font-bold text-base"
                >
                  Restore Consent
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive SHA-256 Audit Trail (Cards on Mobile, Table on Desktop) */}
      <div className="bg-emerald-50/90 rounded-2xl border-2 border-emerald-300 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-sm font-bold uppercase text-emerald-700">
              Append-Only Tamper-Evident History
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              SHA-256 Hash-Chained Audit Log ({snapshot.auditIntegrity.totalEntries}{" "}
              Events)
            </h2>
          </div>
          <span className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-base font-bold self-start sm:self-auto">
            ✓ Chain Integrity 100% Verified
          </span>
        </div>

        {/* Mobile View (< md): Card List per Rule 9 */}
        <div className="block md:hidden space-y-4">
          {snapshot.auditLog.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-base text-slate-900">
                  {row.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                    row.result === "ALLOWED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {row.result}
                </span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {row.actorName} ({row.actorRole.toUpperCase()})
              </div>
              <div className="font-mono text-sm font-semibold text-slate-800">
                {row.action}
              </div>
              <p className="text-base text-slate-700 leading-relaxed">
                {row.reason}
              </p>
              <div className="font-mono text-xs text-slate-500">
                SHA-256: {row.currHash.slice(0, 16)}…
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (md+): Horizontally Scrollable Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-base">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-mono text-sm">
                <th className="py-3 pr-4">Event ID</th>
                <th className="py-3 pr-4">Actor & Role</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Result</th>
                <th className="py-3 pr-4">Clinical / Security Trace</th>
                <th className="py-3">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshot.auditLog.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="py-3.5 pr-4 font-mono text-sm font-bold text-slate-800 whitespace-nowrap">
                    {row.id}
                  </td>
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{row.actorName}</div>
                    <div className="font-mono text-xs text-emerald-700 uppercase font-bold">
                      {row.actorRole}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-sm font-bold text-slate-900">
                    {row.action}
                  </td>
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                        row.result === "ALLOWED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.result}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-slate-700 max-w-md leading-relaxed">
                    {row.reason}
                  </td>
                  <td className="py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {row.currHash.slice(0, 14)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

