import type { CertificationRecord } from "@/lib/certification/workflow";

const RECORDS_KEY = "iris.certification.records.v1";
const KEY_MATERIAL_KEY = "iris.certification.key.v1";
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

type EncryptedPayload = {
  version: 1;
  algorithm: "AES-256-GCM";
  iv: string;
  ciphertext: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getVaultKey() {
  const existing = localStorage.getItem(KEY_MATERIAL_KEY);
  const rawKey = existing
    ? base64ToBytes(existing)
    : crypto.getRandomValues(new Uint8Array(32));

  if (!existing) {
    localStorage.setItem(KEY_MATERIAL_KEY, bytesToBase64(rawKey));
  }

  return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function createPersonGateCommitment(label: string, facts: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    ENCODER.encode(`${label}\n${facts}`)
  );
  return bytesToHex(new Uint8Array(digest));
}

export async function loadCertificationRecords(): Promise<
  CertificationRecord[]
> {
  const stored = localStorage.getItem(RECORDS_KEY);
  if (!stored) {
    return [];
  }

  const payload = JSON.parse(stored) as EncryptedPayload;
  const key = await getVaultKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.ciphertext)
  );

  return JSON.parse(DECODER.decode(plaintext)) as CertificationRecord[];
}

export async function saveCertificationRecords(records: CertificationRecord[]) {
  const key = await getVaultKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    ENCODER.encode(JSON.stringify(records))
  );

  const payload: EncryptedPayload = {
    version: 1,
    algorithm: "AES-256-GCM",
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };

  localStorage.setItem(RECORDS_KEY, JSON.stringify(payload));
}
