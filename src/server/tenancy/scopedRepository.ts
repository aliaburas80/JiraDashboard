// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Multi-Tenant Organization Management — Layer 1 tenant isolation (ORG-05).
// See product/MULTI_TENANT_ORG_DESIGN.md §3.1.
//
// No feature is permitted to call prisma.<orgScopedModel>.findMany/findUnique/
// findFirst/create/update/delete directly for any org-scoped model — this
// module is the one place those calls are allowed to originate from. Every
// method here injects organizationId into the read/update/delete filter or
// the create payload, and it always OVERWRITES any caller-supplied
// organizationId rather than trusting one — a caller cannot pass a where
// clause or data object to read or write another organization's rows.
//
// The companion ESLint rule (local-rules/no-direct-org-scoped-prisma, see
// eslint-local-rules/index.js) makes "a route forgot the org filter" a
// build-time error instead of a runtime hope — see ORG-05b.

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type WhereScoped<TWhere> = TWhere extends { where?: infer W }
  ? Omit<TWhere, 'where'> & { where?: W }
  : TWhere;

function withOrgWhere<TArgs extends { where?: Record<string, unknown> }>(
  args: TArgs | undefined,
  organizationId: string,
): TArgs {
  const base = (args ?? {}) as TArgs;
  return {
    ...base,
    where: { ...(base.where ?? {}), organizationId },
  } as TArgs;
}

function withOrgData<TArgs extends { data: unknown }>(
  args: TArgs,
  organizationId: string,
): TArgs {
  const data = args.data;
  if (Array.isArray(data)) {
    return {
      ...args,
      data: data.map((row) => ({ ...(row as Record<string, unknown>), organizationId })),
    };
  }
  return {
    ...args,
    data: { ...(data as Record<string, unknown>), organizationId },
  };
}

/**
 * Builds an org-scoped wrapper around one Prisma model delegate.
 *
 * Every read/update/delete/count method forces `where.organizationId` to the
 * bound organizationId — any organizationId the caller put in `where` is
 * discarded, not merged-with-caller-wins. Every create method forces
 * `data.organizationId` the same way.
 */
function createScopedModel<
  FindManyArgs extends { where?: Record<string, unknown> },
  FindFirstArgs extends { where?: Record<string, unknown> },
  FindUniqueArgs extends { where: Record<string, unknown> },
  CreateArgs extends { data: unknown },
  CreateManyArgs extends { data: unknown },
  UpdateArgs extends { where: Record<string, unknown>; data: unknown },
  UpdateManyArgs extends { where?: Record<string, unknown>; data: unknown },
  DeleteArgs extends { where: Record<string, unknown> },
  DeleteManyArgs extends { where?: Record<string, unknown> },
  CountArgs extends { where?: Record<string, unknown> },
  Result,
  ManyResult,
  CreateResult,
  BatchResult,
>(
  delegate: {
    findMany: (args?: FindManyArgs) => Promise<ManyResult>;
    findFirst: (args?: FindFirstArgs) => Promise<Result | null>;
    findUnique: (args: FindUniqueArgs) => Promise<Result | null>;
    findUniqueOrThrow: (args: FindUniqueArgs) => Promise<Result>;
    create: (args: CreateArgs) => Promise<CreateResult>;
    createMany: (args: CreateManyArgs) => Promise<BatchResult>;
    update: (args: UpdateArgs) => Promise<Result>;
    updateMany: (args: UpdateManyArgs) => Promise<BatchResult>;
    delete: (args: DeleteArgs) => Promise<Result>;
    deleteMany: (args: DeleteManyArgs) => Promise<BatchResult>;
    count: (args?: CountArgs) => Promise<number>;
  },
  organizationId: string,
) {
  return {
    findMany: (args?: FindManyArgs) => delegate.findMany(withOrgWhere(args, organizationId)),
    findFirst: (args?: FindFirstArgs) => delegate.findFirst(withOrgWhere(args, organizationId)),
    // findUnique/findUniqueOrThrow key on a unique field (usually id), not organizationId —
    // Prisma's *UniqueInput type won't accept an extra organizationId in `where` for most
    // models. Scope by re-checking the result's organizationId instead of the query itself.
    findUnique: async (args: FindUniqueArgs): Promise<Result | null> => {
      const row = await delegate.findUnique(args);
      if (!row) return null;
      const owner = (row as Record<string, unknown>).organizationId;
      return owner === organizationId ? row : null;
    },
    findUniqueOrThrow: async (args: FindUniqueArgs): Promise<Result> => {
      const row = await delegate.findUniqueOrThrow(args);
      const owner = (row as Record<string, unknown>).organizationId;
      if (owner !== organizationId) {
        throw new Prisma.PrismaClientKnownRequestError('No record found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        });
      }
      return row;
    },
    create: (args: CreateArgs) => delegate.create(withOrgData(args, organizationId)),
    createMany: (args: CreateManyArgs) => delegate.createMany(withOrgData(args, organizationId)),
    update: (args: UpdateArgs) =>
      delegate.update(withOrgWhere(args, organizationId) as UpdateArgs),
    updateMany: (args: UpdateManyArgs) => delegate.updateMany(withOrgWhere(args, organizationId)),
    delete: (args: DeleteArgs) => delegate.delete(withOrgWhere(args, organizationId) as DeleteArgs),
    deleteMany: (args: DeleteManyArgs) => delegate.deleteMany(withOrgWhere(args, organizationId)),
    count: (args?: CountArgs) => delegate.count(withOrgWhere(args, organizationId)),
  };
}

export function scopedRepository(organizationId: string) {
  if (!organizationId) {
    throw new Error('scopedRepository() requires a non-empty organizationId');
  }

  return {
    user: createScopedModel(prisma.user, organizationId),
    importLog: createScopedModel(prisma.importLog, organizationId),
    dashboardSnapshot: createScopedModel(prisma.dashboardSnapshot, organizationId),
    auditEvent: createScopedModel(prisma.auditEvent, organizationId),
    userAddRequest: createScopedModel(prisma.userAddRequest, organizationId),
    notification: createScopedModel(prisma.notification, organizationId),
    jiraConnection: createScopedModel(prisma.jiraConnection, organizationId),
  };
}

export type ScopedRepository = ReturnType<typeof scopedRepository>;
