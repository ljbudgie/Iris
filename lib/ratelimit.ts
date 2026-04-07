import { createClient } from "redis";

import {
  IP_RATE_LIMIT_TTL_SECONDS,
  isProductionEnvironment,
  MAX_IP_MESSAGES_PER_HOUR,
} from "@/lib/constants";
import { IrisError } from "@/lib/errors";

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => {
      console.error("Redis client error:", err);
    });
    client.connect().catch((err) => {
      console.error("Redis connection failed:", err);
      client = null;
    });
  }
  return client;
}

export async function checkIpRateLimit(ip: string | undefined) {
  if (!isProductionEnvironment || !ip) {
    return;
  }

  const redis = getClient();
  if (!redis?.isReady) {
    return;
  }

  try {
    const key = `ip-rate-limit:${ip}`;
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, IP_RATE_LIMIT_TTL_SECONDS, "NX")
      .exec();

    if (typeof count === "number" && count > MAX_IP_MESSAGES_PER_HOUR) {
      throw new IrisError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof IrisError) {
      throw error;
    }
    console.error("Redis rate limit check failed:", error);
  }
}
