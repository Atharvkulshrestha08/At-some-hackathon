"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ShieldCheck,
  Lock,
  Users,
  Building2,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Ambulance,
  Radio,
  Sparkles,
  KeyRound,
  UserPlus,
  Layers,
  ChevronRight,
  Menu,
  X,
  PhoneCall,
  Terminal,
  RefreshCw,
  LogOut,
  Play,
  Pause,
  Stethoscope,
  TrendingUp,
  Cpu,
  Clock,
  Compass,
  Check,
  ChevronDown,
} from "lucide-react";
import type { SupportedLanguage } from "@/lib/i18n";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { OrganizationRecord, UserRecord, ActiveSessionRecord } from "@/lib/db";

export interface DemoAccountPreset {
  personRole: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
  passwordPlain: string;
  roleBadge: string;
  facilityHex: string;
  avatarText: string;
  avatarBg: string;
  badgeBg: string;
}

export const LANDING_DEMO_PRESETS: DemoAccountPreset[] = [
  {
    personRole: "Super Admin (Global Master)",
    organizationId: "ORG-GLOBAL",
    organizationName: "Global Health Operations Command",
    userId: "super.atharv",
    userName: "Atharv (Super Admin)",
    passwordPlain: "Super@Admin#2026",
    roleBadge: "Super Admin • Platform Director",
    facilityHex: "GLOBAL",
    avatarText: "SA",
    avatarBg: "bg-purple-600 text-white",
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    personRole: "Clinic Doctor",
    organizationId: "ORG-BOKO",
    organizationName: "Boko Central PHC Medical Block",
    userId: "doc.boko01",
    userName: "Dr. Pranabjyoti Bora",
    passwordPlain: "Boko@Demo#101",
    roleBadge: "Clinician • HEX-0 Boko Central PHC",
    facilityHex: "HEX-0",
    avatarText: "DR",
    avatarBg: "bg-red-600 text-white",
    badgeBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  {
    personRole: "Frontline ASHA Worker",
    organizationId: "ORG-SEVAK",
    organizationName: "Sevak Health Foundation",
    userId: "asha.sevak07",
    userName: "Rina Devi",
    passwordPlain: "Sevak@Demo#207",
    roleBadge: "ASHA Worker • Sevak 15-Worker Team",
    facilityHex: "HEX-0",
    avatarText: "RD",
    avatarBg: "bg-emerald-600 text-white",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    personRole: "Local Clinic Nurse",
    organizationId: "ORG-CHHAY",
    organizationName: "Chhaygaon North Sub-Centre Network",
    userId: "anm.chhay03",
    userName: "Sister Dipali Kalita",
    passwordPlain: "Chhay@Demo#303",
    roleBadge: "ANM Nurse • HEX-1 Chhaygaon North",
    facilityHex: "HEX-1",
    avatarText: "DK",
    avatarBg: "bg-blue-600 text-white",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
];

interface LandingTranslations {
  badge: string;
  heroTitle1: string;
  heroTitleHighlight: string;
  heroTitle2: string;
  heroSubtitle: string;
  ctaSignIn: string;
  ctaOnboard: string;
  demoChipHeader: string;
  navHowItWorks: string;
  navJourney3D: string;
  navHexArchitecture: string;
  navSecurity: string;
  navLaunch: string;
  problemHeading: string;
  problemSub: string;
}

const LANDING_I18N: Record<SupportedLanguage, LandingTranslations> = {
  en: {
    badge: "CLINICAL DECISION SUPPORT & LOAD-BALANCING MESH",
    heroTitle1: "Catch the silent clinical turn,",
    heroTitleHighlight: "before it becomes an emergency.",
    heroTitle2: "",
    heroSubtitle:
      "SwasthyaSense detects multi-visit silent deterioration across maternal preeclampsia, hypertension, diabetes, and oncology recovery. It partitions queues in ~242µs while keeping 100% of village walk-in clinic capacity untouched.",
    ctaSignIn: "Launch Organization Portal",
    ctaOnboard: "+ Onboard New Healthcare Org",
    demoChipHeader: "Instant 1-Click Demo Accounts (Simultaneous Multi-Tenant Access)",
    navHowItWorks: "How It Works",
    navJourney3D: "3D Patient Journey",
    navHexArchitecture: "5-Hexagon Mesh",
    navSecurity: "Security & DPDP",
    navLaunch: "Launch Portal",
    problemHeading: "Why Rural Follow-Up Care Breaks Down",
    problemSub: "Three systemic failures in primary healthcare delivery that SwasthyaSense fixes at the root.",
  },
  as: {
    badge: "ক্লিনিকেল আগতীয়া সতৰ্কীকৰণ আৰু লোড-ভাৰসাম্য মঞ্চ",
    heroTitle1: "ৰোগীৰ নীৰৱ শাৰীৰিক অৱনতি চিনাক্ত কৰক,",
    heroTitleHighlight: "জৰুৰীকালীন সংকট হোৱাৰ আগতেই।",
    heroTitle2: "",
    heroSubtitle:
      "স্বাস্থ্য-সেন্সে গৰ্ভাৱস্থাৰ এক্লাম্পচিয়া, উচ্চ ৰক্তচাপ, মধুমেহ আৰু কেন্সাৰৰ পিছৰ নীৰৱ বিপদ ধৰা পেলায়—~২৪২ মাইক্ৰ’ছেকেণ্ডত কিউইক-চৰ্ট বিভাজন কৰি গাঁৱৰ সাধাৰণ ৰোগীৰ ১০টা আসন ১০০% সুৰক্ষিত ৰাখে।",
    ctaSignIn: "সংগঠন পৰ্টেল খোলক",
    ctaOnboard: "+ নতুন স্বাস্থ্য সংগঠন পঞ্জীয়ন",
    demoChipHeader: "১-ক্লিকত ডেম' একাউণ্টত প্ৰৱেশ কৰক (তিনিটা সুকীয়া সংগঠন)",
    navHowItWorks: "কেনেকৈ কাম কৰে",
    navJourney3D: "3D ৰোগীৰ যাত্ৰা",
    navHexArchitecture: "৫-হেক্সাগন নেটৱৰ্ক",
    navSecurity: "সুৰক্ষা আৰু DPDP",
    navLaunch: "পৰ্টেল খোলক",
    problemHeading: "গ্ৰাম্য অনুসৰণ চিকিৎসাত কিয় ব্যৱধান আহে",
    problemSub: "কাগজৰ পঞ্জী আৰু সমন্বয়হীন ব্যৱস্থাৰ তিনিটা গভীৰ সমস্যা যিটো স্বাস্থ্য-সেন্সে সমাধান কৰে।",
  },
  bn: {
    badge: "ক্লিনিক্যাল আর্লি-ওয়ার্নিং ও লোড-ব্যালেন্সিং মেশ",
    heroTitle1: "রোগীর নীরব অবনতি শনাক্ত করুন,",
    heroTitleHighlight: "জরুরি সংকট তৈরি হওয়ার আগেই।",
    heroTitle2: "",
    heroSubtitle:
      "স্বাস্থ্যসেন্স উচ্চ-ঝুঁকির গর্ভাবস্থা, রক্তচাপ ও ডায়াবেটিস রোগীদের নীরব অবনতি শনাক্ত করে এবং ~২৪২µs-এ কুইক-সর্ট বিভাজন করে গ্রামীণ সাধারণ রোগীদের ১০টি স্লট ১০০% সুরক্ষিত রাখে।",
    ctaSignIn: "সংস্থা পোর্টাল খুলুন",
    ctaOnboard: "+ নতুন স্বাস্থ্য সংস্থা যুক্ত করুন",
    demoChipHeader: "১-ক্লিকে ডেমো অ্যাকাউন্টে প্রবেশ করুন",
    navHowItWorks: "কীভাবে কাজ করে",
    navJourney3D: "3D রোগীর যাত্রা",
    navHexArchitecture: "৫-হেক্সাগন আর্কিটেকচার",
    navSecurity: "নিরাপত্তা ও DPDP",
    navLaunch: "পোর্টাল খুলুন",
    problemHeading: "গ্রামীণ ফলো-আপ চিকিৎসা কেন ভেঙে পড়ে",
    problemSub: "কাগজের খাতা এবং সমন্বয়ের অভাবের তিনটি মূল সংকট।",
  },
  hi: {
    badge: "क्लिनिकल अर्ली-वॉर्निंग और लोड-बैलेंसिंग मेश",
    heroTitle1: "मरीज़ की शांत गिरावट को पहचानें,",
    heroTitleHighlight: "इससे पहले कि वह आपातकाल बन जाए।",
    heroTitle2: "",
    heroSubtitle:
      "स्वास्थ्य-सेंस उच्च जोखिम गर्भावस्था, रक्तचाप, मधुमेह और ऑन्कोलॉजी रिकवरी में शांत गिरावट को पकड़ता है—~242µs में QuickSort विभाजन कर गाँव के 10 वॉक-इन स्लॉट 100% सुरक्षित रखता है।",
    ctaSignIn: "संगठन पोर्टल खोलें",
    ctaOnboard: "+ नया स्वास्थ्य संगठन जोड़ें",
    demoChipHeader: "1-क्लिक डेमो खाते (एक साथ तीन स्वतंत्र टेनेंट)",
    navHowItWorks: "यह कैसे काम करता है",
    navJourney3D: "3D मरीज़ यात्रा",
    navHexArchitecture: "5-हेक्सागोन नेटवर्क",
    navSecurity: "सुरक्षा और DPDP",
    navLaunch: "पोर्टल खोलें",
    problemHeading: "ग्रामीण फॉलो-अप देखभाल क्यों विफल होती है",
    problemSub: "कागज़ी रजिस्टरों और अनियमित भीड़ के तीन गंभीर कारण जिन्हें हम हल करते हैं।",
  },
  ta: {
    badge: "மருத்துவ முன்னெச்சரிக்கை & சுமை சமநிலை நெட்வொர்க்",
    heroTitle1: "நோயாளியின் தொடர் சரிவைக் கண்டறியுங்கள்,",
    heroTitleHighlight: "அது அவசரநிலையாக மாறுவதற்கு முன்பு.",
    heroTitle2: "",
    heroSubtitle:
      "SwasthyaSense உயர்-ஆபத்து கர்ப்பம், இரத்த அழுத்தம் மற்றும் நீரிழிவு நோயாளிகளில் அமைதியான சரிவைக் கண்டறிந்து ~242µs-இல் QuickSort மூலம் வரிசையைப் பிரிக்கிறது.",
    ctaSignIn: "போர்ட்டலைத் தொடங்கவும்",
    ctaOnboard: "+ புதிய சுகாதார நிறுவனம்",
    demoChipHeader: "1-கிளிக் டெமோ கணக்குகள்",
    navHowItWorks: "செயல்படும் விதம்",
    navJourney3D: "3D நோயாளி பயணம்",
    navHexArchitecture: "5-அறுகோண கட்டமைப்பு",
    navSecurity: "பாதுகாப்பு & DPDP",
    navLaunch: "போர்ட்டல்",
    problemHeading: "கிராமப்புற தொடர் சிகிச்சை ஏன் தடைபடுகிறது",
    problemSub: "காகிதப் பதிவேடுகள் மற்றும் கட்டுப்பாடற்ற வருகைகளின் 3 சவால்கள்.",
  },
  te: {
    badge: "క్లినికల్ ఎర్లీ-వార్నింగ్ & లోడ్-బ్యాలెన్సింగ్ మెష్",
    heroTitle1: "రోగి నిశ్శబ్ద క్షీణతను ముందే గుర్తించండి,",
    heroTitleHighlight: "అది అత్యవసర పరిస్థితిగా మారకముందే.",
    heroTitle2: "",
    heroSubtitle:
      "SwasthyaSense అధిక-ప్రమాద గర్భం, రక్తపోటు మరియు మధుమేహ రోగులలో నిశ్శబ్ద క్షీణతను గుర్తించి ~242µsలో QuickSort ద్వారా క్యూలను విభజిస్తుంది.",
    ctaSignIn: "పోర్టల్ ప్రారంభించండి",
    ctaOnboard: "+ కొత్త ఆరోగ్య సంస్థ",
    demoChipHeader: "1-క్లిక్ డెమో ఖాతాలు",
    navHowItWorks: "ఇది ఎలా పనిచేస్తుంది",
    navJourney3D: "3D పేషెంట్ జర్నీ",
    navHexArchitecture: "5-హెక్సాగాన్ ఆర్కిటెక్చర్",
    navSecurity: "భద్రత & DPDP",
    navLaunch: "పోర్టల్ తెరవండి",
    problemHeading: "గ్రామీణ ఫాలో-అప్ కేర్ ఎందుకు విఫలమవుతుంది",
    problemSub: "కాగితపు రికార్డులు మరియు అనుకోని రద్దీ వల్ల వచ్చే 3 సమస్యలు.",
  },
  mr: {
    badge: "क्लिनिकल अर्ली-वॉर्निंग आणि लोड-बॅलन्सिंग मेश",
    heroTitle1: "रुग्णाच्या शांतपणे खालावणाऱ्या प्रकृतीला ओळखा,",
    heroTitleHighlight: "आणीबाणीची परिस्थिती उद्भवण्यापूर्वी.",
    heroTitle2: "",
    heroSubtitle:
      "SwasthyaSense उच्च-जोखीम गर्भधारणा, रक्तदाब आणि मधुमेह रुग्णांमधील शांत खालावणारी प्रकृती ओळखते आणि ~242µs मध्ये QuickSort द्वारे रांगांचे विभाजन करते.",
    ctaSignIn: "संस्था पोर्टल सुरू करा",
    ctaOnboard: "+ नवीन आरोग्य संस्था",
    demoChipHeader: "1-क्लिक डेमो खाती",
    navHowItWorks: "हे कसे कार्य करते",
    navJourney3D: "3D रुग्ण प्रवास",
    navHexArchitecture: "5-हेक्सागोन नेटवर्क",
    navSecurity: "सुरक्षा आणि DPDP",
    navLaunch: "पोर्टल उघडा",
    problemHeading: "ग्रामीण फॉलो-अप आरोग्यसेवा का खंडित होते",
    problemSub: "कागदी नोंदी आणि अनियंत्रित गर्दीच्या ३ मुख्य समस्या.",
  },
};

export interface SwasthyaLandingPageProps {
  organizations: OrganizationRecord[];
  users: UserRecord[];
  activeSessions: ActiveSessionRecord[];
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  isAuthenticated: boolean;
  currentOrganization?: OrganizationRecord;
  currentUser?: UserRecord;
  onSignInSuccess: (params: {
    organizationId: string;
    userId: string;
    accessPasscode: string;
  }) => Promise<{ ok: boolean; error?: string; locked?: boolean; remainingAttempts?: number }>;
  onRegisterOrganization: (params: {
    orgName: string;
    orgShortName: string;
    district: string;
    accessPasscode: string;
    teamSize: number;
    leadWorkerName: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onEnterWorkspace: () => void;
  onSignOut: () => void;
}

export default function SwasthyaLandingPage({
  organizations,
  users,
  activeSessions,
  selectedLanguage,
  onSelectLanguage,
  isAuthenticated,
  currentOrganization,
  currentUser,
  onSignInSuccess,
  onRegisterOrganization,
  onEnterWorkspace,
  onSignOut,
}: SwasthyaLandingPageProps) {
  const t = LANDING_I18N[selectedLanguage] || LANDING_I18N.en;

  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stepper & 3D Interactive Beats
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [journeyBeat, setJourneyBeat] = useState<number>(0);
  const [autoPlayJourney, setAutoPlayJourney] = useState<boolean>(true);
  const journeySectionRef = useRef<HTMLDivElement | null>(null);

  // Auth Modal State
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"signin" | "onboard">("signin");
  const [orgIdInput, setOrgIdInput] = useState<string>("ORG-BOKO");
  const [userIdInput, setUserIdInput] = useState<string>("doc.boko01");
  const [passwordInput, setPasswordInput] = useState<string>("Boko@Demo#101");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLocked, setAuthLocked] = useState<boolean>(false);
  const [authSuccessBanner, setAuthSuccessBanner] = useState<string | null>(null);

  // New Organization Onboarding Form
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgShort, setNewOrgShort] = useState("");
  const [newOrgDistrict, setNewOrgDistrict] = useState("Kamrup Rural, Assam");
  const [newOrgPasscode, setNewOrgPasscode] = useState("CARE-2026");
  const [newOrgTeamSize, setNewOrgTeamSize] = useState(15);
  const [newOrgLead, setNewOrgLead] = useState("Mitali Das");

  // Interactive Mini-Simulators on Landing Page
  const [simFollowUpUsed, setSimFollowUpUsed] = useState<number>(14);
  const [simCriticalUsed, setSimCriticalUsed] = useState<number>(4);
  const [simVitals, setSimVitals] = useState({
    bpSys: 164,
    bpDia: 104,
    glucose: 142,
    heartRate: 98,
    spo2: 96,
  });
  const [hexOverflowState, setHexOverflowState] = useState<
    "idle" | "broadcast" | "accepted_hex2" | "ambulance_hex4"
  >("idle");
  const [previewSmsReply, setPreviewSmsReply] = useState<"1" | "2" | "STOP">("1");

  // Auto-advance 3D Journey Beat
  useEffect(() => {
    if (!autoPlayJourney) return;
    const timer = setInterval(() => {
      setJourneyBeat((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, [autoPlayJourney]);

  // Direct 1-Click Instant Demo Login
  const handleDirectDemoLogin = async (preset: DemoAccountPreset) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await onSignInSuccess({
        organizationId: preset.organizationId,
        userId: preset.userId,
        accessPasscode: preset.passwordPlain,
      });
      if (!res.ok) {
        setAuthError(res.error || "Authentication failed");
        setLoginModalOpen(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessBanner(null);

    if (!orgIdInput.trim() || !userIdInput.trim() || !passwordInput.trim()) {
      setAuthError("Please provide Organization ID, Staff User ID, and Password.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await onSignInSuccess({
        organizationId: orgIdInput.trim(),
        userId: userIdInput.trim(),
        accessPasscode: passwordInput,
      });
      if (!res.ok) {
        setAuthError(res.error || "Invalid credentials.");
        if (res.locked) setAuthLocked(true);
      } else {
        setLoginModalOpen(false);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!newOrgName.trim()) {
      setAuthError("Please enter an Organization Name.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await onRegisterOrganization({
        orgName: newOrgName.trim(),
        orgShortName: newOrgShort.trim() || newOrgName.trim().split(" ")[0],
        district: newOrgDistrict.trim(),
        accessPasscode: newOrgPasscode.trim(),
        teamSize: newOrgTeamSize,
        leadWorkerName: newOrgLead.trim(),
      });
      if (!res.ok) {
        setAuthError(res.error || "Could not onboard organization.");
      } else {
        setLoginModalOpen(false);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const PIPELINE_STEPS = [
    {
      step: "01",
      tag: "5-Vital Vector",
      title: "Bidirectional Field Check-In",
      summary: "Evaluates BP, Heart Rate, Glucose, Temp/SpO₂, and Danger Symptoms in both High ↑ and Low ↓ directions.",
      detail:
        "ASHA & ANM workers record vitals in rural homes. The engine flags both hypertensive urgency (≥160/110) and hypotensive shock (<90/60), hyperglycaemia (>240) and hypoglycaemia (<70), and correlates 3-visit rising systolic trajectories (+28 pts).",
      icon: Activity,
      color: "text-red-600 dark:text-red-400",
      accentBg: "bg-red-500/10",
      accentBorder: "border-red-500/20",
    },
    {
      step: "02",
      tag: "Pivot = 100",
      title: "QuickSort Engine (~242µs)",
      summary: "In-place Hoare partition splits the cohort into Upper Red (≥100) and Lower Green (<100).",
      detail:
        "In ~242 microseconds, patients scoring ≥ 100 or with a single MEOWS/NEWS2 hard red flag route to the Upper Partition (Red, 4-hour Doctor SLA). Scores < 100 route to the Lower Partition (Green, staggered 50-minute clinic windows between 09:00 and 17:00).",
      icon: Cpu,
      color: "text-red-600 dark:text-red-400",
      accentBg: "bg-red-500/10",
      accentBorder: "border-red-500/20",
    },
    {
      step: "03",
      tag: "15 / 5 / 10 Matrix",
      title: "Clinic Capacity Isolation",
      summary: "15 Follow-Up, 5 Reserved Critical, and 10 Protected Walk-In Slots (100% Untouched).",
      detail:
        "Automated outreach is strictly capped at 20 total slots per PHC. The 10 Walk-In slots are hardware-isolated in software—ensuring unscheduled village villagers seeking routine acute care are never crowded out.",
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10",
      accentBorder: "border-emerald-500/20",
    },
    {
      step: "04",
      tag: "Spatial Mesh",
      title: "5-Hexagon Mesh & 108 Bypass",
      summary: "First-to-accept neighbor lock across Ring-1 clinics or 108 Ambulance dispatch to Guwahati.",
      detail:
        "When the 31st patient arrives at a saturated clinic, an H3 Ring-1 overflow broadcast alerts adjacent sub-centres (HEX-1 Chhaygaon, HEX-2 Rani, HEX-3 Mirza). Severe eclampsia or neutropenic sepsis triggers a 108 Ambulance Bypass directly to HEX-4 (GMCH & BBCI).",
      icon: Radio,
      color: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10",
      accentBorder: "border-emerald-500/20",
    },
  ];

  const JOURNEY_BEATS = [
    {
      id: "a",
      label: "Beat 01 • Silent Deterioration",
      title: "PT-MAT-2001 BP Rises: 148 → 156 → 163 mmHg",
      description:
        "A 3rd-trimester mother in Boko misses her scheduled PHC visit. Paper registers mark this as a routine absence, but SwasthyaSense tracks the 3-visit rising systolic trajectory (148 → 156 → 163 mmHg) with blurred vision—firing a MEOWS severe preeclampsia override (Score: 135).",
      metric: "Trajectory: +28 pts • Hard Override Activated",
      accent: "bg-red-600",
    },
    {
      id: "b",
      label: "Beat 02 • QuickSort Pivot = 100",
      title: "In-Place Hoare Partitioning in ~242µs",
      description:
        "The algorithmic engine executes an in-place QuickSort around Pivot = 100. Upper Partition (Red, Score ≥ 100) locks an immediate 4-hour Doctor SLA. Lower Partition (Green, Score < 100) assigns staggered 50-minute consultation windows across the day.",
      metric: "Execution: 242µs • 16 Red / 42 Green Slots",
      accent: "bg-red-600",
    },
    {
      id: "c",
      label: "Beat 03 • 30-Slot Clinic Protection",
      title: "15 Follow-Up / 5 Critical / 10 Walk-In (100% Untouched)",
      description:
        "Inside HEX-0 Boko Central PHC, 30 daily slots are isolated. Even when 20 automated slots are completely booked, all 10 Protected Walk-In slots remain untouched and luminous for local villagers walking in with acute fevers or snakebites.",
      metric: "10 Walk-In Slots: 100% Guaranteed Untouched",
      accent: "bg-emerald-600",
    },
    {
      id: "d",
      label: "Beat 04 • 31st Patient Hexagon Wave",
      title: "HEX-0 Hits 100% → HEX-2 Rani Accepts & Atomically Locks",
      description:
        "When the 31st critical patient arrives and HEX-0 & HEX-1 hit their 20/20 automated cap, an H3 Ring-1 overflow broadcast alerts HEX-2 (Rani) and HEX-3 (Mirza). Rani East Community PHC accepts first, atomically claiming the slot and updating the regional clinical mesh.",
      metric: "First-to-Accept Atomic Lock at HEX-2 Rani",
      accent: "bg-emerald-600",
    },
    {
      id: "e",
      label: "Beat 05 • 108 Tertiary Care Bypass",
      title: "Direct 108 Emergency Route to HEX-4 (GMCH & BBCI)",
      description:
        "For severe post-chemotherapy neutropenic sepsis (PT-ONC-3004: 39.1°C, SpO₂ 91%) or eclampsia with no local PHC doctor on duty, the system bypasses rural clinics entirely—dispatching a 108 Boat/Road Ambulance directly to HEX-4 (Guwahati Tertiary Care Hub).",
      metric: "108 Tertiary Bypass → HEX-4 GMCH / BBCI Hub",
      accent: "bg-red-600",
    },
  ];

  const currentBeat = JOURNEY_BEATS[journeyBeat] || JOURNEY_BEATS[0];

  return (
    <div
      className={`min-h-screen selection:bg-red-500/20 selection:text-red-700 font-sans transition-colors duration-300 ${
        darkMode ? "bg-[#0A0E1A] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* ===================================================================
          1. ULTRA-POLISHED FLOATING GLASS NAVBAR
      =================================================================== */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div
          className={`max-w-7xl mx-auto rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4 border transition-all ${
            darkMode
              ? "bg-slate-900/80 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              : "bg-white/85 border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl"
          }`}
        >
          {/* Brand Logo & Clinical Sub-Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 ring-1 ring-white/20 relative">
              <HeartPulse className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight">
                  Swasthya<span className="text-red-600">Sense</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                  Clinical Mesh v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Early-Warning • QuickSort Triage • Hexagonal Load-Balancing
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide">
            <a
              href="#how-it-works"
              className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {t.navHowItWorks}
            </a>
            <a
              href="#patient-journey-3d"
              className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              {t.navJourney3D}
            </a>
            <a
              href="#hexagon-mesh"
              className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {t.navHexArchitecture}
            </a>
            <a
              href="#security-dpdp"
              className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {t.navSecurity}
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* 7-Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select Language"
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
                className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                  darkMode
                    ? "bg-slate-950 border-white/10 text-slate-200"
                    : "bg-slate-100/80 border-slate-200 text-slate-800"
                }`}
              >
                {SUPPORTED_LANGUAGES.map((langObj) => (
                  <option key={langObj.code} value={langObj.code}>
                    {langObj.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle Theme"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                darkMode
                  ? "bg-slate-950 border-white/10 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-200/60"
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* If Authenticated: Show active user pill + Enter Workspace */}
            {isAuthenticated && currentUser && currentOrganization ? (
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                    darkMode
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">{currentUser.name.split(" ")[0]}</span>
                  <span className="opacity-70 text-[11px]">• {currentOrganization.shortName}</span>
                </div>
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setLoginModalOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {t.navLaunch}
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Navigation Menu"
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden mt-2 p-5 rounded-2xl border space-y-4 ${
              darkMode
                ? "bg-slate-900 border-white/10 text-slate-100"
                : "bg-white border-slate-200 text-slate-900 shadow-xl"
            }`}
          >
            <div className="flex flex-col space-y-3 font-semibold text-sm">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                {t.navHowItWorks}
              </a>
              <a href="#patient-journey-3d" onClick={() => setMobileMenuOpen(false)} className="text-red-600">
                {t.navJourney3D}
              </a>
              <a href="#hexagon-mesh" onClick={() => setMobileMenuOpen(false)}>
                {t.navHexArchitecture}
              </a>
              <a href="#security-dpdp" onClick={() => setMobileMenuOpen(false)}>
                {t.navSecurity}
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setLoginModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {t.navLaunch}
            </button>
          </div>
        )}
      </header>

      {/* ===================================================================
          2. GRAND HERO: EDITORIAL IMPACT + REAL-TIME CLINICAL COMMAND RADAR
      =================================================================== */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute -top-10 left-1/4 w-96 h-96 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Live Micro-Telemetry Ribbon */}
          <div className="flex items-center justify-center mb-8">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium transition-all ${
                darkMode
                  ? "bg-slate-900/90 border-white/10 text-slate-300 shadow-md"
                  : "bg-white/90 border-slate-200/80 text-slate-700 shadow-xs"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
              <span className="font-bold text-red-600 tracking-wide font-mono text-[11px]">
                LIVE PROTOCOL
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="hidden sm:inline">NEWS2 & MEOWS Maternal Overrides</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="font-mono text-emerald-600 font-bold">~242µs QuickSort</span>
              <span className="text-slate-300 dark:text-slate-700 hidden md:inline">•</span>
              <span className="font-mono text-slate-500 hidden md:inline">10 Protected Walk-In Slots</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left 7 Columns: Editorial Headline, Mission, Dual CTA, and 1-Click Demo Launcher */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-slate-900 dark:text-white">
                {t.heroTitle1}{" "}
                <span className="text-red-600 dark:text-red-500">
                  {t.heroTitleHighlight}
                </span>
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {t.heroSubtitle}
              </p>

              {/* Primary Launch Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("signin");
                    setLoginModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <KeyRound className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>{t.ctaSignIn}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("onboard");
                    setLoginModalOpen(true);
                  }}
                  className={`w-full sm:w-auto px-6 py-4 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                      : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>{t.ctaOnboard}</span>
                </button>
              </div>

              {/* 1-Click Instant Demo Launcher Ribbon */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  darkMode
                    ? "bg-slate-900/80 border-slate-800 backdrop-blur-md"
                    : "bg-white border-slate-200/90 shadow-xs backdrop-blur-md"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-600" />
                    Instant 1-Click Multi-Tenant Demo Accounts
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    SIMULTANEOUS ACCESS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {LANDING_DEMO_PRESETS.map((preset) => (
                    <button
                      key={preset.userId}
                      type="button"
                      disabled={authLoading}
                      onClick={() => void handleDirectDemoLogin(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer group ${
                        darkMode
                          ? "bg-slate-950/80 border-slate-800/80 hover:border-red-500/50 hover:bg-slate-900"
                          : "bg-slate-50 border-slate-200/80 hover:border-red-400 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${preset.avatarBg} font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {preset.avatarText}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate group-hover:text-red-600 transition-colors">
                          {preset.userName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {preset.personRole}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                          {preset.organizationId}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-red-600 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Futuristic Real-Time Hologram & Hexagonal Command Radar */}
            <div className="lg:col-span-5 relative">
              <div
                className={`relative rounded-3xl p-6 sm:p-7 border overflow-hidden ${
                  darkMode
                    ? "bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-white/10 shadow-2xl"
                    : "bg-gradient-to-b from-slate-50 via-white to-white border-slate-200/90 shadow-2xl shadow-slate-900/5"
                }`}
              >
                {/* Header HUD Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                      KAMRUP 5-HEX MESH ACTIVE
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    SLA: 4h • RT: 242µs
                  </span>
                </div>

                {/* SVG Hexagonal Mesh Hologram Canvas */}
                <div className="relative h-64 w-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 400 260"
                    className="w-full h-full drop-shadow-md select-none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Background Connection Links */}
                    <line x1="200" y1="130" x2="110" y2="70" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                    <line x1="200" y1="130" x2="290" y2="70" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                    <line x1="200" y1="130" x2="110" y2="190" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                    <line x1="200" y1="130" x2="290" y2="190" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />

                    {/* Ambulance Tertiary Line from HEX-0 directly to HEX-4 */}
                    <path
                      d="M 200 130 Q 320 130 360 40"
                      stroke="#EF4444"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />

                    {/* HEX-0 Center (Boko Central PHC) */}
                    <g transform="translate(200, 130)">
                      <polygon
                        points="0,-32 28,-16 28,16 0,32 -28,16 -28,-16"
                        className="fill-red-500/15 stroke-red-600 stroke-[2.5]"
                      />
                      <circle cx="0" cy="0" r="6" className="fill-red-600 animate-ping" />
                      <circle cx="0" cy="0" r="4" className="fill-white" />
                      <text x="0" y="-38" textAnchor="middle" className="text-[10px] font-mono font-bold fill-red-600">HEX-0 • Boko</text>
                      <text x="0" y="44" textAnchor="middle" className="text-[9px] font-sans font-medium fill-slate-500">18/20 Sys • 10 Free</text>
                    </g>

                    {/* HEX-1 (Chhaygaon North) */}
                    <g transform="translate(110, 70)">
                      <polygon
                        points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                        className="fill-amber-500/15 stroke-amber-500 stroke-2"
                      />
                      <text x="0" y="-28" textAnchor="middle" className="text-[9px] font-mono font-bold fill-amber-600">HEX-1 • Chhaygaon</text>
                    </g>

                    {/* HEX-2 (Rani South-East) */}
                    <g transform="translate(290, 70)">
                      <polygon
                        points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                        className="fill-emerald-500/15 stroke-emerald-500 stroke-2"
                      />
                      <text x="0" y="-28" textAnchor="middle" className="text-[9px] font-mono font-bold fill-emerald-600">HEX-2 • Rani</text>
                    </g>

                    {/* HEX-3 (Mirza South-West) */}
                    <g transform="translate(110, 190)">
                      <polygon
                        points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                        className="fill-emerald-500/15 stroke-emerald-500 stroke-2"
                      />
                      <text x="0" y="34" textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-500">HEX-3 • Mirza</text>
                    </g>

                    {/* HEX-4 (Guwahati GMCH / BBCI Tertiary Care Hub) */}
                    <g transform="translate(360, 40)">
                      <circle cx="0" cy="0" r="16" className="fill-red-600/20 stroke-red-600 stroke-2" />
                      <circle cx="0" cy="0" r="5" className="fill-red-600" />
                      <text x="0" y="-20" textAnchor="middle" className="text-[9px] font-mono font-extrabold fill-red-600">HEX-4 • GMCH</text>
                      <text x="0" y="24" textAnchor="middle" className="text-[8px] font-mono fill-red-500 font-bold">108 BYPASS</text>
                    </g>
                  </svg>
                </div>

                {/* Floating Telemetry Glass Card */}
                <div
                  className={`mt-4 p-3.5 rounded-2xl border text-xs font-mono space-y-1.5 transition-all ${
                    darkMode
                      ? "bg-slate-950/80 border-white/10 text-slate-300"
                      : "bg-white border-slate-200 text-slate-800 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-600 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      PT-MAT-2001 (Boko PHC)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold">
                      MEOWS OVERRIDE
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Systolic Trajectory: 148 → 156 → 163 mmHg (+28 pts)
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-white/5 text-[11px]">
                    <span className="text-emerald-600 font-bold">
                      ✓ 10/10 Walk-In Slots Free
                    </span>
                    <span className="text-slate-500">Score: 135 / Pivot: 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. THE PROBLEM BENTO GRID: WHY RURAL FOLLOW-UP CARE FAILS
      =================================================================== */}
      <section
        className={`py-16 sm:py-20 border-y ${
          darkMode ? "bg-slate-900/40 border-white/10" : "bg-slate-50/70 border-slate-200/80"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              THE FRONTLINE CARE CRISIS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              {t.problemHeading}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {t.problemSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem 01 */}
            <div
              className={`p-7 rounded-3xl border transition-all ${
                darkMode
                  ? "bg-slate-900 border-white/10 hover:border-red-500/40"
                  : "bg-white border-slate-200 hover:border-red-300 shadow-sm"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center font-extrabold text-lg mb-5">
                01
              </div>
              <h3 className="text-lg font-bold mb-2">
                Silent Deterioration After Missed Visits
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Rural patients miss follow-up visits due to river crossings, transport costs, and lost daily wages. When contact breaks down, manageable conditions turn into acute emergencies unnoticed.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 font-mono text-xs text-red-600 font-semibold">
                Result: Preventable ICU admissions
              </div>
            </div>

            {/* Problem 02 */}
            <div
              className={`p-7 rounded-3xl border transition-all ${
                darkMode
                  ? "bg-slate-900 border-white/10 hover:border-red-500/40"
                  : "bg-white border-slate-200 hover:border-red-300 shadow-sm"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-extrabold text-lg mb-5">
                02
              </div>
              <h3 className="text-lg font-bold mb-2">
                Fragmented Registers Hide Rising Trends
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                A 3-visit rising blood pressure trajectory looks like a routine absence in paper registers. The isolated visits fail to connect, concealing imminent eclampsia or stroke until it is too late.
              </p>
              <div className="mt-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 font-mono text-xs font-bold text-red-700 dark:text-red-300">
                148 → 156 → 163 mmHg (+28 pts)
              </div>
            </div>

            {/* Problem 03 */}
            <div
              className={`p-7 rounded-3xl border transition-all ${
                darkMode
                  ? "bg-slate-900 border-white/10 hover:border-emerald-500/40"
                  : "bg-white border-slate-200 hover:border-emerald-300 shadow-sm"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-lg mb-5">
                03
              </div>
              <h3 className="text-lg font-bold mb-2">
                Bulk Reminders Overwhelm Local PHCs
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Automated reminders sent in uncoordinated blasts cause morning crowds at small 30-slot village clinics—overwhelming the lone Medical Officer and displacing regular walk-in villagers.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 font-mono text-xs text-emerald-600 font-bold">
                SwasthyaSense: 10 Walk-In Slots 100% Free
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. INTERACTIVE 4-STAGE CLINICAL PIPELINE
      =================================================================== */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                HOW IT WORKS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
                The 4-Stage Clinical Coordination Pipeline
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              From the rural home check-in to regional hospital bypass—explore each deterministic stage below.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activePipelineStep === idx;
              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? darkMode
                        ? "bg-slate-900 border-red-500 shadow-lg shadow-red-500/10 ring-1 ring-red-500/50"
                        : "bg-white border-red-500 shadow-md ring-1 ring-red-500/20"
                      : darkMode
                      ? "bg-slate-950/60 border-white/5 hover:border-white/20"
                      : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-extrabold text-slate-400">
                      STEP {step.step}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${step.accentBg} ${step.color} border ${step.accentBorder}`}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base mb-1">{step.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {step.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detailed Pipeline Stage Visualizer */}
          <div
            className={`p-6 sm:p-9 rounded-3xl border transition-all ${
              darkMode
                ? "bg-slate-900/80 border-white/10"
                : "bg-white border-slate-200/90 shadow-lg shadow-slate-900/5"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                  <span>STAGE {PIPELINE_STEPS[activePipelineStep].step}</span>
                  <span>•</span>
                  <span>{PIPELINE_STEPS[activePipelineStep].tag}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold">
                  {PIPELINE_STEPS[activePipelineStep].title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {PIPELINE_STEPS[activePipelineStep].detail}
                </p>
              </div>

              {/* Dynamic Stage Interactive Simulator */}
              <div className="lg:col-span-6">
                {activePipelineStep === 0 && (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 font-mono text-xs ${
                      darkMode ? "bg-slate-950 border-white/10" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-500">
                      <span>INTERACTIVE 5-VITAL INPUT</span>
                      <span className="text-red-500">Live Scoring</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 font-bold">
                        <span>Systolic BP: {simVitals.bpSys} mmHg</span>
                        <span>{simVitals.bpSys >= 160 ? "Severe (+40 pts)" : "Normal"}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold">
                        <span>Heart Rate: {simVitals.heartRate} bpm</span>
                        <span>Tachycardia (+20 pts)</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold">
                        <span>Blood Glucose: {simVitals.glucose} mg/dL</span>
                        <span>Controlled</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300 font-bold">
                        <span>SpO₂: {simVitals.spo2}% / Temp 37.1°C</span>
                        <span>Stable</span>
                      </div>
                    </div>
                  </div>
                )}

                {activePipelineStep === 1 && (
                  <div
                    className={`p-5 rounded-2xl border space-y-4 font-mono text-xs ${
                      darkMode ? "bg-slate-950 border-white/10" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">QUICKSORT PIVOT = 100</span>
                      <span className="text-emerald-500 font-bold">~242 µs Execution</span>
                    </div>
                    <div className="p-3 rounded-xl bg-red-600 text-white font-bold flex justify-between items-center shadow-md shadow-red-600/20">
                      <span>Upper Partition (Score ≥ 100)</span>
                      <span>4h Doctor SLA</span>
                    </div>
                    <div className="text-center font-bold text-red-500 border-y-2 border-dashed border-red-500/40 py-1.5 text-[11px]">
                      ▲ PIVOT BOUNDARY (SCORE 100) ▼
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold flex justify-between items-center shadow-md shadow-emerald-600/20">
                      <span>Lower Partition (Score &lt; 100)</span>
                      <span>09:00–17:00 Staggered Slots</span>
                    </div>
                  </div>
                )}

                {activePipelineStep === 2 && (
                  <div
                    className={`p-5 rounded-2xl border space-y-4 text-xs ${
                      darkMode ? "bg-slate-950 border-white/10" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>30-Slot Clinic Daily Allocation</span>
                      <span className="font-mono text-emerald-600">15 / 5 / 10 Isolation</span>
                    </div>
                    <div className="h-7 rounded-xl overflow-hidden flex font-mono text-[10px] font-extrabold text-white shadow-inner">
                      <div className="w-1/2 bg-amber-500 flex items-center justify-center">
                        15 FOLLOW-UP
                      </div>
                      <div className="w-1/6 bg-red-600 flex items-center justify-center">
                        5 CRIT
                      </div>
                      <div className="w-1/3 bg-emerald-600 flex items-center justify-center animate-pulse">
                        10 WALK-IN (FREE)
                      </div>
                    </div>
                    <p className="text-emerald-600 font-semibold text-center">
                      ✓ 10 Walk-In slots are 100% Protected for unannounced village walk-ins.
                    </p>
                  </div>
                )}

                {activePipelineStep === 3 && (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 font-mono text-xs ${
                      darkMode ? "bg-slate-950 border-white/10" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 font-bold">
                      HEX-0 Full (20/20) → 31st Patient Arrives
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-bold">
                      → Ring-1 Broadcast: HEX-2 (Rani) Accepts & Atomically Locks
                    </div>
                    <div className="p-3 rounded-xl bg-rose-600 text-white font-bold flex justify-between items-center">
                      <span>Severe Eclampsia / Sepsis</span>
                      <span>🚑 108 Bypass to HEX-4 (GMCH)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. SIGNATURE 3D PATIENT JOURNEY (OBSIDIAN MEDTECH CANVAS)
      =================================================================== */}
      <section
        id="patient-journey-3d"
        ref={journeySectionRef}
        className="py-16 sm:py-24 bg-[#0A0E1A] text-white border-y border-slate-800 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold uppercase tracking-wider mb-2 border border-red-500/30">
                <Compass className="w-3.5 h-3.5 text-red-500" />
                SCROLL-DRIVEN 3D SPATIAL TELEMETRY
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                3D Patient Journey: From Silent Risk to Rescue
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setAutoPlayJourney((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              {autoPlayJourney ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-emerald-400" /> Auto-Scrub Active
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-red-400" /> Resume Auto-Scrub
                </>
              )}
            </button>
          </div>

          {/* 5 Beat Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {JOURNEY_BEATS.map((beat, idx) => (
              <button
                key={beat.id}
                type="button"
                onClick={() => {
                  setAutoPlayJourney(false);
                  setJourneyBeat(idx);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  journeyBeat === idx
                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <div className="font-mono text-[10px] font-extrabold uppercase opacity-80">
                  {beat.label}
                </div>
                <div className="font-bold text-xs truncate mt-0.5">{beat.title}</div>
              </button>
            ))}
          </div>

          {/* 3D Isometric Telemetry Stage Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Isometric Canvas */}
            <div
              className="lg:col-span-7 relative rounded-3xl border border-slate-800 bg-[#070B14] p-6 sm:p-10 min-h-[380px] flex items-center justify-center overflow-hidden"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative w-full max-w-lg transition-transform duration-700 ease-out"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(18deg) rotateY(${journeyBeat * 3 - 6}deg)`,
                }}
              >
                {/* Floating Metric Badges */}
                <div className="flex justify-between items-center mb-5 font-mono text-xs">
                  <span className="px-3 py-1 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 font-bold">
                    ● PT-MAT-2001 BP: 148 → 156 → 163
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold">
                    ⚡ QuickSort: ~242µs
                  </span>
                </div>

                {/* Beat 02 QuickSort Laser Line */}
                {journeyBeat === 1 && (
                  <div className="mb-4 p-2.5 rounded-xl bg-red-600/20 border-2 border-dashed border-red-500 text-center font-mono text-xs font-bold text-red-300 animate-pulse">
                    ═══ QUICKSORT PIVOT = 100 SPLIT (UPPER RED vs LOWER GREEN) ═══
                  </div>
                )}

                {/* Beat 03 30-Slot Bar */}
                {journeyBeat === 2 && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-emerald-500 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-amber-400">15 Follow-Up</span>
                      <span className="text-red-400">5 Critical</span>
                      <span className="text-emerald-400 font-bold">10 Walk-In (100% Free)</span>
                    </div>
                    <div className="h-5 rounded-lg overflow-hidden flex font-mono text-[9px] font-bold">
                      <div className="w-1/2 bg-amber-500 text-slate-950 flex items-center justify-center">15 SYS</div>
                      <div className="w-1/6 bg-red-600 text-white flex items-center justify-center">5 CRIT</div>
                      <div className="w-1/3 bg-emerald-500 text-slate-950 flex items-center justify-center animate-pulse">10 WALK-IN</div>
                    </div>
                  </div>
                )}

                {/* 5 Hexagon Clinic Nodes Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      journeyBeat === 3
                        ? "bg-red-950/80 border-red-500"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-red-400">HEX-0 BOKO</div>
                    <div className="font-bold text-xs mt-0.5">Boko Central PHC</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">10 Walk-In Free</div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      journeyBeat === 3
                        ? "bg-amber-950/80 border-amber-500"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-slate-300">HEX-1 CHHAY</div>
                    <div className="font-bold text-xs mt-0.5">Chhaygaon North</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">10 Walk-In Free</div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      journeyBeat === 3
                        ? "bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-500/50 scale-105"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-emerald-400">HEX-2 RANI</div>
                    <div className="font-bold text-xs mt-0.5">Rani East PHC</div>
                    <div className="text-[10px] text-emerald-300 mt-1 font-mono">
                      {journeyBeat === 3 ? "⚡ Locked 31st Pt" : "Ring-1 Standby"}
                    </div>
                  </div>
                </div>

                {/* Tertiary Care 108 Emergency Route */}
                <div
                  className={`mt-3 p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    journeyBeat === 4
                      ? "bg-red-950 border-red-400 ring-2 ring-red-500/50 scale-105"
                      : "bg-slate-900/90 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Ambulance className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="font-bold text-xs">HEX-4 • GMCH & BBCI Tertiary Hub</div>
                      <div className="text-[10px] text-red-400 font-mono">24×7 ICU / Oncology Route</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                    108 DISPATCH
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative Info Card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold border border-red-500/30">
                  {currentBeat.label}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold">{currentBeat.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentBeat.description}
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 font-bold">
                  {currentBeat.metric}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setJourneyBeat((prev) => (prev - 1 + 5) % 5)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <span className="font-mono text-xs text-slate-400">
                    Beat {journeyBeat + 1} / 5
                  </span>
                  <button
                    type="button"
                    onClick={() => setJourneyBeat((prev) => (prev + 1) % 5)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white cursor-pointer shadow-md shadow-red-600/30"
                  >
                    Next Beat →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. CORE CAPABILITIES (FIVE PILLARS BENTO GRID)
      =================================================================== */}
      <section id="hexagon-mesh" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              ARCHITECTURAL EXCELLENCE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Five Resilient Pillars of SwasthyaSense
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {/* Pillar 01: Multi-Tenant RLS */}
            <div
              className={`p-7 rounded-3xl border ${
                darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-xs font-bold border border-red-500/20">
                  PILLAR 01 • MULTI-TENANT RLS
                </span>
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Multi-Organization Isolation & Frontline Collaboration
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Organizations like Sevak Health Foundation, Boko Central PHC, and Chhaygaon North sign in independently. Frontline workers collaborate internally across their 15-worker teams, while cross-organization reads are blocked with <code>HTTP 403 Not your organization</code> and logged.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">✓ ORG-SEVAK: 260 Patients (58 Assigned to Rina Devi)</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">✓ ORG-BOKO: Isolated Boko PHC Clinic Queue</div>
                <div className="text-red-600 dark:text-red-400 font-bold">✗ Cross-Tenant Breach: Blocked with HTTP 403 & SHA-256 Logged</div>
              </div>
            </div>

            {/* Pillar 03: 30-Slot Clinic Matrix Simulator */}
            <div
              className={`p-7 rounded-3xl border ${
                darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                  PILLAR 03 • 30-SLOT CAPACITY MATRIX
                </span>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Closed-Loop Slot Reclamation Simulator
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Every village clinic isolates 30 daily slots into 15 Follow-Up, 5 Critical, and 10 Protected Walk-In. Test the live slot reclamation loop below:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                    {simFollowUpUsed}/15 Follow-Up
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold">
                    {simCriticalUsed}/5 Critical
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                    10/10 Walk-In Free
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSimFollowUpUsed((v) => Math.min(15, v + 1))}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition-colors"
                  >
                    + Book Follow-Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimFollowUpUsed((v) => Math.max(0, v - 1));
                      setSimCriticalUsed((v) => Math.max(0, v - 1));
                    }}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
                  >
                    ✓ Clear & Free Slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          7. SECURITY & DPDP ACT 2023 CERTIFICATION
      =================================================================== */}
      <section
        id="security-dpdp"
        className={`py-16 sm:py-20 border-y ${
          darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              TRUST, PRIVACY & SAFETY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              DPDP Act 2023 Compliance & Clinical Decision Support
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Non-Diagnostic Decision Support",
                desc: "Prominently displays DECISION-SUPPORT ONLY • NOT A DIAGNOSTIC DEVICE across all screens. Never prescribes medications.",
                badge: "WHO / CDSCO Aligned",
              },
              {
                title: "AES-256-GCM Phone Encryption",
                desc: "Frontline patient phone numbers are encrypted at rest with random IVs and authentication tags. Masked to all supervisors.",
                badge: "AES-256-GCM",
              },
              {
                title: "PostgreSQL Row-Level Security",
                desc: "Strict tenant barriers prevent cross-organization data leakage. Authenticated with cryptographic scrypt password hashes.",
                badge: "Postgres RLS",
              },
              {
                title: "SHA-256 Audit Trail Chain",
                desc: "Every check-in, rule amendment, and 403 access denial is cryptographically hash-chained into a tamper-evident ledger.",
                badge: "SHA-256 Ledger",
              },
              {
                title: "DPDP Instant 'STOP' Revocation",
                desc: "Replying 'STOP' to any SMS/WhatsApp message immediately locks the patient record to a minimal stub and blocks future outreach.",
                badge: "DPDP Act 2023",
              },
              {
                title: "4-Hour SLA Watchdog",
                desc: "Automated idempotent jobs inspect Upper Partition (≥100) patient alerts and escalate unreviewed cases to the Block Supervisor.",
                badge: "4h SLA Watchdog",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`p-6 rounded-2xl border transition-all ${
                  darkMode ? "bg-slate-900 border-slate-800 shadow-sm" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1">{card.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          8. FOOTER WITH LIVE ACTIVE MULTI-TENANT SESSIONS BAR
      =================================================================== */}
      <footer className={`pt-14 pb-10 border-t ${darkMode ? "bg-[#070B14] text-slate-400 border-slate-800" : "bg-slate-900 text-slate-300 border-slate-800"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Live Multi-Tenant Sessions Bar */}
          <div className="p-4 rounded-2xl bg-white/5 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Multi-Tenant Sessions ({activeSessions.length} Active Tenants)
                </div>
                <div className="text-[11px] text-slate-400">
                  Independent tokens per tab • No single-session lock
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeSessions.map((ses) => (
                <div
                  key={`${ses.orgId}-${ses.userId}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono font-bold text-white">{ses.userId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                    {ses.orgId}
                  </span>
                  <span className="text-[11px] text-emerald-400 hidden sm:inline">{ses.roleBadge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <span className="font-extrabold text-white text-base">
                  Swasthya<span className="text-red-500">Sense</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Non-diagnostic early-warning and hexagonal clinic load-balancing platform for rural frontline health teams.
              </p>
              <div className="text-[11px] text-red-300 font-semibold p-2 rounded-lg bg-red-950/60 border border-red-800/50">
                DECISION-SUPPORT ONLY • NOT A DIAGNOSTIC DEVICE
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white uppercase tracking-wider mb-2">Capabilities</div>
              <div>5-Category Bidirectional Vitals</div>
              <div>QuickSort Pivot = 100 Engine (~242µs)</div>
              <div>30-Slot Clinic Protection Matrix</div>
              <div>5-Village Spatial Hex Mesh</div>
              <div>108 Rapid Ambulance Bypass</div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white uppercase tracking-wider mb-2">Compliance</div>
              <div>DPDP Act 2023 Consent Revocation</div>
              <div>AES-256-GCM Phone Encryption</div>
              <div>SHA-256 Cryptographic Audit Ledger</div>
              <div>NEWS2 & MEOWS Maternal Guidelines</div>
              <div>PostgreSQL Row-Level Security</div>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-white uppercase tracking-wider mb-2">Portal Access</div>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Organization Sign-In
              </button>
              <button
                type="button"
                onClick={onEnterWorkspace}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Open Scenario Lab
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>© 2026 SwasthyaSense Clinical Mesh • Kamrup Rural & Guwahati</div>
            <div className="font-mono">300 Synthetic Patients • Zero Real PII</div>
          </div>
        </div>
      </footer>

      {/* ===================================================================
          MODAL: SLEEK MODERN ORGANIZATION SIGN-IN & ONBOARDING SHEET
      =================================================================== */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Organization Portal Sign-In</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Postgres Row-Level Security & Scrypt Password Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setAuthError(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  authTab === "signin"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Sign In to Existing Tenant
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("onboard");
                  setAuthError(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  authTab === "onboard"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                + Onboard New Organization
              </button>
            </div>

            {/* Form Body */}
            {authTab === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="p-6 space-y-4">
                {/* 1-Click Demo Accounts Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Quick-Autofill Demo Personas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LANDING_DEMO_PRESETS.map((p) => (
                      <button
                        key={p.userId}
                        type="button"
                        onClick={() => {
                          setOrgIdInput(p.organizationId);
                          setUserIdInput(p.userId);
                          setPasswordInput(p.passwordPlain);
                        }}
                        className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          orgIdInput === p.organizationId && userIdInput === p.userId
                            ? "bg-red-500/10 border-red-500 text-red-600"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="font-bold truncate">{p.userName}</div>
                        <div className="text-[10px] opacity-75 truncate">{p.organizationId}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Organization ID</label>
                  <input
                    type="text"
                    value={orgIdInput}
                    onChange={(e) => setOrgIdInput(e.target.value)}
                    placeholder="e.g. ORG-BOKO"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Staff User ID</label>
                    <input
                      type="text"
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="e.g. doc.boko01"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Sign In & Launch Portal
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOnboardSubmit} className="p-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="e.g. Gramin Swasthya Trust"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Short Name</label>
                    <input
                      type="text"
                      value={newOrgShort}
                      onChange={(e) => setNewOrgShort(e.target.value)}
                      placeholder="e.g. Gramin Care"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">District</label>
                    <input
                      type="text"
                      value={newOrgDistrict}
                      onChange={(e) => setNewOrgDistrict(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Passcode</label>
                    <input
                      type="text"
                      value={newOrgPasscode}
                      onChange={(e) => setNewOrgPasscode(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                        darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Team Size</label>
                    <input
                      type="number"
                      value={newOrgTeamSize}
                      onChange={(e) => setNewOrgTeamSize(Number(e.target.value) || 15)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                        darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Lead Frontline Worker Name</label>
                  <input
                    type="text"
                    value={newOrgLead}
                    onChange={(e) => setNewOrgLead(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                      darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Provision Isolated Tenant & Enter
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
