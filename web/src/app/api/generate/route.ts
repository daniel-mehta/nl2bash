import { NextResponse } from "next/server";
import { z } from "zod";

import { generateBashFromText } from "../../../lib/llm";
import { sanitizeModelResult } from "../../../lib/safety";

const RequestSchema = z.object({
  input: z.string().min(1, "input is required"),
  os: z.enum(["linux", "macos", "wsl"]).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, os } = RequestSchema.parse(body);

    const modelResult = await generateBashFromText({ input, os });

    // Recompute risk and attach safety assessment (do not trust model's risk label)
    const sanitized = sanitizeModelResult({
      commands: modelResult.commands,
      dryRunCommands: modelResult.dryRunCommands,
      riskLevel: modelResult.riskLevel,
      needsConfirmation: modelResult.needsConfirmation
    });

    // If hard-blocked, return a safe response with reasons
    if (sanitized.safety.blocked) {
      return NextResponse.json(
        {
          error: "Blocked potentially dangerous command generation.",
          blocked: true,
          reasons: sanitized.safety.reasons,
          // Still return a consistent shape for UI rendering
          commands: [],
          explanations: [],
          riskLevel: "high",
          needsConfirmation: true,
          assumptions: modelResult.assumptions ?? [],
          dryRunCommands: []
        },
        { status: 400 }
      );
    }

    // Return the validated model output plus safety assessment
    return NextResponse.json({
      commands: modelResult.commands,
      explanations: modelResult.explanations,
      riskLevel: sanitized.riskLevel,
      needsConfirmation: sanitized.needsConfirmation,
      assumptions: modelResult.assumptions,
      dryRunCommands: modelResult.dryRunCommands,
      safety: sanitized.safety
    });
  } catch (err: any) {
    // Zod validation errors (bad request)
    if (err?.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Invalid request body.",
          details: err.errors
        },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        error: "Server error while generating command.",
        message: typeof err?.message === "string" ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
