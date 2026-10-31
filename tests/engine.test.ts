import assert from "node:assert/strict";
import {
  evaluatePatientFiveCategories,
  quickSortPatientsByThreshold,
  allocateClinicSlots30,
  DEFAULT_CLINICIAN_THRESHOLDS,
} from "../src/lib/quicksort-engine.ts";
import {
  buildSeededDatabaseState,
  computeSystemSnapshot,
  verifyAuditChainIntegrity,
  appendAuditEntry,
} from "../src/lib/db.ts";

console.log("==================================================================");
console.log("SWASTHYA SENSE — Automated Verification & Engine Test Suite");
console.log("==================================================================");

// 1. Test 5-Category Bidirectional Rule Engine (Rising BP, Low Glucose, Post-Chemo Fever)
{
  const risingBpPatient = evaluatePatientFiveCategories({
    patientId: "TEST-1",
    pseudonym: "PT-HYP-TEST",
    ageBand: "60–69",
    village: "Boko Central",
    facilityId: "FAC-HEX-0",
    hexagonId: "HEX-0",
    cohort: "hypertension",
    mobility: "independent",
    consentActive: true,
    daysOverdue: 2,
    consecutiveMissed: 0,
    symptoms: [],
    vitalsHistory: [
      {
        recordedAt: "2026-10-01",
        systolicBp: 148,
        diastolicBp: 90,
        heartRate: 76,
        bloodGlucose: 110,
        temperature: 36.8,
        spo2: 98,
      },
      {
        recordedAt: "2026-10-15",
        systolicBp: 156,
        diastolicBp: 94,
        heartRate: 80,
        bloodGlucose: 115,
        temperature: 36.9,
        spo2: 98,
      },
      {
        recordedAt: "2026-10-31",
        systolicBp: 163,
        diastolicBp: 102,
        heartRate: 84,
        bloodGlucose: 120,
        temperature: 37.0,
        spo2: 97,
      },
    ],
  });

  assert.equal(risingBpPatient.flagClass, "clinical_review");
  assert.equal(risingBpPatient.primaryRuleId, "CLIN-BP-02");
  assert.equal(risingBpPatient.abovePivotThreshold, true);
  assert.ok(risingBpPatient.whyFlagged.includes("148 → 156 → 163"));
  assert.ok(risingBpPatient.whyFlagged.includes("Not a diagnosis"));
  console.log("✅ [PASS] Test 1: 3-Reading Rising BP (148 → 156 → 163) triggers CLIN-BP-02 with explainable trace.");
}

// 2. Test Post-Cancer / Post-Illness Recovery Bidirectional Crisis (Low BP + High Fever + Homebound -> Rapid Ambulance)
{
  const cancerRecoveryPatient = evaluatePatientFiveCategories({
    patientId: "TEST-ONC",
    pseudonym: "PT-ONC-TEST",
    ageBand: "50–59",
    village: "Boko Central",
    facilityId: "FAC-HEX-0",
    hexagonId: "HEX-0",
    cohort: "post_illness",
    mobility: "homebound",
    consentActive: true,
    daysOverdue: 3,
    consecutiveMissed: 1,
    symptoms: ["post_chemo_fever", "breathlessness"],
    vitalsHistory: [
      {
        recordedAt: "2026-10-31",
        systolicBp: 84, // LOW (<90)
        diastolicBp: 54,
        heartRate: 122, // HIGH (>110)
        bloodGlucose: 65, // LOW (<70)
        temperature: 38.9, // HIGH (>=38.0)
        spo2: 91, // LOW (<93)
      },
    ],
  });

  assert.equal(cancerRecoveryPatient.flagClass, "clinical_review");
  assert.equal(cancerRecoveryPatient.exceedsLocalClinicCapability, true);
  assert.equal(cancerRecoveryPatient.requiresRapidAmbulance, true);
  assert.ok(cancerRecoveryPatient.totalScore >= 200);
  console.log(
    `✅ [PASS] Test 2: Post-Illness/Oncology crisis (Score ${cancerRecoveryPatient.totalScore}) flags Clinic-Bypass & Rapid Ambulance.`
  );
}

// 3. Test QuickSort Pivot Threshold Partitioning & 30-Slot (15 System / 5 Critical / 10 Walk-In) Isolation
{
  const state = buildSeededDatabaseState();
  const snapshot = computeSystemSnapshot("worker", "USR-WRK-RINA");

  const { immediatePartition, flexiblePartition } = snapshot.quickSortResult;
  assert.ok(immediatePartition.length > 0, "Should have immediate partition patients >= 100");
  assert.ok(flexiblePartition.length > 0, "Should have flexible partition patients < 100");

  // Verify every immediate patient has score >= threshold and is sorted descending
  for (let i = 0; i < immediatePartition.length; i++) {
    assert.ok(
      immediatePartition[i].totalScore >= DEFAULT_CLINICIAN_THRESHOLDS.pivotThreshold
    );
    if (i > 0) {
      assert.ok(immediatePartition[i - 1].totalScore >= immediatePartition[i].totalScore);
    }
  }

  // Verify every flexible patient has score < threshold and is sorted descending
  for (let i = 0; i < flexiblePartition.length; i++) {
    assert.ok(
      flexiblePartition[i].totalScore < DEFAULT_CLINICIAN_THRESHOLDS.pivotThreshold
    );
    if (i > 0) {
      assert.ok(flexiblePartition[i - 1].totalScore >= flexiblePartition[i].totalScore);
    }
  }

  // Verify 30-slot allocation for FAC-HEX-0 preserves 10 Walk-In slots untouched
  const hex0Alloc = snapshot.clinicAllocations["FAC-HEX-0"];
  assert.equal(hex0Alloc.totalCapacity, 30);
  assert.equal(hex0Alloc.systemFollowupCap, 15);
  assert.equal(hex0Alloc.criticalReservedCap, 5);
  assert.equal(hex0Alloc.walkInProtectedCap, 10);

  const walkInSlots = hex0Alloc.slots.filter((s) => s.bucket === "PROTECTED_WALK_IN");
  assert.equal(walkInSlots.length, 10);
  assert.ok(walkInSlots.every((s) => s.status === "PROTECTED_GENERAL"));

  console.log(
    `✅ [PASS] Test 3: QuickSort Pivot Engine partitioned ${snapshot.quickSortResult.trace.totalEvaluated} patients (${immediatePartition.length} Immediate >=100, ${flexiblePartition.length} Flexible <100) and preserved 10/10 Protected Walk-In slots.`
  );
}

// 4. Test 31st-Patient Preemption & Hexagon Overflow Trigger
{
  // Create 22 mock patients for a clinic (7 critical >= 100, 15 routine < 100)
  const mockPatients = [];
  for (let i = 1; i <= 7; i++) {
    mockPatients.push(
      evaluatePatientFiveCategories({
        patientId: `CRIT-${i}`,
        pseudonym: `PT-CRIT-${i}`,
        ageBand: "50–59",
        village: "Chhaygaon",
        facilityId: "FAC-HEX-1",
        hexagonId: "HEX-1",
        cohort: "post_illness",
        mobility: "homebound",
        consentActive: true,
        daysOverdue: 5,
        consecutiveMissed: 2,
        symptoms: ["post_chemo_fever"],
        vitalsHistory: [
          {
            recordedAt: "2026-10-31",
            systolicBp: 170 + i,
            diastolicBp: 105,
            heartRate: 118,
            bloodGlucose: 140,
            temperature: 38.6,
            spo2: 92,
          },
        ],
      })
    );
  }
  for (let i = 1; i <= 15; i++) {
    mockPatients.push(
      evaluatePatientFiveCategories({
        patientId: `ROUT-${i}`,
        pseudonym: `PT-ROUT-${i}`,
        ageBand: "40–49",
        village: "Chhaygaon",
        facilityId: "FAC-HEX-1",
        hexagonId: "HEX-1",
        cohort: "hypertension",
        mobility: "independent",
        consentActive: true,
        daysOverdue: 2,
        consecutiveMissed: 0,
        symptoms: [],
        vitalsHistory: [
          {
            recordedAt: "2026-10-31",
            systolicBp: 130,
            diastolicBp: 82,
            heartRate: 74,
            bloodGlucose: 105,
            temperature: 36.7,
            spo2: 98,
          },
        ],
      })
    );
  }

  const alloc = allocateClinicSlots30("FAC-HEX-1", "HEX-1", mockPatients, 100);
  // 5 Critical slots filled + 2 excess Critical patients preempt 2 of the 15 System slots = 7 Critical occupied!
  assert.equal(alloc.occupiedCritical, 7);
  // Remaining 13 System slots filled by routine flexible patients, 2 lowest-scoring routine patients shifted to remote worker
  assert.equal(alloc.occupiedSystemFollowup, 13);
  assert.equal(alloc.preemptedToRemoteWorker.length, 2);
  // And all 10 Walk-In slots remain 100% untouched!
  assert.equal(alloc.occupiedWalkIn, 10);
  console.log(
    "✅ [PASS] Test 4: 31st-Patient Preemption shifts lowest-risk routine slots to remote worker check-in while keeping all 10 Walk-In slots untouched."
  );
}

// 5. Test Seeded Registry (300 Synthetic Patients) & SHA-256 Hash-Chained Audit Trail
{
  const snap = computeSystemSnapshot("admin", "USR-ADMIN-1");
  assert.equal(snap.stats.totalPatients, 300);
  assert.equal(snap.withdrawnPatients.length, 3);
  assert.equal(snap.facilities.length, 5);

  appendAuditEntry(
    "USR-SUP-1",
    "Pranab Hazarika",
    "supervisor",
    "READ_PATIENT_CONTACT_DENIED",
    "PT-ONC-401",
    "PT-SYN-001",
    "BLOCKED_403_RBAC",
    "Supervisor attempted to read encrypted contact details — blocked and logged."
  );

  const integrity = verifyAuditChainIntegrity();
  assert.equal(integrity.valid, true);
  assert.equal(integrity.brokenAtId, null);
  console.log(
    `✅ [PASS] Test 5: 300 Synthetic Patients, 5 Hexagon Clinics, Consent Gate, and SHA-256 Audit Chain (${integrity.totalEntries} linked hashes) verified.`
  );
}

console.log("==================================================================");
console.log("ALL SWASTHYA SENSE AUTOMATED TESTS PASSED (100%)");
console.log("==================================================================");

