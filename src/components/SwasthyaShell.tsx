"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Cross,
  Database,
  Globe,
  HeartPulse,
  Hexagon,
  LayoutGrid,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
  SupportedLanguage,
} from "@/lib/i18n";
import type {
  EvaluatedPatientFlag,
  RuleThresholds,
  ClinicCapacityAllocation,
} from "@/lib/quicksort-engine";
import type {
  FacilityRecord,
  UserRecord,
  UserRole,
  EscalationRecord,
  HexBroadcastRecord,
  AmbulanceDispatchRecord,
  SimulatedMessageRecord,
  AuditLogRecord,
  PendingRuleDraft,
} from "@/lib/db";
import type {
  ExternalIntegrationStatus,
  DangerSymptomDefinition,
} from "@/lib/external-integrations";

export interface SystemSnapshot {
  simulatedClockIso: string;
  postgresEngineStatus: string;
  integrations: ExternalIntegrationStatus;
  symptomCatalog: DangerSymptomDefinition[];
  activeThresholds: RuleThresholds;
  pendingRuleDraft: PendingRuleDraft | null;
  facilities: FacilityRecord[];
  users: UserRecord[];
  quickSortResult: {
    immediatePartition: EvaluatedPatientFlag[];
    flexiblePartition: EvaluatedPatientFlag[];
    combinedRanked: EvaluatedPatientFlag[];
    trace: {
      pivotThreshold: number;
      totalEvaluated: number;
      immediateCount: number;
      flexibleCount: number;
      comparisons: number;
      executionMicros: number;
    };
  };
  clinicAllocations: Record<string, ClinicCapacityAllocation>;
  escalations: EscalationRecord[];
  hexBroadcasts: HexBroadcastRecord[];
  ambulanceDispatches: AmbulanceDispatchRecord[];
  messages: SimulatedMessageRecord[];
  auditIntegrity: {
    valid: boolean;
    totalEntries: number;
    brokenAtId: string | null;
  };
  auditLog: AuditLogRecord[];
  withdrawnPatients: Array<{
    id: string;
    pseudonym: string;
    cohort: string;
    village: string;
    withdrawnAt: string | null;
  }>;
  stats: {
    totalPatients: number;
    consentedPatients: number;
    withdrawnPatients: number;
    totalImmediateAboveThreshold: number;
    totalOverdue: number;
    totalMissedTwice: number;
    openEscalations: number;
    slaBreachedCount: number;
    activeHexBroadcasts: number;
    activeAmbulances: number;
  };
}

interface SwasthyaContextValue {
  snapshot: SystemSnapshot | null;
  loading: boolean;
  busyAction: boolean;
  activeRole: UserRole;
  activeUserId: string;
  activeUserName: string;
  lang: SupportedLanguage;
  setLang: (l: SupportedLanguage) => void;
  handleUserSwitch: (userId: string) => void;
  executeAction: (
    payload: Record<string, unknown>
  ) => Promise<{ ok: boolean; data: unknown }>;
  openCheckinModal: (pt: EvaluatedPatientFlag) => void;
  openPhoneDrawer: (patientId?: string) => void;
}

const SwasthyaContext = createContext<SwasthyaContextValue | null>(null);

export function useSwasthya() {
  const ctx = useContext(SwasthyaContext);
  if (!ctx) {
    throw new Error("useSwasthya must be used inside SwasthyaShell");
  }
  return ctx;
}

export function SwasthyaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyAction, setBusyAction] = useState<boolean>(false);

  const [activeRole, setActiveRole] = useState<UserRole>("worker");
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [activeUserName, setActiveUserName] = useState<string>("");
  const [lang, setLang] = useState<SupportedLanguage>("en");

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState<boolean>(false);
  const [selectedSimPatientId, setSelectedSimPatientId] = useState<string>("");

  const [checkinModalPatient, setCheckinModalPatient] =
    useState<EvaluatedPatientFlag | null>(null);
  const [checkinForm, setCheckinForm] = useState({
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 76,
    bloodGlucose: 110,
    temperature: 37.0,
    spo2: 98,
    symptoms: [] as string[],
    doctorUnavailableAtClinic: false,
  });

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSnapshot = useCallback(
    async (roleOverride?: UserRole, userOverride?: string) => {
      try {
        const r = roleOverride || activeRole;
        const u = userOverride || activeUserId;
        const query = new URLSearchParams();
        if (r) query.set("role", r);
        if (u) query.set("userId", u);
        const res = await fetch(`/api/swasthya?${query.toString()}`);
        const data: SystemSnapshot = await res.json();
        setSnapshot(data);

        // Dynamically initialize active user & default simulated patient from API data
        if (!u && data.users.length > 0) {
          const defaultUser =
            data.users.find((usr) => usr.role === r) || data.users[0];
          setActiveRole(defaultUser.role);
          setActiveUserId(defaultUser.id);
          setActiveUserName(`${defaultUser.name} (${defaultUser.title})`);
        }
        if (
          data.quickSortResult.combinedRanked.length > 0 &&
          !selectedSimPatientId
        ) {
          setSelectedSimPatientId(
            data.quickSortResult.combinedRanked[0].patientId
          );
        }
      } catch {
        setToast({ type: "error", text: "Failed to load clinical registry." });
      } finally {
        setLoading(false);
      }
    },
    [activeRole, activeUserId, selectedSimPatientId]
  );

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const executeAction = async (payload: Record<string, unknown>) => {
    setBusyAction(true);
    try {
      const res = await fetch("/api/swasthya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerRole: activeRole,
          callerId: activeUserId,
          callerName: activeUserName,
          ...payload,
        }),
      });
      const data = await res.json();
      if (data.snapshot) {
        setSnapshot(data.snapshot);
      }
      if (!res.ok) {
        setToast({
          type: "error",
          text: data.error || "Action blocked by security/privacy gate.",
        });
      } else if (data.message) {
        setToast({ type: "success", text: data.message });
      }
      return { ok: res.ok, data };
    } catch {
      setToast({ type: "error", text: "Network error executing action." });
      return { ok: false, data: null };
    } finally {
      setBusyAction(false);
    }
  };

  const handleUserSwitch = (userId: string) => {
    if (!snapshot) return;
    const selectedUser = snapshot.users.find((u) => u.id === userId);
    if (!selectedUser) return;
    setActiveRole(selectedUser.role);
    setActiveUserId(selectedUser.id);
    setActiveUserName(`${selectedUser.name} (${selectedUser.title})`);
    void fetchSnapshot(selectedUser.role, selectedUser.id);
  };

  const openCheckinModal = (pt: EvaluatedPatientFlag) => {
    setCheckinModalPatient(pt);
    if (pt.latestVitals) {
      setCheckinForm({
        systolicBp: pt.latestVitals.systolicBp,
        diastolicBp: pt.latestVitals.diastolicBp,
        heartRate: pt.latestVitals.heartRate,
        bloodGlucose: pt.latestVitals.bloodGlucose,
        temperature: pt.latestVitals.temperature,
        spo2: pt.latestVitals.spo2,
        symptoms: [],
        doctorUnavailableAtClinic: false,
      });
    }
  };

  const openPhoneDrawer = (patientId?: string) => {
    if (patientId) {
      setSelectedSimPatientId(patientId);
    } else if (
      !selectedSimPatientId &&
      snapshot?.quickSortResult.combinedRanked[0]
    ) {
      setSelectedSimPatientId(
        snapshot.quickSortResult.combinedRanked[0].patientId
      );
    }
    setPhoneDrawerOpen(true);
  };

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutGrid },
    {
      href: "/worklist",
      label: "Triage Queue",
      icon: Activity,
      count: snapshot?.quickSortResult.trace.immediateCount,
      alertRed: true,
    },
    {
      href: "/network",
      label: "Hex Network",
      icon: Hexagon,
      count: snapshot?.stats.activeHexBroadcasts,
      alertRed: true,
    },
    {
      href: "/clinician",
      label: "Clinician",
      icon: Stethoscope,
      count: snapshot?.stats.openEscalations,
      alertRed: false,
    },
    {
      href: "/governance",
      label: "Governance",
      icon: ShieldCheck,
    },
    {
      href: "/simulator",
      label: "Scenario Lab",
      icon: Zap,
    },
  ];

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  return (
    <SwasthyaContext.Provider
      value={{
        snapshot,
        loading,
        busyAction,
        activeRole,
        activeUserId,
        activeUserName,
        lang,
        setLang,
        handleUserSwitch,
        executeAction,
        openCheckinModal,
        openPhoneDrawer,
      }}
    >
      <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
        {/* ================================================================= */}
        {/* SINGLE ULTRA-CLEAN 21ST.DEV FLOATING HEADER BAR                   */}
        {/* ================================================================= */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            {/* Left: Crisp Medical Brand */}
            <Link
              href="/"
              className="min-h-[44px] flex items-center gap-2.5 shrink-0 whitespace-nowrap"
            >
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                <Cross className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  SwasthyaSense
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  v{snapshot?.activeThresholds.version ?? 1}.0
                </span>
              </div>
            </Link>

            {/* Center (xl+): 21st.dev Floating Segmented Pill Nav */}
            <nav
              aria-label="Primary Navigation"
              className="hidden xl:flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                    {typeof item.count === "number" && item.count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold leading-tight ${
                          item.alertRed
                            ? "bg-red-600 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: API-Driven User Selector, Language, Phone Sim & Mobile Menu */}
            <div className="flex items-center gap-2 shrink-0">
              {snapshot && snapshot.users.length > 0 && (
                <div className="hidden lg:flex items-center bg-slate-100 rounded-xl px-2.5 min-h-[40px] border border-slate-200/70">
                  <User className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                  <select
                    aria-label="Select Active Clinical User"
                    value={activeUserId}
                    onChange={(e) => handleUserSwitch(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[170px] truncate"
                  >
                    {snapshot.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Language Pill (md+) */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-2.5 min-h-[40px] border border-slate-200/70">
                <Globe className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                <select
                  aria-label="Select Language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Phone Simulator Trigger */}
              <button
                type="button"
                onClick={() => openPhoneDrawer()}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">WhatsApp Sim</span>
              </button>

              {/* Hamburger Menu Button for < xl screens (44x44px) */}
              <button
                type="button"
                aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* RESPONSIVE SLIDE-OVER DRAWER FOR MOBILE / TABLET (< xl)           */}
        {/* ================================================================= */}
        {mobileMenuOpen && (
          <div className="xl:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-sm bg-white h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center">
                      <Cross className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      SwasthyaSense
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`min-h-[48px] px-4 py-3 rounded-xl text-base font-semibold flex items-center justify-between ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </span>
                        {typeof item.count === "number" && item.count > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isActive
                                ? "bg-white text-emerald-800"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  {snapshot && snapshot.users.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                        Active Clinical User (From API)
                      </label>
                      <select
                        value={activeUserId}
                        onChange={(e) => handleUserSwitch(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-semibold text-slate-900"
                      >
                        {snapshot.users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                      Regional Language
                    </label>
                    <select
                      value={lang}
                      onChange={(e) =>
                        setLang(e.target.value as SupportedLanguage)
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-semibold text-slate-900"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} — {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                {snapshot && snapshot.facilities.length > 0 && (
                  <button
                    disabled={busyAction}
                    onClick={() => {
                      void executeAction({
                        action: "SIMULATE_31ST_PATIENT",
                        facilityId: snapshot.facilities[0].id,
                      });
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 text-white text-base font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Simulate 31st Critical Patient</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TOAST NOTIFICATION                                                */}
        {/* ================================================================= */}
        {toast && (
          <div className="max-w-screen-xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-base font-medium shadow-xs ${
                toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === "error" ? (
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <span>{toast.text}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-black/5 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MAIN PAGE CONTENT                                                 */}
        {/* ================================================================= */}
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {loading || !snapshot ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                <HeartPulse className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Loading Clinical Triage Registry...
              </h2>
            </div>
          ) : (
            children
          )}
        </main>

        {/* ================================================================= */}
        {/* SUBTLE COMPLIANCE & LIVE API CONNECTOR FOOTER                     */}
        {/* ================================================================= */}
        <footer className="bg-white border-t border-slate-200/80 py-4 mt-12">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold text-xs border border-red-200">
                DECISION-SUPPORT ONLY • NOT A DIAGNOSTIC DEVICE
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-600">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                {snapshot?.integrations?.supabasePostgres.mode ??
                  snapshot?.postgresEngineStatus}{" "}
                ({snapshot?.stats.totalPatients ?? 0} Records)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-medium flex items-center gap-1 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4" />
                SHA-256 Chain Verified ({snapshot?.auditIntegrity.totalEntries ?? 0})
              </span>
              <button
                onClick={() => executeAction({ action: "RESET_DEMO" })}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Reset State
              </button>
            </div>
          </div>
        </footer>

        {/* ================================================================= */}
        {/* MODAL: 5-VITAL CHECK-IN (DYNAMICALLY POPULATED FROM API CATALOG)  */}
        {/* ================================================================= */}
        {checkinModalPatient && snapshot && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="w-full h-full sm:h-auto sm:max-w-xl bg-white sm:rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase">
                    5-Category Clinical Check-In
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Record Vitals — {checkinModalPatient.pseudonym}
                  </h3>
                </div>
                <button
                  onClick={() => setCheckinModalPatient(null)}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    1a. Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={checkinForm.systolicBp}
                    onChange={(e) =>
                      setCheckinForm({
                        ...checkinForm,
                        systolicBp: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    1b. Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={checkinForm.diastolicBp}
                    onChange={(e) =>
                      setCheckinForm({
                        ...checkinForm,
                        diastolicBp: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    2. Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={checkinForm.heartRate}
                    onChange={(e) =>
                      setCheckinForm({
                        ...checkinForm,
                        heartRate: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    3. Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={checkinForm.bloodGlucose}
                    onChange={(e) =>
                      setCheckinForm({
                        ...checkinForm,
                        bloodGlucose: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    4a. Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={checkinForm.temperature}
                    onChange={(e) =>
                      setCheckinForm({
                        ...checkinForm,
                        temperature: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    4b. Oxygen SpO₂ (%)
                  </label>
                  <input
                    type="number"
                    value={checkinForm.spo2}
                    onChange={(e) =>
                      setCheckinForm({
                        ...checkinForm,
                        spo2: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  5. Danger-Sign Symptom Checklist (From API Catalog):
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {(snapshot.symptomCatalog || []).map((sym) => {
                    const checked = checkinForm.symptoms.includes(sym.id);
                    return (
                      <label
                        key={sym.id}
                        className="min-h-[40px] flex items-center gap-3 text-sm text-slate-800 font-medium cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCheckinForm({
                                ...checkinForm,
                                symptoms: [...checkinForm.symptoms, sym.id],
                              });
                            } else {
                              setCheckinForm({
                                ...checkinForm,
                                symptoms: checkinForm.symptoms.filter(
                                  (s) => s !== sym.id
                                ),
                              });
                            }
                          }}
                        />
                        <span>{sym.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="min-h-[44px] flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-800 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-red-600"
                  checked={checkinForm.doctorUnavailableAtClinic}
                  onChange={(e) =>
                    setCheckinForm({
                      ...checkinForm,
                      doctorUnavailableAtClinic: e.target.checked,
                    })
                  }
                />
                <span>
                  Doctor absent at local clinic — record vitals & route remotely to specialist
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setCheckinModalPatient(null)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-slate-100 text-slate-800 text-base font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={busyAction}
                  onClick={async () => {
                    await executeAction({
                      action: "LOG_CHECKIN",
                      patientId: checkinModalPatient.patientId,
                      ...checkinForm,
                    });
                    setCheckinModalPatient(null);
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-xs"
                >
                  Save & Re-Sort Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SLIDE-OVER DRAWER: PATIENT WHATSAPP SIMULATOR (API-POPULATED)     */}
        {/* ================================================================= */}
        {phoneDrawerOpen && snapshot && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full sm:max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Patient WhatsApp / SMS Handset
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gateway:{" "}
                      {snapshot.integrations?.messagingGateway.provider ??
                        "SIMULATED_SANDBOX"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPhoneDrawerOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-3">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Active Patient Handset (From API Queue):
                </label>
                <select
                  value={selectedSimPatientId}
                  onChange={(e) => setSelectedSimPatientId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                >
                  {snapshot.quickSortResult.combinedRanked
                    .slice(0, 25)
                    .map((pt) => (
                      <option key={pt.patientId} value={pt.patientId}>
                        {pt.pseudonym} ({pt.village} • Score {pt.totalScore})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex-1 bg-[#EFEAE2] rounded-2xl border border-slate-200 p-4 overflow-y-auto space-y-3">
                {snapshot.messages.map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <div className="p-3 rounded-2xl rounded-tl-xs bg-white shadow-xs text-slate-800 border border-slate-200/60">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-700 mb-1">
                        <span>
                          To: {m.pseudonym} ({m.language.toUpperCase()})
                        </span>
                        <span>{m.status}</span>
                      </div>
                      <p className="leading-relaxed text-sm">{m.body}</p>
                    </div>

                    {m.replyText && (
                      <div className="ml-8 p-2.5 rounded-2xl rounded-tr-xs bg-[#D9FDD3] text-slate-900 shadow-xs text-right border border-emerald-300">
                        <span className="font-mono font-bold text-sm">
                          Reply: &ldquo;{m.replyText}&rdquo;
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 mt-3 space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase">
                  Simulate Incoming Patient Reply Webhook:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={busyAction || !selectedSimPatientId}
                    onClick={() =>
                      executeAction({
                        action: "SIMULATE_PATIENT_REPLY",
                        patientId: selectedSimPatientId,
                        replyText: "1",
                      })
                    }
                    className="min-h-[44px] p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold text-center"
                  >
                    1 • Confirm
                  </button>

                  <button
                    disabled={busyAction || !selectedSimPatientId}
                    onClick={() =>
                      executeAction({
                        action: "SIMULATE_PATIENT_REPLY",
                        patientId: selectedSimPatientId,
                        replyText: "2",
                      })
                    }
                    className="min-h-[44px] p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold text-center"
                  >
                    2 • Problem
                  </button>

                  <button
                    disabled={busyAction || !selectedSimPatientId}
                    onClick={() =>
                      executeAction({
                        action: "SIMULATE_PATIENT_REPLY",
                        patientId: selectedSimPatientId,
                        replyText: "STOP",
                      })
                    }
                    className="min-h-[44px] p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold text-center"
                  >
                    STOP
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SwasthyaContext.Provider>
  );
}
