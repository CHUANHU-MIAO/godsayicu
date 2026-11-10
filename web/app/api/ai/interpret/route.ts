import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getCreditBalance, spendCredits } from '@/lib/db/credits';

import { fail, handleRouteError, invalidRequest, readJson, unauthorized } from '../../_lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 单次解读的额度单价，TODO: 按模型与输出长度分档计费 */
const INTERPRET_COST = 1;
const MODEL = 'gpt-4o-mini';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

const SYSTEM_PROMPT = [
  '你是「观象」的解读助手，面向中文用户。',
  '用户会给出一段结构化的占卜结果（JSON）与一个提问。',
  '请结合传统象数语境，给出克制、具体、可执行的解读，不要断言吉凶绝对，不要涉及医疗、法律、投资的确定性建议。',
  '输出使用简体中文，分 3-5 个自然段，总长度控制在 400 字以内。',
].join('\n');

const interpretSchema = z.object({
  domain: z.string().trim().min(1, 'domain 不能为空').max(64),
  payload: z.record(z.string(), z.unknown()),
  question: z.string().trim().max(500, '问题最多 500 字').optional(),
});

type InterpretInput = z.infer<typeof interpretSchema>;

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function buildUserPrompt({ domain, payload, question }: InterpretInput): string {
  return JSON.stringify({ domain, question: question ?? '', payload }, null, 2);
}

/** 从上游 SSE 事件块中取出增量文本 */
function extractDelta(rawEvent: string): string {
  for (const line of rawEvent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;

    const data = trimmed.slice('data:'.length).trim();
    if (!data || data === '[DONE]') continue;

    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const content = parsed.choices?.[0]?.delta?.content;
      if (typeof content === 'string' && content.length > 0) return content;
    } catch {
      // 上游心跳或非 JSON 片段，忽略
    }
  }

  return '';
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return fail(
        'AI_NOT_CONFIGURED',
        '服务端未配置 OPENAI_API_KEY，AI 解读暂不可用；请在 .env 中补充后重启服务',
        503,
      );
    }

    const user = await getCurrentUser();
    if (!user) return unauthorized('请先登录后再使用 AI 解读');

    const parsed = interpretSchema.safeParse(await readJson(request));
    if (!parsed.success) return invalidRequest(parsed.error);

    const db = getDb();
    const balance = await getCreditBalance(db, user.id);
    if (balance < INTERPRET_COST) {
      return fail(
        'INSUFFICIENT_CREDITS',
        `额度不足：当前 ${balance}，本次解读需要 ${INTERPRET_COST}`,
        402,
      );
    }

    const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(parsed.data) },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      console.error('[ai/interpret] 上游返回异常', upstream.status, detail.slice(0, 500));
      return fail('AI_UPSTREAM_ERROR', `模型服务返回 ${upstream.status}，请稍后重试`, 502);
    }

    // TODO: 真实计费应在流式输出完成（或失败重试）后结算，并支持失败回滚；
    // 当前结构为：拿到上游响应后立即扣减，避免长连接期间重复调用刷额度。
    const remaining = await spendCredits(db, user.id, INTERPRET_COST, 'ai_interpret');

    const reader = upstream.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              sseEvent({ type: 'meta', model: MODEL, cost: INTERPRET_COST, balance: remaining }),
            ),
          );

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
              const rawEvent = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);

              const text = extractDelta(rawEvent);
              if (text) controller.enqueue(encoder.encode(sseEvent({ type: 'delta', text })));

              boundary = buffer.indexOf('\n\n');
            }
          }

          const tail = extractDelta(buffer);
          if (tail) controller.enqueue(encoder.encode(sseEvent({ type: 'delta', text: tail })));

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('[ai/interpret] 流式转发失败', error);
          controller.enqueue(
            encoder.encode(sseEvent({ type: 'error', message: '解读过程中断，请稍后重试' })),
          );
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
      cancel() {
        // 客户端提前断开：TODO 按计费策略决定是否回滚已扣减额度
        void reader.cancel().catch(() => undefined);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
