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
  FileCheck2,
  KeyRound,
  UserPlus,
  Layers,
  Clock,
  ChevronRight,
  Menu,
  X,
  PhoneCall,
  Terminal,
  RefreshCw,
  LogOut,
  Play,
  Pause,
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
}

export const LANDING_DEMO_PRESETS: DemoAccountPreset[] = [
  {
    personRole: "Clinic doctor",
    organizationId: "ORG-BOKO",
    organizationName: "Boko Central PHC Medical Block",
    userId: "doc.boko01",
    userName: "Dr. Pranabjyoti Bora (MO)",
    passwordPlain: "Boko@Demo#101",
    roleBadge: "Clinician, HEX-0 Boko Central PHC",
    facilityHex: "HEX-0",
  },
  {
    personRole: "Frontline worker",
    organizationId: "ORG-SEVAK",
    organizationName: "Sevak Health Foundation",
    userId: "asha.sevak07",
    userName: "Rina Devi (Sevak ASHA #07)",
    passwordPlain: "Sevak@Demo#207",
    roleBadge: "ASHA worker, Sevak 15-worker team",
    facilityHex: "HEX-0",
  },
  {
    personRole: "Local clinic nurse",
    organizationId: "ORG-CHHAY",
    organizationName: "Chhaygaon North Sub-Centre Network",
    userId: "anm.chhay03",
    userName: " Sister Dipali Kalita (ANM #03)",
    passwordPlain: "Chhay@Demo#303",
    roleBadge: "ANM nurse, HEX-1 Chhaygaon North",
    facilityHex: "HEX-1",
  },
];

interface LandingTranslations {
  badge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  ctaSignIn: string;
  ctaSignInSub: string;
  ctaOnboard: string;
  navHowItWorks: string;
  navJourney3D: string;
  navHexArchitecture: string;
  navSecurity: string;
  navLaunch: string;
  problemHeading: string;
  problem1Title: string;
  problem1Body: string;
  problem2Title: string;
  problem2Body: string;
  problem3Title: string;
  problem3Body: string;
}

const LANDING_I18N: Record<SupportedLanguage, LandingTranslations> = {
  en: {
    badge: "NON-DIAGNOSTIC CLINICAL EARLY-WARNING & HEXAGONAL LOAD-BALANCING",
    heroTitle: "Catch the patient who didn't show up,",
    heroHighlight: "before it becomes an emergency.",
    heroSubtitle:
      "SwasthyaSense detects silent multi-visit clinical deterioration across high-risk pregnancy, post-illness recovery, hypertension, and diabetes—partitioning queues in ~242µs while protecting 100% of village walk-in capacity.",
    ctaSignIn: "Sign In with Organization Credentials",
    ctaSignInSub: "Sevak 15-Worker Team • Boko Central PHC • Chhaygaon North",
    ctaOnboard: "+ Onboard New Healthcare Organization",
    navHowItWorks: "How It Works",
    navJourney3D: "3D Patient Journey",
    navHexArchitecture: "5-Hexagon Architecture",
    navSecurity: "Security & DPDP",
    navLaunch: "Organization Sign-In / Launch Portal",
    problemHeading: "Why Rural Follow-Up Care Breaks Down",
    problem1Title: "Silent Deterioration After Missed Visits",
    problem1Body:
      "Patients miss follow-ups due to river crossings, transport costs, daily wage loss, and language barriers—turning manageable hypertension or gestational risk into acute emergencies.",
    problem2Title: "Fragmented Registers Hide Rising Trajectories",
    problem2Body:
      "A 3-visit rising blood pressure trajectory (148 → 156 → 163 mmHg) looks like a routine missed appointment on paper registers until severe preeclampsia or stroke occurs.",
    problem3Title: "Bulk Reminders Flood Small Village Clinics",
    problem3Body:
      "Uncoordinated SMS blasts trigger morning crowds at 30-slot PHCs, overwhelming the lone Medical Officer and displacing regular village walk-in patients.",
  },
  as: {
    badge: "অ-নিদানমূলক ক্লিনিকেল আগতীয়া সতৰ্কীকৰণ আৰু হেক্সাগনেল ভাৰসাম্য মঞ্চ",
    heroTitle: "যিজন ৰোগী ক্লিনিকলৈ নাহিল তেওঁক চিনাক্ত কৰক,",
    heroHighlight: "জৰুৰীকালীন বিপদ হোৱাৰ আগতেই।",
    heroSubtitle:
      "স্বাস্থ্য-সেন্সে গৰ্ভাৱস্থা, উচ্চ ৰক্তচাপ, মধুমেহ আৰু জটিল ৰোগৰ পিছত নীৰৱে বাঢ়ি অহা বিপদ ধৰা পেলায়—~২৪২ মাইক্ৰ’ছেকেণ্ডত কিউক-চৰ্ট বিভাজন কৰি গাঁৱৰ সাধাৰণ ৰোগীৰ ১০টা আসন ১০০% সুৰক্ষিত ৰাখে।",
    ctaSignIn: "সংগঠনৰ পৰিচয় পত্ৰৰে ছাইন-ইন কৰক",
    ctaSignInSub: "সেৱক ১৫-জনীয়া আশা দল • বকো পিএইচচি • ছয়গাঁও উত্তৰ",
    ctaOnboard: "+ নতুন স্বাস্থ্য সংগঠন পঞ্জীয়ন কৰক",
    navHowItWorks: "কেনেকৈ কাম কৰে",
    navJourney3D: "3D ৰোগীৰ যাত্ৰা",
    navHexArchitecture: "৫-হেক্সাগন নেটৱৰ্ক",
    navSecurity: "সুৰক্ষা আৰু DPDP",
    navLaunch: "সংগঠন ছাইন-ইন / পৰ্টেল খোলক",
    problemHeading: "গ্ৰাম্য অনুসৰণ চিকিৎসাত কিয় ব্যৱধান আহে",
    problem1Title: "সাক্ষাৎ হেৰুৱাৰ পিছত নীৰৱ অৱনতি",
    problem1Body:
      "দূৰত্ব, যাতায়তৰ অসুবিধা, দিনহাজিৰা ক্ষতি আৰু ভাষাৰ বাধাৰ বাবে ৰোগীয়ে ফলো-আপ এৰি দিয়ে।",
    problem2Title: "কাগজৰ বহীত লুকাই থকা ৩-বাৰৰ বৃদ্ধি (148 → 156 → 163)",
    problem2Body:
      "তিনিটা ভিজিটত ক্ৰমান্বয়ে বাঢ়ি অহা ৰক্তচাপ কাগজৰ পঞ্জীত সাধাৰণ যেন লাগে, যেতিয়ালৈকে এক্লাম্পচিয়া নহয়।",
    problem3Title: "একেলগে পঠিওৱা মেছেজে ক্ষুদ্ৰ ক্লিনিক উপচাই পেলায়",
    problem3Body:
      "পৰিকল্পনাহীন ৰিমাইণ্ডাৰে ৩০-আসনৰ স্বাস্থ্য কেন্দ্ৰত ভিৰ সৃষ্টি কৰে আৰু সাধাৰণ গাঁওবাসীক বঞ্চিত কৰে।",
  },
  bn: {
    badge: "নন-ডায়াগনস্টিক ক্লিনিক্যাল আর্লি-ওয়ার্নিং ও হেক্সাগোনাল লোড-ব্যালেন্সিং",
    heroTitle: "যে রোগী ফলো-আপে আসেননি তাঁকে শনাক্ত করুন,",
    heroHighlight: "জরুরি সংকট তৈরি হওয়ার আগেই।",
    heroSubtitle:
      "স্বাস্থ্যসেন্স উচ্চ-ঝুঁকির গর্ভাবস্থা, রক্তচাপ ও ডায়াবেটিস রোগীদের নীরব অবনতি শনাক্ত করে এবং ~২৪২µs-এ কিউইকসর্ট বিভাজন করে গ্রামের ওয়াক-ইন রোগীদের ১০টি স্লট ১০০% সুরক্ষিত রাখে।",
    ctaSignIn: "সংস্থার ক্রেডেনশিয়াল দিয়ে সাইন-ইন করুন",
    ctaSignInSub: "সেবক ১৫-কর্মী দল • বকো পিএইচসি • ছয়গাঁও উত্তর",
    ctaOnboard: "+ নতুন স্বাস্থ্য সংস্থা যুক্ত করুন",
    navHowItWorks: "কীভাবে কাজ করে",
    navJourney3D: "3D রোগীর যাত্রা",
    navHexArchitecture: "৫-হেক্সাগন আর্কিটেকচার",
    navSecurity: "নিরাপত্তা ও DPDP",
    navLaunch: "সংস্থা সাইন-ইন / পোর্টাল খুলুন",
    problemHeading: "গ্রামীণ ফলো-আপ চিকিৎসা কেন ভেঙে পড়ে",
    problem1Title: "মিসড ভিজিটের পর নীরব অবনতি",
    problem1Body:
      "দূরত্ব, পরিবহন খরচ ও ভাষার বাধার কারণে রোগীরা ফলো-আপ মিস করেন এবং নীরবে সংকটাপন্ন হন।",
    problem2Title: "কাগজের রেজিস্টারে লুকিয়ে থাকা ৩-ভিজিট বৃদ্ধি",
    problem2Body:
      "১৪৮ → ১৫৬ → ১৬৩ mmHg রক্তচাপ বৃদ্ধি কাগজের খাতায় সাধারণ মিসড অ্যাপয়েন্টমেন্ট মনে হয়।",
    problem3Title: "বাল্ক রিমাইন্ডারে ছোট ক্লিনিকে অতিরিক্ত ভিড়",
    problem3Body:
      "একসাথে সবাইকে ডাকার ফলে ৩০-স্লটের ক্লিনিকে ভিড় হয় এবং সাধারণ ওয়াক-ইন রোগীরা বঞ্চিত হন।",
  },
  hi: {
    badge: "गैर-निदानात्मक क्लिनिकल अर्ली-वॉर्निंग और हेक्सागोनल लोड-बैलेंसिंग",
    heroTitle: "उस मरीज़ को समय रहते पहचानें जो क्लिनिक नहीं आया,",
    heroHighlight: "इससे पहले कि वह आपातकाल बन जाए।",
    heroSubtitle:
      "स्वास्थ्य-सेंस उच्च जोखिम वाली गर्भावस्था, रक्तचाप, मधुमेह और गंभीर बीमारी के बाद होने वाली शांत गिरावट को पकड़ता है—~242µs में QuickSort विभाजन कर गाँव के 10 वॉक-इन स्लॉट 100% सुरक्षित रखता है।",
    ctaSignIn: "संगठन क्रेडेंशियल के साथ साइन-इन करें",
    ctaSignInSub: "सेवक 15-आशा टीम • बोको PHC • छयगांव नॉर्थ",
    ctaOnboard: "+ नया स्वास्थ्य संगठन पंजीकृत करें",
    navHowItWorks: "यह कैसे काम करता है",
    navJourney3D: "3D मरीज़ यात्रा",
    navHexArchitecture: "5-हेक्सागोन आर्किटेक्चर",
    navSecurity: "सुरक्षा और DPDP",
    navLaunch: "संगठन साइन-इन / पोर्टल खोलें",
    problemHeading: "ग्रामीण फॉलो-अप देखभाल क्यों विफल हो जाती है",
    problem1Title: "छूटे हुए विज़िट के बाद शांत गिरावट",
    problem1Body:
      "दूरी, परिवहन, दिहाड़ी के नुकसान और भाषा की बाधाओं के कारण मरीज़ फॉलो-अप छोड़ देते हैं।",
    problem2Title: "कागज़ी रजिस्टरों में छिपा 3-विज़िट बढ़ता रुझान",
    problem2Body:
      "तीन विज़िट में बढ़ता BP (148 → 156 → 163 mmHg) कागज़ पर सामान्य लगता है जब तक गंभीर संकट न आ जाए।",
    problem3Title: "बल्क रिमाइंडर से छोटे क्लिनिकों में भीड़",
    problem3Body:
      "बिना क्रम के भेजे गए रिमाइंडर 30-स्लॉट क्लिनिक को भर देते हैं और सामान्य ग्रामीण मरीज़ों को जगह नहीं मिलती।",
  },
  ta: {
    badge: "நோய் নির্ণயமற்ற மருத்துவ முன்னெச்சரிக்கை & அறுகோண சுமை சமநிலை",
    heroTitle: "மருத்துவமனைக்கு வராத நோயாளியைக் கண்டறியுங்கள்,",
    heroHighlight: "அது அவசரநிலையாக மாறுவதற்கு முன்பு.",
    heroSubtitle:
      "SwasthyaSense உயர்-ஆபத்து கர்ப்பம், இரத்த அழுத்தம் மற்றும் நீரிழிவு நோயாளிகளின் தொடர் சரிவைக் கண்டறிந்து ~242µs-இல் QuickSort மூலம் வரிசையைப் பிரிக்கிறது.",
    ctaSignIn: "நிறுவன சான்றுகளுடன் உள்நுழையவும்",
    ctaSignInSub: "சேவக் 15-பணியாளர் குழு • போகோ PHC • சாய்கான்",
    ctaOnboard: "+ புதிய சுகாதார நிறுவனத்தைச் சேர்க்கவும்",
    navHowItWorks: "செயல்படும் விதம்",
    navJourney3D: "3D நோயாளி பயணம்",
    navHexArchitecture: "5-அறுகோண கட்டமைப்பு",
    navSecurity: "பாதுகாப்பு & DPDP",
    navLaunch: "நிறுவன உள்நுழைவு / போர்டல்",
    problemHeading: "கிராமப்புற தொடர் சிகிச்சை ஏன் தடைபடுகிறது",
    problem1Title: "தவறவிட்ட வருகைக்குப் பின் அமைதியான பாதிப்பு",
    problem1Body:
      "தூரம், போக்குவரத்து மற்றும் மொழித் தடைகளால் நோயாளிகள் தொடர் பரிசோதனையைத் தவறவிடுகின்றனர்.",
    problem2Title: "காகிதப் பதிவேடுகளில் மறையும் 3-முறை உயர்வு (148→156→163)",
    problem2Body:
      "மூன்று வருகைகளில் உயரும் இரத்த அழுத்தம் காகிதப் பதிவேட்டில் சாதாரணமாகத் தெரிகிறது.",
    problem3Title: "மொத்த நினைவூட்டல்களால் சிறிய கிளினிக்குகளில் நெரிசல்",
    problem3Body:
      "ஒரே நேரத்தில் அனுப்பப்படும் செய்திகள் 30-இட கிளினிக்கை நிரப்பி சாதாரண மக்களைப் பாதிக்கின்றன.",
  },
  te: {
    badge: "నాన్-డయాగ్నస్టిక్ క్లినికల్ ఎర్లీ-వార్నింగ్ & హెక్సాగోనల్ లోడ్-బ్యాలెన్సింగ్",
    heroTitle: "క్లినిక్‌కు రాని రోగిని ముందే గుర్తించండి,",
    heroHighlight: "అది అత్యవசర పరిస్థితిగా మారకముందే.",
    heroSubtitle:
      "SwasthyaSense అధిక-ప్రమాద గర్భం, రక్తపోటు మరియు మధుమేహ రోగులలో నిశ్శబ్ద క్షీణతను గుర్తించి ~242µsలో QuickSort ద్వారా క్యూలను విభజిస్తుంది.",
    ctaSignIn: "సంస్థ క్రెడెన్షియల్స్‌తో సైన్-ఇన్ చేయండి",
    ctaSignInSub: "సేవక్ 15-వర్కర్ టీమ్ • బోకో PHC • ఛాయ్‌గావ్ నార్త్",
    ctaOnboard: "+ కొత్త ఆరోగ్య సంస్థను నమోదు చేయండి",
    navHowItWorks: "ఇది ఎలా పనిచేస్తుంది",
    navJourney3D: "3D పేషెంట్ జర్నీ",
    navHexArchitecture: "5-హెక్సాగాన్ ఆర్కిటెక్చర్",
    navSecurity: "భద్రత & DPDP",
    navLaunch: "సంస్థ సైన్-ఇన్ / పోర్టల్ తెరవండి",
    problemHeading: "గ్రామీణ ఫాలో-అప్ కేర్ ఎందుకు విఫలమవుతుంది",
    problem1Title: "మిస్ అయిన విజిట్ల తర్వాత నిశ్శబ్ద క్షీణత",
    problem1Body:
      "దూరం, రవాణా ఖర్చులు మరియు భాషా అడ్డంకుల వల్ల రోగులు ఫాలో-అప్ విజిట్లను కోల్పోతారు.",
    problem2Title: "పేపర్ రిజిస్టర్లలో దాగి ఉండే 3-విజిట్ పెరుగుదల (148→156→163)",
    problem2Body:
      "మూడు విజిట్లలో పెరుగుతున్న రక్తపోటు కాగితపు రిజిస్టర్లలో సాధారణంగా కనిపిస్తుంది.",
    problem3Title: "బల్క్ రిమైండర్ల వల్ల చిన్న క్లినిక్‌లలో రద్దీ",
    problem3Body:
      "ఒకేసారి పంపే రిమైండర్లు 30-స్లాట్ PHCలను నింపేసి సాధారణ వాక్-ఇన్ రోగులకు ఇబ్బంది కలిగిస్తాయి.",
  },
  mr: {
    badge: "नॉन-डायग्नोस्टिक क्लिनिकल अर्ली-वॉर्निंग आणि हेक्सागोनल लोड-बॅलन्सिंग",
    heroTitle: "क्लिनिकला न आलेल्या रुग्णाला वेळीच ओळखा,",
    heroHighlight: "आणीबाणीची परिस्थिती उद्भवण्यापूर्वी.",
    heroSubtitle:
      "SwasthyaSense उच्च-जोखीम गर्भधारणा, रक्तदाब आणि मधुमेह रुग्णांमधील शांत खालावणारी प्रकृती ओळखते आणि ~242µs मध्ये QuickSort द्वारे रांगांचे विभाजन करते.",
    ctaSignIn: "संस्थेच्या क्रेडेंशियल्ससह साइन-इन करा",
    ctaSignInSub: "सेवक १५-आशा टीम • बोको PHC • छयगाव नॉर्थ",
    ctaOnboard: "+ नवीन आरोग्य संस्था नोंदणी करा",
    navHowItWorks: "हे कसे कार्य करते",
    navJourney3D: "3D रुग्ण प्रवास",
    navHexArchitecture: "5-हेक्सागोन आर्किटेक्चर",
    navSecurity: "सुरक्षा आणि DPDP",
    navLaunch: "संस्था साइन-इन / पोर्टल उघडा",
    problemHeading: "ग्रामीण फॉलो-अप आरोग्यसेवा का खंडित होते",
    problem1Title: "चुकलेल्या भेटीनंतर शांतपणे खालावणारी प्रकृती",
    problem1Body:
      "अंतर, वाहतूक खर्च, रोजंदारीचे नुकसान आणि भाषेच्या अडथळ्यांमुळे रुग्ण फॉलो-अप टाळतात.",
    problem2Title: "कागदी नोंदवहीत लपलेला ३-भेटींचा वाढता कल (148→156→163)",
    problem2Body:
      "तीन भेटींमध्ये वाढत जाणारा रक्तदाब कागदावर सामान्य वाटतो जोपर्यंत गंभीर संकट येत नाही.",
    problem3Title: "एकत्रित रिमाइंडर्समुळे छोट्या क्लिनिकमध्ये गर्दी",
    problem3Body:
      "अचानक पाठवलेल्या मेसेजमुळे ३०-स्लॉट क्लिनिकमध्ये गर्दी होते आणि सामान्य ग्रामस्थांना जागा मिळत नाही.",
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

  // Theme state (Light / Dark mode)
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Pipeline Stepper (Step 1 -> Step 4)
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  // Scroll-Driven 3D Patient Journey Beat (0 to 4 -> Beats a, b, c, d, e)
  const [journeyBeat, setJourneyBeat] = useState<number>(0);
  const [autoPlayJourney, setAutoPlayJourney] = useState<boolean>(true);
  const journeySectionRef = useRef<HTMLDivElement | null>(null);

  // Interactive Pillar 3 & 4 mini-simulators on Landing Page
  const [simFollowUpUsed, setSimFollowUpUsed] = useState<number>(14);
  const [simCriticalUsed, setSimCriticalUsed] = useState<number>(4);
  const [hexOverflowState, setHexOverflowState] = useState<
    "normal" | "broadcasting" | "locked_hex2" | "ambulance_hex4"
  >("normal");
  const [doctorUnavailablePreview, setDoctorUnavailablePreview] = useState<boolean>(false);
  const [previewSmsReply, setPreviewSmsReply] = useState<"1" | "2" | "STOP">("1");

  // Auth Card / Modal State
  const [authTab, setAuthTab] = useState<"signin" | "onboard">("signin");
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [orgIdInput, setOrgIdInput] = useState<string>("ORG-BOKO");
  const [userIdInput, setUserIdInput] = useState<string>("doc.boko01");
  const [passwordInput, setPasswordInput] = useState<string>("Boko@Demo#101");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLocked, setAuthLocked] = useState<boolean>(false);
  const [authSuccessBanner, setAuthSuccessBanner] = useState<string | null>(null);

  // New Org Onboarding inputs
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgShort, setNewOrgShort] = useState("");
  const [newOrgDistrict, setNewOrgDistrict] = useState("Kamrup Rural, Assam");
  const [newOrgPasscode, setNewOrgPasscode] = useState("GRAMIN-2026");
  const [newOrgTeamSize, setNewOrgTeamSize] = useState(15);
  const [newOrgLead, setNewOrgLead] = useState("Meenakshi Das");

  // Scroll listener for the 3D Patient Journey section
  useEffect(() => {
    const handleScroll = () => {
      if (!journeySectionRef.current) return;
      const rect = journeySectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (rect.top < viewportHeight * 0.75 && rect.bottom > viewportHeight * 0.25) {
        const totalScrollable = Math.max(1, rect.height - viewportHeight * 0.35);
        const scrolled = Math.max(0, viewportHeight * 0.55 - rect.top);
        const progress = Math.min(1, Math.max(0, scrolled / totalScrollable));
        const computedBeat = Math.min(4, Math.floor(progress * 5));
        setJourneyBeat(computedBeat);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-advance 3D journey beat when autoPlayJourney is enabled
  useEffect(() => {
    if (!autoPlayJourney) return;
    const timer = setInterval(() => {
      setJourneyBeat((prev) => (prev + 1) % 5);
    }, 4200);
    return () => clearInterval(timer);
  }, [autoPlayJourney]);

  const handleSelectDemoPreset = (preset: DemoAccountPreset) => {
    setAuthTab("signin");
    setOrgIdInput(preset.organizationId);
    setUserIdInput(preset.userId);
    setPasswordInput(preset.passwordPlain);
    setAuthError(null);
    setAuthLocked(false);
    setAuthSuccessBanner(
      `Autofilled ${preset.personRole}: ${preset.userId} @ ${preset.organizationId} (${preset.roleBadge})`
    );
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessBanner(null);

    if (!orgIdInput.trim() || !userIdInput.trim() || !passwordInput.trim()) {
      setAuthError("Please enter Organization ID, User ID, and Password.");
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
        if (res.locked) {
          setAuthLocked(true);
        }
      } else {
        setAuthLocked(false);
        setAuthSuccessBanner("Authenticated! Launching isolated clinical workspace...");
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
      setAuthError("Please provide an Organization Name.");
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

  // Resolve matching preset or user for live Role Badge preview
  const matchedPreset = LANDING_DEMO_PRESETS.find(
    (p) =>
      p.organizationId.toUpperCase() === orgIdInput.trim().toUpperCase() &&
      p.userId.toLowerCase() === userIdInput.trim().toLowerCase()
  );
  const matchedStaffUser = users.find(
    (u) =>
      (u.organizationId || "").toUpperCase() === orgIdInput.trim().toUpperCase() &&
      u.id.toLowerCase() === userIdInput.trim().toLowerCase()
  );
  const previewRoleBadge =
    matchedPreset?.roleBadge ||
    (matchedStaffUser
      ? `${matchedStaffUser.title} (${matchedStaffUser.role.toUpperCase()})`
      : "Role verified upon organization sign-in");

  const PIPELINE_STEPS = [
    {
      step: "STEP 01",
      title: "5-Vital Bidirectional Field Check-In (↑ High & ↓ Low)",
      short: "BP, Heart Rate, Blood Glucose, Temp/SpO₂, Danger Signs & Overdue Gaps",
      detail:
        "ASHA & ANM workers capture 5 vital categories in rural homes or sub-centres. Every parameter is evaluated bidirectionally—catching both hypertensive crises (≥160/110) and hypotensive shock (<90/60), hyperglycaemia (>240) and hypoglycaemia (<70), fever (≥38.0°C) and hypothermia (<35.5°C), plus 3-visit rising trajectories (+28 pts).",
      badge: "5 Vitals ↑↓ + 3-Visit Trend",
      color: "red",
    },
    {
      step: "STEP 02",
      title: "QuickSort Pivot Engine (Pivot = 100 in ~242µs)",
      short: "Upper Partition (≥100 or NEWS2/MEOWS Override) vs Lower Partition (<100)",
      detail:
        "Hoare's in-place QuickSort partitions the active cohort around Pivot = 100 in ~242 microseconds. Score ≥ 100 or a single-parameter NEWS2/MEOWS red flag routes immediately to the Upper Partition (Red, 4-hour clinician SLA). Score < 100 routes to the Lower Partition (Green, staggered 50-min to 2-hour clinic windows between 09:00 and 17:00).",
      badge: "Pivot = 100 • O(n log n)",
      color: "emerald",
    },
    {
      step: "STEP 03",
      title: "30-Slot Clinic Matrix (15 / 5 / 10 Isolation)",
      short: "15 System Follow-Up • 5 Reserved Critical • 10 Protected Walk-In (100% Untouched)",
      detail:
        "Automated follow-up scheduling is strictly capped at 15 routine slots + 5 emergency buffer slots. The 10 Walk-In slots are hardware-isolated in software—ensuring regular villagers walking into the PHC with acute fever or injury are 100% untouched by system reminders.",
      badge: "10 Walk-In Slots 100% Protected",
      color: "emerald",
    },
    {
      step: "STEP 04",
      title: "5-Hexagon Overflow Broadcast or 108 Ambulance Bypass",
      short: "Atomic First-to-Accept Neighbor Lock or Tertiary Bypass to HEX-4 (GMCH & BBCI)",
      detail:
        "When the 31st critical patient arrives at a saturated clinic (20/20 system cap), SwasthyaSense broadcasts an encrypted H3 Ring-1 overflow request to neighboring clinics (HEX-1 Chhaygaon, HEX-2 Rani, HEX-3 Mirza). The first clinic to accept atomically locks the referral. Severe maternal eclampsia or neutropenic sepsis triggers a 108 Ambulance Bypass directly to HEX-4 (GMCH & BBCI Tertiary Hub).",
      badge: "H3 Ring-1 Mesh + 108 Bypass",
      color: "red",
    },
  ];

  const JOURNEY_BEATS = [
    {
      id: "a",
      label: "Beat A • Silent 3-Visit Trajectory",
      title: "Patient Dot & 3-Visit Rising BP (148 → 156 → 163 mmHg)",
      description:
        "PT-MAT-2001 (3rd-trimester maternal patient in Boko) misses her scheduled PHC checkup. SwasthyaSense correlates her 3-visit rising systolic trajectory (148 → 156 → 163 mmHg) with blurred vision—adding +28 trajectory points and firing a MEOWS severe preeclampsia override (Score = 135).",
      metric: "BP 148 → 156 → 163 mmHg (+28 Trajectory Bonus)",
      tiltX: 16,
      tiltY: -14,
      zoomZ: 10,
    },
    {
      id: "b",
      label: "Beat B • QuickSort Pivot = 100",
      title: "In-Place Hoare Partition Splits Red (≥100) vs Green (<100)",
      description:
        "In 242 microseconds, the QuickSort Pivot Line (100) bisects the 300-patient registry. Upper Partition (Red, Score ≥ 100) locks an immediate 4-hour Doctor SLA. Lower Partition (Green, Score < 100) assigns staggered 50-min to 2-hour windows across 09:00–17:00.",
      metric: "Pivot = 100 • 16 Immediate (Red) / 42 Flexible (Green)",
      tiltX: 10,
      tiltY: 12,
      zoomZ: 24,
    },
    {
      id: "c",
      label: "Beat C • 30-Slot Clinic Isolation",
      title: "15 Follow-Up / 5 Critical / 10 Walk-In ('100% Untouched')",
      description:
        "Inside HEX-0 Boko Central PHC, the 30 daily slots are partitioned into 15 System Follow-Up and 5 Reserved Critical slots. Even at peak triage load, all 10 Protected Walk-In slots glow emerald green—100% untouched for unscheduled village walk-ins.",
      metric: "15 System + 5 Critical | 10 Walk-In = 100% Untouched",
      tiltX: 22,
      tiltY: -6,
      zoomZ: 18,
    },
    {
      id: "d",
      label: "Beat D • 31st Critical Patient Hex Broadcast",
      title: "HEX-0 & HEX-1 Hit 100% → Neighbor HEX-2 Accepts & Locks",
      description:
        "When the 31st critical patient arrives and HEX-0 (Boko) & HEX-1 (Chhaygaon) reach 20/20 system capacity, an H3 Ring-1 overflow wave pulses outward to HEX-2 (Rani South-East) and HEX-3 (Mirza). HEX-2 accepts first, turning emerald green and atomically locking the slot!",
      metric: "HEX-0 Full (20/20) → Atomic Lock at HEX-2 (Rani PHC)",
      tiltX: 28,
      tiltY: 18,
      zoomZ: 30,
    },
    {
      id: "e",
      label: "Beat E • 108 Ambulance Tertiary Bypass",
      title: "Direct 108 Emergency Route to HEX-4 (GMCH & BBCI Hub)",
      description:
        "For post-chemotherapy neutropenic fever (PT-ONC-3004: 39.1°C, SpO₂ 91%) or eclampsia with no local PHC doctor on duty, SwasthyaSense bypasses rural sub-centres—dispatching a 108 Boat/Road Ambulance directly to HEX-4 (GMCH & BBCI Tertiary Care Hub) with an eSanjeevani tele-consult packet.",
      metric: "108 Tertiary Bypass → HEX-4 (GMCH & BBCI Guwahati)",
      tiltX: 14,
      tiltY: -20,
      zoomZ: 28,
    },
  ];

  const currentBeat = JOURNEY_BEATS[journeyBeat] || JOURNEY_BEATS[0];

  // Reusable Sign-In / Onboard Form Renderer
  const renderAuthCardContent = () => (
    <div
      className={`rounded-2xl border transition-all ${
        darkMode
          ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-2xl"
          : "bg-white border-slate-200/90 text-slate-900 shadow-xl shadow-slate-900/5"
      }`}
    >
      {/* Card Header Tabs */}
      <div
        className={`flex items-center justify-between border-b px-5 py-3.5 ${
          darkMode ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50/80"
        } rounded-t-2xl`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthTab("signin");
              setAuthError(null);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
              authTab === "signin"
                ? "bg-red-600 text-white shadow-sm"
                : darkMode
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Organization Sign-In
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("onboard");
              setAuthError(null);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
              authTab === "onboard"
                ? "bg-emerald-600 text-white shadow-sm"
                : darkMode
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              + Onboard New Org
            </span>
          </button>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <Lock className="w-3 h-3" /> RLS Isolated
        </span>
      </div>

      {authTab === "signin" ? (
        <form onSubmit={handleSignInSubmit} className="p-5 space-y-4">
          {/* 3 Simultaneous Demo Users Helper Panel */}
          <div
            className={`p-3 rounded-xl border ${
              darkMode
                ? "bg-slate-950/90 border-slate-800"
                : "bg-slate-50/90 border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                Simultaneous Multi-Tenant Demo Accounts
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                DEMO ONLY
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {LANDING_DEMO_PRESETS.map((preset) => {
                const isSelected =
                  orgIdInput.toUpperCase() === preset.organizationId &&
                  userIdInput.toLowerCase() === preset.userId;
                return (
                  <button
                    key={preset.userId}
                    type="button"
                    onClick={() => handleSelectDemoPreset(preset)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? darkMode
                          ? "bg-red-950/40 border-red-500/60 text-white"
                          : "bg-red-50/90 border-red-300 text-slate-900 shadow-xs"
                        : darkMode
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-red-600 font-mono">
                          {preset.userId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 font-mono font-semibold">
                          {preset.organizationId}
                        </span>
                        <span className="text-[11px] font-medium opacity-85 truncate">
                          • {preset.personRole}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold truncate mt-0.5">
                        {preset.roleBadge}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-800">
                      Autofill
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Organization ID Field */}
          <div>
            <label className="block text-xs font-bold mb-1.5">
              Organization ID / Tenant Block
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={orgIdInput}
                onChange={(e) => setOrgIdInput(e.target.value)}
                placeholder="e.g. ORG-BOKO or ORG-SEVAK"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
              <select
                aria-label="Select Healthcare Organization"
                value={
                  organizations.some(
                    (o) => o.id.toUpperCase() === orgIdInput.trim().toUpperCase()
                  )
                    ? orgIdInput.trim().toUpperCase()
                    : ""
                }
                onChange={(e) => {
                  if (!e.target.value) return;
                  const nextOrgId = e.target.value;
                  setOrgIdInput(nextOrgId);
                  const preset = LANDING_DEMO_PRESETS.find(
                    (p) => p.organizationId === nextOrgId
                  );
                  if (preset) {
                    setUserIdInput(preset.userId);
                    setPasswordInput(preset.passwordPlain);
                  } else {
                    const firstUser = users.find((u) => u.organizationId === nextOrgId);
                    const orgObj = organizations.find((o) => o.id === nextOrgId);
                    if (firstUser) setUserIdInput(firstUser.id);
                    if (orgObj) setPasswordInput(orgObj.accessPasscode);
                  }
                }}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-slate-200"
                    : "bg-slate-50 border-slate-300 text-slate-800"
                }`}
              >
                <option value="">Quick-Select Organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.id} — {org.shortName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User ID & Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5">
                Staff User ID
              </label>
              <input
                type="text"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="doc.boko01 / asha.sevak07"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">
                Password / Org Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resolved Role Badge Preview */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
              darkMode
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
            }`}
          >
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Role Badge:
            </span>
            <span className="font-bold text-right">{previewRoleBadge}</span>
          </div>

          {/* Error / Lockout / Success Feedback */}
          {authError && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                authLocked
                  ? "bg-red-950 text-red-200 border-red-600"
                  : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                {authLocked && (
                  <div className="font-extrabold uppercase tracking-wider text-red-500 mb-0.5">
                    HTTP 423 • ACCOUNT LOCKED AFTER 5 FAILED ATTEMPTS
                  </div>
                )}
                {authError}
              </div>
            </div>
          )}

          {authSuccessBanner && !authError && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccessBanner}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying Scrypt Hash & RLS Session...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Sign In & Launch Isolated Clinical Workspace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOnboardSubmit} className="p-5 space-y-3.5">
          <div className="text-xs text-slate-500">
            Provision a new multi-tenant healthcare organization with its own isolated PostgreSQL RLS patient registry and 15-worker frontline team.
          </div>
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
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Short Code</label>
              <input
                type="text"
                value={newOrgShort}
                onChange={(e) => setNewOrgShort(e.target.value)}
                placeholder="e.g. Gramin Trust"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">District / Block</label>
              <input
                type="text"
                value={newOrgDistrict}
                onChange={(e) => setNewOrgDistrict(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Org Passcode</label>
              <input
                type="text"
                value={newOrgPasscode}
                onChange={(e) => setNewOrgPasscode(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ASHA Team Size</label>
              <input
                type="number"
                min={1}
                max={200}
                value={newOrgTeamSize}
                onChange={(e) => setNewOrgTeamSize(Number(e.target.value) || 15)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white"
                    : "bg-white border-slate-300 text-slate-900"
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
                darkMode
                  ? "bg-slate-950 border-slate-800 text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            />
          </div>
          {authError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {authError}
            </div>
          )}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create Isolated Organization & Sign In
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
      }`}
    >
      {/* ===================================================================
          1. STICKY GLASS-BLUR TOP NAVIGATION BAR
      =================================================================== */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
          darkMode
            ? "bg-slate-950/85 border-slate-800/90"
            : "bg-white/90 border-slate-200/80"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
          {/* Brand Logo / Wordmark (Red / Green / White) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/25 relative">
              <HeartPulse className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">
                  Swasthya<span className="text-red-600">Sense</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  v2.5 Clinical Mesh
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Early-Warning • QuickSort Queue • 5-Hexagon Load Balancer
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold">
            <a
              href="#how-it-works"
              className="hover:text-red-600 transition-colors py-2"
            >
              {t.navHowItWorks}
            </a>
            <a
              href="#patient-journey-3d"
              className="hover:text-red-600 transition-colors py-2 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              {t.navJourney3D}
            </a>
            <a
              href="#hexagon-architecture"
              className="hover:text-red-600 transition-colors py-2"
            >
              {t.navHexArchitecture}
            </a>
            <a
              href="#security-dpdp"
              className="hover:text-red-600 transition-colors py-2"
            >
              {t.navSecurity}
            </a>
          </nav>

          {/* Right Controls: 7-Language Selector + Dark Mode + Auth Status / CTA */}
          <div className="flex items-center gap-2.5">
            {/* 7-Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select Language"
                value={selectedLanguage}
                onChange={(e) =>
                  onSelectLanguage(e.target.value as SupportedLanguage)
                }
                className={`pl-8 pr-2.5 py-2 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 text-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                {SUPPORTED_LANGUAGES.map((langObj) => (
                  <option key={langObj.code} value={langObj.code}>
                    {langObj.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Light / Dark Mode Button */}
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle Light or Dark Mode"
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                darkMode
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Session Active Pill OR Organization Sign-In CTA */}
            {isAuthenticated && currentUser && currentOrganization ? (
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                    darkMode
                      ? "bg-emerald-950/50 border-emerald-800 text-emerald-200"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left">
                    <div className="font-bold leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] opacity-80">
                      {currentOrganization.shortName} • Session Active
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign Out"
                  className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    darkMode
                      ? "border-slate-800 text-slate-300 hover:bg-slate-900"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
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
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {t.navLaunch}
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open Navigation Menu"
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-t px-4 py-4 space-y-3 ${
              darkMode
                ? "bg-slate-950 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col space-y-2 text-sm font-bold">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2"
              >
                {t.navHowItWorks}
              </a>
              <a
                href="#patient-journey-3d"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-red-600"
              >
                {t.navJourney3D}
              </a>
              <a
                href="#hexagon-architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2"
              >
                {t.navHexArchitecture}
              </a>
              <a
                href="#security-dpdp"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2"
              >
                {t.navSecurity}
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setLoginModalOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {t.navLaunch}
            </button>
          </div>
        )}
      </header>

      {/* ===================================================================
          2. HERO SECTION + LIVE MICRO-TELEMETRY TICKER + SIGN-IN PORTAL
      =================================================================== */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-24 border-b border-slate-200/70 dark:border-slate-800/80">
        {/* Subtle Clinical Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35 dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(220,38,38,0.16) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Live Micro-Telemetry Ticker Bar */}
          <div
            className={`mb-8 rounded-2xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 ${
              darkMode
                ? "bg-slate-900/90 border-slate-800"
                : "bg-slate-50/90 border-slate-200/90"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                LIVE TELEMETRY
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20">
                ⚡ ~242µs QuickSort Partition
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                🛡️ 15/5/10 Slot Isolation (10 Walk-In Untouched)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                ⬢ 5-Hexagon Clinic Mesh
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                🔒 AES-256-GCM + SHA-256 Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Product Headline, Value Prop, CTAs, Stylized Village-Clinic Hex Map */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-extrabold tracking-wide">
                <Activity className="w-3.5 h-3.5" />
                {t.badge}
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
                {t.heroTitle}{" "}
                <span className="text-red-600 underline decoration-emerald-500/60 decoration-wavy underline-offset-8">
                  {t.heroHighlight}
                </span>
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed max-w-2xl ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {t.heroSubtitle}
              </p>

              {/* Two Primary CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("signin");
                    setLoginModalOpen(true);
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/25 transition-all flex flex-col items-start cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    {t.ctaSignIn}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-medium text-red-100 mt-0.5">
                    {t.ctaSignInSub}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("onboard");
                    setLoginModalOpen(true);
                  }}
                  className={`px-5 py-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    darkMode
                      ? "border-emerald-500/60 text-emerald-400 hover:bg-emerald-950/40"
                      : "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {t.ctaOnboard}
                </button>
              </div>

              {/* Stylized Village-Clinic Hexagon Map & Patient Queue Illustration */}
              <div
                className={`p-5 rounded-2xl border ${
                  darkMode
                    ? "bg-slate-900/70 border-slate-800"
                    : "bg-slate-50/90 border-slate-200/90"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-red-600" />
                    Kamrup Rural 5-Hexagon Clinic Mesh & Trajectory Preview
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600">
                    Walk-In Protection: 10/10 Slots Free
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {[
                    {
                      hex: "HEX-0",
                      name: "Boko Central PHC",
                      org: "ORG-BOKO / SEVAK",
                      slots: "18/20 Sys • 10/10 Walk-In",
                      status: "amber",
                    },
                    {
                      hex: "HEX-1",
                      name: "Chhaygaon North",
                      org: "ORG-CHHAY",
                      slots: "14/20 Sys • 10/10 Walk-In",
                      status: "emerald",
                    },
                    {
                      hex: "HEX-2",
                      name: "Rani South-East",
                      org: "Ring-1 Neighbor",
                      slots: "9/20 Sys • Ready for Overflow",
                      status: "emerald",
                    },
                    {
                      hex: "HEX-3",
                      name: "Mirza South-West",
                      org: "Ring-1 Neighbor",
                      slots: "11/20 Sys • Ready for Overflow",
                      status: "emerald",
                    },
                    {
                      hex: "HEX-4",
                      name: "GMCH & BBCI Hub",
                      org: "Tertiary 108 Bypass",
                      slots: "24×7 ICU / Oncology / OBGYN",
                      status: "red",
                    },
                  ].map((node) => (
                    <div
                      key={node.hex}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        node.status === "red"
                          ? darkMode
                            ? "bg-red-950/40 border-red-700/60"
                            : "bg-red-50/80 border-red-200"
                          : node.status === "amber"
                          ? darkMode
                            ? "bg-amber-950/30 border-amber-700/50"
                            : "bg-amber-50/80 border-amber-200"
                          : darkMode
                          ? "bg-emerald-950/30 border-emerald-800/50"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-extrabold text-red-600">
                          {node.hex}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            node.status === "red"
                              ? "bg-red-600 animate-ping"
                              : node.status === "amber"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="font-bold text-xs mt-1 truncate">
                        {node.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {node.org}
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-emerald-600 mt-1">
                        {node.slots}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Embedded Multi-Tenant Organization Sign-In Card */}
            <div className="lg:col-span-5">{renderAuthCardContent()}</div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. THE PROBLEM STRIP (3 CONCISE CLINICAL REALITY CARDS)
      =================================================================== */}
      <section
        className={`py-14 border-b ${
          darkMode
            ? "bg-slate-900/50 border-slate-800"
            : "bg-slate-50/70 border-slate-200/70"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              THE FRONTLINE REALITY GAP
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              {t.problemHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-2xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-extrabold mb-4">
                01
              </div>
              <h3 className="text-lg font-extrabold mb-2">{t.problem1Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.problem1Body}
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-extrabold mb-4">
                02
              </div>
              <h3 className="text-lg font-extrabold mb-2">{t.problem2Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.problem2Body}
              </p>
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 font-mono text-xs font-bold">
                Visit 1: 148/92 → Visit 2: 156/98 → Visit 3: 163/106 mmHg
              </div>
            </div>

            <div
              className={`p-6 rounded-2xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold mb-4">
                03
              </div>
              <h3 className="text-lg font-extrabold mb-2">{t.problem3Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.problem3Body}
              </p>
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-mono text-xs font-bold">
                SwasthyaSense Solution: 15 Follow-Up / 5 Critical / 10 Walk-In
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. INTERACTIVE VISUAL PIPELINE (STEP 1 → STEP 4)
      =================================================================== */}
      <section
        id="how-it-works"
        className="py-16 lg:py-20 border-b border-slate-200/70 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                CLOSED-LOOP CLINICAL ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mt-1">
                Interactive 4-Stage Clinical Pipeline
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Click or hover any stage below to inspect how field vitals flow through the ~242µs QuickSort partition into the 30-slot clinic matrix.
            </p>
          </div>

          {/* Horizontal Stepper Selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {PIPELINE_STEPS.map((s, idx) => {
              const isActive = activePipelineStep === idx;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  onMouseEnter={() => setActivePipelineStep(idx)}
                  className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? s.color === "red"
                        ? "border-red-600 bg-red-50/60 dark:bg-red-950/30 shadow-md"
                        : "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-md"
                      : darkMode
                      ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        s.color === "red"
                          ? "bg-red-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {s.step}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive ? "rotate-90 text-red-600" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {s.short}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Expanded Step Detail & Animated Graphic */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-600/10 text-red-600 border border-red-600/20">
                  {PIPELINE_STEPS[activePipelineStep].badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold">
                  {PIPELINE_STEPS[activePipelineStep].title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {PIPELINE_STEPS[activePipelineStep].detail}
                </p>
              </div>

              <div className="lg:col-span-5">
                {activePipelineStep === 0 && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
                    <div className="font-bold text-slate-500 uppercase">
                      Bidirectional 5-Vital Check-In Vector
                    </div>
                    <div className="flex justify-between p-2 rounded bg-red-500/10 text-red-600 font-bold">
                      <span>1. BP: 163/106 mmHg (↑ Severe)</span>
                      <span>+28 Trend + Override</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-amber-500/10 text-amber-600 font-bold">
                      <span>2. Heart Rate: 114 bpm (↑ Tachy)</span>
                      <span>+20 pts</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                      <span>3. Glucose: 64 mg/dL (↓ Hypo)</span>
                      <span>+25 pts</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-red-500/10 text-red-600 font-bold">
                      <span>4. Temp 39.1°C / SpO₂ 91% (↓)</span>
                      <span>Hard Override ≥100</span>
                    </div>
                  </div>
                )}

                {activePipelineStep === 1 && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">QUICKSORT PIVOT = 100</span>
                      <span className="text-emerald-600 font-bold">~242 µs</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-600 text-white font-bold flex justify-between">
                      <span>Upper Partition (Score ≥ 100)</span>
                      <span>4-Hour Doctor SLA</span>
                    </div>
                    <div className="border-t-2 border-dashed border-red-500 py-1 text-center text-[11px] font-extrabold text-red-600">
                      ▲ PIVOT = 100 BOUNDARY ▼
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-600 text-white font-bold flex justify-between">
                      <span>Lower Partition (Score &lt; 100)</span>
                      <span>09:00–17:00 Staggered</span>
                    </div>
                  </div>
                )}

                {activePipelineStep === 2 && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="font-bold flex justify-between">
                      <span>30-Slot PHC Daily Matrix</span>
                      <span className="text-emerald-600 font-mono">15 / 5 / 10</span>
                    </div>
                    <div className="h-6 rounded-xl overflow-hidden flex font-mono text-[10px] font-extrabold text-white">
                      <div className="w-1/2 bg-amber-500 flex items-center justify-center">
                        15 FOLLOW-UP
                      </div>
                      <div className="w-1/6 bg-red-600 flex items-center justify-center">
                        5 CRIT
                      </div>
                      <div className="w-1/3 bg-emerald-600 flex items-center justify-center">
                        10 WALK-IN (FREE)
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ✓ 10 Walk-In slots are 100% Untouched by automated outreach.
                    </p>
                  </div>
                )}

                {activePipelineStep === 3 && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs font-mono">
                    <div className="p-2 rounded bg-red-500/10 text-red-600 font-bold">
                      HEX-0 Boko PHC: 20/20 System Cap (31st Patient Arrives)
                    </div>
                    <div className="p-2 rounded bg-emerald-500/15 text-emerald-600 font-bold">
                      → Ring-1 Broadcast → HEX-2 Rani Accepts & Atomically Locks!
                    </div>
                    <div className="p-2 rounded bg-red-600 text-white font-bold">
                      → Severe Eclampsia / Oncology → 108 Bypass to HEX-4 (GMCH)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. SIGNATURE SCROLL-DRIVEN 3D "PATIENT JOURNEY" STAGE
      =================================================================== */}
      <section
        id="patient-journey-3d"
        ref={journeySectionRef}
        className={`py-16 lg:py-24 border-b transition-colors ${
          darkMode
            ? "bg-slate-950 border-slate-800"
            : "bg-slate-900 text-white border-slate-800"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                SCROLL-DRIVEN 3D TELEMETRY STAGE
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                3D Patient Journey: From Silent Trend to Hexagonal Rescue
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoPlayJourney((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {autoPlayJourney ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-emerald-400" /> Auto-Scrubbing (Pause)
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-red-400" /> Resume Auto-Scrub
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 5 Scroll Beat Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {JOURNEY_BEATS.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setAutoPlayJourney(false);
                  setJourneyBeat(idx);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  journeyBeat === idx
                    ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30"
                    : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <div className="font-mono text-[10px] font-extrabold uppercase opacity-90">
                  {b.label}
                </div>
                <div className="font-bold text-xs mt-1 line-clamp-1">
                  {b.title}
                </div>
              </button>
            ))}
          </div>

          {/* 3D Perspective Stage Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 7 Columns: GPU-Accelerated CSS 3D Hexagonal Mesh Stage */}
            <div
              className="lg:col-span-7 relative rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-10 overflow-hidden min-h-[420px] flex items-center justify-center"
              style={{ perspective: "1200px" }}
            >
              {/* Layer 1 (Background): Parallax Coordinate Grid */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none transition-transform duration-700"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                  transform: `rotateX(${currentBeat.tiltX * 0.6}deg) rotateY(${
                    currentBeat.tiltY * 0.4
                  }deg) scale(1.1)`,
                }}
              />

              {/* Layer 2 & 3: 3D Tilted Plane with 5 Hexagon Clinics + Floating Vitals */}
              <div
                className="relative w-full max-w-xl transition-transform duration-700 ease-out"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${currentBeat.tiltX}deg) rotateY(${currentBeat.tiltY}deg) translateZ(${currentBeat.zoomZ}px)`,
                }}
              >
                {/* Floating Vitals Midground Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border transition-all ${
                      journeyBeat === 0
                        ? "bg-red-600 text-white border-red-400 scale-105 shadow-lg shadow-red-600/40"
                        : "bg-slate-900/90 text-red-400 border-slate-700"
                    }`}
                  >
                    ● PT-MAT-2001 BP: 148 → 156 → 163 mmHg
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border transition-all ${
                      journeyBeat === 1
                        ? "bg-emerald-600 text-white border-emerald-400 scale-105 shadow-lg"
                        : "bg-slate-900/90 text-emerald-400 border-slate-700"
                    }`}
                  >
                    ⚡ QuickSort Pivot = 100 (~242µs)
                  </div>
                </div>

                {/* Beat B QuickSort Partition Laser Line */}
                {journeyBeat === 1 && (
                  <div className="mb-4 p-3 rounded-xl bg-red-600/20 border-2 border-dashed border-red-500 text-center font-mono text-xs font-extrabold text-red-300 animate-pulse">
                    ═══ QUICKSORT PIVOT = 100 SPLIT: UPPER RED (≥100) vs LOWER GREEN (&lt;100) ═══
                  </div>
                )}

                {/* Beat C 30-Slot 3D Segmented Bar */}
                {journeyBeat === 2 && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-2">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-amber-400">15 System Follow-Up</span>
                      <span className="text-red-400">5 Critical</span>
                      <span className="text-emerald-400">
                        10 Walk-In (100% Untouched)
                      </span>
                    </div>
                    <div className="h-5 rounded-xl overflow-hidden flex font-mono text-[10px] font-extrabold">
                      <div className="w-1/2 bg-amber-500 text-slate-950 flex items-center justify-center">
                        15 SYS
                      </div>
                      <div className="w-1/6 bg-red-600 text-white flex items-center justify-center">
                        5 CRIT
                      </div>
                      <div className="w-1/3 bg-emerald-500 text-slate-950 flex items-center justify-center animate-pulse">
                        10 WALK-IN FREE
                      </div>
                    </div>
                  </div>
                )}

                {/* 5 Hexagonal Clinic Nodes in 3D Space */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* HEX-0 Boko Central PHC */}
                  <div
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      journeyBeat === 3
                        ? "bg-red-950/90 border-red-500 shadow-lg shadow-red-600/30"
                        : "bg-slate-900/90 border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-red-400">
                        HEX-0 • BOKO PHC
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                        {journeyBeat === 3 ? "20/20 FULL" : "18/20 SYS"}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      Boko Central PHC
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      Walk-In: 10/10 Untouched
                    </div>
                  </div>

                  {/* HEX-1 Chhaygaon North */}
                  <div
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      journeyBeat === 3
                        ? "bg-red-950/90 border-red-500 shadow-lg shadow-red-600/30"
                        : "bg-slate-900/90 border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-amber-400">
                        HEX-1 • CHHAYGAON
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {journeyBeat === 3 ? "20/20 FULL" : "14/20 SYS"}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      Chhaygaon North PHC
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      Walk-In: 10/10 Untouched
                    </div>
                  </div>

                  {/* HEX-2 Rani South-East (First-to-Accept Neighbor) */}
                  <div
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      journeyBeat === 3
                        ? "bg-emerald-950/90 border-emerald-400 scale-105 shadow-xl shadow-emerald-500/30"
                        : "bg-slate-900/90 border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-emerald-400">
                        HEX-2 • RANI PHC
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        {journeyBeat === 3 ? "LOCKED ✓" : "9/20 SYS"}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      Rani South-East
                    </div>
                    <div className="text-[11px] text-emerald-300 font-mono mt-1">
                      {journeyBeat === 3
                        ? "⚡ Accepted 31st Patient!"
                        : "Ring-1 Neighbor Ready"}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: HEX-3 Mirza & HEX-4 GMCH Tertiary Hub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-3.5 rounded-2xl border border-slate-700 bg-slate-900/90">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-slate-300">
                        HEX-3 • MIRZA SOUTH-WEST
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        11/20 SYS • Standby
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Secondary Ring-1 Neighbor • Auto-released when HEX-2 locks
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border-2 transition-all ${
                      journeyBeat === 4
                        ? "bg-red-950 border-red-400 scale-105 shadow-xl shadow-red-600/40"
                        : "bg-slate-900/90 border-red-900/60"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-red-400 flex items-center gap-1">
                        <Ambulance className="w-3.5 h-3.5" /> HEX-4 • GMCH & BBCI
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-mono font-bold">
                        108 BYPASS
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      Guwahati Tertiary Care Hub
                    </div>
                    <div className="text-[11px] text-red-300 font-mono mt-0.5">
                      {journeyBeat === 4
                        ? "🚑 108 Route Active (Eclampsia / Oncology)"
                        : "24×7 Maternal & Oncology Escalation"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Active Beat Narrative & Live Telemetry Card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-extrabold">
                  {currentBeat.label}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {currentBeat.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentBeat.description}
                </p>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 font-bold">
                  {currentBeat.metric}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setJourneyBeat((prev) => (prev - 1 + 5) % 5)
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    ← Previous Beat
                  </button>
                  <span className="font-mono text-xs text-slate-400">
                    Beat {journeyBeat + 1} of 5
                  </span>
                  <button
                    type="button"
                    onClick={() => setJourneyBeat((prev) => (prev + 1) % 5)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white cursor-pointer"
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
          6. CORE CAPABILITIES (THE 5 PILLARS)
      =================================================================== */}
      <section
        id="hexagon-architecture"
        className="py-16 lg:py-24 border-b border-slate-200/70 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              FIVE ARCHITECTURAL PILLARS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-1">
              Built for Frontline Scale, Clinical Rigor & Zero Clinic Overload
            </h2>
          </div>

          {/* PILLAR 1 & PILLAR 3 ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pillar 1: Multi-Organization Sign-In & Strict Tenant Isolation */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-mono text-xs font-extrabold">
                  PILLAR 01 • MULTI-TENANT RLS
                </span>
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">
                Multi-Organization Sign-In & Strict Tenant Isolation
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Healthcare organizations (Sevak Health Foundation, Boko Central PHC, Chhaygaon North, Kamrup Rural NHM, Arogya Trust) sign in with scoped credentials. Frontline teams collaborate internally via{" "}
                <strong className="text-slate-900 dark:text-white">
                  &ldquo;My Assigned Patients&rdquo;
                </strong>{" "}
                vs{" "}
                <strong className="text-slate-900 dark:text-white">
                  &ldquo;All Organization Team&rdquo;
                </strong>
                , while cross-organization access is blocked with{" "}
                <code className="text-red-600 font-bold">
                  403 Not your organization
                </code>{" "}
                and PostgreSQL Row-Level Security.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5">
                <div className="text-emerald-600 font-bold">
                  ✓ asha.sevak07 @ ORG-SEVAK → 260 Sevak Patients (58 Assigned)
                </div>
                <div className="text-emerald-600 font-bold">
                  ✓ doc.boko01 @ ORG-BOKO → Isolated Boko PHC Cohort
                </div>
                <div className="text-red-600 font-bold">
                  ✗ Cross-Tenant Read Attempt → HTTP 403 Blocked + SHA-256 Logged
                </div>
              </div>
            </div>

            {/* Pillar 3: 30-Slot Clinic Capacity Isolation & Closed-Loop Reclamation */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-mono text-xs font-extrabold">
                  PILLAR 03 • 30-SLOT ISOLATION (15 / 5 / 10)
                </span>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">
                30-Slot Clinic Matrix & Closed-Loop Slot Reclamation
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Every 30-slot PHC is partitioned into{" "}
                <strong>15 System Follow-Up</strong>,{" "}
                <strong>5 Reserved Critical</strong>, and{" "}
                <strong className="text-emerald-600">
                  10 Protected Walk-In Slots (100% Untouched)
                </strong>
                . Test the live slot reclamation loop below:
              </p>

              {/* Interactive Slot Simulator */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="font-extrabold text-amber-600 text-base">
                      {simFollowUpUsed}/15
                    </div>
                    <div className="text-[10px]">System Follow-Up</div>
                  </div>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="font-extrabold text-red-600 text-base">
                      {simCriticalUsed}/5
                    </div>
                    <div className="text-[10px]">Reserved Critical</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
                    <div className="font-extrabold text-emerald-600 text-base">
                      10/10 FREE
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      100% Untouched
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSimFollowUpUsed((v) => Math.min(15, v + 1))
                    }
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                  >
                    + Register Patient (Book Slot)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimFollowUpUsed((v) => Math.max(0, v - 1));
                      setSimCriticalUsed((v) => Math.max(0, v - 1));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    ✓ Clear / Stabilize Patient (Reclaim Slot)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PILLAR 2: 5-CATEGORY BIDIRECTIONAL CLINICAL ENGINE TABLE */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border ${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-mono text-xs font-extrabold">
                PILLAR 02 • 5-CATEGORY BIDIRECTIONAL ENGINE + QUICKSORT PIVOT = 100
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600">
                NEWS2 (Royal College of Physicians) + MEOWS Maternal Standards
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold mb-4">
              Bidirectional Vital Thresholds (High ↑ & Low ↓) + 3-Visit Trajectory Bonus
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b font-mono uppercase ${
                      darkMode
                        ? "border-slate-800 text-slate-400"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <th className="py-3 pr-4">Clinical Category</th>
                    <th className="py-3 px-4">High Danger (↑)</th>
                    <th className="py-3 px-4">Low Danger (↓)</th>
                    <th className="py-3 pl-4">Trajectory / Hard Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="py-3 pr-4 font-bold">
                      1. Blood Pressure (Systolic / Diastolic)
                    </td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      ≥160/110 Severe (+40) • MEOWS ≥140/90 (+25)
                    </td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      &lt;90/60 Hypotensive Shock (+40)
                    </td>
                    <td className="py-3 pl-4 font-mono text-emerald-600 font-bold">
                      3-Visit Rising (148→156→163): +28 pts + Override
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold">2. Heart Rate (Pulse)</td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      &gt;130 Extreme (+35) • &gt;110 Tachycardia (+20)
                    </td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      &lt;40 Severe Bradycardia • &lt;50 (+30)
                    </td>
                    <td className="py-3 pl-4 font-mono">
                      NEWS2 Single-Parameter Red Flag → Score ≥ 100
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold">
                      3. Blood Glucose (Random / Capillary)
                    </td>
                    <td className="py-3 px-4 text-amber-600 font-mono">
                      &gt;300 DKA Risk (+35) • &gt;240 Hyper (+20)
                    </td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      &lt;54 Neuroglycopenia • &lt;70 Hypo (+35)
                    </td>
                    <td className="py-3 pl-4 font-mono text-emerald-600 font-bold">
                      3-Visit Rising Glucose Trend: +18 pts
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold">
                      4. Temperature & Oxygen (SpO₂)
                    </td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      ≥39.0°C High Fever (+30) • ≥38.0°C (+20)
                    </td>
                    <td className="py-3 px-4 text-red-600 font-mono">
                      &lt;35.5°C Hypothermia • SpO₂ &lt;93% Hypoxia
                    </td>
                    <td className="py-3 pl-4 font-mono text-red-600 font-bold">
                      Oncology + Fever ≥38°C → Neutropenic Override
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold">
                      5. Danger Symptoms & Overdue Gaps
                    </td>
                    <td className="py-3 px-4 font-mono">
                      Blurred Vision, Chest Pain, Bleeding, Rigors
                    </td>
                    <td className="py-3 px-4 font-mono">
                      &gt;14d Overdue (+20) • &gt;7d Overdue (+12)
                    </td>
                    <td className="py-3 pl-4 font-mono text-amber-600 font-bold">
                      2× Missed Follow-Up = Automatic Amber Escalation
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PILLAR 4 & PILLAR 5 ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pillar 4: Interactive 5-Hexagon Overflow & 108 Ambulance Bypass */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-mono text-xs font-extrabold">
                  PILLAR 04 • 5-HEXAGON MESH & 108 BYPASS
                </span>
                <Radio className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">
                H3 Hexagonal Overflow, 108 Bypass & eSanjeevani Fallback
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Simulate what happens when the 31st critical patient arrives at a full clinic or when the local PHC doctor is off-duty:
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setHexOverflowState("locked_hex2")}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Simulate 31st Patient → HEX-2 Lock
                </button>
                <button
                  type="button"
                  onClick={() => setHexOverflowState("ambulance_hex4")}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                >
                  🚑 Trigger 108 Bypass to HEX-4
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDoctorUnavailablePreview((prev) => !prev)
                  }
                  className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    doctorUnavailablePreview
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {doctorUnavailablePreview
                    ? "Doctor Away: eSanjeevani Active"
                    : "Toggle Doctor Unavailable"}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2">
                {hexOverflowState === "locked_hex2" ? (
                  <div className="text-emerald-600 font-bold">
                    ✓ HEX-0 (20/20) & HEX-1 (20/20) Full → Broadcast to Ring-1 → HEX-2 (Rani South-East) Accepted First & Atomically Locked! (10/10 Walk-In Untouched).
                  </div>
                ) : hexOverflowState === "ambulance_hex4" ? (
                  <div className="text-red-600 font-bold">
                    🚑 108 AMBULANCE BYPASS DISPATCHED: Severe Eclampsia / Neutropenic Fever routed directly to HEX-4 (GMCH & BBCI Tertiary Hub).
                  </div>
                ) : (
                  <div className="text-slate-500">
                    Mesh Status: Normal • HEX-0, HEX-1, HEX-2, HEX-3 connected to HEX-4 Tertiary Hub.
                  </div>
                )}
                {doctorUnavailablePreview && (
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                    📡 Local PHC Doctor Off-Duty: Automated ANM Stabilization Checklist + eSanjeevani Tele-MO Handoff Activated!
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 5: 7 Regional Languages, 1/2/STOP Reply Loop & DPDP Consent */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-mono text-xs font-extrabold">
                  PILLAR 05 • 7 LANGUAGES & DPDP CONSENT
                </span>
                <PhoneCall className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">
                7 Regional Languages (`1 / 2 / STOP`) & DPDP Consent Gate
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Staggered outreach in Assamese, Bengali, Hindi, Tamil, Telugu, Marathi, and English with zero-literacy{" "}
                <code>1 / 2 / STOP</code> reply parsing:
              </p>

              <div className="flex gap-2 mb-3">
                {(["1", "2", "STOP"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setPreviewSmsReply(code)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border cursor-pointer ${
                      previewSmsReply === code
                        ? code === "STOP"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-emerald-600 text-white border-emerald-600"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    Reply &ldquo;{code}&rdquo;
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs">
                {previewSmsReply === "1" && (
                  <div className="text-emerald-600 font-bold">
                    Reply &ldquo;1&rdquo; (Confirm): Slot confirmed in staggered window (11:30–12:20) at Boko Central PHC.
                  </div>
                )}
                {previewSmsReply === "2" && (
                  <div className="text-amber-600 font-bold">
                    Reply &ldquo;2&rdquo; (Reschedule): Automatically shifted to next-day afternoon window (14:00–15:30) without crowding morning clinic hours.
                  </div>
                )}
                {previewSmsReply === "STOP" && (
                  <div className="text-red-600 font-bold">
                    Reply &ldquo;STOP&rdquo; (DPDP Act 2023 Withdrawal): Consent immediately revoked, AES-256-GCM phone masked to [LOCKED — CONSENT WITHDRAWN], all future outreach halted.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          7. SECURITY, PRIVACY & CLINICAL SAFETY SECTION (6 BADGES)
      =================================================================== */}
      <section
        id="security-dpdp"
        className={`py-16 border-b ${
          darkMode
            ? "bg-slate-900/40 border-slate-800"
            : "bg-slate-50/80 border-slate-200/80"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              CRYPTOGRAPHIC GOVERNANCE & SAFETY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              DPDP Act 2023 Compliance & Non-Diagnostic Guardrails
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Non-Diagnostic Decision Support",
                desc: "Displays 'DECISION-SUPPORT ONLY • NOT A DIAGNOSTIC DEVICE' across all clinician & ASHA views. Never prescribes medications.",
                badge: "CDSCO / WHO Aligned",
              },
              {
                title: "AES-256-GCM Phone PII Encryption",
                desc: "Patient phone numbers are encrypted at rest using Node crypto AES-256-GCM with random IV and authentication tags.",
                badge: "AES-256-GCM",
              },
              {
                title: "Strict RBAC & PostgreSQL RLS",
                desc: "Supervisors, Clinicians, and Admins receive HTTP 403 Forbidden if they attempt to decrypt raw patient phone numbers.",
                badge: "HTTP 403 Gate",
              },
              {
                title: "SHA-256 Tamper-Evident Audit Chain",
                desc: "Every read, check-in, 403 denial, and hex overflow links prevHash → entryHash in an immutable cryptographic ledger.",
                badge: "SHA-256 Verified",
              },
              {
                title: "DPDP Consent Gate (STOP Lock)",
                desc: "One-step consent revocation locks the patient record to a minimal stub and blocks check-ins & outreach immediately.",
                badge: "DPDP Act 2023",
              },
              {
                title: "4-Hour SLA Escalation Watchdog",
                desc: "Idempotent background jobs monitor Upper Partition (≥100) cases and escalate unreviewed alerts to the Block Supervisor.",
                badge: "4h SLA Watchdog",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`p-5 rounded-2xl border ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          8. PROPER 4-COLUMN FOOTER + SIMULTANEOUS LIVE SESSIONS BAR
      =================================================================== */}
      <footer
        className={`pt-14 pb-10 ${
          darkMode ? "bg-slate-950 text-slate-400" : "bg-slate-900 text-slate-300"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Simultaneous Active Multi-Tenant Sessions Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <div className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Live Multi-Tenant Sessions ({activeSessions.length} Simultaneous Active Tenants)
                </div>
                <div className="text-[11px] text-slate-400">
                  Independent HMAC-SHA256 session tokens • No single-session lock • Instant demo switching
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
                  <span className="font-mono font-bold text-white">
                    {ses.userId}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                    {ses.orgId}
                  </span>
                  <span className="text-[11px] text-emerald-400 hidden sm:inline">
                    {ses.roleBadge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Column Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-base">
                  Swasthya<span className="text-red-500">Sense</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Non-diagnostic clinical early-warning, ~242µs QuickSort queue partitioning, and 5-Hexagon clinic load-balancing for rural and semi-urban healthcare teams.
              </p>
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800/50 text-[11px] text-red-300 font-semibold">
                DECISION-SUPPORT ONLY • NOT A DIAGNOSTIC DEVICE
              </div>
            </div>

            {/* Col 2: Product Architecture */}
            <div className="space-y-2 text-xs">
              <div className="font-extrabold text-white uppercase tracking-wider mb-2">
                Clinical Platform
              </div>
              <div>
                <a href="#how-it-works" className="hover:text-white">
                  5-Category Bidirectional Engine
                </a>
              </div>
              <div>
                <a href="#how-it-works" className="hover:text-white">
                  QuickSort Pivot = 100 (~242µs)
                </a>
              </div>
              <div>
                <a href="#patient-journey-3d" className="hover:text-white">
                  Scroll-Driven 3D Patient Journey
                </a>
              </div>
              <div>
                <a href="#hexagon-architecture" className="hover:text-white">
                  30-Slot Matrix (15 / 5 / 10)
                </a>
              </div>
              <div>
                <a href="#hexagon-architecture" className="hover:text-white">
                  5-Hexagon Overflow & 108 Bypass
                </a>
              </div>
            </div>

            {/* Col 3: Governance & Standards */}
            <div className="space-y-2 text-xs">
              <div className="font-extrabold text-white uppercase tracking-wider mb-2">
                Governance & Compliance
              </div>
              <div>DPDP Act 2023 Consent Gate</div>
              <div>AES-256-GCM Phone PII Encryption</div>
              <div>SHA-256 Hash-Chained Audit Ledger</div>
              <div>PostgreSQL Row-Level Security (RLS)</div>
              <div>NEWS2 & MEOWS Clinical Protocols</div>
            </div>

            {/* Col 4: Quick Launch & Theme/Language */}
            <div className="space-y-3 text-xs">
              <div className="font-extrabold text-white uppercase tracking-wider mb-2">
                Portal Access
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Sign In to Clinical Portal
              </button>
              <button
                type="button"
                onClick={onEnterWorkspace}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Open Interactive Scenario Lab
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              © 2026 SwasthyaSense Clinical Mesh • Kamrup Rural & Guwahati Tertiary Network
            </div>
            <div className="font-mono">
              300 Synthetic Patients • Zero Real PII • 15/15 Automated Verification Suite
            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================================
          MODAL: ORGANIZATION SIGN-IN / ONBOARD NEW HEALTHCARE ORG
      =================================================================== */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg">
            <button
              type="button"
              onClick={() => setLoginModalOpen(false)}
              aria-label="Close Sign-In Modal"
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-900 text-white border border-slate-700 flex items-center justify-center hover:bg-red-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {renderAuthCardContent()}
          </div>
        </div>
      )}
    </div>
  );
}

