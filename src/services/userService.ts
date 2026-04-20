import { AppError } from "../controllers/baseController.js";
import type { IUser, IUserInput } from "../interfaces/User.js";
import { UserRepository } from "../repositories/userRepository.js";
import { Bcrypt } from "../utils/Bcrypt.js";
import { JWT } from "../utils/JWT.js";

export class UserService {
  
  constructor(private readonly userRepository: UserRepository) { }

  async create(user: IUserInput): Promise<IUser> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }
    const hashedPassword = await Bcrypt.hash(user.password);
    const response = await this.userRepository.create({ ...user, password: hashedPassword });
    return response;
  }

  async login(user: IUserInput): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (!existingUser) {
      throw new AppError(400, 'Invalid credentials');
    }
    const isPasswordValid = await Bcrypt.compare(user.password, existingUser.password);
    if (!isPasswordValid) {
      throw new AppError(400, 'Invalid credentials');
    }
    const token = JWT.sign({ id: existingUser.id, email: existingUser.email, expiresIn: '1h' });
    return token;
  }
}