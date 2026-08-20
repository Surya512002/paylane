import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(10_000),
  amountMinor: z
    .string()
    .regex(/^\d+$/)
    .refine((v) => BigInt(v) > 0n, { message: "Amount must be greater than 0" }),
  deadlineAt: z.string().datetime({ offset: true }).optional().nullable(),
  checklist: z.array(z.string().trim().min(1).max(500)).min(1),
});

export const revisionSchema = z.object({
  reason: z.string().min(5).max(2000),
  remainingIssues: z.array(z.string().min(1)).min(1),
});

export const disputeSchema = z.object({
  reason: z.string().min(5).max(5000),
});

export const resolveDisputeSchema = z.object({
  workerAmountMinor: z.string().regex(/^\d+$/),
  clientAmountMinor: z.string().regex(/^\d+$/),
  rationale: z.string().min(5).max(5000),
});

export const paidResourceSchema = z.object({
  name: z.string().min(2).max(120),
  path: z.string().min(1).max(200),
  description: z.string().min(5).max(2000),
  priceMinor: z.string().regex(/^\d+$/),
  rateLimitPerMinute: z.number().int().min(1).max(10_000).default(60),
});

export const agentPolicySchema = z.object({
  dailySpendCapMinor: z.string().regex(/^\d+$/).optional().nullable(),
  allowlistedHosts: z.array(z.string()).default([]),
  paused: z.boolean().default(false),
});

export const jobStatusSchema = z.enum([
  "Draft",
  "Published",
  "Funded",
  "Assigned",
  "InProgress",
  "Delivered",
  "RevisionRequested",
  "Accepted",
  "Disputed",
  "Resolved",
  "AutoReleased",
  "Cancelled",
  "Expired",
]);

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type PaidResourceInput = z.infer<typeof paidResourceSchema>;
