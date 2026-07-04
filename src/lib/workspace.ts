// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-006: workspace helper — single authoritative lookup for a user's workspace.
// EP-008 will add workspace-scoped query enforcement on top of this.

import { prisma } from '@/lib/prisma';

export type WorkspaceSummary = {
  id:     string;
  name:   string;
  slug:   string;
  status: string;
};

/**
 * Returns the active workspace owned by userId, or null if none exists.
 * This is the only place workspace lookup should be initiated — never
 * accept a workspaceId from untrusted user input at this stage.
 */
export async function getWorkspaceForUser(userId: string): Promise<WorkspaceSummary | null> {
  return prisma.workspace.findFirst({
    where:  { ownerUserId: userId, status: 'active' },
    select: { id: true, name: true, slug: true, status: true },
  });
}

/**
 * EP-020: the key that scopes a user's live dashboard data (latest-metrics
 * file, cloud backup entry) so cloud-storage-mode users never see another
 * user's uploads/syncs. Prefers the user's workspace (shared visibility for
 * teammates within it); falls back to a per-user key for any account without
 * one, rather than ever falling back to a single shared/global key.
 */
export async function getMetricsScopeKeyForUser(userId: string): Promise<string> {
  const workspace = await getWorkspaceForUser(userId);
  return workspace ? `ws:${workspace.id}` : `user:${userId}`;
}

/**
 * Creates a workspace and workspace-member record for a new user.
 * Must be called inside a Prisma transaction alongside user creation.
 */
export async function createWorkspaceForUser(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  userName: string,
): Promise<WorkspaceSummary> {
  const workspace = await tx.workspace.create({
    data: {
      name:        userName,
      slug:        `ws-${userId}`,
      ownerUserId: userId,
      status:      'active',
    },
    select: { id: true, name: true, slug: true, status: true },
  });

  await tx.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId,
      accessRole:  'owner',
    },
  });

  return workspace;
}
