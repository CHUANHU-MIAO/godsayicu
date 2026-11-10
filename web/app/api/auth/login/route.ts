import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { verifyPassword } from '@/lib/auth/password';
import { startSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';

import { fail, handleRouteError, invalidRequest, ok, readJson } from '../../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码').max(128),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) return invalidRequest(parsed.error);

    const { email, password } = parsed.data;
    const db = getDb();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // 不区分“邮箱不存在”和“密码错误”，避免账号枚举
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail('INVALID_CREDENTIALS', '邮箱或密码不正确', 401);
    }

    const response = ok({
      user: { id: user.id, email: user.email, nickname: user.nickname, createdAt: user.createdAt },
    });
    await startSession(response, { sub: user.id, email: user.email });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
