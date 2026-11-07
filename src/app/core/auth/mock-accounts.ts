
import { User } from '../../models/user.model';

export interface MockAccount {
  user: User;
  password: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    user: {
      id: 1,
      username: 'trainee',
      name: 'Demo Trainee',
      email: 'trainee@example.com',
      role: 'trainee'
    },
    password: 'demo123'
  },
  {
    user: {
      id: 2,
      username: 'accountant',
      name: 'Demo Accountant',
      email: 'accountant@example.com',
      role: 'accountant'
    },
    password: 'demo123'
  },
  {
    user: {
      id: 3,
      username: 'admin',
      name: 'Demo Admin',
      email: 'admin@example.com',
      role: 'admin'
    },
    password: 'demo123'
  }
];
