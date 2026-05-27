import Joi from 'joi';
import type { IUserCreateInput, IUserLoginInput } from '../interfaces/User.js';
import type { IUserValidator } from '../interfaces/validators/IUserValidator.js';
import { BaseValidator } from './baseValidator.js';

export class UserValidator extends BaseValidator implements IUserValidator {

  private readonly createUserSchema = Joi.object({
    firstName: Joi.string().min(3).max(20).required(),
    lastName: Joi.string().min(3).max(20).required(),
    email: Joi.string().email().min(3).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  private readonly loginUserSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  validateCreateUser(user: unknown): IUserCreateInput {
    return this.validate<IUserCreateInput>(this.createUserSchema, user);
  }

  validateLoginUser(user: unknown): IUserLoginInput {
    return this.validate<IUserLoginInput>(this.loginUserSchema, user);
  }
}
