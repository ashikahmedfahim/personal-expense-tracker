import jwt from 'jsonwebtoken';

export class JWT {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    return secret;
  }

  static sign(payload: jwt.JwtPayload, options?: jwt.SignOptions): string {
    return jwt.sign(payload, JWT.getSecret(), options);
  }

  static verify(token: string): jwt.JwtPayload | string {
    return jwt.verify(token, JWT.getSecret());
  }
}