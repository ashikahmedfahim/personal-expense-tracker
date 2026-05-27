export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserResponse = Omit<IUser, 'password'>;

export function toUserResponse(user: IUser): IUserResponse {
  const { password: _, ...userResponse } = user;
  return userResponse;
}

export interface IUserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IUserLoginInput {
  email: string;
  password: string;
}
