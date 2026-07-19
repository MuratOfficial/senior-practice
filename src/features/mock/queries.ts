import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { MockConfig, MockItem } from "./config";

export interface MockSessionDetail {
  id: string;
  config: MockConfig;
  items: MockItem[];
  score: number | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface MockSessionSummary {
  id: string;
  startedAt: Date;
  finishedAt: Date;
  score: number | null;
  total: number;
  rated: number;
}

export async function getMockSession(
  userId: string,
  id: string
): Promise<MockSessionDetail | null> {
  const row = await prisma.mockSession.findFirst({ where: { id, userId } });
  if (!row) return null;
  return {
    id: row.id,
    config: row.config as unknown as MockConfig,
    items: row.items as unknown as MockItem[],
    score: row.score,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  };
}

/** Последняя незавершённая сессия — чтобы предложить продолжить вместо новой. */
export async function findActiveMockSession(
  userId: string
): Promise<{ id: string; startedAt: Date } | null> {
  const row = await prisma.mockSession.findFirst({
    where: { userId, finishedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true },
  });
  return row;
}

export async function listFinishedMockSessions(
  userId: string
): Promise<MockSessionSummary[]> {
  const rows = await prisma.mockSession.findMany({
    where: { userId, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 20,
  });
  return rows.map((row) => {
    const items = row.items as unknown as MockItem[];
    return {
      id: row.id,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt!,
      score: row.score,
      total: items.length,
      rated: items.filter((i) => i.quality !== null).length,
    };
  });
}
