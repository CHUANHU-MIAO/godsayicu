import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';

import { signSessionToken, verifySessionToken } from './jwt';

export const SESSION_COOKIE_NAME = 'wen_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export type CurrentUser = {
  id: string;
  email: string;
  nickname: string;
};

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/** 读取当前请求携带的会话 token（不校验） */
export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** 写入会话 Cookie */
export async function setSessionCookie(response: NextResponse, token: string): Promise<void> {
  response.cookies.set({ ...sessionCookieOptions(), value: token });
}

/** 清除会话 Cookie */
export async function clearSessionCookie(response: NextResponse): Promise<void> {
  response.cookies.set({ ...sessionCookieOptions(), value: '', maxAge: 0 });
}

/** 签发 token 并写入 Cookie */
export async function startSession(
  response: NextResponse,
  claims: { sub: string; email: string },
): Promise<void> {
  const token = await signSessionToken(claims);
  await setSessionCookie(response, token);
}

/**
 * 当前登录用户；未登录或 token 无效返回 null。
 * 数据库未配置时抛出 DatabaseNotConfiguredError，由路由层转成 503。
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await readSessionToken();
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const db = getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email, nickname: users.nickname })
    .from(users)
    .where(eq(users.id, claims.sub))
    .limit(1);

  return row ?? null;
}
