
export type UserRole = 'admin' | 'accountant' | 'trainee';

export type DemoCard = 'test-visa' | 'test-mastercard';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;

  profilePicture?: string;
  preferences?: string[];
  demoCard?: DemoCard;
}
