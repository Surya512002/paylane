import { JobStatus, LedgerKind, ReceiptType, platformFee, workerNet } from "@workpay/shared";
import type { Job, User } from "@prisma/client";
import { prisma } from "../db";
import { writeAuditLog } from "../audit";
import { config } from "../config";
import { verifyFundTx } from "../chain";

export type JobAction =
  | "publish"
  | "fund"
  | "assign"
  | "start"
  | "deliver"
  | "revision"
  | "accept"
  | "dispute"
  | "cancel"
  | "autoRelease"
  | "resolve";

export class TransitionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type Actor = Pick<User, "id" | "walletAddress" | "isAdmin">;

function isParty(job: Job, actor: Actor) {
  return job.clientId === actor.id || job.workerId === actor.id;
}

function isClient(job: Job, actor: Actor) {
  return job.clientId === actor.id;
}

function isWorker(job: Job, actor: Actor) {
  return job.workerId === actor.id;
}

const ALLOWED: Record<JobAction, JobStatus[]> = {
  publish: [JobStatus.Draft],
  fund: [JobStatus.Published],
  assign: [JobStatus.Funded],
  start: [JobStatus.Assigned],
  deliver: [JobStatus.InProgress, JobStatus.RevisionRequested],
  revision: [JobStatus.Delivered],
  accept: [JobStatus.Delivered, JobStatus.RevisionRequested],
  dispute: [JobStatus.Delivered, JobStatus.RevisionRequested, JobStatus.InProgress],
  cancel: [
    JobStatus.Draft,
    JobStatus.Published,
    JobStatus.Funded,
    JobStatus.Assigned,
    JobStatus.InProgress,
  ],
  autoRelease: [JobStatus.Delivered, JobStatus.RevisionRequested],
  resolve: [JobStatus.Disputed],
};

export function assertTransition(job: Job, action: JobAction) {
  if (!ALLOWED[action].includes(job.status as JobStatus)) {
    throw new TransitionError(`Cannot ${action} from status ${job.status}`);
  }
}

async function writeReleaseLedger(job: Job, kind: LedgerKind, txHash?: string) {
  const fee = platformFee(job.amountMinor, config.platformFeeBps);
  const net = workerNet(job.amountMinor, config.platformFeeBps);
  await prisma.ledgerEntry.createMany({
    data: [
      {
        type: ReceiptType.Job,
        kind,
        amountMinor: net,
        feeMinor: 0n,
        status: "confirmed",
        counterparty: job.workerId ?? undefined,
        txHash,
        jobId: job.id,
        userId: job.workerId ?? undefined,
      },
      {
        type: ReceiptType.Job,
        kind: LedgerKind.PlatformFee,
        amountMinor: fee,
        feeMinor: 0n,
        status: "confirmed",
        txHash,
        jobId: job.id,
      },
    ],
  });
}

async function writeRefundLedger(job: Job, txHash?: string) {
  await prisma.ledgerEntry.create({
    data: {
      type: ReceiptType.Job,
      kind: LedgerKind.EscrowRefund,
      amountMinor: job.amountMinor,
      status: "confirmed",
      counterparty: job.clientId,
      txHash,
      jobId: job.id,
      userId: job.clientId,
    },
  });
}

export async function applyJobTransition(
  jobId: string,
  action: JobAction,
  actor: Actor,
  payload: Record<string, unknown> = {},
) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) throw new TransitionError("Job not found", 404);

    assertTransition(job, action);

    switch (action) {
      case "publish": {
        if (!isClient(job, actor)) throw new TransitionError("Only client can publish");
        if (job.checklist.length < 1) throw new TransitionError("Checklist required");
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.Published },
        });
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "fund": {
        if (!isClient(job, actor)) throw new TransitionError("Only client can fund");
        const txHash = payload.txHash as string | undefined;
        let onchainJobId = payload.onchainJobId as string | undefined;
        if (!config.demoMode && (!txHash || !onchainJobId)) {
          throw new TransitionError("txHash and onchainJobId required");
        }
        if (!config.demoMode && txHash) {
          const fundChainId =
            typeof payload.chainId === "number"
              ? payload.chainId
              : typeof payload.chainId === "string"
                ? Number(payload.chainId)
                : config.chainId;
          const v = await verifyFundTx(
            txHash as `0x${string}`,
            job.amountMinor,
            Number.isFinite(fundChainId) ? fundChainId : config.chainId,
          );
          if (!v.ok) throw new TransitionError(v.reason ?? "Fund verification failed");
          if (v.onchainJobId) onchainJobId = v.onchainJobId;
        }
        const updated = await tx.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.Funded,
            escrowTxHash: txHash ?? `demo:fund:${jobId}`,
            onchainJobId: onchainJobId ? BigInt(onchainJobId) : BigInt(Date.now()),
          },
        });
        await tx.ledgerEntry.create({
          data: {
            type: ReceiptType.Job,
            kind: LedgerKind.EscrowFund,
            amountMinor: job.amountMinor,
            status: "confirmed",
            txHash: updated.escrowTxHash ?? undefined,
            jobId: job.id,
            userId: job.clientId,
          },
        });
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId, meta: { txHash } });
        return updated;
      }
      case "assign": {
        const workerAddress = (payload.workerAddress as string)?.toLowerCase();
        if (!workerAddress) throw new TransitionError("workerAddress required");
        const worker = await tx.user.upsert({
          where: { walletAddress: workerAddress },
          create: { walletAddress: workerAddress },
          update: {},
        });
        const canAssign = isClient(job, actor) || worker.id === actor.id;
        if (!canAssign) throw new TransitionError("Not authorized to assign");
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.Assigned, workerId: worker.id },
        });
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "start": {
        if (!isWorker(job, actor)) throw new TransitionError("Only worker can start");
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.InProgress },
        });
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "deliver": {
        if (!isWorker(job, actor)) throw new TransitionError("Only worker can deliver");
        const note = payload.note as string | undefined;
        const artifactUrl = payload.artifactUrl as string | undefined;
        const artifactHash = payload.artifactHash as string | undefined;
        if (!note && !artifactUrl && !artifactHash) {
          throw new TransitionError("Delivery requires note or artifact");
        }
        await tx.delivery.create({
          data: {
            jobId,
            workerId: actor.id,
            note,
            artifactUrl,
            artifactHash,
          },
        });
        const now = new Date();
        const reviewDeadline = job.reviewDeadline ??
          new Date(now.getTime() + config.reviewWindowHours * 3600 * 1000);
        const updated = await tx.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.Delivered,
            deliveredAt: job.deliveredAt ?? now,
            reviewDeadline,
            deliveryHash: artifactHash ?? job.deliveryHash,
          },
        });
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "revision": {
        if (!isClient(job, actor)) throw new TransitionError("Only client can request revision");
        if (job.revisionsUsed >= config.revisionLimit) {
          throw new TransitionError(`Revision limit (${config.revisionLimit}) reached`);
        }
        const updated = await tx.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.RevisionRequested,
            revisionsUsed: job.revisionsUsed + 1,
          },
        });
        await writeAuditLog({
          userId: actor.id,
          action,
          entity: "Job",
          entityId: jobId,
          meta: { reason: payload.reason },
        });
        return updated;
      }
      case "accept": {
        if (!isClient(job, actor)) throw new TransitionError("Only client can accept");
        const releaseTx = config.demoMode ? `demo:accept:${jobId}` : (payload.txHash as string);
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.Accepted, releaseTxHash: releaseTx },
        });
        await writeReleaseLedger(job, LedgerKind.EscrowRelease, releaseTx);
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "dispute": {
        if (!isParty(job, actor)) throw new TransitionError("Only parties can dispute");
        const evidenceDeadline = new Date(Date.now() + config.disputeEvidenceHours * 3600 * 1000);
        await tx.dispute.create({
          data: {
            jobId,
            openerId: actor.id,
            reason: (payload.reason as string) ?? "Dispute opened",
            evidenceDeadline,
          },
        });
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.Disputed },
        });
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "cancel": {
        const clientCancel = [JobStatus.Draft, JobStatus.Published, JobStatus.Funded].includes(
          job.status as JobStatus,
        );
        const workerCancel = [JobStatus.Assigned, JobStatus.InProgress].includes(
          job.status as JobStatus,
        );
        if (clientCancel && !isClient(job, actor)) throw new TransitionError("Only client can cancel");
        if (workerCancel && !isWorker(job, actor)) throw new TransitionError("Only worker can cancel");
        if (job.status === JobStatus.Funded && job.workerId) {
          throw new TransitionError("Cannot cancel funded job with worker assigned");
        }
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.Cancelled },
        });
        if ([JobStatus.Funded, JobStatus.Assigned, JobStatus.InProgress].includes(job.status as JobStatus)) {
          await writeRefundLedger(job, config.demoMode ? `demo:refund:${jobId}` : undefined);
        }
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      case "autoRelease": {
        if (!job.reviewDeadline || new Date() < job.reviewDeadline) {
          throw new TransitionError("Review window not elapsed");
        }
        const releaseTx = config.demoMode ? `demo:auto:${jobId}` : (payload.txHash as string);
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.AutoReleased, releaseTxHash: releaseTx },
        });
        await writeReleaseLedger(job, LedgerKind.EscrowRelease, releaseTx);
        await writeAuditLog({
          userId: actor.id === "system" ? null : actor.id,
          action,
          entity: "Job",
          entityId: jobId,
        });
        return updated;
      }
      case "resolve": {
        if (!actor.isAdmin) throw new TransitionError("Admin only", 403);
        const workerAmount = BigInt(payload.workerAmountMinor as string);
        const clientAmount = BigInt(payload.clientAmountMinor as string);
        if (workerAmount + clientAmount !== job.amountMinor) {
          throw new TransitionError("Split must equal escrow amount");
        }
        const dispute = await tx.dispute.findFirst({
          where: { jobId, status: "open" },
          orderBy: { createdAt: "desc" },
        });
        if (!dispute) throw new TransitionError("No open dispute");
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: "resolved",
            workerAmountMinor: workerAmount,
            clientAmountMinor: clientAmount,
            rationale: payload.rationale as string,
            resolvedAt: new Date(),
            resolvedById: actor.id,
          },
        });
        const updated = await tx.job.update({
          where: { id: jobId },
          data: { status: JobStatus.Resolved },
        });
        await tx.ledgerEntry.create({
          data: {
            type: ReceiptType.Job,
            kind: LedgerKind.EscrowSplit,
            amountMinor: workerAmount,
            status: "confirmed",
            jobId: job.id,
            userId: job.workerId ?? undefined,
          },
        });
        if (clientAmount > 0n) {
          await tx.ledgerEntry.create({
            data: {
              type: ReceiptType.Job,
              kind: LedgerKind.EscrowRefund,
              amountMinor: clientAmount,
              status: "confirmed",
              jobId: job.id,
              userId: job.clientId,
            },
          });
        }
        await writeAuditLog({ userId: actor.id, action, entity: "Job", entityId: jobId });
        return updated;
      }
      default:
        throw new TransitionError("Unknown action");
    }
  });
}

export async function runAutoReleaseCrank() {
  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: [JobStatus.Delivered, JobStatus.RevisionRequested] },
      reviewDeadline: { lte: now },
    },
  });
  const results = [];
  for (const job of jobs) {
    try {
      const systemActor = {
        id: "system",
        walletAddress: "0x0000000000000000000000000000000000000000",
        isAdmin: true,
      };
      const updated = await applyJobTransition(job.id, "autoRelease", systemActor);
      results.push({ id: job.id, ok: true, status: updated.status });
    } catch (e) {
      results.push({ id: job.id, ok: false, error: (e as Error).message });
    }
  }
  return results;
}
