import { getCurrentUser } from '@/lib/auth/session';

import { handleRouteError, ok, unauthorized } from '../../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
