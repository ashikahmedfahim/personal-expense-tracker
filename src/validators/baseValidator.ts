import type Joi from 'joi';
import type { Request } from 'express';
import { AppError } from '../utils/errors.js';
import type { IBaseValidator } from '../interfaces/validators/IBaseValidator.js';

export class BaseValidator implements IBaseValidator {
  validate<T>(schema: Joi.Schema, data: Request['body']): T {
    const { error, value }: Joi.ValidationResult<T> = schema.validate(data, { stripUnknown: true });
    if (error) throw new AppError(400, error.message);
    return value;
  }
}
