import { desc, eq, sql } from 'drizzle-orm';

import type { Database } from './index';
import { creditsLedger } from './schema';

/** 余额不足时抛出，路由层转成 402 */
export class InsufficientCreditsError extends Error {
  readonly code = 'INSUFFICIENT_CREDITS';

  constructor(
    readonly balance: number,
    readonly required: number,
  ) {
    super(`额度不足：当前 ${balance}，本次需要 ${required}`);
    this.name = 'InsufficientCreditsError';
  }
}

const balanceExpr = sql<number>`coalesce(sum(${creditsLedger.delta}), 0)::int`;

/** 用户当前余额（流水求和） */
export async function getCreditBalance(db: Database, userId: string): Promise<number> {
  const rows = await db
    .select({ total: balanceExpr })
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId));

  return rows[0]?.total ?? 0;
}

/** 最近的额度流水 */
export async function listCreditEntries(db: Database, userId: string, limit = 50) {
  return db
    .select()
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId))
    .orderBy(desc(creditsLedger.createdAt))
    .limit(limit);
}

/**
 * 扣减额度：在事务中读取余额、写流水。
 * TODO: 真实计费需要接入订单/套餐与失败回滚策略（当前按固定单价扣减）。
 */
export async function spendCredits(
  db: Database,
  userId: string,
  amount: number,
  reason: string,
): Promise<number> {
  if (amount <= 0) throw new Error('扣减额度必须为正数');

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ total: balanceExpr })
      .from(creditsLedger)
      .where(eq(creditsLedger.userId, userId));

    const balance = rows[0]?.total ?? 0;
    if (balance < amount) throw new InsufficientCreditsError(balance, amount);

    const balanceAfter = balance - amount;
    await tx.insert(creditsLedger).values({
      userId,
      delta: -amount,
      reason,
      balanceAfter,
    });

    return balanceAfter;
  });
}
