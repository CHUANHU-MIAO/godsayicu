import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { hashPassword } from '@/lib/auth/password';
import { startSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { creditsLedger, users } from '@/lib/db/schema';

import { fail, handleRouteError, invalidRequest, ok, readJson } from '../../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TODO: 注册赠送额度按运营策略调整
const SIGNUP_BONUS = 3;

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('邮箱格式不正确').max(254),
  password: z.string().min(8, '密码至少 8 位').max(128),
  nickname: z.string().trim().min(1, '昵称不能为空').max(32),
});

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await readJson(request));
    if (!parsed.success) return invalidRequest(parsed.error);

    const { email, password, nickname } = parsed.data;
    const db = getDb();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) return fail('EMAIL_TAKEN', '该邮箱已注册', 409);

    const passwordHash = await hashPassword(password);

    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ email, passwordHash, nickname })
        .returning({
          id: users.id,
          email: users.email,
          nickname: users.nickname,
          createdAt: users.createdAt,
        });

      await tx.insert(creditsLedger).values({
        userId: created.id,
        delta: SIGNUP_BONUS,
        reason: 'signup_bonus',
        balanceAfter: SIGNUP_BONUS,
      });

      return created;
    });

    const response = ok({ user: { ...user, credits: SIGNUP_BONUS } }, 201);
    await startSession(response, { sub: user.id, email: user.email });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
