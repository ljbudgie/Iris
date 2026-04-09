/**
 * PersonGate Vault — local storage for personal facts.
 *
 * The vault keeps all user-specific data on the user's side.  Facts are
 * never exposed externally; only cryptographic commitments leave the vault.
 *
 * This implementation uses an in-memory Map as the backing store.  In
 * production this would be backed by the MemPalace or a local encrypted
 * database, but the interface remains the same.
 */

import type {
  Challenge,
  ChallengeStatus,
  VaultCategory,
  VaultRecord,
  VaultState,
} from "./types";

/**
 * In-memory vault store keyed by userId.
 *
 * Each user has their own isolated vault containing records and challenges.
 */
const vaults = new Map<
  string,
  { records: Map<string, VaultRecord>; challenges: Map<string, Challenge> }
>();

function getUserVault(userId: string) {
  if (!vaults.has(userId)) {
    vaults.set(userId, {
      records: new Map(),
      challenges: new Map(),
    });
  }
  return vaults.get(userId)!;
}

// ---------------------------------------------------------------------------
// Vault record operations
// ---------------------------------------------------------------------------

/**
 * Store a new vault record with the user's personal facts.
 */
export function storeRecord({
  userId,
  category,
  facts,
  commitment,
  governanceStatus,
}: {
  userId: string;
  category: VaultCategory;
  facts: string;
  commitment: string;
  governanceStatus: "SOVEREIGN" | "NULL";
}): VaultRecord {
  const vault = getUserVault(userId);
  const now = new Date().toISOString();

  const record: VaultRecord = {
    id: crypto.randomUUID(),
    userId,
    category,
    facts,
    commitment,
    governanceStatus,
    createdAt: now,
    updatedAt: now,
  };

  vault.records.set(record.id, record);
  return record;
}

/**
 * Retrieve a vault record by ID.
 */
export function getRecord(
  userId: string,
  recordId: string
): VaultRecord | undefined {
  return getUserVault(userId).records.get(recordId);
}

/**
 * List all vault records for a user, optionally filtered by category.
 */
export function listRecords(
  userId: string,
  category?: VaultCategory
): VaultRecord[] {
  const vault = getUserVault(userId);
  const records = Array.from(vault.records.values());

  if (category) {
    return records.filter((r) => r.category === category);
  }
  return records;
}

/**
 * Update the governance status of a vault record (e.g. after receipt validation).
 */
export function updateRecordStatus(
  userId: string,
  recordId: string,
  governanceStatus: "SOVEREIGN" | "NULL"
): VaultRecord | undefined {
  const vault = getUserVault(userId);
  const record = vault.records.get(recordId);

  if (!record) {
    return undefined;
  }

  const updated: VaultRecord = {
    ...record,
    governanceStatus,
    updatedAt: new Date().toISOString(),
  };

  vault.records.set(recordId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Challenge operations
// ---------------------------------------------------------------------------

/**
 * Add a challenge to the user's vault (triggered by a NULL receipt).
 */
export function addChallenge(challenge: Challenge): void {
  const vault = getUserVault(challenge.userId);
  vault.challenges.set(challenge.id, challenge);
}

/**
 * List all challenges for a user, optionally filtered by status.
 */
export function listChallenges(
  userId: string,
  status?: ChallengeStatus
): Challenge[] {
  const vault = getUserVault(userId);
  const challenges = Array.from(vault.challenges.values());

  if (status) {
    return challenges.filter((c) => c.status === status);
  }
  return challenges;
}

/**
 * Update the status of an existing challenge.
 */
export function updateChallengeStatus(
  userId: string,
  challengeId: string,
  status: ChallengeStatus
): Challenge | undefined {
  const vault = getUserVault(userId);
  const challenge = vault.challenges.get(challengeId);

  if (!challenge) {
    return undefined;
  }

  const updated: Challenge = { ...challenge, status };
  vault.challenges.set(challengeId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Vault state (summary)
// ---------------------------------------------------------------------------

/**
 * Get the complete vault state for a user, including summary counts.
 */
export function getVaultState(userId: string): VaultState {
  const records = listRecords(userId);
  const challenges = listChallenges(userId);

  return {
    records,
    challenges,
    summary: {
      totalRecords: records.length,
      sovereignCount: records.filter(
        (r) => r.governanceStatus === "SOVEREIGN"
      ).length,
      nullCount: records.filter(
        (r) => r.governanceStatus === "NULL"
      ).length,
      openChallenges: challenges.filter(
        (c) => c.status === "open"
      ).length,
    },
  };
}

/**
 * Clear all vault data for a user (for testing or user-requested deletion).
 */
export function clearVault(userId: string): void {
  vaults.delete(userId);
}
