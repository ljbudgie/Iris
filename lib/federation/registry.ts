import { generateUUID } from "@/lib/utils";
import type { FederationProvider, GovernanceStatus, ProviderId } from "./types";

/**
 * In-memory provider registry.
 *
 * For production use this should be backed by a persistent store (e.g. the
 * existing Postgres database via Drizzle). An in-memory Map keeps the initial
 * scaffold simple and dependency-free.
 */
const providers = new Map<ProviderId, FederationProvider>();

export function registerProvider(
  registration: Omit<
    FederationProvider,
    "id" | "governanceStatus" | "registeredAt"
  >
): FederationProvider {
  const id = generateUUID();

  const provider: FederationProvider = {
    id,
    name: registration.name,
    endpointUrl: registration.endpointUrl,
    capabilities: registration.capabilities,
    governanceStatus: "NULL",
    registeredAt: new Date().toISOString(),
  };

  providers.set(id, provider);
  return provider;
}

export function getProvider(id: ProviderId): FederationProvider | undefined {
  return providers.get(id);
}

export function getAllProviders(): FederationProvider[] {
  return Array.from(providers.values());
}

export function removeProvider(id: ProviderId): boolean {
  return providers.delete(id);
}

export function getProvidersByCapability(
  capability: string
): FederationProvider[] {
  return getAllProviders().filter((p) => p.capabilities.includes(capability));
}

export function updateGovernanceStatus(
  id: ProviderId,
  status: GovernanceStatus
): FederationProvider | undefined {
  const provider = providers.get(id);
  if (!provider) {
    return undefined;
  }
  provider.governanceStatus = status;
  return provider;
}
