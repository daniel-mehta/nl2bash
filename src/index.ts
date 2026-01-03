import "dotenv/config";
import express from "express";
import cors from "cors";

// Import the generator and safety from the web lib so the backend can execute
// the same logic used by the web API route.
import { generateBashFromText } from "../web/src/lib/llm";
import { sanitizeModelResult } from "../web/src/lib/safety";

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

    const modelResult = await generateBashFromText({ input, os });

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
