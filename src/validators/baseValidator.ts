import type Joi from "joi";
import type { Request } from "express";
import { AppError } from "../controllers/baseController.js";

export class BaseValidator {
  static validate<T>(schema: Joi.Schema, data: Request["body"]): T {
    const { error, value } = schema.validate(data, { stripUnknown: true });
    if (error) throw new AppError(400, error.message);
    return value;
  }
}