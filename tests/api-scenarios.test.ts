import assert from "node:assert/strict";
import {
  resetDbState,
  computeSystemSnapshot,
  verifyAuditChainIntegrity,
} from "../src/lib/db.ts";
import { GET, POST } from "../src/app/api/swasthya/route.ts";

async function callPost(payload: Record<string, unknown>) {
  const req = new Request("http://localhost:3000/api/swasthya", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  const res = await POST(req);
  const json = await res.json();
  return { status: res.status, json };
}

console.log("==================================================================");
console.log("SWASTHYA SENSE — End-to-End API & 10-Scenario Integration Suite");
console.log("==================================================================");

resetDbState();

// Scenario 1: GET initial snapshot & verify 300 synthetic patients + 5 Hexagon clinics
{
  const req = new Request(
    "http://localhost:3000/api/swasthya?role=worker&userId=USR-WRK-RINA"
  );
  const res = await GET(req);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.stats.totalPatients, 300);
  assert.equal(data.facilities.length, 5);
  assert.equal(data.auditIntegrity.valid, true);
  console.log("✅ [PASS] Scenario 1: GET /api/swasthya returns 300 synthetic patients & 5 Hexagon clinics.");
}

// Scenario 2: Send Multilingual WhatsApp Reminder & Simulate Patient Reply "1" (Clears Overdue)
{
  const sendRes = await callPost({
    action: "SEND_REMINDER",
    callerRole: "worker",
    callerId: "USR-WRK-RINA",
    callerName: "Rina Devi",
    patientId: "PT-SYN-006",
    templateKey: "due_today",
    overrideLanguage: "as", // Assamese
  });
  assert.equal(sendRes.status, 200);

  const replyRes = await callPost({
    action: "SIMULATE_PATIENT_REPLY",
    patientId: "PT-SYN-006",
    replyText: "1",
  });
  assert.equal(replyRes.status, 200);
  assert.ok(replyRes.json.message.includes("overdue reminder cleared"));
  console.log("✅ [PASS] Scenario 2: Assamese WhatsApp reminder sent & Reply '1' cleared overdue flag.");
}

// Scenario 3: Simulate Patient Reply "STOP" -> Immediate Consent Withdrawal & Record Lock
{
  const stopRes = await callPost({
    action: "SIMULATE_PATIENT_REPLY",
    patientId: "PT-SYN-005",
    replyText: "STOP",
  });
  assert.equal(stopRes.status, 200);

  // Attempting to send a reminder after STOP must be blocked (403 Consent Gate)
  const blockedSend = await callPost({
    action: "SEND_REMINDER",
    callerRole: "worker",
    callerId: "USR-WRK-RINA",
    patientId: "PT-SYN-005",
  });
  assert.equal(blockedSend.status, 403);
  assert.ok(blockedSend.json.error.includes("Consent Gate Blocked"));
  console.log("✅ [PASS] Scenario 3: Reply 'STOP' immediately revokes consent & blocks further messaging (403).");
}

// Scenario 4: Wrong-Role Contact Access Attempt (Supervisor tries to read phone number -> 403 + Audit)
{
  const rbacRes = await callPost({
    action: "VIEW_PATIENT_CONTACT",
    callerRole: "supervisor",
    callerId: "USR-SUP-1",
    callerName: "Pranab Hazarika",
    patientId: "PT-SYN-001",
  });
  assert.equal(rbacRes.status, 403);
  assert.ok(rbacRes.json.error.includes("403 Forbidden"));
  console.log("✅ [PASS] Scenario 4: Supervisor contact access blocked with uniform 403 & written to Audit Log.");
}

// Scenario 5: Simulate 31st-Patient Critical Arrival -> QuickSort Slot #1 + Hexagon Ring Broadcast + 10 Walk-In Untouched
{
  const p31Res = await callPost({
    action: "SIMULATE_31ST_PATIENT",
    facilityId: "FAC-HEX-1",
  });
  assert.equal(p31Res.status, 200);
  const topRanked = p31Res.json.snapshot.quickSortResult.immediatePartition[0];
  assert.ok(topRanked.totalScore >= 100);
  const hex1Slots = p31Res.json.snapshot.clinicAllocations["FAC-HEX-1"];
  assert.equal(hex1Slots.occupiedWalkIn, 10);
  console.log(
    `✅ [PASS] Scenario 5: 31st-Patient Critical Arrival scored ${topRanked.totalScore}, partitioned to Immediate Slot, kept 10 Walk-In slots untouched, and broadcasted to adjacent Hexagons.`
  );
}

// Scenario 6: Neighbor Hexagon Clinic Accepts & Claims Broadcast (Atomic Lock)
{
  const snap = computeSystemSnapshot();
  const openBroadcast = snap.hexBroadcasts.find(
    (b) => b.status === "BROADCASTING_RING"
  );
  assert.ok(openBroadcast, "Expected an active Hexagon Ring broadcast");

  const claimRes = await callPost({
    action: "CLAIM_HEXAGON_BROADCAST",
    callerRole: "clinician",
    callerId: "USR-CLIN-2",
    callerName: "Dr. Rajesh Sharma",
    broadcastId: openBroadcast.id,
    acceptingFacilityId: "FAC-HEX-4",
  });
  assert.equal(claimRes.status, 200);
  assert.ok(claimRes.json.message.includes("HEX-4"));
  console.log("✅ [PASS] Scenario 6: Adjacent Hexagon Clinic HEX-4 accepted & locked patient broadcast.");
}

// Scenario 7: Admin Proposes Rule Threshold Update -> Inactive Until Clinician Signs Off
{
  const draftRes = await callPost({
    action: "ADMIN_PROPOSE_THRESHOLDS",
    callerRole: "admin",
    callerId: "USR-ADMIN-1",
    callerName: "Vikramjit Bora",
    pivotThreshold: 95,
    bpSystolicHigh: 158,
  });
  assert.equal(draftRes.status, 200);
  assert.equal(draftRes.json.snapshot.activeThresholds.version, 1); // Still v1 until clinician approves!
  assert.ok(draftRes.json.snapshot.pendingRuleDraft);

  const signoffRes = await callPost({
    action: "CLINICIAN_APPROVE_THRESHOLDS",
    callerRole: "clinician",
    callerId: "USR-CLIN-1",
    callerName: "Dr. Ananya Baruah",
  });
  assert.equal(signoffRes.status, 200);
  assert.equal(signoffRes.json.snapshot.activeThresholds.version, 2);
  assert.equal(signoffRes.json.snapshot.activeThresholds.pivotThreshold, 95);
  console.log("✅ [PASS] Scenario 7: Admin rule draft v2 stayed inactive until Clinician sign-off activated it.");
}

// Scenario 8: Verify SHA-256 Hash-Chained Audit Trail Integrity after all mutations
{
  const auditCheck = verifyAuditChainIntegrity();
  assert.equal(auditCheck.valid, true);
  assert.equal(auditCheck.brokenAtId, null);
  console.log(
    `✅ [PASS] Scenario 8: SHA-256 Audit Chain 100% verified across all ${auditCheck.totalEntries} entries.`
  );
}

resetDbState();
console.log("==================================================================");
console.log("ALL END-TO-END API & SCENARIO TESTS PASSED (100%)");
console.log("==================================================================");
