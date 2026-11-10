'use client';

import { useEffect } from 'react';

import { initMotion } from '@/lib/motion/governor';

/** 无 UI：启动一次性能探测，之后由 html[data-motion] 驱动全站降级 */
export default function MotionGovernor() {
  useEffect(() => {
    initMotion();
  }, []);

  return null;
}
