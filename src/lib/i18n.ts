export type SupportedLanguage = "en" | "hi" | "as" | "bn" | "ta" | "te" | "mr";

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", region: "Global / Pan-India" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "North & Central India" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", region: "Assam & Northeast" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "East India & Bengal" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "South India (TN)" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "South India (AP/TG)" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "West India (MH)" },
];

export const UI_TRANSLATIONS: Record<
  SupportedLanguage,
  {
    appTitle: string;
    appSubtitle: string;
    safetyBanner: string;
    syntheticBadge: string;
    emergencyNotice: string;
    worklistTitle: string;
    hexMeshTitle: string;
    quicksortTitle: string;
    slotAllocationTitle: string;
    whyFlagged: string;
    sendReminder: string;
    logCheckin: string;
    escalateClinician: string;
    dispatchAmbulance: string;
    broadcastHexagon: string;
    aboveThresholdImmediate: string;
    belowThresholdFlexible: string;
    protectedWalkIn: string;
    classReminder: string;
    classMissed: string;
    classClinical: string;
    cohortHypertension: string;
    cohortDiabetes: string;
    cohortPregnancy: string;
    cohortPostIllness: string;
    consentActive: string;
    consentWithdrawn: string;
  }
> = {
  en: {
    appTitle: "SWASTHYA SENSE",
    appSubtitle: "Early Warning, Follow-Up & Hexagonal Clinic Mesh Platform",
    safetyBanner:
      "PROTOTYPE DECISION-SUPPORT ONLY • NOT A DIAGNOSTIC DEVICE • CLINICIAN OVERSIGHT REQUIRED ON EVERY ALERT",
    syntheticBadge: "100% SYNTHETIC DATA",
    emergencyNotice:
      "Emergency Protocol: SWASTHYA SENSE is not an emergency service. For life-threatening emergencies, initiate Rapid Ambulance (108 / Rapid Response) and local emergency protocol immediately.",
    worklistTitle: "QuickSort Ranked Daily Worklist",
    hexMeshTitle: "5-Village Hexagonal Clinic Mesh & Overflow Router",
    quicksortTitle: "5-Category QuickSort Threshold Engine",
    slotAllocationTitle: "30-Slot Clinic Isolator (15 System • 5 Critical • 10 Walk-In)",
    whyFlagged: "Why Flagged (Explainable Rule Trace)",
    sendReminder: "Send SMS / WhatsApp",
    logCheckin: "Log 5-Vital Check-In",
    escalateClinician: "Escalate to Clinician",
    dispatchAmbulance: "Dispatch Rapid Ambulance",
    broadcastHexagon: "Broadcast to Adjacent Hex Clinics",
    aboveThresholdImmediate: "≥ Threshold (Immediate Intervention Slot)",
    belowThresholdFlexible: "< Threshold (Flexible 50m–2h Clinic Window)",
    protectedWalkIn: "Protected Walk-In Slots (Untouched by System)",
    classReminder: "Blue • Administrative Reminder",
    classMissed: "Amber • Missed Follow-Up (×2)",
    classClinical: "Red • Needs Clinician Review",
    cohortHypertension: "Hypertension",
    cohortDiabetes: "Diabetes",
    cohortPregnancy: "High-Risk Pregnancy",
    cohortPostIllness: "Post-Illness / Oncology Recovery",
    consentActive: "Consent Active",
    consentWithdrawn: "Consent Withdrawn (Locked Stub)",
  },
  hi: {
    appTitle: "स्वास्थ्य सेंस (SWASTHYA SENSE)",
    appSubtitle: "प्रारंभिक चेतावनी, फॉलो-अप और हेक्सागोनल क्लिनिक नेटवर्क",
    safetyBanner:
      "प्रोटोटाइप सहायता प्रणाली • यह रोग निदान (Diagnosis) नहीं करता • हर क्लिनिकल अलर्ट पर डॉक्टर की देखरेख अनिवार्य है",
    syntheticBadge: "100% सिंथेटिक डेटा",
    emergencyNotice:
      "आपातकालीन सूचना: गंभीर स्थिति में तुरंत रैपिड एम्बुलेंस (108) और स्थानीय आपातकालीन प्रोटोकॉल शुरू करें।",
    worklistTitle: "क्विक-सॉर्ट (QuickSort) दैनिक प्राथमिकता सूची",
    hexMeshTitle: "5-गाँव हेक्सागोनल क्लिनिक मेश और ओवरफ्लो राउटर",
    quicksortTitle: "5-श्रेणी क्विक-सॉर्ट थ्रेशोल्ड इंजन",
    slotAllocationTitle: "30-स्लॉट क्लिनिक विभाजन (15 सिस्टम • 5 क्रिटिकल • 10 वॉक-इन)",
    whyFlagged: "क्यों चिह्नित किया गया (स्पष्ट नियम विवरण)",
    sendReminder: "SMS / WhatsApp रिमाइंडर भेजें",
    logCheckin: "5-वाइटल चेक-इन दर्ज करें",
    escalateClinician: "डॉक्टर को एस्केलेट करें",
    dispatchAmbulance: "रैपिड एम्बुलेंस भेजें",
    broadcastHexagon: "पड़ोसी हेक्सागोन क्लिनिक को भेजें",
    aboveThresholdImmediate: "≥ थ्रेशोल्ड (तत्काल प्राथमिकता स्लॉट)",
    belowThresholdFlexible: "< थ्रेशोल्ड (50 मिनट–2 घंटे का लचीला समय)",
    protectedWalkIn: "सुरक्षित वॉक-इन स्लॉट (सामान्य मरीजों के लिए सुरक्षित)",
    classReminder: "नीला • सामान्य रिमाइंडर",
    classMissed: "पीला • लगातार छूटा फॉलो-अप",
    classClinical: "लाल • डॉक्टर की समीक्षा आवश्यक",
    cohortHypertension: "उच्च रक्तचाप (BP)",
    cohortDiabetes: "मधुमेह (Diabetes)",
    cohortPregnancy: "उच्च-जोखिम गर्भावस्था",
    cohortPostIllness: "गंभीर बीमारी / कैंसर रिकवरी",
    consentActive: "सहमति सक्रिय",
    consentWithdrawn: "सहमति वापस ली गई (लॉक)",
  },
  as: {
    appTitle: "স্বাস্থ্য চেন্স (SWASTHYA SENSE)",
    appSubtitle: "আগজাননী, ফ’ল’-আপ আৰু হেক্সাগনেল ক্লিনিক নেটৱৰ্ক",
    safetyBanner:
      "প্ৰট’টাইপ সহায়ক ব্যৱস্থা • ই ৰোগ নিৰ্ণয় নকৰে • প্ৰতিটো সতৰ্কবাণীত চিকিৎসকৰ নিৰীক্ষণ বাধ্যতামূলক",
    syntheticBadge: "১০০% কৃত্ৰিম তথ্য",
    emergencyNotice:
      "জৰুৰীকালীন জাননী: সংকটজনক অৱস্থাত তৎক্ষণাত দ্ৰুত এম্বুলেন্স (108) আৰু জৰুৰীকালীন ব্যৱস্থা গ্ৰহণ কৰক।",
    worklistTitle: "কুইক-চৰ্ট (QuickSort) দৈনিক কৰ্মসূচী",
    hexMeshTitle: "৫-খন গাঁৱৰ হেক্সাগনেল ক্লিনিক জাল",
    quicksortTitle: "৫-বিভাগ কুইক-চৰ্ট থ্ৰেছহ’ল্ড ইঞ্জিন",
    slotAllocationTitle: "৩০-টা শ্লট বিভাজন (১৫ চিষ্টেম • ৫ জৰুৰী • ১০ সাধাৰণ ৰোগী)",
    whyFlagged: "কিয় ফ্লেগ কৰা হৈছে (নিয়মৰ ব্যাখ্যা)",
    sendReminder: "SMS / WhatsApp পঠিয়াওক",
    logCheckin: "স্বাস্থ্য পৰীক্ষা নথিভুক্ত কৰক",
    escalateClinician: "চিকিৎসকলৈ প্ৰেৰণ কৰক",
    dispatchAmbulance: "দ্ৰুত এম্বুলেন্স পঠিয়াওক",
    broadcastHexagon: "কাষৰীয়া হেক্সাগন ক্লিনিকলৈ পঠিয়াওক",
    aboveThresholdImmediate: "≥ থ্ৰেছহ’ল্ড (তাৎক্ষণিক চিকিৎসা শ্লট)",
    belowThresholdFlexible: "< থ্ৰেছহ’ল্ড (৫০ মি.–২ ঘণ্টাৰ নমনীয় সময়)",
    protectedWalkIn: "সংৰক্ষিত সাধাৰণ শ্লট (চিষ্টেমৰ দ্বাৰা অপৰিৱৰ্তিত)",
    classReminder: "নীলা • স্মাৰক",
    classMissed: "হালধীয়া • অনুপস্থিত ফ’ল’-আপ",
    classClinical: "ৰঙা • চিকিৎসকৰ পৰ্যালোচনা প্ৰয়োজন",
    cohortHypertension: "উচ্চ ৰক্তচাপ",
    cohortDiabetes: "মধুমেহ (ডায়েবেটিছ)",
    cohortPregnancy: "গৰ্ভাৱস্থাৰ বিপদাপন্নতা",
    cohortPostIllness: "কেন্সাৰ / জটিল ৰোগৰ পিছৰ আৰোগ্য",
    consentActive: "সন্মতি সক্ৰিয়",
    consentWithdrawn: "সন্মতি প্ৰত্যাহাৰ (লক কৰা হৈছে)",
  },
  bn: {
    appTitle: "স্বাস্থ্য সেন্স (SWASTHYA SENSE)",
    appSubtitle: "প্রাথমিক সতর্কতা, ফলো-আপ ও হেক্সাগোনাল ক্লিনিক নেটওয়ার্ক",
    safetyBanner:
      "প্রোটোটাইপ সহায়ক ব্যবস্থা • এটি রোগ নির্ণয় করে না • প্রতিটি ক্লিনিক্যাল অ্যালার্টে চিকিৎসকের তদারকি আবশ্যক",
    syntheticBadge: "১০০% সিন্থেটিক ডেটা",
    emergencyNotice:
      "জরুরি বিজ্ঞপ্তি: গুরুতর অবস্থায় অবিলম্বে র‍্যাপিড অ্যাম্বুলেন্স (108) ও জরুরি প্রোটোকল চালু করুন।",
    worklistTitle: "কুইক-সর্ট (QuickSort) দৈনিক কাজের তালিকা",
    hexMeshTitle: "৫-গ্রাম হেক্সাগোনাল ক্লিনিক মেশ ও রাউটার",
    quicksortTitle: "৫-বিভাগ কুইক-সর্ট থ্রেশহোল্ড ইঞ্জিন",
    slotAllocationTitle: "৩০-স্লট ক্লিনিক বিভাজন (১৫ সিস্টেম • ৫ ক্রিটিক্যাল • ১০ ওয়াক-ইন)",
    whyFlagged: "কেন ফ্ল্যাগ করা হয়েছে (ব্যাখ্যা)",
    sendReminder: "SMS / WhatsApp পাঠান",
    logCheckin: "চেক-ইন নথিভুক্ত করুন",
    escalateClinician: "ডাক্তারের কাছে পাঠান",
    dispatchAmbulance: "দ্রুত অ্যাম্বুলেন্স পাঠান",
    broadcastHexagon: "পাশের হেক্সাগন ক্লিনিকে ব্রডকাস্ট করুন",
    aboveThresholdImmediate: "≥ থ্রেশহোল্ড (তাৎক্ষণিক অগ্রাধিকার স্লট)",
    belowThresholdFlexible: "< থ্রেশহোল্ড (৫০ মি.–২ ঘণ্টার নমনীয় সময়)",
    protectedWalkIn: "সংরক্ষিত ওয়াক-ইন স্লট (সাধারণ রোগীদের জন্য)",
    classReminder: "নীল • রিমাইন্ডার",
    classMissed: "হলুদ • মিস হওয়া ফলো-আপ",
    classClinical: "লাল • ডাক্তারের পর্যালোচনা প্রয়োজন",
    cohortHypertension: "উচ্চ রক্তচাপ",
    cohortDiabetes: "ডায়াবেটিস",
    cohortPregnancy: "ঝুঁকিপূর্ণ গর্ভাবস্থা",
    cohortPostIllness: "ক্যান্সার / অস্ত্রোপচার পরবর্তী সুস্থতা",
    consentActive: "সম্মতি সক্রিয়",
    consentWithdrawn: "সম্মতি প্রত্যাহার করা হয়েছে",
  },
  ta: {
    appTitle: "ஸ்வாஸ்த்ய சென்ஸ் (SWASTHYA SENSE)",
    appSubtitle: "முன்கூட்டிய எச்சரிக்கை, தொடர் கண்காணிப்பு & அறுகோண கிளினிக் வலைப்பின்னல்",
    safetyBanner:
      "மாதிரி அமைப்பு மட்டுமே • நோய் கண்டறியும் கருவி அல்ல • மருத்துவர் மேற்பார்வை அவசியம்",
    syntheticBadge: "100% செயற்கை தரவு",
    emergencyNotice:
      "அவசர அறிவிப்பு: உயிருக்கு ஆபத்தான நிலையில் உடனடியாக விரைவு ஆம்புலன்ஸ் (108) சேவையை அழைக்கவும்.",
    worklistTitle: "QuickSort தினசரி முன்னுரிமைப் பட்டியல்",
    hexMeshTitle: "5-கிராம அறுகோண கிளினிக் வலைப்பின்னல்",
    quicksortTitle: "5-வகை QuickSort வரம்பு இயந்திரம்",
    slotAllocationTitle: "30-இட கிளினிக் ஒதுக்கீடு (15 சிஸ்டம் • 5 அவசரம் • 10 நேரில் வருபவர்)",
    whyFlagged: "ஏன் சுட்டிக்காட்டப்பட்டது (விளக்கம்)",
    sendReminder: "SMS / WhatsApp அனுப்பு",
    logCheckin: "பரிசோதனை பதிவு செய்",
    escalateClinician: "மருத்துவருக்கு அனுப்பு",
    dispatchAmbulance: "விரைவு ஆம்புலன்ஸ் அனுப்பு",
    broadcastHexagon: "அருகிலுள்ள கிளினிக்குகளுக்கு அனுப்பு",
    aboveThresholdImmediate: "≥ வரம்பு (உடனடி சிகிச்சை இடம்)",
    belowThresholdFlexible: "< வரம்பு (50 நிமிடம்–2 மணி நேர நெகிழ்வான நேரம்)",
    protectedWalkIn: "பாதுகாக்கப்பட்ட நேரில் வரும் நோயாளிகள் இடம் (10)",
    classReminder: "நீலம் • நினைவூட்டல்",
    classMissed: "மஞ்சள் • தவறிய பரிசோதனை",
    classClinical: "சிவப்பு • மருத்துவர் ஆய்வு தேவை",
    cohortHypertension: "உயர் இரத்த அழுத்தம்",
    cohortDiabetes: "நீரிழிவு",
    cohortPregnancy: "அதிக ஆபத்துள்ள கர்ப்பம்",
    cohortPostIllness: "புற்றுநோய் / தீவிர சிகிச்சைக்குப் பின் மீட்பு",
    consentActive: "ஒப்புதல் செயலில் உள்ளது",
    consentWithdrawn: "ஒப்புதல் திரும்பப் பெறப்பட்டது",
  },
  te: {
    appTitle: "స్వాస్థ్య సెన్స్ (SWASTHYA SENSE)",
    appSubtitle: "ముందస్తు హెచ్చరిక, ఫాలో-అప్ & హెక్సాగోనల్ క్లినిక్ నెట్‌వర్క్",
    safetyBanner:
      "ప్రోటోటైప్ సహాయక వ్యవస్థ మాత్రమే • వ్యాధి నిర్ధారణ కాదు • ప్రతి అలర్ట్‌కు డాక్టర్ పర్యవేక్షణ తప్పనిసరి",
    syntheticBadge: "100% సింథటిక్ డేటా",
    emergencyNotice:
      "అత్యవసర గమనిక: ప్రాణాంతక పరిస్థితుల్లో వెంటనే ర్యాపిడ్ అంబులెన్స్ (108) సేవను ప్రారంభించండి.",
    worklistTitle: "QuickSort రోజువారీ ప్రాధాన్యత జాబితా",
    hexMeshTitle: "5-గ్రామాల హెక్సాగోనల్ క్లినిక్ మెష్",
    quicksortTitle: "5-విభాగాల QuickSort థ్రెషోల్డ్ ఇంజిన్",
    slotAllocationTitle: "30-స్లాట్ల క్లినిక్ విభజన (15 సిస్టమ్ • 5 క్రిటికల్ • 10 వాక్-ఇన్)",
    whyFlagged: "ఎందుకు ఫ్లాగ్ చేయబడింది (వివరణ)",
    sendReminder: "SMS / WhatsApp పంపండి",
    logCheckin: "చెక్-ఇన్ నమోదు చేయండి",
    escalateClinician: "డాక్టర్‌కు పంపండి",
    dispatchAmbulance: "ర్యాపిడ్ అంబులెన్స్ పంపండి",
    broadcastHexagon: "పక్క హెక్సాగాన్ క్లినిక్‌లకు పంపండి",
    aboveThresholdImmediate: "≥ థ్రెషోల్డ్ (తక్షణ ప్రాధాన్యత స్లాట్)",
    belowThresholdFlexible: "< థ్రెషోల్డ్ (50 ని.–2 గంటల సౌకర్యవంతమైన సమయం)",
    protectedWalkIn: "రక్షిత సాధారణ వాక్-ఇన్ స్లాట్లు (10)",
    classReminder: "నీలం • రిమైండర్",
    classMissed: "పసుపు • మిస్ అయిన ఫాలో-అప్",
    classClinical: "ఎరుపు • డాక్టర్ సమీక్ష అవసరం",
    cohortHypertension: "అధిక రక్తపోటు",
    cohortDiabetes: "మధుమేహం",
    cohortPregnancy: "హై-రిస్క్ ప్రెగ్నెన్సీ",
    cohortPostIllness: "క్యాన్సర్ / తీవ్ర అనారోగ్యం నుండి కోలుకోవడం",
    consentActive: "సమ్మతి సక్రియంగా ఉంది",
    consentWithdrawn: "సమ్మతి ఉపసంహరించబడింది",
  },
  mr: {
    appTitle: "स्वास्थ्य सेन्स (SWASTHYA SENSE)",
    appSubtitle: "पूर्वसूचना, फॉलो-अप आणि षट्कोनी क्लिनिक नेटवर्क",
    safetyBanner:
      "प्रोटोटाइप निर्णय-सहाय्य प्रणाली • हे रोग निदान करत नाही • प्रत्येक अलर्टवर डॉक्टरांचे नियंत्रण आवश्यक",
    syntheticBadge: "१००% सिंथेटिक डेटा",
    emergencyNotice:
      "आपत्कालीन सूचना: गंभीर परिस्थितीत त्वरित रॅपिड रुग्णवाहिका (108) आणि आपत्कालीन प्रोटोकॉल सुरू करा.",
    worklistTitle: "QuickSort दैनिक प्राधान्य कार्यसूची",
    hexMeshTitle: "५-गाव षट्कोनी (Hexagonal) क्लिनिक नेटवर्क",
    quicksortTitle: "५-श्रेणी QuickSort थ्रेशोल्ड इंजिन",
    slotAllocationTitle: "३०-स्लॉट क्लिनिक वाटप (१५ सिस्टम • ५ गंभीर • १० थेट येणारे रुग्ण)",
    whyFlagged: "का चिन्हांकित केले (स्पष्टीकरण)",
    sendReminder: "SMS / WhatsApp पाठवा",
    logCheckin: "चेक-इन नोंदवा",
    escalateClinician: "डॉक्टरांकडे पाठवा",
    dispatchAmbulance: "रॅपिड रुग्णवाहिका पाठवा",
    broadcastHexagon: "शेजारील षट्कोनी क्लिनिकला पाठवा",
    aboveThresholdImmediate: "≥ थ्रेशोल्ड (तत्काळ प्राधान्य स्लॉट)",
    belowThresholdFlexible: "< थ्रेशोल्ड (५० मि.–२ तासांची लवचिक वेळ)",
    protectedWalkIn: "राखीव वॉक-इन स्लॉट (सामान्य रुग्णांसाठी सुरक्षित)",
    classReminder: "निळा • आठवण",
    classMissed: "पिवळा • चुकलेला फॉलो-अप",
    classClinical: "लाल • डॉक्टरांची तपासणी आवश्यक",
    cohortHypertension: "उच्च रक्तदाब",
    cohortDiabetes: "मधुमेह",
    cohortPregnancy: "उच्च-जोखीम गरोदरपण",
    cohortPostIllness: "कर्करोग / गंभीर आजारानंतरची रिकव्हरी",
    consentActive: "संमती सक्रिय",
    consentWithdrawn: "संमती मागे घेतली (लॉक)",
  },
};

export const MESSAGE_TEMPLATES_I18N: Record<
  string,
  Record<SupportedLanguage, string>
> = {
  upcoming_visit: {
    en: "Hello. Your routine health check is due on {date} ({window}). Reply 1 to confirm, 2 to reschedule, STOP to opt out.",
    hi: "नमस्ते। आपकी स्वास्थ्य जाँच {date} ({window}) को निर्धारित है। पुष्टि के लिए 1, समय बदलने के लिए 2, या बंद करने के लिए STOP लिखें।",
    as: "নমস্কাৰ। আপোনাৰ স্বাস্থ্য পৰীক্ষা {date} ({window}) তাৰিখে আছে। নিশ্চিত কৰিবলৈ 1, সময় সলাবলৈ 2, বা বন্ধ কৰিবলৈ STOP লিখক।",
    bn: "নমস্কার। আপনার স্বাস্থ্য পরীক্ষা {date} ({window}) তারিখে নির্ধারিত। নিশ্চিত করতে 1, সময় বদলাতে 2, বন্ধ করতে STOP পাঠান।",
    ta: "வணக்கம். உங்கள் உடல்நலப் பரிசோதனை {date} ({window}) அன்று உள்ளது. உறுதிப்படுத்த 1, மாற்ற 2, நிறுத்த STOP என அனுப்பவும்.",
    te: "నమస్కారం. మీ ఆరోగ్య పరీక్ష {date} ({window}) నాడు ఉంది. నిర్ధారించడానికి 1, మార్చడానికి 2, ఆపడానికి STOP అని పంపండి.",
    mr: "नमस्कार. तुमची आरोग्य तपासणी {date} ({window}) रोजी आहे. निश्चित करण्यासाठी 1, वेळ बदलण्यासाठी 2, बंद करण्यासाठी STOP पाठवा.",
  },
  due_today: {
    en: "Your health check is today ({window}). Please visit the clinic or reply 2 if you need a home visit from your health worker.",
    hi: "आपकी स्वास्थ्य जाँच आज ({window}) है। कृपया क्लिनिक पधारें या आशा कार्यकर्ता की गृह-भेंट के लिए 2 का उत्तर दें।",
    as: "আপোনাৰ স্বাস্থ্য পৰীক্ষা আজি ({window})। অনুগ্ৰহ কৰি ক্লিনিকলৈ আহক বা ঘৰুৱা পৰিদৰ্শনৰ বাবে 2 উত্তৰ দিয়ক।",
    bn: "আপনার স্বাস্থ্য পরীক্ষা আজ ({window})। অনুগ্রহ করে ক্লিনিকে আসুন বা স্বাস্থ্যকর্মীর বাড়ি পরিদর্শনের জন্য 2 পাঠান।",
    ta: "உங்கள் பரிசோதனை இன்று ({window}). கிளினிக்கிற்கு வரவும் அல்லது வீட்டு 방문த்திற்கு 2 என அனுப்பவும்.",
    te: "మీ ఆరోగ్య పరీక్ష ఈరోజు ({window}). క్లినిక్‌కు రండి లేదా ఇంటి సందర్శన కోసం 2 అని పంపండి.",
    mr: "तुमची आरोग्य तपासणी आज ({window}) आहे. कृपया क्लिनिकला भेट द्या किंवा गृहभेटीसाठी 2 पाठवा.",
  },
  missed_visit: {
    en: "We missed you at your scheduled check-up. Reply 1 if you can visit within your flexible window, or 2 if you have a health problem.",
    hi: "आप नियमित जाँच में नहीं आ पाए। यदि आप इस सप्ताह आ सकते हैं तो 1 भेजें, या कोई समस्या है तो 2 भेजें।",
    as: "আপুনি নিৰ্ধাৰিত পৰীক্ষাত উপস্থিত নাছিল। এই সপ্তাহত আহিব পাৰিলে 1, বা কিবা সমস্যা থাকিলে 2 পঠিয়াওক।",
    bn: "আমরা আপনার নির্ধারিত চেক-আপে আপনাকে মিস করেছি। আসতে পারলে 1, বা কোনো সমস্যা থাকলে 2 পাঠান।",
    ta: "உங்கள் பரிசோதனையைத் தவறிவிட்டீர்கள். வர முடிந்தால் 1, உடல்நலப் பிரச்சினை இருந்தால் 2 அனுப்பவும்.",
    te: "మీరు ఆరోగ్య పరీక్షకు రాలేదు. ఈ వారం రాగలిగితే 1, ఏదైనా సమస్య ఉంటే 2 పంపండి.",
    mr: "तुमची नियोजित तपासणी चुकली आहे. या आठवड्यात येऊ शकत असल्यास 1, किंवा त्रास असल्यास 2 पाठवा.",
  },
  symptom_checkin: {
    en: "How are you feeling today? Reply 1 if well, or 2 if you have any problem so your health worker can contact you.",
    hi: "आज आप कैसा महसूस कर रहे हैं? ठीक हैं तो 1 भेजें, कोई परेशानी है तो 2 भेजें ताकि स्वास्थ्य कार्यकर्ता आपसे संपर्क करें।",
    as: "আজি আপুনি কেনে অনুভৱ কৰিছে? ভালে থাকিলে 1, অসুবিধা থাকিলে 2 পঠিয়াওক যাতে স্বাস্থ্যকৰ্মীয়ে যোগাযোগ কৰিব পাৰে।",
    bn: "আজ আপনি কেমন বোধ করছেন? ভালো থাকলে 1, কোনো সমস্যা থাকলে 2 পাঠান যাতে স্বাস্থ্যকর্মী আপনাকে কল করতে পারেন।",
    ta: "இன்று எப்படி உணர்கிறீர்கள்? நலமாக இருந்தால் 1, பிரச்சினை இருந்தால் 2 அனுப்பவும்.",
    te: "ఈరోజు మీరు ఎలా ఉన్నారు? బాగుంటే 1, సమస్య ఉంటే 2 పంపండి.",
    mr: "आज तुम्हाला कसे वाटत आहे? बरे असल्यास 1, त्रास असल्यास 2 पाठवा म्हणजे आरोग्य सेविका संपर्क करतील.",
  },
  slot_preempted_flexible: {
    en: "Good news: your recent vitals are stable! To prioritize an emergency case today, your routine check-up is moved to flexible window {window} / local health worker visit. Reply 1 to confirm.",
    hi: "सुसमाचार: आपके हाल के स्वास्थ्य मानक स्थिर हैं! आज एक आपातकालीन मरीज को प्राथमिकता देने हेतु आपकी सामान्य जाँच {window} / आशा गृह-भेंट में समायोजित की गई है।",
    as: "ভাল খবৰ: আপোনাৰ স্বাস্থ্যৰ মানদণ্ড সুস্থিৰ! আজি এজন জৰুৰী ৰোগীক অগ্ৰাধিকাৰ দিবলৈ আপোনাৰ সাধাৰণ পৰীক্ষা {window} সময়লৈ নিয়া হৈছে।",
    bn: "সুসংবাদ: আপনার সাম্প্রতিক ভাইটাল স্থিতিশীল! আজ একটি জরুরি কেসকে অগ্রাধিকার দিতে আপনার রুটিন চেক-আপ {window}-এ স্থানান্তরিত হয়েছে।",
    ta: "நல்ல செய்தி: আপনার உடல்நிலை சீராக உள்ளது! அவசர நோயாளிக்கு முன்னுரிமை அளிக்க உங்கள் பரிசோதனை {window} நேரத்திற்கு மாற்றப்பட்டுள்ளது.",
    te: "శుభవార్త: మీ ఆరోగ్య ప్రమాణాలు స్థిరంగా ఉన్నాయి! అత్యవసర కేసు కోసం మీ సాధారణ పరీక్ష {window} సమయానికి మార్చబడింది.",
    mr: "आनंदाची बातमी: तुमचे आरोग्य निर्देशांक स्थिर आहेत! तातडीच्या रुग्णासाठी तुमची नियमित तपासणी {window} वेळेत हलवली आहे.",
  },
};

