import { UserService } from "../services/userService.js";
import type { Request, Response } from "express";
import { AppError, BaseController } from "./baseController.js";
import { UserValidator } from "../validators/userValidator.js";
import type { IUserInput } from "../interfaces/User.js";

export class UserController extends BaseController {

  constructor(private readonly userService: UserService) {
    super();
  }

  async createUser(req: Request, res: Response): Promise<void> {
    await this.handleRequest<void>(async () => {
      const value = UserValidator.validateCreateUser(req.body);
      const user = await this.userService.create(value);
      this.created(res, user);
    }, res);
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    await this.handleRequest<void>(async () => {
      const value = UserValidator.validateLoginUser(req.body);
      const user = await this.userService.login(value);
      this.ok(res, user);
    }, res);
  }
}