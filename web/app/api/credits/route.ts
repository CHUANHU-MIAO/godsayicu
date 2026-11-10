import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getCreditBalance, listCreditEntries } from '@/lib/db/credits';

import { handleRouteError, ok, unauthorized } from '../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const db = getDb();
    const [balance, entries] = await Promise.all([
      getCreditBalance(db, user.id),
      listCreditEntries(db, user.id),
    ]);

    return ok({ balance, entries });
  } catch (error) {
    return handleRouteError(error);
  }
}
