export type UserRole = 'admin' | 'accountant' | 'trainee';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
}