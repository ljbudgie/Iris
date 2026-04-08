import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex =
  /^guest-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const DUMMY_PASSWORD = generateDummyPassword();

export const MAX_FILE_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IP_MESSAGES_PER_HOUR = 100;
export const IP_RATE_LIMIT_TTL_SECONDS = 60 * 60; // 1 hour

export const FEATURED_MODEL_ID = "xai/grok-4.1-fast-non-reasoning";

export const suggestions = [
  "What is the Burgess Principle and how can it help me?",
  "An organisation treated me unfairly — what are my options?",
  "Draft a formal letter to challenge a decision",
];
