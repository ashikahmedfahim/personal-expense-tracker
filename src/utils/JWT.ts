import jwt from 'jsonwebtoken';

const JWT_ALGORITHM = 'HS256' as const satisfies jwt.Algorithm;

export class JWT {
  private static getSecret(): string {
    const secret: string | undefined = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    return secret;
  }

  static sign(payload: jwt.JwtPayload, options?: jwt.SignOptions): string {
    return jwt.sign(payload, JWT.getSecret(), {
      ...options,
      algorithm: JWT_ALGORITHM,
    });
  }

  static verify(token: string): jwt.JwtPayload | string {
    return jwt.verify(token, JWT.getSecret(), {
      algorithms: [JWT_ALGORITHM],
    });
  }
}
