import Joi from 'joi';
import type { IUserInput } from '../interfaces/User.js';
import { BaseValidator } from './baseValidator.js';

export class UserValidator extends BaseValidator {

  private static readonly createUserSchema = Joi.object({
    firstName: Joi.string().min(3).max(20).required(),
    lastName: Joi.string().min(3).max(20).required(),
    email: Joi.string().email().min(3).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  private static readonly loginUserSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  static validateCreateUser(user: IUserInput): IUserInput {
    return this.validate(this.createUserSchema, user);
  }

  static validateLoginUser(user: IUserInput): IUserInput {
    return this.validate(this.loginUserSchema, user);
  }
}