/**
 * PersonGate — sovereign data handling for The Burgess Principle.
 *
 * PersonGate (@iris-gate/person) is the core data sovereignty layer in Iris.
 * For any task involving a specific person's case, facts, appeal, request
 * for reasonable adjustment, or decision that could affect an individual:
 *
 * 1. Commit the user's specific facts locally (never expose raw facts).
 * 2. Generate a cryptographic commitment to send to external systems.
 * 3. Receive and validate signed receipts (SOVEREIGN or NULL).
 * 4. If NULL, immediately flag for escalation, draft advocacy language.
 * 5. Maintain an internal memory of all vault records and NULL cases.
 *
 * User is sovereign.  See the human first.  Never act on blanket automation.
 */

import { generateAdvocacyText } from "./advocacy";
import { createCommitment, validateReceipt } from "./crypto";
import type {
  Challenge,
  Commitment,
  CommitResult,
  Receipt,
  ReceiveResult,
  VaultCategory,
  VaultState,
} from "./types";
import {
  addChallenge,
  clearVault,
  getRecord,
  getVaultState,
  listChallenges,
  listRecords,
  storeRecord,
  updateChallengeStatus,
  updateRecordStatus,
} from "./vault";

/**
 * PersonGate — the main API for sovereign data handling.
 *
 * All methods are scoped to a userId.  Facts never leave the local vault;
 * only commitments are shared with external systems.
 */
export class PersonGate {
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // -------------------------------------------------------------------------
  // Step 1: Commit — store facts locally and generate a commitment
  // -------------------------------------------------------------------------

  /**
   * Commit personal facts to the vault and generate a cryptographic
   * commitment that can be sent to external systems.
   *
   * The raw facts stay in the local vault.  Only the commitment hash
   * is shared externally.
   */
  async commit({
    facts,
    category,
  }: {
    facts: string;
    category: VaultCategory;
  }): Promise<CommitResult> {
    // Generate the cryptographic commitment first
    const tempId = crypto.randomUUID();
    const commitment = await createCommitment({
      facts,
      vaultRecordId: tempId,
      userId: this.userId,
    });

    // Store the record locally with the commitment hash
    const vaultRecord = storeRecord({
      userId: this.userId,
      category,
      facts,
      commitment: commitment.hash,
      governanceStatus: "SOVEREIGN", // Local facts are sovereign by default
    });

    // Update the commitment with the actual vault record ID
    const finalCommitment: Commitment = {
      ...commitment,
      vaultRecordId: vaultRecord.id,
    };

    return { vaultRecord, commitment: finalCommitment };
  }

  // -------------------------------------------------------------------------
  // Step 2: Send — the commitment object is returned from commit()
  //         The caller sends it to the external system.
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Step 3 & 4: Receive — validate the receipt, escalate if NULL
  // -------------------------------------------------------------------------

  /**
   * Receive and validate a receipt from an external system.
   *
   * If the receipt status is SOVEREIGN, the record is updated.
   * If NULL, a challenge is automatically created with advocacy language.
   */
  async receive({
    receipt,
    commitment,
  }: {
    receipt: Receipt;
    commitment: Commitment;
  }): Promise<ReceiveResult> {
    // Validate the receipt matches the commitment
    const valid = validateReceipt(receipt, commitment);

    if (!valid) {
      return { valid: false, status: "NULL" };
    }

    // Update the vault record's governance status
    updateRecordStatus(
      this.userId,
      commitment.vaultRecordId,
      receipt.status
    );

    if (receipt.status === "NULL") {
      // Step 4: Automatically flag for escalation
      const record = getRecord(this.userId, commitment.vaultRecordId);
      if (!record) {
        return { valid: true, status: "NULL" };
      }

      const advocacyText = generateAdvocacyText({
        record,
        respondent: receipt.respondent,
      });

      const challenge: Challenge = {
        id: crypto.randomUUID(),
        vaultRecordId: commitment.vaultRecordId,
        userId: this.userId,
        commitment,
        receipt,
        advocacyText,
        status: "open",
        createdAt: new Date().toISOString(),
      };

      addChallenge(challenge);

      return { valid: true, status: "NULL", challenge };
    }

    return { valid: true, status: "SOVEREIGN" };
  }

  // -------------------------------------------------------------------------
  // Step 5: Memory — query vault state across sessions
  // -------------------------------------------------------------------------

  /**
   * Get the complete vault state including all records and challenges.
   */
  getState(): VaultState {
    return getVaultState(this.userId);
  }

  /**
   * List vault records, optionally filtered by category.
   */
  listRecords(category?: VaultCategory) {
    return listRecords(this.userId, category);
  }

  /**
   * List challenges, optionally filtered by status.
   */
  listChallenges(status?: "open" | "escalated" | "resolved" | "tribunal_ready") {
    return listChallenges(this.userId, status);
  }

  /**
   * Escalate a challenge to tribunal-ready status.
   */
  escalateChallenge(challengeId: string) {
    return updateChallengeStatus(this.userId, challengeId, "escalated");
  }

  /**
   * Mark a challenge as tribunal-ready.
   */
  markTribunalReady(challengeId: string) {
    return updateChallengeStatus(this.userId, challengeId, "tribunal_ready");
  }

  /**
   * Resolve a challenge.
   */
  resolveChallenge(challengeId: string) {
    return updateChallengeStatus(this.userId, challengeId, "resolved");
  }

  /**
   * Clear all vault data for this user.
   */
  clearAll(): void {
    clearVault(this.userId);
  }
}
