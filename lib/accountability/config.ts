import type { RetentionConfig } from "./types";
import rawConfig from "./retention-config.json";

function loadConfig(): RetentionConfig {
  return {
    policies: {
      institutional_decision: rawConfig.policies.institutional_decision,
      accountability_evidence: rawConfig.policies.accountability_evidence,
      personal_sensitive: rawConfig.policies.personal_sensitive,
      model_context: rawConfig.policies.model_context,
      system_log: rawConfig.policies.system_log,
    },
  };
}

export const retentionConfig: RetentionConfig = loadConfig();
