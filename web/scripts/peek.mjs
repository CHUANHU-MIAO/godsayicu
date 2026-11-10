/**
 * 临时探针：确认 tarot / almanac 的真实输出结构，供页面渲染使用。
 * 运行：node scripts/peek.mjs
 */
import { calculateTarot } from 'taibu-core/tarot';
import { calculateDailyAlmanac } from 'taibu-core/almanac';

const tarot = await calculateTarot({ spreadType: 'situation', allowReversed: true });
console.log('TAROT_SPREAD:', tarot.spreadName);
console.log('TAROT_CARDS:', JSON.stringify(tarot.cards, null, 2));

const almanac = await calculateDailyAlmanac({ date: '2026-11-10', timezone: 'Asia/Shanghai' });
console.log('ALMANAC:', JSON.stringify(almanac, null, 2).slice(0, 2200));
