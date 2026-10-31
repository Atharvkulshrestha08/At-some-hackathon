/**
 * SWASTHYA SENSE — External API & Database Integration Layer
 *
 * Automatically detects configured credentials in `.env.local`
 * (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
 * `SUPABASE_JWKS_URL`, WhatsApp/Twilio, 108 Ambulance Webhook) and provides
 * live cloud synchronization alongside the embedded PostgreSQL 16 (PGlite) engine.
 */

export interface ExternalIntegrationStatus {
  supabasePostgres: {
    configured: boolean;
    url: string | null;
    jwksUrl: string | null;
    mode: "LIVE_SUPABASE_CONNECTED" | "LOCAL_PGLITE_POSTGRES_16";
  };
  messagingGateway: {
    configured: boolean;
    provider:
      | "META_WHATSAPP_CLOUD"
      | "TWILIO_SMS_WHATSAPP"
      | "WA_ME_DEEPLINK_AND_SANDBOX";
  };
  ambulance108Dispatch: {
    configured: boolean;
    endpoint: string | null;
    mode: "LIVE_108_WEBHOOK" | "SIMULATED_108_DISPATCH";
  };
  facilityRegistryApi: {
    configured: boolean;
    endpoint: string | null;
    mode: "LIVE_HFR_API" | "SUPABASE_FACILITY_MESH";
  };
}

export function getExternalIntegrationStatus(): ExternalIntegrationStatus {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://givuusaxvalgcjaveobx.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    null;
  const supabaseJwksUrl =
    process.env.SUPABASE_JWKS_URL ||
    (supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : null);

  const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN || null;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || null;
  const ambulanceWebhook = process.env.AMBULANCE_108_WEBHOOK_URL || null;
  const facilityApiUrl = process.env.FACILITY_REGISTRY_API_URL || null;

  return {
    supabasePostgres: {
      configured: Boolean(supabaseUrl && supabaseKey),
      url: supabaseUrl,
      jwksUrl: supabaseJwksUrl,
      mode:
        supabaseUrl && supabaseKey
          ? "LIVE_SUPABASE_CONNECTED"
          : "LOCAL_PGLITE_POSTGRES_16",
    },
    messagingGateway: {
      configured: Boolean(whatsappToken || twilioSid),
      provider: whatsappToken
        ? "META_WHATSAPP_CLOUD"
        : twilioSid
        ? "TWILIO_SMS_WHATSAPP"
        : "WA_ME_DEEPLINK_AND_SANDBOX",
    },
    ambulance108Dispatch: {
      configured: Boolean(ambulanceWebhook),
      endpoint: ambulanceWebhook,
      mode: ambulanceWebhook ? "LIVE_108_WEBHOOK" : "SIMULATED_108_DISPATCH",
    },
    facilityRegistryApi: {
      configured: Boolean(facilityApiUrl || supabaseUrl),
      endpoint: facilityApiUrl || supabaseUrl,
      mode: facilityApiUrl ? "LIVE_HFR_API" : "SUPABASE_FACILITY_MESH",
    },
  };
}

/**
 * Non-blocking Cloud Sync to Supabase REST API (`https://givuusaxvalgcjaveobx.supabase.co/rest/v1/<table>`)
 * Whenever a check-in, escalation, message, or SHA-256 audit log entry is recorded,
 * this replicates the row to Supabase Cloud if the table exists, while keeping
 * the local PostgreSQL 16 (PGlite) transaction 100% resilient.
 */
export async function syncRowToSupabaseCloud(
  table: string,
  row: Record<string, unknown>
): Promise<void> {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !apiKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch {
    // Graceful fallback to embedded PostgreSQL (PGlite) when offline or inside restricted network sandbox
  }
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
