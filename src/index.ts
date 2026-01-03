import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";

// Load environment variables: prefer repo root `.env`, fall back to `web/.env`.
const rootEnvPath = path.join(process.cwd(), ".env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  const webEnvPath = path.join(process.cwd(), "web", ".env");
  if (fs.existsSync(webEnvPath)) {
    dotenv.config({ path: webEnvPath });
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Simple POST proxy that runs the generator on the server and returns a
// sanitized response matching what the UI expects. Body: { input: string, os?: string }
app.post("/generate", async (req, res) => {
  try {
    const { input, os } = req.body ?? {};
    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "input is required" });
    }

    // Dynamically import the generator and safety modules so the server can
    // start even when OpenAI credentials are missing. If the import or
    // generation fails due to missing credentials, respond with a helpful
    // error instead of crashing the process.
    let modelResult: any;
    try {
      const { generateBashFromText } = await import("../web/src/lib/llm");
      const { sanitizeModelResult } = await import("../web/src/lib/safety");

      modelResult = await generateBashFromText({ input, os });

      const sanitized = sanitizeModelResult({
        commands: modelResult.commands,
        dryRunCommands: modelResult.dryRunCommands,
        riskLevel: modelResult.riskLevel,
        needsConfirmation: modelResult.needsConfirmation
      });

      if (sanitized.safety.blocked) {
        return res.status(400).json({
          error: "Blocked potentially dangerous command generation.",
          blocked: true,
          reasons: sanitized.safety.reasons,
          commands: [],
          explanations: [],
          riskLevel: "high",
          needsConfirmation: true,
          assumptions: modelResult.assumptions ?? [],
          dryRunCommands: []
        });
      }

      return res.json({
        commands: modelResult.commands,
        explanations: modelResult.explanations,
        riskLevel: sanitized.riskLevel,
        needsConfirmation: sanitized.needsConfirmation,
        assumptions: modelResult.assumptions,
        dryRunCommands: modelResult.dryRunCommands,
        safety: sanitized.safety
      });
    } catch (e: any) {
      // If the error seems to come from missing OpenAI credentials, return
      // a clear 500 message asking to set `OPENAI_API_KEY`.
      const msg = typeof e?.message === "string" ? e.message : String(e);
      if (msg.toLowerCase().includes("openai") || msg.toLowerCase().includes("missing")) {
        return res.status(500).json({ error: "OPENAI_API_KEY missing or OpenAI client error.", message: msg });
      }
      throw e;
    }

    if (sanitized.safety.blocked) {
      return res.status(400).json({
        error: "Blocked potentially dangerous command generation.",
        blocked: true,
        reasons: sanitized.safety.reasons,
        commands: [],
        explanations: [],
        riskLevel: "high",
        needsConfirmation: true,
        assumptions: modelResult.assumptions ?? [],
        dryRunCommands: []
      });
    }

    return res.json({
      commands: modelResult.commands,
      explanations: modelResult.explanations,
      riskLevel: sanitized.riskLevel,
      needsConfirmation: sanitized.needsConfirmation,
      assumptions: modelResult.assumptions,
      dryRunCommands: modelResult.dryRunCommands,
      safety: sanitized.safety
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Server error", message: err?.message ?? String(err) });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.get("/", (_req, res) => {
  res.send("nl2bash API is running. Try GET /health or POST /generate");
});
