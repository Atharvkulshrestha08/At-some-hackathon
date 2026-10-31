"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Hexagon,
  Radio,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";
import { UI_TRANSLATIONS } from "@/lib/i18n";

export default function NetworkPage() {
  const { snapshot, lang, busyAction, executeAction } = useSwasthya();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  if (!snapshot || snapshot.facilities.length === 0) return null;

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const { clinicAllocations } = snapshot;
  const selectedFacility =
    snapshot.facilities.find((f) => f.id === selectedFacilityId) ||
    snapshot.facilities[0];
  const selectedClinicAlloc =
    clinicAllocations[selectedFacility.id] ||
    Object.values(clinicAllocations)[0];

  // Dynamically compute network totals from API facilities
  const totalClinics = snapshot.facilities.length;
  const totalNetworkSlots = snapshot.facilities.reduce(
    (acc, f) => acc + f.totalSlots,
    0
  );
  const totalProtectedWalkIns = snapshot.facilities.reduce(
    (acc, f) => acc + f.walkInSlots,
    0
  );

  // Map facility coordinates dynamically from `fac.hexCoords` returned by the API
  const getFacilitySvgPoint = (fac: (typeof snapshot.facilities)[number]) => {
    // Scale API hexCoords (centered around 210,150) to the 520x390 radar canvas
    const cx = 260 + (fac.hexCoords.x - 210) * 1.15;
    const cy = 195 + (fac.hexCoords.y - 150) * 1.2;
    return { cx, cy };
  };

  // Build unique adjacency edges dynamically from `fac.adjacentHexagons`
  const adjacencyEdges: Array<{
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isBroadcastingEdge: boolean;
  }> = [];
  const seenPairs = new Set<string>();

  for (const facA of snapshot.facilities) {
    const ptA = getFacilitySvgPoint(facA);
    for (const neighborHexId of facA.adjacentHexagons) {
      const facB = snapshot.facilities.find(
        (f) => f.hexagonId === neighborHexId
      );
      if (!facB) continue;
      const pairKey = [facA.hexagonId, facB.hexagonId].sort().join("--");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const ptB = getFacilitySvgPoint(facB);
      const isBroadcastingEdge = snapshot.hexBroadcasts.some(
        (b) =>
          b.status === "BROADCASTING_RING" &&
          ((b.originHexagonId === facA.hexagonId &&
            b.targetHexagons.includes(facB.hexagonId)) ||
            (b.originHexagonId === facB.hexagonId &&
              b.targetHexagons.includes(facA.hexagonId)))
      );

      adjacencyEdges.push({
        key: pairKey,
        x1: ptA.cx,
        y1: ptA.cy,
        x2: ptB.cx,
        y2: ptB.cy,
        isBroadcastingEdge,
      });
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* =================================================================== */}
      {/* PAGE HEADER & LIVE NETWORK TELEMETRY STRIP (100% API-DRIVEN)        */}
      {/* =================================================================== */}
      <div className="bg-gradient-to-br from-teal-100/90 via-emerald-100/70 to-cyan-100/80 rounded-3xl border-2 border-teal-300 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-200 border border-teal-400 text-teal-950 text-sm font-bold">
              <Hexagon className="w-4 h-4 text-teal-700" />
              <span>
                H3 Spatial Mesh • {totalClinics} Connected Village Clinics •{" "}
                {totalNetworkSlots} Total Daily Slots
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight leading-snug">
              {t.hexMeshTitle}
            </h1>
            <p className="text-base text-slate-800 leading-relaxed font-medium">
              When any village clinic reaches <strong>100% critical capacity</strong>, incoming
              high-risk patients are{" "}
              <strong className="text-slate-950">
                equally broadcasted across all adjacent Hexagon ring clinics
              </strong>
              . Whichever neighbor clinic accepts first immediately locks the case and receives
              the full 5-vital clinical handover chart.
            </p>
          </div>

          {/* Live Mesh Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-teal-100/90 border border-teal-300">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Active Clinics
              </div>
              <div className="text-2xl font-bold font-mono text-slate-950 mt-1">
                {totalClinics} Hexagons
              </div>
              <div className="text-xs font-bold text-teal-900 mt-0.5">
                Ring Connected
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-100/90 border border-rose-300">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Ring Broadcasts
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
                {snapshot.stats.activeHexBroadcasts} Live
              </div>
              <div className="text-xs font-bold text-rose-800 mt-0.5">
                Awaiting Claim
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-emerald-100/90 border border-emerald-300">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Walk-In Shield
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
                {totalProtectedWalkIns} / {totalProtectedWalkIns}
              </div>
              <div className="text-xs font-bold text-emerald-900 mt-0.5">
                100% Untouched
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TOP GRID: INTERACTIVE HONEYCOMB RADAR + NEIGHBOR BROADCAST QUEUE    */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left 7 Cols: Interactive Honeycomb Spatial Radar */}
        <div className="lg:col-span-7 bg-teal-50/90 rounded-3xl border-2 border-teal-300 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Interactive Spatial Topology
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {totalClinics}-Village Honeycomb Mesh Radar
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Selected / Available
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                100% Full / Broadcasting
              </span>
            </div>
          </div>

          {/* Honeycomb SVG Canvas */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
            <svg
              viewBox="0 0 520 390"
              className="w-full max-w-[520px] h-auto select-none"
              role="img"
              aria-label="Hexagonal Clinic Network"
            >
              <defs>
                <pattern
                  id="clinicalGrid"
                  width="26"
                  height="26"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 26 0 L 0 0 0 26"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="0.75"
                  />
                </pattern>
                <filter id="hexShadow" x="-15%" y="-15%" width="130%" height="130%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="5"
                    floodColor="#0f172a"
                    floodOpacity="0.08"
                  />
                </filter>
              </defs>

              <rect width="520" height="390" rx="16" fill="url(#clinicalGrid)" />

              {/* Concentric Spatial Radar Rings */}
              <circle
                cx="260"
                cy="195"
                r="125"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.25"
                strokeDasharray="6 6"
              />
              <circle
                cx="260"
                cy="195"
                r="172"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Dynamic Mesh Connection Vectors from API Adjacency Graph */}
              {adjacencyEdges.map((edge) => (
                <line
                  key={edge.key}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={edge.isBroadcastingEdge ? "#dc2626" : "#059669"}
                  strokeWidth={edge.isBroadcastingEdge ? "3" : "2.5"}
                  strokeDasharray={edge.isBroadcastingEdge ? "6 4" : "5 5"}
                  opacity={edge.isBroadcastingEdge ? "0.95" : "0.5"}
                />
              ))}

              {/* Dynamically Render All Village Hexagon Cells from API */}
              {snapshot.facilities.map((fac) => {
                const { cx, cy } = getFacilitySvgPoint(fac);
                const outerR = 54;
                const innerR = 48;

                const makeHexPoints = (radius: number) =>
                  Array.from({ length: 6 })
                    .map((_, idx) => {
                      const angle = (Math.PI / 3) * idx;
                      return `${cx + radius * Math.cos(angle)},${
                        cy + radius * Math.sin(angle)
                      }`;
                    })
                    .join(" ");

                const isSelected = selectedFacility.id === fac.id;
                const alloc = clinicAllocations[fac.id];
                const isBroadcastingOrigin = snapshot.hexBroadcasts.some(
                  (b) =>
                    b.status === "BROADCASTING_RING" &&
                    b.originHexagonId === fac.hexagonId
                );
                const critUsed = alloc?.occupiedCritical || 0;
                const critMax = fac.criticalSlots;
                const isCritFull = critUsed >= critMax || isBroadcastingOrigin;

                const strokeColor = isCritFull
                  ? "#dc2626"
                  : isSelected
                  ? "#059669"
                  : "#64748b";
                const fillColor = isCritFull
                  ? "#fef2f2"
                  : isSelected
                  ? "#ecfdf5"
                  : "#ffffff";
                const badgeFill = isCritFull
                  ? "#dc2626"
                  : isSelected
                  ? "#059669"
                  : "#0f172a";

                return (
                  <g
                    key={fac.id}
                    onClick={() => setSelectedFacilityId(fac.id)}
                    className="cursor-pointer transition-transform"
                    filter="url(#hexShadow)"
                  >
                    {(isSelected || isCritFull) && (
                      <polygon
                        points={makeHexPoints(outerR + 5)}
                        fill="none"
                        stroke={isCritFull ? "#fca5a5" : "#6ee7b7"}
                        strokeWidth="3"
                      />
                    )}

                    <polygon
                      points={makeHexPoints(outerR)}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected || isCritFull ? "3" : "2"}
                    />

                    <polygon
                      points={makeHexPoints(innerR)}
                      fill="none"
                      stroke={isCritFull ? "#fecaca" : "#e2e8f0"}
                      strokeWidth="1"
                    />

                    <rect
                      x={cx - 28}
                      y={cy - 34}
                      width="56"
                      height="16"
                      rx="8"
                      fill={badgeFill}
                    />
                    <text
                      x={cx}
                      y={cy - 23}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {fac.hexagonId}
                    </text>

                    <text
                      x={cx}
                      y={cy - 4}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="11.5"
                      fontWeight="bold"
                    >
                      {fac.village}
                    </text>

                    <text
                      x={cx}
                      y={cy + 9}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      {fac.tier.replace(/_/g, " ")}
                    </text>

                    <rect
                      x={cx - 30}
                      y={cy + 15}
                      width="60"
                      height="5"
                      rx="2.5"
                      fill="#e2e8f0"
                    />
                    <rect
                      x={cx - 30}
                      y={cy + 15}
                      width={Math.min(60, Math.round((critUsed / critMax) * 60))}
                      height="5"
                      rx="2.5"
                      fill={isCritFull ? "#dc2626" : "#059669"}
                    />

                    <text
                      x={cx}
                      y={cy + 31}
                      textAnchor="middle"
                      fill={
                        !fac.clinicianOnDuty || isCritFull ? "#dc2626" : "#047857"
                      }
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {!fac.clinicianOnDuty
                        ? "DOC ABSENT"
                        : `${critUsed}/${critMax} CRIT SLOTS`}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="w-full mt-4 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2">
              {snapshot.facilities.map((fac) => {
                const active = selectedFacility.id === fac.id;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => setSelectedFacilityId(fac.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                      active
                        ? "bg-teal-700 border-teal-800 text-white shadow-xs"
                        : "bg-teal-100/80 border-teal-300 text-teal-950 hover:bg-teal-200/80"
                    }`}
                  >
                    {fac.hexagonId} • {fac.village}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Facility Control Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-100/70 border border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-teal-700 text-white font-mono text-xs font-bold">
                  {selectedFacility.hexagonId}
                </span>
                <h3 className="text-base font-bold text-slate-950">
                  {selectedFacility.name}
                </h3>
              </div>
              <p className="text-sm text-teal-950 font-medium">
                Adjacent Ring Neighbors:{" "}
                <strong className="font-mono text-teal-800 font-extrabold">
                  {selectedFacility.adjacentHexagons.join(", ")}
                </strong>{" "}
                • Total Slots:{" "}
                <strong>
                  {selectedFacility.totalSlots} ({selectedFacility.systemSlots} System /{" "}
                  {selectedFacility.criticalSlots} Critical /{" "}
                  {selectedFacility.walkInSlots} Walk-In)
                </strong>
              </p>
            </div>

            <button
              disabled={busyAction}
              onClick={() =>
                executeAction({
                  action: "TOGGLE_FACILITY_DOCTOR",
                  facilityId: selectedFacility.id,
                })
              }
              className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors shrink-0 flex items-center gap-2 ${
                selectedFacility.clinicianOnDuty
                  ? "bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200"
                  : "bg-rose-100 border-rose-400 text-rose-950 hover:bg-rose-200"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>
                Doctor:{" "}
                {selectedFacility.clinicianOnDuty
                  ? "ON DUTY (Tap to Simulate Absent)"
                  : "ABSENT (Remote Specialist Routing)"}
              </span>
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Equal Neighbor-Ring Broadcast Queue */}
        <div className="lg:col-span-5 bg-rose-50/90 rounded-3xl border-2 border-rose-300 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-200 border border-rose-300 text-rose-900 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-rose-700" />
                Equal Neighbor-Ring Broadcasts
              </span>
              <span className="font-mono text-xs font-bold text-rose-800">
                FIRST-ACCEPT LOCK
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                Incoming Overflow Handovers
              </h2>
              <p className="text-base text-slate-800 mt-1 leading-relaxed font-medium">
                When a village clinic is 100% full, its critical patient query broadcasts
                simultaneously to every adjacent Hexagon clinic below.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {snapshot.hexBroadcasts.map((bc) => {
                const isBroadcasting = bc.status === "BROADCASTING_RING";
                return (
                  <div
                    key={bc.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isBroadcasting
                        ? "bg-rose-100/90 border-rose-300 shadow-xs"
                        : "bg-emerald-100/90 border-emerald-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-950 text-lg">
                          {bc.pseudonym}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-700 text-white font-mono text-xs font-bold">
                          Score {bc.priorityScore}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                          isBroadcasting
                            ? "bg-red-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isBroadcasting
                          ? `RING → ${bc.targetHexagons.join(", ")}`
                          : `LOCKED BY ${bc.acceptedByFacilityName}`}
                      </span>
                    </div>

                    <div className="text-sm text-slate-800 font-medium flex flex-wrap items-center gap-2">
                      <span>Origin Clinic:</span>
                      <strong className="text-slate-950">
                        {bc.originFacilityName} ({bc.originHexagonId})
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-200/80 border border-rose-300 font-mono text-sm font-bold text-rose-900">
                      {bc.vitalsSummary}
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed">
                      {bc.whyFlagged}
                    </p>

                    {isBroadcasting ? (
                      <div className="pt-3 border-t border-red-200/80 space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Accept & Lock Patient at Neighbor Hexagon Clinic:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bc.targetHexagons.map((hexId) => {
                            const neighborFac = snapshot.facilities.find(
                              (f) => f.hexagonId === hexId
                            );
                            if (!neighborFac) return null;
                            return (
                              <button
                                key={hexId}
                                disabled={busyAction}
                                onClick={() =>
                                  executeAction({
                                    action: "CLAIM_HEXAGON_BROADCAST",
                                    broadcastId: bc.id,
                                    acceptingFacilityId: neighborFac.id,
                                  })
                                }
                                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>
                                  Accept at {neighborFac.hexagonId} ({neighborFac.village})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-emerald-200 flex items-center gap-2 text-sm font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Handover complete — clinical chart locked to{" "}
                          {bc.acceptedByFacilityName}.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              <strong>Test Critical Patient Overflow:</strong> Simulates an arrival when all{" "}
              {selectedFacility.criticalSlots} Critical Slots are full.
            </div>
            <button
              disabled={busyAction}
              onClick={() =>
                executeAction({
                  action: "SIMULATE_31ST_PATIENT",
                  facilityId: selectedFacility.id,
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shrink-0 shadow-xs transition-colors"
            >
              + Trigger Overflow Patient
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BOTTOM SECTION: CLINIC CAPACITY ISOLATOR (DYNAMIC SLOTS FROM API)    */}
      {/* =================================================================== */}
      <div className="bg-emerald-50/90 rounded-3xl border-2 border-emerald-300 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              {t.slotAllocationTitle}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {selectedFacility.name} ({selectedFacility.hexagonId}) —{" "}
              {selectedFacility.totalSlots} Daily Slots
            </h2>
            <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
              Strict 3-Bucket Isolation guarantees general villagers walking in for routine
              care are never displaced by high-risk follow-up alerts.
            </p>
          </div>

          {/* 3-Bucket Capacity Gauges (100% API-Driven) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 min-w-[165px]">
              <div className="flex items-center justify-between text-xs font-bold text-red-700">
                <span>CRITICAL SLOTS</span>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {selectedClinicAlloc.occupiedCritical} /{" "}
                {selectedFacility.criticalSlots}
              </div>
              <div className="text-xs text-red-700 font-medium mt-0.5">
                Score ≥ {snapshot.activeThresholds.pivotThreshold} Immediate
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 min-w-[165px]">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>FOLLOW-UP SYSTEM</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {selectedClinicAlloc.occupiedSystem} /{" "}
                {selectedFacility.systemSlots}
              </div>
              <div className="text-xs text-emerald-800 font-medium mt-0.5">
                50m–2h Flexible Windows
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 min-w-[165px]">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>WALK-IN SHIELD</span>
                <Users className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {selectedFacility.walkInSlots} / {selectedFacility.walkInSlots}
              </div>
              <div className="text-xs text-slate-700 font-medium mt-0.5">
                100% Protected & Untouched
              </div>
            </div>
          </div>
        </div>

        {selectedClinicAlloc.preemptedLowScoreCount > 0 && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-red-900 font-medium">
              <strong>Preemption Active:</strong>{" "}
              {selectedClinicAlloc.preemptedLowScoreCount} lowest-scoring routine follow-up
              slot(s) gracefully converted to ASHA Home Visits while{" "}
              <strong>
                all {selectedFacility.walkInSlots} Walk-In Slots remained 100% untouched
              </strong>
              .
            </div>
            <span className="px-3 py-1 rounded-full bg-red-600 text-white font-mono text-xs font-bold shrink-0">
              WALK-INS PROTECTED
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {selectedClinicAlloc.slots.map((slot) => {
            const isCriticalBucket = slot.bucket === "CRITICAL_RESERVED";
            const isWalkInBucket = slot.bucket === "PROTECTED_WALK_IN";

            return (
              <div
                key={slot.slotNumber}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-shadow hover:shadow-xs ${
                  isCriticalBucket
                    ? "bg-red-50/60 border-red-200"
                    : isWalkInBucket
                    ? "bg-slate-50/90 border-slate-200"
                    : "bg-emerald-50/50 border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-slate-600">
                    SLOT #{String(slot.slotNumber).padStart(2, "0")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide ${
                      isCriticalBucket
                        ? "bg-red-600 text-white"
                        : isWalkInBucket
                        ? "bg-slate-800 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isCriticalBucket
                      ? `CRITICAL (${selectedFacility.criticalSlots})`
                      : isWalkInBucket
                      ? `WALK-IN (${selectedFacility.walkInSlots})`
                      : `SYSTEM (${selectedFacility.systemSlots})`}
                  </span>
                </div>

                <div>
                  <div className="font-mono font-bold text-base text-slate-900 truncate">
                    {slot.pseudonym || "Open Buffer Slot"}
                  </div>
                  {slot.score !== null ? (
                    <div className="text-xs font-mono font-bold text-red-700 mt-0.5">
                      QuickSort Score: {slot.score}
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      {isWalkInBucket
                        ? "Reserved for Village Walk-In"
                        : "Available Follow-Up Slot"}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-700 leading-snug border-t border-slate-200/80 pt-2 font-semibold">
                  {slot.timeWindow}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
