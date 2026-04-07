import { z } from "zod";

/**
 * Governance status for provider outputs under The Burgess Principle.
 *
 * SOVEREIGN — a human mind has been applied to this specific output
 *             for this specific user; the response may be delivered.
 * NULL      — no human review has occurred; the response must be
 *             flagged, held, or routed to human review before delivery.
 */
export type GovernanceStatus = "SOVEREIGN" | "NULL";

/** Unique identifier for a registered federation provider. */
export type ProviderId = string;

// ---------------------------------------------------------------------------
// Provider registration
// ---------------------------------------------------------------------------

export const providerRegistrationSchema = z.object({
  /** Human-readable provider name. */
  name: z.string().min(1).max(128),

  /** HTTPS endpoint that accepts federated messages. */
  endpointUrl: z.string().url(),

  /** Capabilities the provider declares (e.g. ["code", "translation"]). */
  capabilities: z.array(z.string().min(1)).min(1),

  /**
   * The provider must explicitly accept the governance protocol
   * tied to UK Certification Mark UK00004343685.
   */
  acceptsGovernanceProtocol: z.literal(true, {
    errorMap: () => ({
      message:
        "Provider must accept the governance protocol (UK Certification Mark UK00004343685) to register.",
    }),
  }),
});

export type ProviderRegistration = z.infer<typeof providerRegistrationSchema>;

// ---------------------------------------------------------------------------
// Stored provider record
// ---------------------------------------------------------------------------

export type FederationProvider = {
  id: ProviderId;
  name: string;
  endpointUrl: string;
  capabilities: string[];
  governanceStatus: GovernanceStatus;
  registeredAt: string;
};

// ---------------------------------------------------------------------------
// Federated message routing
// ---------------------------------------------------------------------------

export const federatedMessageSchema = z.object({
  /** User message content to route to providers. */
  content: z.string().min(1),

  /** Optional list of provider IDs; if omitted, all providers are queried. */
  providerIds: z.array(z.string()).optional(),

  /** Optional capability filter to narrow down target providers. */
  capability: z.string().optional(),
});

export type FederatedMessage = z.infer<typeof federatedMessageSchema>;

// ---------------------------------------------------------------------------
// Provider response
// ---------------------------------------------------------------------------

export type ProviderResponse = {
  providerId: ProviderId;
  providerName: string;
  content: string;
  governanceStatus: GovernanceStatus;
  respondedAt: string;
};

export type FederatedRouteResponse = {
  responses: ProviderResponse[];
  attribution: {
    providerId: ProviderId;
    providerName: string;
    governanceStatus: GovernanceStatus;
  }[];
};
