'use client';

/**
 * 匿名历史桥接：自动把 /api/divination 的成功排盘结果写入本地历史。
 *
 * 采用拦截 window.fetch 的方式，好处是 9 个术数页面无需任何改动（也不触碰布局），
 * 未来新增术数自动覆盖。只匹配精确的 POST /api/divination，用 response.clone()
 * 旁路读取，不消费页面要用的 body；任何异常都静默忽略，不影响排盘主流程。
 */
import { useEffect } from 'react';

import { saveFromResult, type ResultLike } from '@/lib/history/local-history';

const TARGET_PATH = '/api/divination';

let installed = false;
let originalFetch: typeof window.fetch | null = null;

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return (input as Request).url ?? '';
}

function readQuestion(body: BodyInit | null | undefined): string {
  if (typeof body !== 'string') return '';
  try {
    const parsed = JSON.parse(body) as { input?: { question?: unknown } };
    const question = parsed?.input?.question;
    return typeof question === 'string' ? question : '';
  } catch {
    return '';
  }
}

export default function HistoryBridge() {
  useEffect(() => {
    if (installed || typeof window === 'undefined') return;

    installed = true;
    const nativeFetch = window.fetch.bind(window);
    originalFetch = nativeFetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let path = '';
      try {
        path = new URL(requestUrl(input), window.location.origin).pathname;
      } catch {
        path = requestUrl(input);
      }

      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase();
      const shouldRecord = path === TARGET_PATH && method === 'POST';

      const response = await nativeFetch(input, init);
      if (!shouldRecord || !response.ok) return response;

      const question = readQuestion(init?.body);
      void response
        .clone()
        .text()
        .then((text) => {
          try {
            const data = JSON.parse(text) as ResultLike;
            if (data?.payload) saveFromResult(data, question);
          } catch {
            /* 非 JSON 响应：忽略 */
          }
        })
        .catch(() => undefined);

      return response;
    };

    return () => {
      if (originalFetch) window.fetch = originalFetch;
      originalFetch = null;
      installed = false;
    };
  }, []);

  return null;
}
