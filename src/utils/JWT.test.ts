import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { JWT } from './JWT.js';

describe('JWT', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('signs tokens with HS256', () => {
    const token = JWT.sign({ id: 1, email: 'jane@example.com' }, { expiresIn: '1h' });
    const header = JSON.parse(
      Buffer.from(token.split('.')[0]!, 'base64url').toString(),
    ) as { alg: string };

    expect(header.alg).toBe('HS256');
  });

  it('verifies valid HS256 tokens', () => {
    const token = JWT.sign({ id: 1, email: 'jane@example.com' });

    expect(JWT.verify(token)).toMatchObject({ id: 1, email: 'jane@example.com' });
  });

  it('rejects tokens signed with a different algorithm', () => {
    const token = jwt.sign(
      { id: 1, email: 'jane@example.com' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS512' },
    );

    expect(() => JWT.verify(token)).toThrow(jwt.JsonWebTokenError);
  });
});
