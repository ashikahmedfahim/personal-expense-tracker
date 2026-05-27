import { AppError } from '../utils/errors.js';
import { toUserResponse, type IUserCreateInput, type IUserLoginInput } from '../interfaces/User.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';
import type { IUserService } from '../interfaces/services/IUserService.js';
import { Bcrypt } from '../utils/Bcrypt.js';
import { JWT } from '../utils/JWT.js';

export class UserService implements IUserService {

  constructor(private readonly userRepository: IUserRepository) { }

  async create(user: IUserCreateInput) {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }
    const hashedPassword = await Bcrypt.hash(user.password);
    const createdUser = await this.userRepository.create({ ...user, password: hashedPassword });
    return toUserResponse(createdUser);
  }

  async login(user: IUserLoginInput): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (!existingUser) {
      throw new AppError(401, 'Invalid credentials');
    }
    const isPasswordValid = await Bcrypt.compare(user.password, existingUser.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }
    const token = JWT.sign(
      { id: existingUser.id, email: existingUser.email },
      { expiresIn: '1h' },
    );
    return token;
  }
}
