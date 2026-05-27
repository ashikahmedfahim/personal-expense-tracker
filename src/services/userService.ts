import { AppError } from '../utils/errors.js';
import {
  toUserResponse,
  type IUser,
  type IUserCreateInput,
  type IUserLoginInput,
  type IUserResponse,
} from '../interfaces/User.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';
import type { IUserService } from '../interfaces/services/IUserService.js';
import { Bcrypt } from '../utils/Bcrypt.js';
import { JWT } from '../utils/JWT.js';

export class UserService implements IUserService {

  constructor(private readonly userRepository: IUserRepository) { }

  async create(user: IUserCreateInput): Promise<IUserResponse> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }
    const hashedPassword: string = await Bcrypt.hash(user.password);
    const createdUser: IUser = await this.userRepository.create({ ...user, password: hashedPassword });
    return toUserResponse(createdUser);
  }

  async login(user: IUserLoginInput): Promise<string> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(user.email);
    if (!existingUser) {
      throw new AppError(401, 'Invalid credentials');
    }
    const isPasswordValid: boolean = await Bcrypt.compare(user.password, existingUser.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }
    const token: string = JWT.sign(
      { id: existingUser.id, email: existingUser.email },
      { expiresIn: '1h' },
    );
    return token;
  }
}
