/**
 * Publishes a new certified partner to the Framer CMS "Certified Partners" collection.
 *
 * Required env vars:
 *   FRAMER_API_TOKEN        — Framer API token (from framer.com/developers)
 *   FRAMER_PROJECT_ID       — The Framer project ID (find in project settings)
 *   FRAMER_COLLECTION_ID    — The CMS collection ID for "Certified Partners"
 *
 * Framer CMS item shape (must match the collection fields you set up in Framer):
 *   name            Text
 *   sector          Text
 *   tier            Text (e.g. "Tier 1", "Tier 2")
 *   certifiedDate   Text (ISO date string, e.g. "2026-06-19")
 *   sovereignScore  Text (e.g. "16/20") — optional
 *   caseStudyUrl    Link — optional
 *   slug            Text (auto-generated from name if not provided)
 */

const FRAMER_API_BASE = "https://api.framer.com/store";

export type FramerCertifiedPartner = {
  name: string;
  sector: string;
  tier: "Tier 1" | "Tier 2";
  certifiedDate: string;
  sovereignScore?: string;
  caseStudyUrl?: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Create a new CMS item in the Framer "Certified Partners" collection.
 * Returns the created item ID on success.
 *
 * If FRAMER_API_TOKEN / FRAMER_PROJECT_ID / FRAMER_COLLECTION_ID are not set,
 * returns a no-op result rather than throwing — so the approval flow completes
 * even if Framer isn't yet wired up.
 */
export async function publishCertifiedPartnerToFramer(
  partner: FramerCertifiedPartner
): Promise<{ itemId: string | null; skipped: boolean; reason?: string }> {
  const token = process.env.FRAMER_API_TOKEN;
  const projectId = process.env.FRAMER_PROJECT_ID;
  const collectionId = process.env.FRAMER_COLLECTION_ID;

  if (!token || !projectId || !collectionId) {
    return {
      itemId: null,
      skipped: true,
      reason:
        "Framer env vars not configured (FRAMER_API_TOKEN, FRAMER_PROJECT_ID, FRAMER_COLLECTION_ID). " +
        "The register commit succeeded. Add these env vars to enable automatic site updates.",
    };
  }

  const url = `${FRAMER_API_BASE}/projects/${projectId}/collections/${collectionId}/items`;

  const body = {
    fieldData: {
      name: partner.name,
      sector: partner.sector,
      tier: partner.tier,
      "certified-date": partner.certifiedDate,
      ...(partner.sovereignScore && { "sovereign-score": partner.sovereignScore }),
      ...(partner.caseStudyUrl && { "case-study-url": partner.caseStudyUrl }),
      slug: slugify(partner.name),
    },
    isDraft: false,
    isArchived: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Framer CMS POST failed: ${res.status} ${await res.text()}`
    );
  }

  const data = (await res.json()) as { id: string };
  return { itemId: data.id, skipped: false };
}
