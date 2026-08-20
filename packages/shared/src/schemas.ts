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

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional().nullable(),
  headline: z.string().trim().min(3).max(160).optional().nullable(),
  bio: z.string().trim().max(4000).optional().nullable(),
  skills: z.array(z.string().trim().min(1).max(40)).max(24).optional(),
  roleTags: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  availability: z.enum(["OpenToWork", "Busy", "NotLooking"]).optional(),
  profilePublic: z.boolean().optional(),
  location: z.string().trim().max(120).optional().nullable(),
  portfolioUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  hourlyRateMinor: z.string().regex(/^\d+$/).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal("")),
});

export const createProposalSchema = z.object({
  coverLetter: z.string().trim().min(20).max(4000),
  proposedAmountMinor: z.string().regex(/^\d+$/).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
