import { SignJWT, jwtVerify } from 'jose';

const ALGORITHM = 'HS256';
const ISSUER = 'wentian';
const DEFAULT_TTL = '7d';
const MIN_SECRET_LENGTH = 16;

/** AUTH_SECRET 缺失时抛出，路由层统一转成 503 */
export class AuthConfigError extends Error {
  readonly code = 'AUTH_NOT_CONFIGURED';

  constructor(message = '服务端未配置 AUTH_SECRET（至少 16 个字符），登录功能不可用') {
    super(message);
    this.name = 'AuthConfigError';
  }
}

export type SessionClaims = {
  /** 用户 id */
  sub: string;
  email: string;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) throw new AuthConfigError();
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  claims: SessionClaims,
  ttl: string | number = DEFAULT_TTL,
): Promise<string> {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getSecretKey());
}

/** 校验失败（过期、签名错误等）返回 null；配置缺失时抛出 AuthConfigError */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  const key = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [ALGORITHM], issuer: ISSUER });
    if (!payload.sub) return null;

    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
    };
  } catch {
    return null;
  }
}
