"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileCheck2,
  Filter,
  Globe,
  HardDrive,
  Hash,
  Hexagon,
  KeyRound,
  PlusCircle,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useSwasthya } from "@/components/SwasthyaShell";
import type { UserRole, FacilityRecord, UserRecord, AuditLogRecord } from "@/lib/db";

export default function SuperAdminConsole() {
  const { snapshot, executeAction, activeRole, activeUserId, activeUserName } = useSwasthya();

  const [activeTab, setActiveTab] = useState<
    "staff_mgmt" | "patient_restrict" | "clinic_mesh" | "services" | "audit_ledger"
  >("staff_mgmt");

  const [tenantScopeFilter, setTenantScopeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [busySubmitting, setBusySubmitting] = useState<boolean>(false);

  // Provision Staff Form
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "clinician" as UserRole,
    subRole: "doctor" as "doctor" | "nurse" | "asha" | "admin",
    organizationId: "ORG-BOKO",
    facilityId: "FAC-BOKO-0",
    title: "Primary Medical Officer",
    passcode: "Care@Staff#2026",
  });

  // Restrict Patient Form
  const [selectedPatientForHold, setSelectedPatientForHold] = useState<string>("");
  const [restrictionReason, setRestrictionReason] = useState<string>(
    "Transferred to State Forensic Oncology Ward • Medico-Legal Hold"
  );

  // Clinic Provisioning Form
  const [showAddClinicModal, setShowAddClinicModal] = useState<boolean>(false);
  const [newClinicForm, setNewClinicForm] = useState({
    name: "Rani South PHC Extension",
    village: "Rani South",
    district: "Kamrup Rural",
    hexagonId: "HEX-2",
    tier: "PHC" as "PHC" | "SUB_CENTRE" | "TERTIARY_REFERRAL",
    organizationId: "ORG-SEVAK",
    totalSlots: 30,
    systemSlots: 15,
    criticalSlots: 5,
    walkInSlots: 10,
  });

  // Open-Source Service Form
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: "OpenEHR Clinical Terminology Microservice",
    category: "Ontology & Coding",
    endpointUrl: "https://openehr.internal.swasthya/v1",
    description: "SNOMED-CT and ICD-11 semantic clinical code validator",
  });

  const allUsers = snapshot?.allUsers || snapshot?.users || [];
  const allFacilities = snapshot?.allFacilities || snapshot?.facilities || [];
  const allOrganizations = snapshot?.organizations || [];
  const auditLogs = snapshot?.auditLog || [];
  const openSourceServices = snapshot?.openSourceServices || [];

  // Filter staff by tenant and search
  const filteredUsers = allUsers.filter((u) => {
    const matchesOrg = tenantScopeFilter === "ALL" || u.organizationId === tenantScopeFilter;
    const matchesSearch =
      searchTerm.length === 0 ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOrg && matchesSearch;
  });

  // Handle Provisioning Staff
  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusySubmitting(true);
    try {
      await executeAction({
        action: "PROVISION_STAFF",
        ...newStaffForm,
      });
      setShowAddStaffModal(false);
      setNewStaffForm({
        name: "",
        role: "clinician",
        subRole: "doctor",
        organizationId: "ORG-BOKO",
        facilityId: "FAC-BOKO-0",
        title: "Primary Medical Officer",
        passcode: "Care@Staff#2026",
      });
    } finally {
      setBusySubmitting(false);
    }
  };

  // Handle Deactivating Staff
  const handleDeactivateStaff = async (staffId: string) => {
    if (!confirm(`Are you sure you want to deactivate credentials for ${staffId}?`)) return;
    setBusySubmitting(true);
    try {
      await executeAction({
        action: "REMOVE_STAFF",
        staffId,
      });
    } finally {
      setBusySubmitting(false);
    }
  };

  // Handle Restricting Patient
  const handleRestrictPatient = async () => {
    if (!selectedPatientForHold) return;
    setBusySubmitting(true);
    try {
      await executeAction({
        action: "RESTRICT_PATIENT",
        patientId: selectedPatientForHold,
        restrictionReason,
      });
      setSelectedPatientForHold("");
    } finally {
      setBusySubmitting(false);
    }
  };

  // Handle Lifting Restriction
  const handleUnrestrictPatient = async (patientId: string) => {
    setBusySubmitting(true);
    try {
      await executeAction({
        action: "UNRESTRICT_PATIENT",
        patientId,
      });
    } finally {
      setBusySubmitting(false);
    }
  };

  // Handle Provisioning Facility
  const handleProvisionFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusySubmitting(true);
    try {
      await executeAction({
        action: "ADD_FACILITY",
        ...newClinicForm,
      });
      setShowAddClinicModal(false);
    } finally {
      setBusySubmitting(false);
    }
  };

  // Handle Adding Open-Source Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusySubmitting(true);
    try {
      await executeAction({
        action: "ADD_OPEN_SERVICE",
        ...newServiceForm,
      });
      setShowAddServiceModal(false);
    } finally {
      setBusySubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Command Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/50 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Global Platform Governance • Master Clearance
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Cross-Tenant Orchestration
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Super Admin Console • Platform Director Atharv
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Master administrative authority over all healthcare organizations, clinics, staff credentials,
              patient holds, spatial hexagonal mesh routing, and the cryptographic SHA-256 audit ledger.
            </p>
          </div>

          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Organizations</div>
              <div className="text-xl font-black text-white mt-0.5">{allOrganizations.length}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Clinics / Hubs</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{allFacilities.length}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Staff</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{allUsers.length}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">SHA-256 Ledger</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                {snapshot?.auditIntegrity?.totalEntries || auditLogs.length}
              </div>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("staff_mgmt")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "staff_mgmt"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Staff Management
          </button>
          <button
            onClick={() => setActiveTab("patient_restrict")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "patient_restrict"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Patient Holds &amp; Restrictions
          </button>
          <button
            onClick={() => setActiveTab("clinic_mesh")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "clinic_mesh"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Hexagon className="w-3.5 h-3.5" />
            Hexagon Mesh &amp; Clinics
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "services"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Open-Source Services ({openSourceServices.length})
          </button>
          <button
            onClick={() => setActiveTab("audit_ledger")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "audit_ledger"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Immutable Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: STAFF MANAGEMENT (USER MANAGEMENT) */}
      {activeTab === "staff_mgmt" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                Staff Directory &amp; User Provisioning
              </h2>
              <p className="text-xs text-slate-500">
                Super Admin can provision and deactivate doctors, nurses, ASHA workers, and administrators across any healthcare organization.
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/25 cursor-pointer transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              + Provision Healthcare Worker
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Filter Organization:
              </label>
              <select
                value={tenantScopeFilter}
                onChange={(e) => setTenantScopeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Organizations (Global Master)</option>
                {allOrganizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.shortName} ({o.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Name &amp; Title</th>
                  <th className="py-2.5 px-3">Role &amp; Badge</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {u.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.title}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.role === "super_admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : u.role === "clinician"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : u.role === "admin"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {u.organizationId || "ORG-SEVAK"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {u.facilityId}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.available !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {u.available !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.role !== "super_admin" && (
                        <button
                          onClick={() => void handleDeactivateStaff(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                          title="Deactivate staff credentials"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT RESTRICTIONS & CLINICAL HOLD */}
      {activeTab === "patient_restrict" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              Place Clinical / Medico-Legal Hold
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In clinical governance, patients are never &ldquo;blacklisted&rdquo;. Instead, an authorized
              Director or Senior Clinician can place a <strong>Clinical Hold / Medico-Legal Suspension</strong>
              with documented reason to pause routine clinic dispatch or transfer to specialized state custody.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Patient to Restrict:
                </label>
                <select
                  value={selectedPatientForHold}
                  onChange={(e) => setSelectedPatientForHold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold"
                >
                  <option value="">-- Choose Patient --</option>
                  {(snapshot?.quickSortResult?.combinedRanked || []).map((pt) => (
                    <option key={pt.patientId} value={pt.patientId}>
                      {pt.pseudonym} • {pt.cohort} ({pt.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Documented Restriction Reason:
                </label>
                <textarea
                  rows={3}
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
                />
              </div>

              <button
                disabled={!selectedPatientForHold || busySubmitting}
                onClick={handleRestrictPatient}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
              >
                {busySubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertOctagon className="w-4 h-4" />
                )}
                Lock Patient on Administrative Hold
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Active Restricted &amp; Held Patients
            </h3>
            <p className="text-xs text-slate-500">
              Patients currently suspended from routine field queue with documented justification.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(snapshot?.quickSortResult?.combinedRanked || []).slice(0, 4).map((pt, idx) => (
                <div key={pt.patientId} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {pt.pseudonym}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        {idx === 0 ? "Medico-Legal Hold" : "Active Monitored"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {idx === 0
                        ? "Transferred to State Forensic Oncology Ward • Hold by Atharv"
                        : "Standard clinical surveillance protocol active."}
                    </div>
                  </div>

                  {idx === 0 && (
                    <button
                      onClick={() => void handleUnrestrictPatient(pt.patientId)}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      Lift Hold
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC MESH & PROVISIONING */}
      {activeTab === "clinic_mesh" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Hexagon className="w-5 h-5 text-red-600" />
                5-Hexagon Clinic Mesh &amp; Spatial Node Provisioning
              </h2>
              <p className="text-xs text-slate-500">
                Primary Health Centres and Sub-Centres connected in H3 spatial rings for atomic overflow absorption.
              </p>
            </div>
            <button
              onClick={() => setShowAddClinicModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/25 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + Add Hexagon Node
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFacilities.map((fac) => (
              <div
                key={fac.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-red-600 dark:text-red-400">
                    {fac.hexagonId}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border">
                    {fac.tier}
                  </span>
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {fac.name}
                  </div>
                  <div className="text-xs text-slate-500">{fac.village}, {fac.district}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t font-mono text-center text-xs">
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border">
                    <div className="text-[9px] text-slate-400">System</div>
                    <div className="font-bold">{fac.systemSlots}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border">
                    <div className="text-[9px] text-red-500 font-bold">Critical</div>
                    <div className="font-bold text-red-600">{fac.criticalSlots}</div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border">
                    <div className="text-[9px] text-emerald-500 font-bold">Walk-In</div>
                    <div className="font-bold text-emerald-600">{fac.walkInSlots}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OPEN-SOURCE MICROSERVICES & INTEGRATIONS */}
      {activeTab === "services" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-red-600" />
                Open-Source Infrastructure &amp; Hardware Gateways
              </h2>
              <p className="text-xs text-slate-500">
                Independent open source microservices running locally to guarantee zero vendor lock-in and offline resilience.
              </p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-red-500" />
              + Register Microservice
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openSourceServices.map((svc) => (
              <div
                key={svc.id}
                className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {svc.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {svc.status} • {svc.latencyMs}ms
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {svc.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {svc.description}
                  </p>
                </div>
                <div className="font-mono text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-xl border truncate">
                  {svc.endpointUrl}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: IMMUTABLE SHA-256 AUDIT LEDGER */}
      {activeTab === "audit_ledger" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                Immutable SHA-256 Cryptographic Audit Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Every clinical check-in, rule draft sign-off, phone view, and emergency dispatch is permanently hashed and chained.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Chain Integrity: 100% Valid ({snapshot?.auditIntegrity?.totalEntries || auditLogs.length} blocks)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3">Entry ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor &amp; Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">SHA-256 Hash Chaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {log.id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {log.timestamp.slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{log.reason}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        log.result === "ALLOWED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                      <div>Curr: {log.currHash.slice(0, 16)}...</div>
                      <div className="text-slate-400">Prev: {log.prevHash.slice(0, 16)}...</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVISION STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-red-600" />
              Provision Healthcare Professional
            </h3>
            <form onSubmit={handleProvisionStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Staff Full Name:</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dr. Himanta Sarma"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Role:</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    <option value="clinician">Clinician (Doctor)</option>
                    <option value="worker">Frontline Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Hospital Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Sub-Role:</label>
                  <select
                    value={newStaffForm.subRole}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, subRole: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse / ANM</option>
                    <option value="asha">ASHA Worker</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Organization:</label>
                  <select
                    value={newStaffForm.organizationId}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, organizationId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    {allOrganizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Facility Node:</label>
                  <select
                    value={newStaffForm.facilityId}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, facilityId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    {allFacilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Access Passcode:</label>
                <input
                  required
                  type="password"
                  value={newStaffForm.passcode}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, passcode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={busySubmitting}
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  Provision Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION CLINIC MODAL */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-red-600" />
              Add Clinic to Hexagonal Mesh
            </h3>
            <form onSubmit={handleProvisionFacility} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Clinic Name:</label>
                <input
                  required
                  type="text"
                  value={newClinicForm.name}
                  onChange={(e) => setNewClinicForm({ ...newClinicForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Village:</label>
                  <input
                    required
                    type="text"
                    value={newClinicForm.village}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, village: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Hexagon ID:</label>
                  <input
                    required
                    type="text"
                    value={newClinicForm.hexagonId}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, hexagonId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="font-bold block mb-1">System:</label>
                  <input
                    type="number"
                    value={newClinicForm.systemSlots}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, systemSlots: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-xl border text-center font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-red-600">Critical:</label>
                  <input
                    type="number"
                    value={newClinicForm.criticalSlots}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, criticalSlots: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-xl border text-center font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-emerald-600">Walk-In:</label>
                  <input
                    type="number"
                    value={newClinicForm.walkInSlots}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, walkInSlots: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-xl border text-center font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={busySubmitting}
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  Add Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER OPEN SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-red-600" />
              Register Open-Source Service
            </h3>
            <form onSubmit={handleAddService} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Service Name:</label>
                <input
                  required
                  type="text"
                  value={newServiceForm.name}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Category:</label>
                <input
                  required
                  type="text"
                  value={newServiceForm.category}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Endpoint URL / Protocol:</label>
                <input
                  required
                  type="text"
                  value={newServiceForm.endpointUrl}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, endpointUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-medium"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={newServiceForm.description}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={busySubmitting}
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  Register Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
