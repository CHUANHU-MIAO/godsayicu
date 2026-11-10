import { createMeta, nowInTimezone, normalizeTimezone } from './types';
import type { DivinationResult } from './types';

export type JiaoFace = '正' | '反';
export type JiaoOutcome = 'sheng' | 'xiao' | 'yin';
export type JiaoLabel = '圣杯' | '笑杯' | '阴杯';
export type JiaoMeaning = '允' | '陈述未明' | '不允';

export interface JiaoPayload {
  result: JiaoOutcome;
  label: JiaoLabel;
  meaning: JiaoMeaning;
  /** 两枚筊杯各自的正反面 */
  faces: [JiaoFace, JiaoFace];
}

/**
 * 杯筊结果同时保留统一结构与 result/label/meaning/faces 顶层字段，
 * 便于页面既按 DivinationResult 统一渲染，也直接读取掷筊结果。
 */
export type JiaoCastResult = DivinationResult<JiaoPayload> & JiaoPayload;

function randomFace(): JiaoFace {
  return Math.random() < 0.5 ? '正' : '反';
}

export function castJiao(): JiaoCastResult {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(undefined, warnings);
  const now = nowInTimezone(timezone);

  const faces: [JiaoFace, JiaoFace] = [randomFace(), randomFace()];

  let payload: JiaoPayload;
  if (faces[0] !== faces[1]) {
    payload = { result: 'sheng', label: '圣杯', meaning: '允', faces };
  } else if (faces[0] === '正') {
    payload = { result: 'xiao', label: '笑杯', meaning: '陈述未明', faces };
  } else {
    payload = { result: 'yin', label: '阴杯', meaning: '不允', faces };
  }

  return {
    domain: 'jiao',
    title: '杯筊问事',
    subtitle: `${payload.label} · ${payload.meaning}`,
    payload,
    meta: createMeta('jiao', timezone, now.dateTime, 'local'),
    warnings,
    ...payload,
  };
}
