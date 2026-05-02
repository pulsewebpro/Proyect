import { prisma } from '@amable/db';
import { WorkspacePlan, WorkspaceRole, CreditEntryType } from '@prisma/client';

export async function ensureUserHasWorkspace(userId: string) {
  const has = await prisma.workspaceMember.findFirst({ where: { userId } });
  if (has) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const workspace = await prisma.workspace.create({
    data: {
      name: `${user.name ?? 'Mi'} espacio`,
      plan: WorkspacePlan.free,
      monthlyCredits: 30,
      dailyBonusCredits: 5,
    },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId, role: WorkspaceRole.owner },
  });
  await prisma.creditLedger.createMany({
    data: [
      { workspaceId: workspace.id, type: CreditEntryType.grant_monthly, amount: 30, balanceAfter: 30, reason: 'OAuth' },
      { workspaceId: workspace.id, type: CreditEntryType.grant_daily, amount: 5, balanceAfter: 35, reason: 'OAuth' },
    ],
  });
}
