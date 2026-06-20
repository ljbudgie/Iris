/**
 * Appends a new certified partner row to institutional_register.csv
 * in the burgess-principle repo via the GitHub Contents API.
 *
 * Required env vars:
 *   GITHUB_API_TOKEN  — fine-grained PAT with `contents: write` on ljbudgie/burgess-principle
 */

const OWNER = "ljbudgie";
const REPO = "burgess-principle";
const FILE_PATH = "institutional_register.csv";
const BRANCH = "main";
const API_BASE = "https://api.github.com";

export type CertifiedPartnerRow = {
  institution: string;
  sector: string;
  tier: string;
  certifiedDate: string;
  sovereignScore?: string;
  status: string;
  keyReference: string;
};

type GitHubFileResponse = {
  sha: string;
  content: string; // base64
  encoding: "base64";
};

/** Build the CSV row string for a newly certified partner. */
function buildCsvRow(partner: CertifiedPartnerRow): string {
  const fields = [
    partner.institution,
    partner.sector,
    "SOVEREIGN",
    partner.sovereignScore ?? "",
    "", // D1
    "", // D2
    "", // D3
    "", // D4
    "", // D5
    `Certified ${partner.tier} — ${partner.certifiedDate}. ${partner.status}`,
    partner.keyReference,
  ].map((f) => (f.includes(",") || f.includes('"') ? `"${f.replace(/"/g, '""')}"` : f));
  return fields.join(",");
}

/**
 * Fetch the current file content and SHA from GitHub.
 * Returns null if the file doesn't exist (shouldn't happen in practice).
 */
async function fetchCurrentFile(token: string): Promise<GitHubFileResponse> {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub GET file failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<GitHubFileResponse>;
}

/**
 * Append a new row to institutional_register.csv via the GitHub Contents API.
 * Returns the commit SHA on success.
 */
export async function appendCertifiedPartnerToRegister(
  partner: CertifiedPartnerRow,
  inquiryId: string
): Promise<{ commitSha: string; url: string }> {
  const token = process.env.GITHUB_API_TOKEN;
  if (!token) {
    throw new Error("GITHUB_API_TOKEN env var is not set");
  }

  const file = await fetchCurrentFile(token);

  // Decode current content (base64 → utf-8)
  const currentContent = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");

  // Append new row (ensure file ends with newline before appending)
  const normalised = currentContent.endsWith("\n") ? currentContent : `${currentContent}\n`;
  const newRow = buildCsvRow(partner);
  const updatedContent = `${normalised}${newRow}\n`;

  // Encode back to base64
  const encodedContent = Buffer.from(updatedContent, "utf-8").toString("base64");

  const commitMessage =
    `feat(register): add certified partner ${partner.institution} (${partner.tier})\n\n` +
    `Burgess Principle certification approved. Inquiry: ${inquiryId}\n` +
    `Certified date: ${partner.certifiedDate}`;

  const putUrl = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: commitMessage,
      content: encodedContent,
      sha: file.sha,
      branch: BRANCH,
    }),
  });

  if (!putRes.ok) {
    throw new Error(`GitHub PUT file failed: ${putRes.status} ${await putRes.text()}`);
  }

  const putData = (await putRes.json()) as {
    commit: { sha: string; html_url: string };
  };

  return {
    commitSha: putData.commit.sha,
    url: putData.commit.html_url,
  };
}
