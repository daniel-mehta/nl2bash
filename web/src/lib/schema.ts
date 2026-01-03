import { z } from "zod";

export const BashCommandSchema = z.object({
  commands: z.array(z.string()).min(1),
  explanations: z.array(z.string()).min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  needsConfirmation: z.boolean(),
  assumptions: z.array(z.string()),
  dryRunCommands: z.array(z.string())
});

export type BashCommandResult = z.infer<typeof BashCommandSchema>;
