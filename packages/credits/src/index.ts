import { prisma } from '@amable/db';
import { Prisma, type CreditEntryType } from '@prisma/client';

const MAX_TX_RETRIES = 5;

export async function getCreditBalance(workspaceId: string): Promise<number> {
  const rows = await prisma.creditLedger.findMany({
    where: { workspaceId },
    select: { type: true, amount: true },
  });
  return sumLedgerRows(rows);
}

function sumLedgerRows(rows: { type: CreditEntryType; amount: number }[]): number {
  let balance = 0;
  for (const r of rows) {
    if (isGrant(r.type)) balance += r.amount;
    else balance -= Math.abs(r.amount);
  }
  return balance;
}

function isGrant(t: CreditEntryType) {
  return (
    t === 'grant_monthly' ||
    t === 'grant_daily' ||
    t === 'topup' ||
    t === 'rollover' ||
    t === 'bonus' ||
    t === 'refund'
  );
}

export async function consumeCredits(params: {
  workspaceId: string;
  amount: number;
  reason: string;
  runId?: string;
}): Promise<{ ok: true; balance: number } | { ok: false; balance: number }> {
  let lastBalance = 0;
  for (let attempt = 0; attempt < MAX_TX_RETRIES; attempt++) {
    try {
      const after = await prisma.$transaction(
        async (tx) => {
          const rows = await tx.creditLedger.findMany({
            where: { workspaceId: params.workspaceId },
            select: { type: true, amount: true },
          });
          const balance = sumLedgerRows(rows);
          lastBalance = balance;
          if (balance < params.amount) {
            throw new InsufficientCreditsError(balance);
          }
          const next = balance - params.amount;
          await tx.creditLedger.create({
            data: {
              workspaceId: params.workspaceId,
              type: 'consume',
              amount: params.amount,
              balanceAfter: next,
              reason: params.reason,
              runId: params.runId,
            },
          });
          return next;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { ok: true, balance: after };
    } catch (e) {
      if (e instanceof InsufficientCreditsError) {
        return { ok: false, balance: e.balance };
      }
      if (isSerializationConflict(e) && attempt < MAX_TX_RETRIES - 1) {
        await delay(25 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw new Error('No se pudo completar el consumo de créditos tras varios reintentos');
}

function isSerializationConflict(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034';
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

class InsufficientCreditsError extends Error {
  constructor(readonly balance: number) {
    super('INSUFFICIENT_CREDITS');
    this.name = 'InsufficientCreditsError';
  }
}
