import { clearSessionCookie } from '@/lib/auth/session';

import { ok } from '../../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const response = ok({ ok: true });
  await clearSessionCookie(response);
  return response;
}
