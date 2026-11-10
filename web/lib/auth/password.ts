import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const ALGORITHM = 'scrypt';

/** 生成 `scrypt$salt$hash` 形式的密码摘要 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = (await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH)) as Buffer;
  return `${ALGORITHM}$${salt}$${derived.toString('hex')}`;
}

/** 校验密码，任何格式异常都视为不匹配 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = (stored ?? '').split('$');
  if (algorithm !== ALGORITHM || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== KEY_LENGTH) return false;

  const derived = (await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(derived, expected);
}
