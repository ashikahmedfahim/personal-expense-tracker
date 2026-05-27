export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
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

/** @deprecated Use IUserCreateInput */
export type IUserInput = IUserCreateInput;
