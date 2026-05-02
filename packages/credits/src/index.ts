import { prisma } from '@amable/db';
import type { CreditEntryType } from '@prisma/client';

export async function getCreditBalance(workspaceId: string): Promise<number> {
  const rows = await prisma.creditLedger.findMany({
    where: { workspaceId },
    select: { type: true, amount: true },
  });
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
  const balance = await getCreditBalance(params.workspaceId);
  if (balance < params.amount) return { ok: false, balance };
  const after = balance - params.amount;
  await prisma.creditLedger.create({
    data: {
      workspaceId: params.workspaceId,
      type: 'consume',
      amount: params.amount,
      balanceAfter: after,
      reason: params.reason,
      runId: params.runId,
    },
  });
  return { ok: true, balance: after };
}
