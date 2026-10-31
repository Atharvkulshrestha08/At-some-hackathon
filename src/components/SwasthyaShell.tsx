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
  Building2,
  CheckCircle2,
  Cross,
  Database,
  Globe,
  HeartPulse,
  Hexagon,
  KeyRound,
  LayoutGrid,
  Lock,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  User,
  UserCheck,
  UserPlus,
  Users,
  Waves,
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
  OrganizationRecord,
  FacilityRecord,
  UserRecord,
  UserRole,
  CohortType,
  MobilityStatus,
  EscalationRecord,
  HexBroadcastRecord,
  AmbulanceDispatchRecord,
  SimulatedMessageRecord,
  AuditLogRecord,
  PendingRuleDraft,
  ActiveSessionRecord,
  PostOpReportRecord,
} from "@/lib/db";
import type {
  ExternalIntegrationStatus,
  DangerSymptomDefinition,
} from "@/lib/external-integrations";
import SwasthyaLandingPage, {
  LANDING_DEMO_PRESETS,
} from "@/components/SwasthyaLandingPage";

export interface SystemSnapshot {
  simulatedClockIso: string;
  postgresEngineStatus: string;
  integrations: ExternalIntegrationStatus;
  symptomCatalog: DangerSymptomDefinition[];
  activeThresholds: RuleThresholds;
  pendingRuleDraft: PendingRuleDraft | null;
  activeOrganization: OrganizationRecord;
  organizations: OrganizationRecord[];
  activeSessions?: ActiveSessionRecord[];
  workerScope: "assigned" | "organization";
  signedInToken: string;
  facilities: FacilityRecord[];
  allFacilities?: FacilityRecord[];
  users: UserRecord[];
  allUsers?: UserRecord[];
  postOpReports?: PostOpReportRecord[];
  openSourceServices?: Array<{
    id: string;
    name: string;
    category: string;
    endpointUrl: string;
    status: "ONLINE" | "STANDBY";
    latencyMs: number;
    description: string;
  }>;
  isSuperAdmin?: boolean;
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
  clearedPatients: Array<{
    id: string;
    pseudonym: string;
    initials: string;
    ageBand: string;
    cohort: string;
    village: string;
    clearedAt: string | null;
    clearedBy: string | null;
    clearedNotes: string | null;
  }>;
  stats: {
    totalPatients: number;
    organizationPatients: number;
    consentedPatients: number;
    withdrawnPatients: number;
    clearedPatients: number;
    totalImmediateAboveThreshold: number;
    totalOverdue: number;
    totalMissedTwice: number;
    openEscalations: number;
    slaBreachedCount: number;
    activeHexBroadcasts: number;
    activeAmbulances: number;
    restrictedPatients?: number;
    totalPostOpReports?: number;
    totalStaff?: number;
    totalFacilities?: number;
  };
}

interface SwasthyaContextValue {
  snapshot: SystemSnapshot | null;
  loading: boolean;
  busyAction: boolean;
  activeRole: UserRole;
  activeUserId: string;
  activeUserName: string;
  activeOrganizationId: string;
  workerScope: "assigned" | "organization";
  setWorkerScope: (scope: "assigned" | "organization") => void;
  lang: SupportedLanguage;
  setLang: (l: SupportedLanguage) => void;
  handleUserSwitch: (userId: string) => void;
  executeAction: (
    payload: Record<string, unknown>
  ) => Promise<{ ok: boolean; data: unknown }>;
  openCheckinModal: (pt: EvaluatedPatientFlag) => void;
  openRegisterPatientModal: () => void;
  openSignInModal: () => void;
  clearPatient: (patientId: string, clearanceNote?: string) => Promise<void>;
  restoreClearedPatient: (patientId: string) => Promise<void>;
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
  const [activeUserId, setActiveUserId] = useState<string>("USR-WRK-RINA");
  const [activeUserName, setActiveUserName] = useState<string>(
    "Rina Devi (Sevak ASHA Lead #1)"
  );
  const [activeOrganizationId, setActiveOrganizationId] =
    useState<string>("ORG-SEVAK");
  const [workerScope, setWorkerScopeState] = useState<
    "assigned" | "organization"
  >("assigned");
  const [authToken, setAuthToken] = useState<string>("");
  const [lang, setLang] = useState<SupportedLanguage>("en");

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState<boolean>(false);
  const [selectedSimPatientId, setSelectedSimPatientId] = useState<string>("");

  // Landing Page Gate & Simultaneous Multi-Tenant Session State
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Restore independent per-tab session from sessionStorage if present
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("swasthya_session_v25");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.organizationId && parsed.userId) {
          setActiveOrganizationId(parsed.organizationId);
          setActiveUserId(parsed.userId);
          if (parsed.userName) setActiveUserName(parsed.userName);
          if (parsed.role) setActiveRole(parsed.role);
          if (parsed.authToken) setAuthToken(parsed.authToken);
          setIsAuthenticated(true);
          if (parsed.enteredWorkspace) {
            setShowLandingPage(false);
          }
        }
      } else if (pathname && pathname !== "/") {
        // Direct navigation to /simulator, /worklist, etc. enters workspace directly
        setShowLandingPage(false);
      }
    } catch {
      // Ignore sessionStorage errors in restricted frames
    }
  }, [pathname]);

  // Multi-Organization Sign-In & Landing Modal
  const [signInModalOpen, setSignInModalOpen] = useState<boolean>(false);
  const [signInTab, setSignInTab] = useState<"signin" | "create">("signin");
  const [selectedOrgForLogin, setSelectedOrgForLogin] =
    useState<string>("ORG-SEVAK");
  const [selectedUserForLogin, setSelectedUserForLogin] =
    useState<string>("USR-WRK-RINA");
  const [passcodeInput, setPasscodeInput] = useState<string>("SEVAK-2026");
  const [newOrgForm, setNewOrgForm] = useState({
    orgName: "",
    orgShortName: "",
    district: "Kamrup Rural, Assam",
    accessPasscode: "CARE-2026",
    teamSize: 15,
    leadWorkerName: "",
  });

  // Register New Patient Modal
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const [registerForm, setRegisterForm] = useState({
    initials: "P.K.",
    ageBand: "40–49",
    cohort: "hypertension" as CohortType,
    facilityId: "FAC-HEX-0",
    mobility: "independent" as MobilityStatus,
    language: "as" as SupportedLanguage,
    preferredChannel: "whatsapp" as "sms" | "whatsapp",
    phonePlain: "+919854088112",
    systolicBp: 154,
    diastolicBp: 96,
    heartRate: 92,
    bloodGlucose: 138,
    temperature: 37.2,
    spo2: 96,
    symptoms: [] as string[],
    daysOverdue: 2,
    consentActive: true,
  });

  // 5-Vital Check-In Modal
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
    async (
      roleOverride?: UserRole,
      userOverride?: string,
      orgOverride?: string,
      scopeOverride?: "assigned" | "organization"
    ) => {
      try {
        const r = roleOverride || activeRole;
        const u = userOverride || activeUserId;
        const o = orgOverride || activeOrganizationId;
        const s = scopeOverride || workerScope;
        const query = new URLSearchParams();
        if (r) query.set("role", r);
        if (u) query.set("userId", u);
        if (o) query.set("organizationId", o);
        if (s) query.set("workerScope", s);

        const res = await fetch(`/api/swasthya?${query.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setToast({
            type: "error",
            text: errData?.error || `Failed to load clinical registry (HTTP ${res.status}).`,
          });
          return;
        }
        const data: SystemSnapshot = await res.json();
        if (data && data.quickSortResult) {
          setSnapshot(data);

          if (data.signedInToken && !authToken) {
            setAuthToken(data.signedInToken);
          }
          if (data.activeOrganization) {
            setActiveOrganizationId(data.activeOrganization.id);
          }
          if (
            data.quickSortResult.combinedRanked?.length > 0 &&
            !selectedSimPatientId
          ) {
            setSelectedSimPatientId(
              data.quickSortResult.combinedRanked[0].patientId
            );
          }
        }
      } catch {
        setToast({ type: "error", text: "Failed to load clinical registry." });
      } finally {
        setLoading(false);
      }
    },
    [
      activeRole,
      activeUserId,
      activeOrganizationId,
      workerScope,
      authToken,
      selectedSimPatientId,
    ]
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
          organizationId: activeOrganizationId,
          workerScope,
          authToken,
          ...payload,
        }),
      });
      const data = await res.json();
      if (data.authToken) {
        setAuthToken(data.authToken);
      }
      if (data.snapshot) {
        setSnapshot(data.snapshot);
        if (data.snapshot.activeOrganization) {
          setActiveOrganizationId(data.snapshot.activeOrganization.id);
        }
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
    setActiveUserName(selectedUser.name);
    setActiveOrganizationId(selectedUser.organizationId || "ORG-SEVAK");
    void fetchSnapshot(
      selectedUser.role,
      selectedUser.id,
      selectedUser.organizationId || "ORG-SEVAK",
      workerScope
    );
  };

  const setWorkerScope = (scope: "assigned" | "organization") => {
    setWorkerScopeState(scope);
    void fetchSnapshot(activeRole, activeUserId, activeOrganizationId, scope);
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

  const openRegisterPatientModal = () => {
    if (snapshot && snapshot.facilities.length > 0) {
      const orgFac =
        snapshot.facilities.find(
          (f) => f.organizationId === activeOrganizationId
        ) || snapshot.facilities[0];
      setRegisterForm((prev) => ({
        ...prev,
        facilityId: orgFac.id,
      }));
    }
    setRegisterModalOpen(true);
  };

  const openSignInModal = () => {
    setSelectedOrgForLogin(activeOrganizationId);
    setSelectedUserForLogin(activeUserId);
    const org = snapshot?.organizations.find(
      (o) => o.id === activeOrganizationId
    );
    if (org) {
      setPasscodeInput(org.accessPasscode);
    }
    setSignInModalOpen(true);
  };

  const clearPatient = async (patientId: string, clearanceNote?: string) => {
    await executeAction({
      action: "CLEAR_PATIENT",
      patientId,
      clearanceNote,
    });
  };

  const restoreClearedPatient = async (patientId: string) => {
    await executeAction({
      action: "RESTORE_CLEARED_PATIENT",
      patientId,
    });
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
      href: "/post-op",
      label: "Post-Op Telemetry",
      icon: Waves,
      count: snapshot?.postOpReports?.length,
      alertRed: true,
    },
    {
      href: "/super-admin",
      label: "Super Admin",
      icon: ShieldAlert,
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
  const orgUsers =
    snapshot?.users.filter(
      (u) => u.organizationId === activeOrganizationId
    ) || [];
  const currentStaffObj = snapshot?.users.find((u) => u.id === activeUserId);

  const handleLandingSignIn = async (params: {
    organizationId: string;
    userId: string;
    accessPasscode: string;
  }) => {
    const res = await executeAction({
      action: "SIGN_IN_ORGANIZATION",
      targetOrganizationId: params.organizationId,
      targetUserId: params.userId,
      accessPasscode: params.accessPasscode,
    });
    const payload = res.data as Record<string, unknown> | null;
    if (!res.ok) {
      return {
        ok: false,
        error:
          (payload?.error as string) ||
          "Invalid organization credentials or account locked.",
        locked: Boolean(payload?.locked),
        remainingAttempts: payload?.remainingAttempts as number | undefined,
      };
    }

    const sessionInfo = payload?.session as
      | {
          userId: string;
          displayName: string;
          role: UserRole;
          orgId: string;
        }
      | undefined;
    const nextOrgId = sessionInfo?.orgId || params.organizationId;
    const nextUserId = sessionInfo?.userId || params.userId;
    const matchedUser = snapshot?.users.find((u) => u.id === nextUserId);
    const nextRole = sessionInfo?.role || matchedUser?.role || "worker";
    const nextUserName =
      sessionInfo?.displayName || matchedUser?.name || params.userId;
    const nextToken = (payload?.authToken as string) || authToken;

    setActiveOrganizationId(nextOrgId);
    setActiveUserId(nextUserId);
    setActiveUserName(nextUserName);
    setActiveRole(nextRole);
    setIsAuthenticated(true);
    setShowLandingPage(false);

    try {
      sessionStorage.setItem(
        "swasthya_session_v25",
        JSON.stringify({
          organizationId: nextOrgId,
          userId: nextUserId,
          userName: nextUserName,
          role: nextRole,
          authToken: nextToken,
          enteredWorkspace: true,
        })
      );
    } catch {
      // Ignore storage error
    }

    return { ok: true };
  };

  const handleLandingRegisterOrg = async (params: {
    orgName: string;
    orgShortName: string;
    district: string;
    accessPasscode: string;
    teamSize: number;
    leadWorkerName: string;
  }) => {
    const res = await executeAction({
      action: "REGISTER_ORGANIZATION",
      ...params,
    });
    const payload = res.data as Record<string, unknown> | null;
    if (!res.ok) {
      return {
        ok: false,
        error: (payload?.error as string) || "Could not create organization.",
      };
    }
    const snapData = payload?.snapshot as SystemSnapshot | undefined;
    if (snapData?.activeOrganization) {
      setActiveOrganizationId(snapData.activeOrganization.id);
      const firstWrk = snapData.users.find(
        (u) => u.organizationId === snapData.activeOrganization.id
      );
      if (firstWrk) {
        setActiveRole(firstWrk.role);
        setActiveUserId(firstWrk.id);
        setActiveUserName(firstWrk.name);
      }
    }
    setIsAuthenticated(true);
    setShowLandingPage(false);
    return { ok: true };
  };

  const handleSignOutToLanding = () => {
    setIsAuthenticated(false);
    setShowLandingPage(true);
    try {
      sessionStorage.removeItem("swasthya_session_v25");
    } catch {
      // Ignore
    }
  };

  if (showLandingPage) {
    return (
      <SwasthyaContext.Provider
        value={{
          snapshot,
          loading,
          busyAction,
          activeRole,
          activeUserId,
          activeUserName,
          activeOrganizationId,
          workerScope,
          setWorkerScope,
          lang,
          setLang,
          handleUserSwitch,
          executeAction,
          openCheckinModal,
          openRegisterPatientModal,
          openSignInModal,
          clearPatient,
          restoreClearedPatient,
          openPhoneDrawer,
        }}
      >
        <SwasthyaLandingPage
          organizations={snapshot?.organizations || []}
          users={snapshot?.allUsers || snapshot?.users || []}
          activeSessions={snapshot?.activeSessions || []}
          selectedLanguage={lang}
          onSelectLanguage={setLang}
          isAuthenticated={isAuthenticated}
          currentOrganization={snapshot?.activeOrganization}
          currentUser={currentStaffObj}
          onSignInSuccess={handleLandingSignIn}
          onRegisterOrganization={handleLandingRegisterOrg}
          onEnterWorkspace={() => {
            setShowLandingPage(false);
            try {
              sessionStorage.setItem(
                "swasthya_session_v25",
                JSON.stringify({
                  organizationId: activeOrganizationId,
                  userId: activeUserId,
                  userName: activeUserName,
                  role: activeRole,
                  authToken,
                  enteredWorkspace: true,
                })
              );
            } catch {
              // Ignore
            }
          }}
          onSignOut={handleSignOutToLanding}
        />
      </SwasthyaContext.Provider>
    );
  }

  return (
    <SwasthyaContext.Provider
      value={{
        snapshot,
        loading,
        busyAction,
        activeRole,
        activeUserId,
        activeUserName,
        activeOrganizationId,
        workerScope,
        setWorkerScope,
        lang,
        setLang,
        handleUserSwitch,
        executeAction,
        openCheckinModal,
        openRegisterPatientModal,
        openSignInModal,
        clearPatient,
        restoreClearedPatient,
        openPhoneDrawer,
      }}
    >
      <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
        {/* ================================================================= */}
        {/* SINGLE ULTRA-CLEAN 21ST.DEV FLOATING HEADER BAR                   */}
        {/* ================================================================= */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2.5">
            {/* Left: Crisp Medical Brand + Active Multi-Tenant Organization Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/"
                className="min-h-[44px] flex items-center gap-2 shrink-0 whitespace-nowrap"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Cross className="w-4 h-4" />
                </div>
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Swasthya<span className="text-emerald-700">Sense</span>
                </span>
              </Link>

              {/* Landing Page Toggle Button */}
              <button
                type="button"
                onClick={() => setShowLandingPage(true)}
                title="View Product Landing Page & 3D Patient Journey"
                className="min-h-[38px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
              >
                <span>Landing Page</span>
              </button>

              {/* Multi-Tenant Organization Sign-In Badge */}
              <button
                type="button"
                onClick={openSignInModal}
                title="Switch Organization or Sign In with Organization Credentials"
                className="min-h-[38px] px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {snapshot?.activeOrganization?.shortName ?? "Sevak Health"}
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono">
                  {currentStaffObj?.title || `${snapshot?.activeOrganization?.teamSize ?? 15} Staff`}
                </span>
              </button>
            </div>

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
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
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
                            ? "bg-rose-600 text-white"
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

            {/* Right Controls: + Register Patient, Org User Selector, Language, WhatsApp Sim */}
            <div className="flex items-center gap-2 shrink-0">
              {/* + Register Patient Button */}
              <button
                type="button"
                onClick={openRegisterPatientModal}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">+ Register Patient</span>
                <span className="sm:hidden">+ Add</span>
              </button>

              {/* Active Organization Staff Switcher (15 Frontline Workers + Clinician + Supervisor) */}
              {orgUsers.length > 0 && (
                <div className="hidden lg:flex items-center bg-slate-100 rounded-xl px-2.5 min-h-[40px] border border-slate-200/70">
                  <User className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                  <select
                    aria-label="Select Active Clinical User in Organization"
                    value={activeUserId}
                    onChange={(e) => handleUserSwitch(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[155px] truncate"
                  >
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Language Pill (md+) */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-2 min-h-[40px] border border-slate-200/70">
                <Globe className="w-4 h-4 text-emerald-600 mr-1 shrink-0" />
                <select
                  aria-label="Select Language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
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
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">SMS/WA</span>
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
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Cross className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      Swasthya<span className="text-emerald-700">Sense</span>
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

                {/* Mobile Organization Sign-In & Register Patient Triggers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openSignInModal();
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Org Sign-In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openRegisterPatientModal();
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Register Pt</span>
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
                  {orgUsers.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                        Staff Member ({snapshot?.activeOrganization?.shortName})
                      </label>
                      <select
                        value={activeUserId}
                        onChange={(e) => handleUserSwitch(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-base font-semibold text-slate-900"
                      >
                        {orgUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.toUpperCase()})
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
                • Tenant: {snapshot?.activeOrganization?.shortName} (
                {snapshot?.stats.organizationPatients ?? 0} Org Pts /{" "}
                {snapshot?.stats.totalPatients ?? 0} Total)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Sessions ({snapshot?.activeSessions?.length ?? 3} Active Tenants)
              </span>
              <span className="text-emerald-700 font-medium flex items-center gap-1 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4" />
                SHA-256 Chain Verified ({snapshot?.auditIntegrity.totalEntries ?? 0})
              </span>
              <button
                onClick={() => executeAction({ action: "RESET_DEMO" })}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1 text-xs cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset State
              </button>
              <button
                onClick={handleSignOutToLanding}
                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold flex items-center gap-1 text-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </footer>

        {/* ================================================================= */}
        {/* MODAL 1: MULTI-ORGANIZATION SIGN-IN & LANDING PORTAL              */}
        {/* ================================================================= */}
        {signInModalOpen && snapshot && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="w-full h-full sm:h-auto sm:max-w-2xl bg-white sm:rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase">
                      Strict Multi-Tenant Organization Isolation
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      Organization Sign-In & 15-Worker Team Portal
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSignInModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-sm text-slate-800 space-y-1.5">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  Zero Cross-Organization Data Leakage (PostgreSQL RLS + API Gate)
                </p>
                <p className="text-slate-700 leading-relaxed">
                  When you sign into an organization (for example,{" "}
                  <strong>Sevak Health Foundation</strong> with its{" "}
                  <strong>15-person frontline worker team</strong>), you only
                  receive and manage patients registered under{" "}
                  <strong>Sevak</strong>. Patients registered under{" "}
                  <strong>Kamrup Rural NHM</strong> or{" "}
                  <strong>Arogya Trust</strong> are strictly isolated (`403`
                  blocked).
                </p>
              </div>

              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setSignInTab("signin")}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold ${
                    signInTab === "signin"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Sign Into Existing Organization ({snapshot.organizations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSignInTab("create")}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold ${
                    signInTab === "create"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  + Onboard New Organization
                </button>
              </div>

              {signInTab === "signin" ? (
                <div className="space-y-4">
                  {/* 3 Simultaneous Demo Accounts Quick-Autofill Panel */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Simultaneous Demo Accounts (3 Active Tenants)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold">
                        DEMO ONLY
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {LANDING_DEMO_PRESETS.map((preset) => (
                        <button
                          key={preset.userId}
                          type="button"
                          onClick={() => {
                            setSelectedOrgForLogin(preset.organizationId);
                            setSelectedUserForLogin(preset.userId);
                            setPasscodeInput(preset.passwordPlain);
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            selectedOrgForLogin === preset.organizationId &&
                            selectedUserForLogin === preset.userId
                              ? "bg-red-50 border-red-400 ring-2 ring-red-500/20"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-mono font-bold text-red-600">
                            {preset.userId}
                          </div>
                          <div className="font-semibold text-slate-800 text-[11px] truncate">
                            {preset.organizationId} • {preset.personRole}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium truncate">
                            {preset.roleBadge}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      1. Select Healthcare Organization
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {snapshot.organizations.map((org) => {
                        const selected = selectedOrgForLogin === org.id;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => {
                              setSelectedOrgForLogin(org.id);
                              setPasscodeInput(org.accessPasscode);
                              const firstUser = snapshot.users.find(
                                (u) => u.organizationId === org.id
                              );
                              if (firstUser) {
                                setSelectedUserForLogin(firstUser.id);
                              }
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              selected
                                ? "bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/20"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-base text-slate-900">
                                {org.name} ({org.id})
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                {org.teamSize} Frontline Workers
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {org.description}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs font-mono text-slate-500">
                              <span>District: {org.district}</span>
                              <span>•</span>
                              <span>Demo Passcode: {org.accessPasscode}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        2. Select Team Member / Role
                      </label>
                      <select
                        value={selectedUserForLogin}
                        onChange={(e) => setSelectedUserForLogin(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                      >
                        {snapshot.users
                          .filter((u) => u.organizationId === selectedOrgForLogin)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} — {u.role.toUpperCase()}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        3. Organization Credentials Passcode
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={passcodeInput}
                          onChange={(e) => setPasscodeInput(e.target.value)}
                          className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={async () => {
                        // Test cross-tenant isolation by attempting to access a patient from another organization
                        const otherOrgPatientId =
                          activeOrganizationId === "ORG-SEVAK"
                            ? "PT-SYN-285"
                            : "PT-ONC-401";
                        await executeAction({
                          action: "LOG_CHECKIN",
                          patientId: otherOrgPatientId,
                          systolicBp: 140,
                          diastolicBp: 90,
                        });
                        setSignInModalOpen(false);
                      }}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Test Cross-Org Isolation (403 Block)</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setSignInModalOpen(false)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={async () => {
                          const targetUser = snapshot.users.find(
                            (u) => u.id === selectedUserForLogin
                          );
                          const res = await executeAction({
                            action: "SIGN_IN_ORGANIZATION",
                            targetOrganizationId: selectedOrgForLogin,
                            targetUserId: selectedUserForLogin,
                            accessPasscode: passcodeInput,
                          });
                          if (res.ok && targetUser) {
                            setActiveOrganizationId(selectedOrgForLogin);
                            setActiveRole(targetUser.role);
                            setActiveUserId(targetUser.id);
                            setActiveUserName(targetUser.name);
                            setSignInModalOpen(false);
                          }
                        }}
                        className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Sign In to Organization</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Organization Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Brahmaputra Rural Care NGO"
                        value={newOrgForm.orgName}
                        onChange={(e) =>
                          setNewOrgForm({
                            ...newOrgForm,
                            orgName: e.target.value,
                          })
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Short Code / Badge Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Brahmaputra NGO"
                        value={newOrgForm.orgShortName}
                        onChange={(e) =>
                          setNewOrgForm({
                            ...newOrgForm,
                            orgShortName: e.target.value,
                          })
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Lead Frontline Worker Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Binita Kalita"
                        value={newOrgForm.leadWorkerName}
                        onChange={(e) =>
                          setNewOrgForm({
                            ...newOrgForm,
                            leadWorkerName: e.target.value,
                          })
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Organization Access Passcode
                      </label>
                      <input
                        type="text"
                        value={newOrgForm.accessPasscode}
                        onChange={(e) =>
                          setNewOrgForm({
                            ...newOrgForm,
                            accessPasscode: e.target.value,
                          })
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSignInModalOpen(false)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={async () => {
                        const res = await executeAction({
                          action: "REGISTER_ORGANIZATION",
                          ...newOrgForm,
                        });
                        if (res.ok) {
                          setSignInModalOpen(false);
                        }
                      }}
                      className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                    >
                      Create & Sign Into Organization
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 2: + REGISTER NEW PATIENT INTO ACTIVE ORGANIZATION          */}
        {/* ================================================================= */}
        {registerModalOpen && snapshot && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="w-full h-full sm:h-auto sm:max-w-2xl bg-white sm:rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase">
                      Tenant Registry: {snapshot.activeOrganization.name}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      Register New High-Risk Patient
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setRegisterModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preset Buttons for Fast Demo */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase mr-1">
                  Quick Clinical Presets:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRegisterForm({
                      ...registerForm,
                      initials: "M.B. (Severe Preeclampsia)",
                      ageBand: "20–29",
                      cohort: "pregnancy",
                      mobility: "independent",
                      systolicBp: 164,
                      diastolicBp: 112,
                      heartRate: 114,
                      bloodGlucose: 98,
                      temperature: 37.2,
                      spo2: 96,
                      symptoms: ["blurred_vision_headache"],
                      daysOverdue: 4,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                >
                  Load High-Risk Pregnancy Preset (Score ≥ 100)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRegisterForm({
                      ...registerForm,
                      initials: "R.D. (Routine HTN)",
                      ageBand: "50–59",
                      cohort: "hypertension",
                      mobility: "independent",
                      systolicBp: 144,
                      diastolicBp: 92,
                      heartRate: 80,
                      bloodGlucose: 118,
                      temperature: 36.8,
                      spo2: 98,
                      symptoms: [],
                      daysOverdue: 3,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Load Routine Follow-Up Preset (Score &lt; 100)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Initials / Tag
                  </label>
                  <input
                    type="text"
                    value={registerForm.initials}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        initials: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age Band
                  </label>
                  <select
                    value={registerForm.ageBand}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        ageBand: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                  >
                    <option value="20–29">20–29 yrs</option>
                    <option value="30–39">30–39 yrs</option>
                    <option value="40–49">40–49 yrs</option>
                    <option value="50–59">50–59 yrs</option>
                    <option value="60–69">60–69 yrs</option>
                    <option value="70+">70+ yrs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    High-Risk Cohort
                  </label>
                  <select
                    value={registerForm.cohort}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        cohort: e.target.value as CohortType,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                  >
                    <option value="hypertension">Hypertension</option>
                    <option value="pregnancy">Maternal / Pregnancy (MEOWS)</option>
                    <option value="diabetes">Diabetes</option>
                    <option value="post_illness">
                      Post-Illness / Oncology Recovery
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Village Facility (Hexagon)
                  </label>
                  <select
                    value={registerForm.facilityId}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        facilityId: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                  >
                    {snapshot.facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.hexagonId} — {f.village}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobility Status
                  </label>
                  <select
                    value={registerForm.mobility}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        mobility: e.target.value as MobilityStatus,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900"
                  >
                    <option value="independent">Ambulatory (Can Walk)</option>
                    <option value="homebound">
                      Homebound (Needs 108 Transport)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone (AES-256-GCM Encrypted)
                  </label>
                  <input
                    type="text"
                    value={registerForm.phonePlain}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        phonePlain: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* 5-Category Vitals Entry */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  Initial 5-Category Clinical Vitals (Evaluated by QuickSort Engine)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={registerForm.systolicBp}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          systolicBp: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1 rounded-lg bg-white border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Diastolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={registerForm.diastolicBp}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          diastolicBp: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1 rounded-lg bg-white border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={registerForm.heartRate}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          heartRate: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1 rounded-lg bg-white border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Glucose (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={registerForm.bloodGlucose}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          bloodGlucose: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1 rounded-lg bg-white border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={registerForm.temperature}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          temperature: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1 rounded-lg bg-white border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      SpO₂ (%)
                    </label>
                    <input
                      type="number"
                      value={registerForm.spo2}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          spo2: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1 rounded-lg bg-white border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={async () => {
                    const res = await executeAction({
                      action: "REGISTER_PATIENT",
                      ...registerForm,
                    });
                    if (res.ok) {
                      setRegisterModalOpen(false);
                    }
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Patient & Run QuickSort</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 3: 5-VITAL CHECK-IN (DYNAMICALLY POPULATED FROM API CATALOG)*/}
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
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Simulated + Direct Link Ready
                        </span>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(m.body)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Open in Real WhatsApp (wa.me) ↗
                        </a>
                      </div>
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
