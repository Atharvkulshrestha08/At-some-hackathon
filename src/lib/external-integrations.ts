/**
 * SWASTHYA SENSE — External API & Database Integration Layer
 *
 * Automatically detects which real-world credentials / endpoints are configured
 * in `.env.local` (Supabase PostgreSQL, WhatsApp Cloud API / Twilio SMS,
 * 108 Ambulance Dispatch Webhook, ABDM / FHIR Health Registry) and routes
 * requests to live APIs when present, or falls back cleanly to the embedded
 * PostgreSQL (PGlite) engine when unconfigured.
 */

export interface ExternalIntegrationStatus {
  supabasePostgres: {
    configured: boolean;
    url: string | null;
    mode: "LIVE_SUPABASE_POSTGRES" | "LOCAL_PGLITE_POSTGRES_16";
  };
  messagingGateway: {
    configured: boolean;
    provider: "META_WHATSAPP_CLOUD" | "TWILIO_SMS_WHATSAPP" | "SIMULATED_SANDBOX";
  };
  ambulance108Dispatch: {
    configured: boolean;
    endpoint: string | null;
    mode: "LIVE_108_WEBHOOK" | "SIMULATED_108_DISPATCH";
  };
  facilityRegistryApi: {
    configured: boolean;
    endpoint: string | null;
    mode: "LIVE_HFR_API" | "DATABASE_FACILITY_TABLE";
  };
}

export function getExternalIntegrationStatus(): ExternalIntegrationStatus {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    null;

  const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN || null;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || null;
  const ambulanceWebhook = process.env.AMBULANCE_108_WEBHOOK_URL || null;
  const facilityApiUrl = process.env.FACILITY_REGISTRY_API_URL || null;

  return {
    supabasePostgres: {
      configured: Boolean(supabaseUrl && supabaseKey),
      url: supabaseUrl,
      mode:
        supabaseUrl && supabaseKey
          ? "LIVE_SUPABASE_POSTGRES"
          : "LOCAL_PGLITE_POSTGRES_16",
    },
    messagingGateway: {
      configured: Boolean(whatsappToken || twilioSid),
      provider: whatsappToken
        ? "META_WHATSAPP_CLOUD"
        : twilioSid
        ? "TWILIO_SMS_WHATSAPP"
        : "SIMULATED_SANDBOX",
    },
    ambulance108Dispatch: {
      configured: Boolean(ambulanceWebhook),
      endpoint: ambulanceWebhook,
      mode: ambulanceWebhook ? "LIVE_108_WEBHOOK" : "SIMULATED_108_DISPATCH",
    },
    facilityRegistryApi: {
      configured: Boolean(facilityApiUrl),
      endpoint: facilityApiUrl,
      mode: facilityApiUrl ? "LIVE_HFR_API" : "DATABASE_FACILITY_TABLE",
    },
  };
}

export interface DangerSymptomDefinition {
  id: string;
  label: string;
  clinicalCategory: string;
  defaultWeight: number;
}

export const CLINICAL_SYMPTOM_CATALOG: DangerSymptomDefinition[] = [
  {
    id: "post_chemo_fever",
    label: "Post-treatment fever with chills (Oncology / Neutropenic risk)",
    clinicalCategory: "post_illness",
    defaultWeight: 45,
  },
  {
    id: "breathlessness",
    label: "Severe breathlessness at rest (SpO₂ / Cardiac risk)",
    clinicalCategory: "general_critical",
    defaultWeight: 40,
  },
  {
    id: "chest_pain",
    label: "Chest pain or acute tightness",
    clinicalCategory: "hypertension",
    defaultWeight: 40,
  },
  {
    id: "blurred_vision",
    label: "Blurred vision / severe headache (Preeclampsia risk)",
    clinicalCategory: "pregnancy",
    defaultWeight: 38,
  },
  {
    id: "reduced_fetal_movement",
    label: "Reduced fetal movement / acute abdominal pain",
    clinicalCategory: "pregnancy",
    defaultWeight: 42,
  },
  {
    id: "severe_weakness_syncope",
    label: "Inability to stand / fainting / hypoglycemic or shock risk",
    clinicalCategory: "diabetes",
    defaultWeight: 40,
  },
  {
    id: "uncontrolled_bleeding",
    label: "Uncontrolled bleeding or post-surgical discharge",
    clinicalCategory: "post_illness",
    defaultWeight: 45,
  },
];

