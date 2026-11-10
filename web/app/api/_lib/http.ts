import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

import { AuthConfigError } from '@/lib/auth/jwt';
import { DatabaseNotConfiguredError } from '@/lib/db';
import { InsufficientCreditsError } from '@/lib/db/credits';

export type ApiError = { error: { code: string; message: string } };

/** 统一成功响应 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** 统一错误响应 { error: { code, message } } */
export function fail(code: string, message: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** 400 参数校验失败 */
export function invalidRequest(error: ZodError): NextResponse<ApiError> {
  const message = error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
    .join('; ');

  return fail('INVALID_REQUEST', message || '请求参数不合法', 400);
}

/** 401 未登录 */
export function unauthorized(message = '请先登录'): NextResponse<ApiError> {
  return fail('UNAUTHORIZED', message, 401);
}

/** 读取 JSON body，解析失败返回 null */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** 统一的异常兜底：把基础设施错误映射成明确的状态码 */
export function handleRouteError(error: unknown): NextResponse<ApiError> {
  if (error instanceof DatabaseNotConfiguredError) {
    return fail(error.code, error.message, 503);
  }

  if (error instanceof AuthConfigError) {
    return fail(error.code, error.message, 503);
  }

  if (error instanceof InsufficientCreditsError) {
    return fail(error.code, error.message, 402);
  }

  // 唯一约束冲突（例如 email 重复）
  if (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505') {
    return fail('CONFLICT', '数据已存在（唯一约束冲突）', 409);
  }

  console.error('[api] 未处理的异常', error);
  return fail('INTERNAL_ERROR', '服务器内部错误', 500);
}
