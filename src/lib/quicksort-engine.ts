/**
 * SWASTHYA SENSE — 5-Category Bidirectional Risk Evaluator,
 * QuickSort Pivot Threshold Engine & 3-Bucket (15/5/10) Clinic Slot Isolator.
 *
 * Non-Diagnostic Guardrail:
 * All rules are deterministic, versioned records with clinician-configured thresholds.
 * Outputs are priority scores and plain-language prompts for human review, NEVER diagnoses.
 */

export type CohortType = "hypertension" | "diabetes" | "pregnancy" | "post_illness";
export type MobilityStatus = "independent" | "assisted" | "homebound";
export type FlagClass = "administrative_reminder" | "administrative_escalation" | "clinical_review";

export interface VitalReading {
  recordedAt: string;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  bloodGlucose: number;
  temperature: number;
  spo2: number;
  weightKg?: number;
}

export interface CategoryBreakdown {
  categoryId: "cat1_bp" | "cat2_hr" | "cat3_glucose" | "cat4_temp_spo2" | "cat5_symptoms_gap";
  label: string;
  direction: "UP" | "DOWN" | "STABLE" | "GAP";
  currentValue: string;
  normalRange: string;
  points: number;
  ruleId: string | null;
  ruleVersion: number;
  reason: string;
}

export interface RuleThresholds {
  pivotThreshold: number; // Default 100: separates Immediate (>=100) from Flexible Window (<100)
  bpSystolicHigh: number; // Default 160
  bpDiastolicHigh: number; // Default 100
  bpSystolicLow: number; // Default 90 (Hypotension / post-cancer shock risk)
  bpDiastolicLow: number; // Default 60
  heartRateHigh: number; // Default 110 bpm
  heartRateLow: number; // Default 50 bpm
  glucoseHigh: number; // Default 240 mg/dL
  glucoseLow: number; // Default 70 mg/dL (Hypoglycemia danger)
  tempHigh: number; // Default 38.0 °C (Post-chemo neutropenic fever risk)
  tempLow: number; // Default 35.5 °C
  spo2Low: number; // Default 93 %
  version: number;
  approvedBy: string;
  approvedAt: string;
}

export const DEFAULT_CLINICIAN_THRESHOLDS: RuleThresholds = {
  pivotThreshold: 100,
  bpSystolicHigh: 160,
  bpDiastolicHigh: 100,
  bpSystolicLow: 90,
  bpDiastolicLow: 60,
  heartRateHigh: 110,
  heartRateLow: 50,
  glucoseHigh: 240,
  glucoseLow: 70,
  tempHigh: 38.0,
  tempLow: 35.5,
  spo2Low: 93,
  version: 1,
  approvedBy: "Dr. Ananya Baruah (Senior MO, PHC Lead) — ILLUSTRATIVE PROTOTYPE",
  approvedAt: "2026-10-31T06:00:00Z",
};

export interface PatientEvaluationInput {
  patientId: string;
  pseudonym: string;
  ageBand: string;
  village: string;
  facilityId: string;
  hexagonId: string;
  cohort: CohortType;
  mobility: MobilityStatus;
  consentActive: boolean;
  daysOverdue: number; // >0 means overdue, <0 means days until due
  consecutiveMissed: number;
  symptoms: string[];
  vitalsHistory: VitalReading[]; // chronological, latest last
}

export interface EvaluatedPatientFlag {
  patientId: string;
  pseudonym: string;
  ageBand: string;
  village: string;
  facilityId: string;
  hexagonId: string;
  cohort: CohortType;
  mobility: MobilityStatus;
  flagClass: FlagClass;
  primaryRuleId: string;
  ruleVersion: number;
  totalScore: number;
  abovePivotThreshold: boolean;
  hardClinicalOverride: boolean;
  pivotThresholdUsed: number;
  exceedsLocalClinicCapability: boolean;
  requiresRapidAmbulance: boolean;
  whyFlagged: string;
  safetyDisclaimer: string;
  stackedFlagCount: number;
  categories: CategoryBreakdown[];
  latestVitals: VitalReading | null;
  bpTrendValues: number[];
}

const DANGER_SIGN_LABELS: Record<string, string> = {
  blurred_vision: "Blurred vision / severe headache",
  chest_pain: "Chest pain or tightness",
  breathlessness: "Severe breathlessness at rest",
  post_chemo_fever: "Post-treatment fever with chills",
  uncontrolled_bleeding: "Uncontrolled bleeding or discharge",
  severe_weakness_syncope: "Inability to stand / fainting",
  reduced_fetal_movement: "Reduced fetal movement / severe abdominal pain",
  persistent_vomiting: "Persistent vomiting / inability to keep fluids down",
};

const COHORT_CRITICALITY_WEIGHTS: Record<CohortType, number> = {
  post_illness: 25,
  pregnancy: 25,
  hypertension: 15,
  diabetes: 15,
};

/**
 * Pure deterministic evaluator across the 5 bidirectional categories + starter rules.
 */
export function evaluatePatientFiveCategories(
  input: PatientEvaluationInput,
  thresholds: RuleThresholds = DEFAULT_CLINICIAN_THRESHOLDS
): EvaluatedPatientFlag {
  const latest =
    input.vitalsHistory.length > 0
      ? input.vitalsHistory[input.vitalsHistory.length - 1]
      : null;

  const last3 = input.vitalsHistory.slice(-3);
  const bpTrendValues = last3.map((v) => v.systolicBp);
  const isBpRising3x =
    bpTrendValues.length === 3 &&
    bpTrendValues[0] < bpTrendValues[1] &&
    bpTrendValues[1] < bpTrendValues[2] &&
    bpTrendValues[2] - bpTrendValues[0] >= 12;

  const isBpDropping3x =
    bpTrendValues.length === 3 &&
    bpTrendValues[0] > bpTrendValues[1] &&
    bpTrendValues[1] > bpTrendValues[2] &&
    bpTrendValues[0] - bpTrendValues[2] >= 15;

  const categories: CategoryBreakdown[] = [];
  let clinicalTriggered = false;
  let hardClinicalOverride = false;
  let stackedFlags = 0;
  let exceedsLocalClinic = false;
  const triggeredRuleIds: string[] = [];
  const reasons: string[] = [];

  // Cohort-specific obstetric thresholds (MEOWS-aligned: >=140/90 in pregnancy is hypertensive; >=160/110 is severe preeclampsia)
  const effectiveBpSysHigh =
    input.cohort === "pregnancy"
      ? Math.min(thresholds.bpSystolicHigh, 140)
      : thresholds.bpSystolicHigh;
  const effectiveBpDiaHigh =
    input.cohort === "pregnancy"
      ? Math.min(thresholds.bpDiastolicHigh, 90)
      : thresholds.bpDiastolicHigh;
  const effectiveHrHigh =
    input.cohort === "pregnancy"
      ? Math.max(thresholds.heartRateHigh, 115)
      : thresholds.heartRateHigh;

  // =========================================================================
  // CATEGORY 1: Blood Pressure (Going UP >= 160/100 [140/90 Pregnancy] or Rising 3x | Going DOWN < 90/60)
  // =========================================================================
  if (latest) {
    if (
      latest.systolicBp >= effectiveBpSysHigh ||
      latest.diastolicBp >= effectiveBpDiaHigh ||
      isBpRising3x
    ) {
      const isSevereObstetricOrCrisis =
        (input.cohort === "pregnancy" &&
          (latest.systolicBp >= 160 || latest.diastolicBp >= 110)) ||
        latest.systolicBp >= 180 ||
        latest.diastolicBp >= 115;
      if (isSevereObstetricOrCrisis) {
        hardClinicalOverride = true;
        exceedsLocalClinic = true;
      }
      const pts = latest.systolicBp >= 175 || isSevereObstetricOrCrisis ? 55 : 42;
      clinicalTriggered = true;
      stackedFlags++;
      triggeredRuleIds.push("CLIN-BP-02");
      const trendStr =
        bpTrendValues.length >= 2 ? ` (3-visit trajectory: ${bpTrendValues.join(" → ")} mmHg)` : "";
      const r = `BP elevated/rising: ${latest.systolicBp}/${latest.diastolicBp} mmHg${trendStr}; cohort upper limit ${effectiveBpSysHigh}/${effectiveBpDiaHigh}${
        input.cohort === "pregnancy" ? " (MEOWS Obstetric Threshold)" : ""
      }. [Rule CLIN-BP-02 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat1_bp",
        label: "1. Blood Pressure (BP)",
        direction: "UP",
        currentValue: `${latest.systolicBp}/${latest.diastolicBp} mmHg`,
        normalRange: `${thresholds.bpSystolicLow}–${effectiveBpSysHigh} / ${thresholds.bpDiastolicLow}–${effectiveBpDiaHigh}`,
        points: pts,
        ruleId: "CLIN-BP-02",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else if (
      latest.systolicBp < thresholds.bpSystolicLow ||
      latest.diastolicBp < thresholds.bpDiastolicLow ||
      isBpDropping3x
    ) {
      const pts = 48;
      clinicalTriggered = true;
      if (latest.systolicBp <= 85 || latest.diastolicBp <= 55) {
        hardClinicalOverride = true;
      }
      stackedFlags++;
      if (input.cohort === "post_illness" || input.cohort === "pregnancy") {
        exceedsLocalClinic = true;
      }
      triggeredRuleIds.push("CLIN-BP-02");
      const r = `BP dangerously low/dropping: ${latest.systolicBp}/${latest.diastolicBp} mmHg (below lower limit ${thresholds.bpSystolicLow}/${thresholds.bpDiastolicLow} mmHg). [Rule CLIN-BP-02 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat1_bp",
        label: "1. Blood Pressure (BP)",
        direction: "DOWN",
        currentValue: `${latest.systolicBp}/${latest.diastolicBp} mmHg`,
        normalRange: `${thresholds.bpSystolicLow}–${thresholds.bpSystolicHigh} mmHg`,
        points: pts,
        ruleId: "CLIN-BP-02",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else {
      categories.push({
        categoryId: "cat1_bp",
        label: "1. Blood Pressure (BP)",
        direction: "STABLE",
        currentValue: `${latest.systolicBp}/${latest.diastolicBp} mmHg`,
        normalRange: `${thresholds.bpSystolicLow}–${thresholds.bpSystolicHigh} mmHg`,
        points: 0,
        ruleId: null,
        ruleVersion: thresholds.version,
        reason: "Within configured range",
      });
    }

    // =========================================================================
    // CATEGORY 2: Heart Rate (Going UP > effectiveHrHigh | Going DOWN < 50 bpm)
    // =========================================================================
    if (latest.heartRate > effectiveHrHigh) {
      const pts = 32;
      clinicalTriggered = true;
      if (latest.heartRate >= 135) hardClinicalOverride = true;
      stackedFlags++;
      triggeredRuleIds.push("CLIN-PNC-04");
      const r = `Heart rate elevated: ${latest.heartRate} bpm (above upper limit ${effectiveHrHigh} bpm). [Rule CLIN-PNC-04 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat2_hr",
        label: "2. Heart Rate (Pulse)",
        direction: "UP",
        currentValue: `${latest.heartRate} bpm`,
        normalRange: `${thresholds.heartRateLow}–${effectiveHrHigh} bpm`,
        points: pts,
        ruleId: "CLIN-PNC-04",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else if (latest.heartRate < thresholds.heartRateLow) {
      const pts = 38;
      clinicalTriggered = true;
      if (latest.heartRate <= 42) hardClinicalOverride = true;
      stackedFlags++;
      triggeredRuleIds.push("CLIN-PNC-04");
      const r = `Heart rate dangerously low: ${latest.heartRate} bpm (below lower limit ${thresholds.heartRateLow} bpm). [Rule CLIN-PNC-04 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat2_hr",
        label: "2. Heart Rate (Pulse)",
        direction: "DOWN",
        currentValue: `${latest.heartRate} bpm`,
        normalRange: `${thresholds.heartRateLow}–${thresholds.heartRateHigh} bpm`,
        points: pts,
        ruleId: "CLIN-PNC-04",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else {
      categories.push({
        categoryId: "cat2_hr",
        label: "2. Heart Rate (Pulse)",
        direction: "STABLE",
        currentValue: `${latest.heartRate} bpm`,
        normalRange: `${thresholds.heartRateLow}–${thresholds.heartRateHigh} bpm`,
        points: 0,
        ruleId: null,
        ruleVersion: thresholds.version,
        reason: "Within configured range",
      });
    }

    // =========================================================================
    // CATEGORY 3: Blood Glucose (Going UP > 240 mg/dL | Going DOWN < 70 mg/dL)
    // =========================================================================
    if (latest.bloodGlucose > thresholds.glucoseHigh) {
      const pts = 38;
      clinicalTriggered = true;
      stackedFlags++;
      triggeredRuleIds.push("CLIN-GLU-03");
      const r = `Blood glucose above range: ${latest.bloodGlucose} mg/dL (upper limit ${thresholds.glucoseHigh} mg/dL). [Rule CLIN-GLU-03 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat3_glucose",
        label: "3. Blood Glucose",
        direction: "UP",
        currentValue: `${latest.bloodGlucose} mg/dL`,
        normalRange: `${thresholds.glucoseLow}–${thresholds.glucoseHigh} mg/dL`,
        points: pts,
        ruleId: "CLIN-GLU-03",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else if (latest.bloodGlucose < thresholds.glucoseLow) {
      const pts = 46;
      clinicalTriggered = true;
      if (latest.bloodGlucose <= 60) hardClinicalOverride = true;
      stackedFlags++;
      triggeredRuleIds.push("CLIN-GLU-03");
      const r = `Blood glucose critically low (hypoglycemia risk): ${latest.bloodGlucose} mg/dL (lower limit ${thresholds.glucoseLow} mg/dL). [Rule CLIN-GLU-03 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat3_glucose",
        label: "3. Blood Glucose",
        direction: "DOWN",
        currentValue: `${latest.bloodGlucose} mg/dL`,
        normalRange: `${thresholds.glucoseLow}–${thresholds.glucoseHigh} mg/dL`,
        points: pts,
        ruleId: "CLIN-GLU-03",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else {
      categories.push({
        categoryId: "cat3_glucose",
        label: "3. Blood Glucose",
        direction: "STABLE",
        currentValue: `${latest.bloodGlucose} mg/dL`,
        normalRange: `${thresholds.glucoseLow}–${thresholds.glucoseHigh} mg/dL`,
        points: 0,
        ruleId: null,
        ruleVersion: thresholds.version,
        reason: "Within configured range",
      });
    }

    // =========================================================================
    // CATEGORY 4: Body Temperature & SpO2 (Temp UP >= 38.0°C | Temp DOWN < 35.5°C or SpO2 < 93%)
    // =========================================================================
    if (latest.temperature >= thresholds.tempHigh) {
      const pts = input.cohort === "post_illness" ? 55 : 36;
      clinicalTriggered = true;
      stackedFlags++;
      if (input.cohort === "post_illness") {
        exceedsLocalClinic = true; // Post-cancer / post-discharge fever needs higher-tier care
        hardClinicalOverride = true;
      }
      triggeredRuleIds.push("CLIN-PNC-04");
      const r = `High fever recorded: ${latest.temperature.toFixed(1)}°C (limit ${thresholds.tempHigh.toFixed(1)}°C)${
        input.cohort === "post_illness"
          ? " in Post-Illness / Oncology recovery cohort (requires higher-tier clinical review)"
          : ""
      }. [Rule CLIN-PNC-04 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat4_temp_spo2",
        label: "4. Temp & Oxygen (SpO₂)",
        direction: "UP",
        currentValue: `${latest.temperature.toFixed(1)}°C | ${latest.spo2}%`,
        normalRange: `35.5–37.9°C | ≥${thresholds.spo2Low}%`,
        points: pts,
        ruleId: "CLIN-PNC-04",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else if (
      latest.temperature < thresholds.tempLow ||
      latest.spo2 < thresholds.spo2Low
    ) {
      const pts = 52;
      clinicalTriggered = true;
      if (latest.spo2 <= 90 || latest.temperature <= 35.0) {
        hardClinicalOverride = true;
      }
      stackedFlags++;
      exceedsLocalClinic = true;
      triggeredRuleIds.push("CLIN-PNC-04");
      const r = `Low oxygen / hypothermia signal: SpO₂ ${latest.spo2}% (min ${thresholds.spo2Low}%), Temp ${latest.temperature.toFixed(1)}°C. [Rule CLIN-PNC-04 v${thresholds.version}]`;
      reasons.push(r);
      categories.push({
        categoryId: "cat4_temp_spo2",
        label: "4. Temp & Oxygen (SpO₂)",
        direction: "DOWN",
        currentValue: `${latest.temperature.toFixed(1)}°C | ${latest.spo2}%`,
        normalRange: `35.5–37.9°C | ≥${thresholds.spo2Low}%`,
        points: pts,
        ruleId: "CLIN-PNC-04",
        ruleVersion: thresholds.version,
        reason: r,
      });
    } else {
      categories.push({
        categoryId: "cat4_temp_spo2",
        label: "4. Temp & Oxygen (SpO₂)",
        direction: "STABLE",
        currentValue: `${latest.temperature.toFixed(1)}°C | ${latest.spo2}%`,
        normalRange: `35.5–37.9°C | ≥${thresholds.spo2Low}%`,
        points: 0,
        ruleId: null,
        ruleVersion: thresholds.version,
        reason: "Within configured range",
      });
    }
  } else {
    // Missing measurement data gap — never assume normal
    categories.push({
      categoryId: "cat1_bp",
      label: "1–4. Vitals Measurement Gap",
      direction: "GAP",
      currentValue: "No recent check-in",
      normalRange: "Scheduled check-in required",
      points: 15,
      ruleId: "ADM-OVD-02",
      ruleVersion: thresholds.version,
      reason: "Missing recent vital readings — treated as data gap requiring follow-up, never assumed normal.",
    });
  }

  // =========================================================================
  // CATEGORY 5: Danger-Sign Symptoms + Overdue Follow-up Gap + Cohort Criticality
  // =========================================================================
  let cat5Points = 0;
  let cat5Rule: string | null = null;
  const cat5Reasons: string[] = [];

  if (input.symptoms.length > 0) {
    clinicalTriggered = true;
    stackedFlags++;
    cat5Points += 55;
    cat5Rule = "CLIN-SYM-01";
    triggeredRuleIds.push("CLIN-SYM-01");
    const symLabels = input.symptoms.map((s) => DANGER_SIGN_LABELS[s] || s).join(", ");
    cat5Reasons.push(`Danger-sign symptom reported (${symLabels}) [Rule CLIN-SYM-01 v${thresholds.version}]`);
    if (
      input.symptoms.includes("post_chemo_fever") ||
      input.symptoms.includes("breathlessness") ||
      input.symptoms.includes("uncontrolled_bleeding") ||
      input.symptoms.includes("chest_pain")
    ) {
      exceedsLocalClinic = true;
    }
  }

  if (input.daysOverdue > 0) {
    const overduePts = Math.min(input.daysOverdue * 6, 45);
    cat5Points += overduePts;
    if (input.consecutiveMissed >= 2) {
      stackedFlags++;
      cat5Points += 20;
      cat5Rule = cat5Rule || "ADM-MISS-03";
      triggeredRuleIds.push("ADM-MISS-03");
      cat5Reasons.push(
        `${input.consecutiveMissed} consecutive missed follow-ups (${input.daysOverdue}d overdue) [Rule ADM-MISS-03 v${thresholds.version}]`
      );
      if (input.cohort === "pregnancy" || input.cohort === "post_illness") {
        clinicalTriggered = true;
        cat5Rule = "CLIN-GAP-05";
        triggeredRuleIds.push("CLIN-GAP-05");
        cat5Reasons.push(
          `Time-critical cohort (${input.cohort}) overdue beyond safe window [Rule CLIN-GAP-05 v${thresholds.version}]`
        );
      }
    } else {
      cat5Rule = cat5Rule || "ADM-OVD-02";
      triggeredRuleIds.push("ADM-OVD-02");
      cat5Reasons.push(`Follow-up overdue by ${input.daysOverdue} days [Rule ADM-OVD-02 v${thresholds.version}]`);
    }
  } else if (input.daysOverdue >= -2) {
    cat5Points += 12;
    cat5Rule = cat5Rule || "ADM-DUE-01";
    triggeredRuleIds.push("ADM-DUE-01");
    cat5Reasons.push(
      `Routine check-in due in ${Math.abs(input.daysOverdue)} day(s) [Rule ADM-DUE-01 v${thresholds.version}]`
    );
  }

  reasons.push(...cat5Reasons);
  categories.push({
    categoryId: "cat5_symptoms_gap",
    label: "5. Symptoms & Follow-Up Schedule Gap",
    direction: input.symptoms.length > 0 ? "UP" : input.daysOverdue > 0 ? "GAP" : "STABLE",
    currentValue:
      input.symptoms.length > 0
        ? `${input.symptoms.length} Danger Sign(s) | ${Math.max(0, input.daysOverdue)}d overdue`
        : input.daysOverdue > 0
        ? `${input.daysOverdue}d overdue (Missed ×${input.consecutiveMissed})`
        : `Due in ${Math.abs(input.daysOverdue)}d`,
    normalRange: "0 danger signs & on-time schedule",
    points: cat5Points,
    ruleId: cat5Rule,
    ruleVersion: thresholds.version,
    reason: cat5Reasons.join("; ") || "Schedule on track",
  });

  // =========================================================================
  // TOTAL COMPOSITE SCORE & CLASS DETERMINATION
  // Score formula aligned with System Architecture doc + 5-Category breakdown:
  // Base clinical weight + 5-category points + stacked flag multiplier + cohort weight
  // =========================================================================
  const sumCategoryPoints = categories.reduce((acc, c) => acc + c.points, 0);
  const cohortWeight = COHORT_CRITICALITY_WEIGHTS[input.cohort] || 10;
  const stackedBonus = Math.max(0, stackedFlags - 1) * 15;
  const clinicalBonus = clinicalTriggered ? 60 : 0;

  // Hard Red-Flag Clinical Override (NEWS2/MEOWS): guarantees a single life-threatening sign never lands below pivotThreshold
  const rawScore = clinicalBonus + sumCategoryPoints + stackedBonus + cohortWeight;
  const totalScore = hardClinicalOverride
    ? Math.max(rawScore, thresholds.pivotThreshold + 35)
    : rawScore;

  let flagClass: FlagClass = "administrative_reminder";
  if (clinicalTriggered || hardClinicalOverride || totalScore >= thresholds.pivotThreshold) {
    flagClass = "clinical_review";
  } else if (input.consecutiveMissed >= 2) {
    flagClass = "administrative_escalation";
  }

  const primaryRuleId =
    triggeredRuleIds.find((r) => r.startsWith("CLIN-")) ||
    triggeredRuleIds[0] ||
    "ADM-DUE-01";

  const abovePivotThreshold =
    hardClinicalOverride || totalScore >= thresholds.pivotThreshold;
  const requiresRapidAmbulance =
    abovePivotThreshold &&
    (input.mobility === "homebound" || exceedsLocalClinic || totalScore >= 165);

  const safetyDisclaimer =
    flagClass === "clinical_review"
      ? "Prototype rule. Not a diagnosis. Clinician review required."
      : "Administrative follow-up tracking prompt.";

  const whyFlaggedPrefix =
    flagClass === "clinical_review"
      ? "Needs clinician review"
      : flagClass === "administrative_escalation"
      ? "Missed follow-up escalation (Worker home visit + Supervisor notice)"
      : "Routine follow-up reminder";

  const whyFlagged = `${whyFlaggedPrefix}: ${
    reasons.length > 0 ? reasons.join(" • ") : "Scheduled check-in window active."
  } (Composite Score: ${totalScore} vs Pivot Threshold: ${thresholds.pivotThreshold}). ${safetyDisclaimer}`;

  return {
    patientId: input.patientId,
    pseudonym: input.pseudonym,
    ageBand: input.ageBand,
    village: input.village,
    facilityId: input.facilityId,
    hexagonId: input.hexagonId,
    cohort: input.cohort,
    mobility: input.mobility,
    flagClass,
    primaryRuleId,
    ruleVersion: thresholds.version,
    totalScore,
    abovePivotThreshold,
    hardClinicalOverride,
    pivotThresholdUsed: thresholds.pivotThreshold,
    exceedsLocalClinicCapability: exceedsLocalClinic,
    requiresRapidAmbulance,
    whyFlagged,
    safetyDisclaimer,
    stackedFlagCount: Math.max(1, stackedFlags),
    categories,
    latestVitals: latest,
    bpTrendValues,
  };
}

// ============================================================================
// QUICKSORT PIVOT THRESHOLD PARTITIONING ENGINE
// ============================================================================

export interface QuickSortTrace {
  pivotThreshold: number;
  totalEvaluated: number;
  immediateCount: number; // Score >= pivotThreshold
  flexibleCount: number; // Score < pivotThreshold
  comparisons: number;
  executionMicros: number;
}

export interface QuickSortPartitionResult {
  immediatePartition: EvaluatedPatientFlag[]; // >= Threshold, sorted descending
  flexiblePartition: EvaluatedPatientFlag[]; // < Threshold, sorted descending
  combinedRanked: EvaluatedPatientFlag[];
  trace: QuickSortTrace;
}

/**
 * Genuine QuickSort implementation with initial Pivot Partitioning around the
 * Clinician Threshold (`pivotThreshold`), followed by recursive QuickSort within
 * both the Upper (`>= threshold`) and Lower (`< threshold`) partitions.
 */
export function quickSortPatientsByThreshold(
  items: EvaluatedPatientFlag[],
  pivotThreshold: number = DEFAULT_CLINICIAN_THRESHOLDS.pivotThreshold
): QuickSortPartitionResult {
  const startNs = typeof performance !== "undefined" ? performance.now() : Date.now();
  let comparisons = 0;

  // Step 1: O(n) Primary Pivot Partition around Clinician Threshold Number
  const upperImmediate: EvaluatedPatientFlag[] = [];
  const lowerFlexible: EvaluatedPatientFlag[] = [];

  for (let i = 0; i < items.length; i++) {
    comparisons++;
    if (items[i].totalScore >= pivotThreshold) {
      upperImmediate.push(items[i]);
    } else {
      lowerFlexible.push(items[i]);
    }
  }

  // Step 2: Recursive QuickSort in descending order of totalScore
  function quickSortDesc(arr: EvaluatedPatientFlag[]): EvaluatedPatientFlag[] {
    if (arr.length <= 1) return arr;
    const pivotIndex = Math.floor(arr.length / 2);
    const pivot = arr[pivotIndex];
    const leftHigher: EvaluatedPatientFlag[] = [];
    const middleEqual: EvaluatedPatientFlag[] = [];
    const rightLower: EvaluatedPatientFlag[] = [];

    for (let i = 0; i < arr.length; i++) {
      comparisons++;
      const current = arr[i];
      if (current.totalScore > pivot.totalScore) {
        leftHigher.push(current);
      } else if (current.totalScore < pivot.totalScore) {
        rightLower.push(current);
      } else {
        // Deterministic tie-breaker: hardClinicalOverride, clinical_review, stackedFlagCount, then patientId
        if (current.hardClinicalOverride && !pivot.hardClinicalOverride) {
          leftHigher.push(current);
        } else if (!current.hardClinicalOverride && pivot.hardClinicalOverride) {
          rightLower.push(current);
        } else if (
          current.flagClass === "clinical_review" &&
          pivot.flagClass !== "clinical_review"
        ) {
          leftHigher.push(current);
        } else if (
          current.flagClass !== "clinical_review" &&
          pivot.flagClass === "clinical_review"
        ) {
          rightLower.push(current);
        } else if (current.stackedFlagCount > pivot.stackedFlagCount) {
          leftHigher.push(current);
        } else if (current.stackedFlagCount < pivot.stackedFlagCount) {
          rightLower.push(current);
        } else if (current.patientId < pivot.patientId) {
          leftHigher.push(current);
        } else if (current.patientId > pivot.patientId) {
          rightLower.push(current);
        } else {
          middleEqual.push(current);
        }
      }
    }

    return [
      ...quickSortDesc(leftHigher),
      ...middleEqual,
      ...quickSortDesc(rightLower),
    ];
  }

  const sortedImmediate = quickSortDesc(upperImmediate);
  const sortedFlexible = quickSortDesc(lowerFlexible);
  const endNs = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    immediatePartition: sortedImmediate,
    flexiblePartition: sortedFlexible,
    combinedRanked: [...sortedImmediate, ...sortedFlexible],
    trace: {
      pivotThreshold,
      totalEvaluated: items.length,
      immediateCount: sortedImmediate.length,
      flexibleCount: sortedFlexible.length,
      comparisons,
      executionMicros: Math.max(1, Math.round((endNs - startNs) * 1000)),
    },
  };
}

// ============================================================================
// 3-BUCKET (15 SYSTEM / 5 CRITICAL / 10 WALK-IN = 30 SLOTS) CLINIC ALLOCATOR
// & HEXAGON OVERFLOW TRIGGER
// ============================================================================

export interface ClinicSlotAssignment {
  slotNumber: number;
  bucket: "CRITICAL_RESERVED" | "SYSTEM_FLEXIBLE" | "PROTECTED_WALK_IN";
  timeWindow: string; // Either "IMMEDIATE INTERVENTION" or 50m-2h flexible window
  patientId: string | null;
  pseudonym: string | null;
  score: number | null;
  flagClass: FlagClass | "walk_in_protected" | null;
  status: "OCCUPIED" | "AVAILABLE_BUFFER" | "PROTECTED_GENERAL";
}

export interface ClinicCapacityAllocation {
  facilityId: string;
  hexagonId: string;
  totalCapacity: number; // Default 30
  systemFollowupCap: number; // Default 15
  criticalReservedCap: number; // Default 5
  walkInProtectedCap: number; // Default 10
  occupiedCritical: number;
  occupiedSystemFollowup: number;
  occupiedSystem: number;
  occupiedWalkIn: number; // Protected general walk-ins
  preemptedLowScoreCount: number;
  preemptedToRemoteWorker: EvaluatedPatientFlag[]; // Bumped safely when 31st critical patient arrives
  overflowToAdjacentHexagons: EvaluatedPatientFlag[]; // Triggered when clinic is 100% full on critical+system capacity
  slots: ClinicSlotAssignment[];
}

const FLEXIBLE_WINDOWS_50M_TO_2H = [
  "09:00 – 10:45 (1h 45m Flexible Window)",
  "10:45 – 12:30 (1h 45m Flexible Window)",
  "13:30 – 15:15 (1h 45m Flexible Window)",
  "15:15 – 17:00 (1h 45m Flexible Window)",
];

/**
 * Allocates QuickSort-partitioned patients into the 30-slot clinic structure:
 * - 5 Reserved Critical Slots (Immediate help for >= Threshold)
 * - 15 System Follow-up Slots (Flexible 50m–2h windows between Open & Close for < Threshold)
 * - 10 Protected Walk-In Slots (Untouched for regular walk-in villagers)
 *
 * If >5 Critical patients arrive:
 * - They preempt the lowest-scoring routine slots at the tail of the 15 System Slots
 *   (shifting those stable routine patients to remote ASHA check-in / +48h window).
 * - If all 20 (5 Critical + 15 System) slots are saturated with critical cases,
 *   any additional critical patient triggers the Adjacent Hexagon Clinic Broadcast!
 */
export function allocateClinicSlots30(
  facilityId: string,
  hexagonId: string,
  patientsForClinic: EvaluatedPatientFlag[],
  pivotThreshold: number = DEFAULT_CLINICIAN_THRESHOLDS.pivotThreshold,
  caps = { systemFollowupCap: 15, criticalReservedCap: 5, walkInProtectedCap: 10 }
): ClinicCapacityAllocation {
  const partitioned = quickSortPatientsByThreshold(patientsForClinic, pivotThreshold);
  const { immediatePartition, flexiblePartition } = partitioned;

  const { systemFollowupCap, criticalReservedCap, walkInProtectedCap } = caps;
  const totalSystemAndCritical = systemFollowupCap + criticalReservedCap; // 20 slots

  const slots: ClinicSlotAssignment[] = [];
  const preemptedToRemoteWorker: EvaluatedPatientFlag[] = [];
  const overflowToAdjacentHexagons: EvaluatedPatientFlag[] = [];

  // 1. Fill the 5 Reserved Critical Slots first with top immediatePartition patients
  const criticalDirect = immediatePartition.slice(0, criticalReservedCap);
  const criticalExcess = immediatePartition.slice(criticalReservedCap);

  for (let i = 0; i < criticalReservedCap; i++) {
    const p = criticalDirect[i];
    slots.push({
      slotNumber: i + 1,
      bucket: "CRITICAL_RESERVED",
      timeWindow: "IMMEDIATE INTERVENTION (0–15 min Priority)",
      patientId: p ? p.patientId : null,
      pseudonym: p ? p.pseudonym : null,
      score: p ? p.totalScore : null,
      flagClass: p ? p.flagClass : null,
      status: p ? "OCCUPIED" : "AVAILABLE_BUFFER",
    });
  }

  // 2. If there are excess Critical patients (>5), they can preempt slots from the 15 System Follow-up bucket,
  //    up to the 15 System slots. Any critical patient beyond total (5 + 15 = 20) triggers Hexagon Broadcast!
  const criticalPreemptingSystem = criticalExcess.slice(0, systemFollowupCap);
  const criticalOverflowingClinic = criticalExcess.slice(systemFollowupCap);
  overflowToAdjacentHexagons.push(...criticalOverflowingClinic);

  const remainingSystemSlotsForFlexible = Math.max(
    0,
    systemFollowupCap - criticalPreemptingSystem.length
  );

  const flexibleSlotted = flexiblePartition.slice(0, remainingSystemSlotsForFlexible);
  const flexibleBumped = flexiblePartition.slice(remainingSystemSlotsForFlexible);
  preemptedToRemoteWorker.push(...flexibleBumped);

  const combinedSystemBucket = [...criticalPreemptingSystem, ...flexibleSlotted];

  for (let i = 0; i < systemFollowupCap; i++) {
    const p = combinedSystemBucket[i];
    const windowLabel =
      p && p.abovePivotThreshold
        ? "IMMEDIATE PREEMPTED SLOT (31st-Patient Protocol)"
        : FLEXIBLE_WINDOWS_50M_TO_2H[i % FLEXIBLE_WINDOWS_50M_TO_2H.length];

    slots.push({
      slotNumber: criticalReservedCap + i + 1,
      bucket: "SYSTEM_FLEXIBLE",
      timeWindow: windowLabel,
      patientId: p ? p.patientId : null,
      pseudonym: p ? p.pseudonym : null,
      score: p ? p.totalScore : null,
      flagClass: p ? p.flagClass : null,
      status: p ? "OCCUPIED" : "AVAILABLE_BUFFER",
    });
  }

  // 3. The 10 Protected Walk-In / Regular Checkup Slots are NEVER touched by our follow-up engine!
  for (let i = 0; i < walkInProtectedCap; i++) {
    slots.push({
      slotNumber: totalSystemAndCritical + i + 1,
      bucket: "PROTECTED_WALK_IN",
      timeWindow: "09:00 – 17:00 Protected General Walk-In (Untouched by System)",
      patientId: `WALKIN-GEN-${i + 1}`,
      pseudonym: `General Walk-In Slot #${i + 1}`,
      score: null,
      flagClass: "walk_in_protected",
      status: "PROTECTED_GENERAL",
    });
  }

  return {
    facilityId,
    hexagonId,
    totalCapacity: systemFollowupCap + criticalReservedCap + walkInProtectedCap,
    systemFollowupCap,
    criticalReservedCap,
    walkInProtectedCap,
    occupiedCritical: criticalDirect.length + criticalPreemptingSystem.length,
    occupiedSystemFollowup: flexibleSlotted.length,
    occupiedSystem: flexibleSlotted.length,
    occupiedWalkIn: walkInProtectedCap,
    preemptedLowScoreCount: flexibleBumped.length,
    preemptedToRemoteWorker,
    overflowToAdjacentHexagons,
    slots,
  };
}

