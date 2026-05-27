import type Joi from 'joi';
import type { Request } from 'express';

export interface IBaseValidator {
  validate<T>(schema: Joi.Schema, data: Request['body']): T;
}
