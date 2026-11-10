import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { divinations } from '@/lib/db/schema';

import { handleRouteError, invalidRequest, ok, readJson, unauthorized } from '../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  domain: z.string().trim().min(1, 'domain 不能为空').max(64),
  question: z.string().trim().max(500, '问题最多 500 字').optional(),
  payload: z.record(z.string(), z.unknown()),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse({ limit: url.searchParams.get('limit') ?? undefined });
    if (!parsed.success) return invalidRequest(parsed.error);

    const db = getDb();
    const rows = await db
      .select()
      .from(divinations)
      .where(eq(divinations.userId, user.id))
      .orderBy(desc(divinations.createdAt))
      .limit(parsed.data.limit);

    return ok({ divinations: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const parsed = createSchema.safeParse(await readJson(request));
    if (!parsed.success) return invalidRequest(parsed.error);

    const db = getDb();
    const [created] = await db
      .insert(divinations)
      .values({
        userId: user.id,
        domain: parsed.data.domain,
        question: parsed.data.question ?? null,
        payload: parsed.data.payload,
      })
      .returning();

    return ok({ divination: created }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
