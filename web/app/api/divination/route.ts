import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  castAlmanac,
  castAstrology,
  castBazi,
  castDaliuren,
  castJiao,
  castLiuyao,
  castMeihua,
  castQimen,
  castTaiyi,
  castTarot,
  castXiaoliuren,
  castZiwei,
} from '@/lib/divination';
import type { DivinationResult } from '@/lib/divination';

/**
 * 通用排盘接口。
 * 计算一律在服务端完成：前端只提交参数、渲染结果，
 * 既规避浏览器兼容问题，也便于后续接入额度与计费。
 */
const HANDLERS = {
  liuyao: castLiuyao,
  tarot: castTarot,
  ziwei: castZiwei,
  daliuren: castDaliuren,
  almanac: castAlmanac,
  bazi: castBazi,
  meihua: castMeihua,
  qimen: castQimen,
  astrology: castAstrology,
  xiaoliuren: castXiaoliuren,
  taiyi: castTaiyi,
  jiao: castJiao,
} as const;

type Domain = keyof typeof HANDLERS;

const bodySchema = z.object({
  domain: z.enum([
    'liuyao',
    'tarot',
    'ziwei',
    'daliuren',
    'almanac',
    'bazi',
    'meihua',
    'qimen',
    'astrology',
    'xiaoliuren',
    'taiyi',
    'jiao',
  ]),
  input: z.unknown().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_json', message: '请求体不是合法 JSON' } },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'invalid_body', message: '参数不合法，需要 domain 与可选 input' } },
      { status: 400 },
    );
  }

  const domain = parsed.data.domain as Domain;
  const handler = HANDLERS[domain] as (input: unknown) => Promise<DivinationResult<unknown>>;

  try {
    const result = await handler(parsed.data.input ?? {});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'cast_failed',
          message: error instanceof Error ? error.message : '排盘失败',
        },
      },
      { status: 500 },
    );
  }
}
