import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/errors.js';
import { UserValidator } from './userValidator.js';

const validCreateInput = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password123',
};

const validLoginInput = {
  email: 'jane@example.com',
  password: 'password123',
};

describe('UserValidator', () => {
  const validator = new UserValidator();

  describe('validateCreateUser', () => {
    it('returns validated input for a valid payload', () => {
      expect(validator.validateCreateUser(validCreateInput)).toEqual(validCreateInput);
    });

    it('throws AppError 400 when required fields are missing', () => {
      expect(() => validator.validateCreateUser({})).toThrow(AppError);
      try {
        validator.validateCreateUser({});
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
      }
    });

    it('throws AppError 400 when email is invalid', () => {
      expect(() =>
        validator.validateCreateUser({ ...validCreateInput, email: 'not-an-email' }),
      ).toThrow(AppError);
    });

    it('throws AppError 400 when password is too short', () => {
      expect(() =>
        validator.validateCreateUser({ ...validCreateInput, password: 'short' }),
      ).toThrow(AppError);
    });

    it('throws AppError 400 when firstName is too short', () => {
      expect(() =>
        validator.validateCreateUser({ ...validCreateInput, firstName: 'ab' }),
      ).toThrow(AppError);
    });

    it('strips unknown fields', () => {
      const result = validator.validateCreateUser({
        ...validCreateInput,
        role: 'admin',
      });

      expect(result).toEqual(validCreateInput);
      expect(result).not.toHaveProperty('role');
    });
  });

  describe('validateLoginUser', () => {
    it('returns validated input for a valid payload', () => {
      expect(validator.validateLoginUser(validLoginInput)).toEqual(validLoginInput);
    });

    it('throws AppError 400 when email is missing', () => {
      expect(() => validator.validateLoginUser({ password: 'password123' })).toThrow(AppError);
      try {
        validator.validateLoginUser({ password: 'password123' });
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
      }
    });

    it('throws AppError 400 when password is too short', () => {
      expect(() =>
        validator.validateLoginUser({ ...validLoginInput, password: 'short' }),
      ).toThrow(AppError);
    });

    it('throws AppError 400 when email is invalid', () => {
      expect(() =>
        validator.validateLoginUser({ ...validLoginInput, email: 'bad' }),
      ).toThrow(AppError);
    });
  });
});
