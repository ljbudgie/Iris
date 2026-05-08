import { registerOTel } from "@vercel/otel";
import { runPreflight } from "@/lib/ai/preflight";

export function register() {
  registerOTel({ serviceName: "iris" });
  runPreflight();
}
