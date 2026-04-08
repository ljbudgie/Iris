import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerHour: number;
  /** Maximum assistant turns (LLM responses) per single chat session. */
  maxTurnsPerChat: number;
  /** Maximum cumulative token budget per single chat session. */
  maxTokensPerChat: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerHour: 100,
    maxTurnsPerChat: 20,
    maxTokensPerChat: 50_000,
  },
  regular: {
    maxMessagesPerHour: 1000,
    maxTurnsPerChat: 80,
    maxTokensPerChat: 200_000,
  },
};
