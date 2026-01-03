export type RiskLevel = "low" | "medium" | "high";

export type SafetyAssessment = {
  riskLevel: RiskLevel;
  needsConfirmation: boolean;
  blocked: boolean;
  reasons: string[];
  suggestedDryRunCommands: string[];
};

// Commands we should never output, even with confirmation.
// This is intentionally strict for a hackathon demo.
const HARD_BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\brm\s+-rf\s+\/\b/i, reason: "Refuses deleting the root directory." },
  { pattern: /\bmkfs(\.\w+)?\b/i, reason: "Refuses filesystem formatting commands." },
  { pattern: /\bdd\s+if=/i, reason: "Refuses raw disk overwrite commands (dd)." },
  { pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, reason: "Refuses fork bomb." },
  { pattern: /\bcurl\b.*\|\s*(sh|bash)\b/i, reason: "Refuses piping remote scripts to a shell." },
  { pattern: /\bwget\b.*\|\s*(sh|bash)\b/i, reason: "Refuses piping remote scripts to a shell." }
];

// Risk escalators. We still allow these, but they require confirmation.
const HIGH_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bsudo\b/i, reason: "Uses sudo." },
  { pattern: /\brm\b/i, reason: "Deletes files." },
  { pattern: /\bchown\b/i, reason: "Changes file ownership." },
  { pattern: /\bchmod\b/i, reason: "Changes file permissions." },
  { pattern: /\bmv\b/i, reason: "Moves/overwrites files." },
  { pattern: /\b>\s*\S+/i, reason: "Overwrites file contents via redirection." },
  { pattern: /\btee\b.*\b\/etc\//i, reason: "Writes into /etc." }
];

const MEDIUM_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bsed\b.*\s-i\b/i, reason: "In-place edits with sed." },
  { pattern: /\btruncate\b/i, reason: "Truncates files." },
  { pattern: /\btar\b.*\s--delete\b/i, reason: "Deletes entries from an archive." }
];

// A simple heuristic: if a command is read-only, it is likely low risk.
const READ_ONLY_HINTS: RegExp[] = [
  /^\s*(ls|pwd|whoami|id|date|uname)\b/i,
  /^\s*(cat|head|tail|less|more)\b/i,
  /^\s*(grep|rg|find)\b/i,
  /^\s*(du|df|ps|top|htop)\b/i,
  /^\s*(git\s+(status|log|diff|show))\b/i
];

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
  return order[a] >= order[b] ? a : b;
}

export function assessCommands(commands: string[], dryRunCommands: string[] = []): SafetyAssessment {
  const reasons: string[] = [];
  let riskLevel: RiskLevel = "low";
  let blocked = false;

  for (const cmd of commands) {
    const trimmed = cmd.trim();
    if (!trimmed) continue;

    // Hard blocks
    for (const rule of HARD_BLOCK_PATTERNS) {
      if (rule.pattern.test(trimmed)) {
        blocked = true;
        reasons.push(rule.reason);
      }
    }

    // Risk escalation
    for (const rule of HIGH_RISK_PATTERNS) {
      if (rule.pattern.test(trimmed)) {
        riskLevel = maxRisk(riskLevel, "high");
        reasons.push(rule.reason);
      }
    }
    for (const rule of MEDIUM_RISK_PATTERNS) {
      if (rule.pattern.test(trimmed)) {
        riskLevel = maxRisk(riskLevel, "medium");
        reasons.push(rule.reason);
      }
    }

    // If it doesn't look read-only and we haven't escalated, set to medium
    const looksReadOnly = READ_ONLY_HINTS.some((r) => r.test(trimmed));
    if (!looksReadOnly && riskLevel === "low") {
      // This is a conservative choice: unknown commands are medium.
      riskLevel = "medium";
      reasons.push("Command is not clearly read-only.");
    }
  }

  // Suggested dry runs
  const suggestedDryRunCommands: string[] = [];
  if (dryRunCommands.length > 0) {
    suggestedDryRunCommands.push(...dryRunCommands);
  }

  // If risky and no dry run exists, try to hint
  if ((riskLevel === "medium" || riskLevel === "high") && suggestedDryRunCommands.length === 0) {
    suggestedDryRunCommands.push("Preview changes before running any destructive command.");
  }

  const needsConfirmation = riskLevel !== "low";

  return {
    riskLevel,
    needsConfirmation,
    blocked,
    reasons: Array.from(new Set(reasons)),
    suggestedDryRunCommands
  };
}

export function sanitizeModelResult(input: {
  commands: string[];
  dryRunCommands: string[];
  riskLevel: RiskLevel;
  needsConfirmation: boolean;
}) {
  // Trust-but-verify: recompute risk from commands.
  const assessment = assessCommands(input.commands, input.dryRunCommands);

  return {
    ...input,
    riskLevel: assessment.riskLevel,
    needsConfirmation: assessment.needsConfirmation,
    safety: assessment
  };
}
