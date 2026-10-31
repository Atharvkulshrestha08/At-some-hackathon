import crypto from "crypto";

export interface DemoAccountChip {
  personLabel: string;
  orgId: string;
  orgName: string;
  userId: string;
  password: string;
  role: "clinician" | "worker" | "supervisor" | "admin";
  subRole: "doctor" | "asha" | "nurse";
  roleBadge: string;
  displayName: string;
  facilityId: string;
  hexagonId: string;
}

/**
 * Cryptographic salted password hashing using Node.js native scrypt (RFC 7914 memory-hard KDF,
 * equivalent to argon2/bcrypt without native C++ addon build failures).
 * Format: `scrypt$<salt_hex>$<derived_key_hex>`
 */
export function hashPassword(plainPassword: string, explicitSalt?: string): string {
  const salt =
    explicitSalt ||
    crypto
      .createHash("sha256")
      .update(`swasthya_salt_${plainPassword.slice(0, 4)}`)
      .digest("hex")
      .slice(0, 32);
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

/**
 * Constant-time verification of a plaintext password against a stored scrypt hash.
 */
export function verifyPasswordHash(plainPassword: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt$")) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  const actualHex = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const actualBuf = Buffer.from(actualHex, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Three Simultaneous Demo Users across 3 Separate Tenants (DEMO ONLY seed configuration).
 * Supports env overrides while providing deterministic defaults for hackathon judges.
 */
export const DEMO_SEED_ACCOUNTS: DemoAccountChip[] = [
  {
    personLabel: "Clinic doctor",
    orgId: process.env.DEMO_ORG_BOKO_ID || "ORG-BOKO",
    orgName: "Boko Central PHC Medical Block",
    userId: process.env.DEMO_USER_BOKO_ID || "doc.boko01",
    password: process.env.DEMO_USER_BOKO_PASS || "Boko@Demo#101",
    role: "clinician",
    subRole: "doctor",
    roleBadge: "Clinician, HEX-0 Boko Central PHC",
    displayName: "Dr. Ananya Baruah (doc.boko01)",
    facilityId: "FAC-BOKO-0",
    hexagonId: "HEX-0",
  },
  {
    personLabel: "Frontline worker",
    orgId: process.env.DEMO_ORG_SEVAK_ID || "ORG-SEVAK",
    orgName: "Sevak Health Foundation (15-Worker Team)",
    userId: process.env.DEMO_USER_SEVAK_ID || "asha.sevak07",
    password: process.env.DEMO_USER_SEVAK_PASS || "Sevak@Demo#207",
    role: "worker",
    subRole: "asha",
    roleBadge: "ASHA worker, Sevak 15-worker team",
    displayName: "Jonali Nath (asha.sevak07)",
    facilityId: "FAC-HEX-0",
    hexagonId: "HEX-0",
  },
  {
    personLabel: "Local clinic nurse",
    orgId: process.env.DEMO_ORG_CHHAY_ID || "ORG-CHHAY",
    orgName: "Chhaygaon North Sub-Centre Network",
    userId: process.env.DEMO_USER_CHHAY_ID || "anm.chhay03",
    password: process.env.DEMO_USER_CHHAY_PASS || "Chhay@Demo#303",
    role: "worker",
    subRole: "nurse",
    roleBadge: "ANM nurse, HEX-1 Chhaygaon North",
    displayName: "Anjali Boro (anm.chhay03)",
    facilityId: "FAC-CHHAY-1",
    hexagonId: "HEX-1",
  },
];

