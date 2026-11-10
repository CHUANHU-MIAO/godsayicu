import { ok } from '../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ ok: true, time: new Date().toISOString() });
}
