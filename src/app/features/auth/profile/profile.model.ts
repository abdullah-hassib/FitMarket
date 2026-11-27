export interface UserProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  bio: string;
  fitnessGoal: string;
  profilePicture: string;
  preferences: string[];
  updatedAt: string;
}

export interface ProfileUpsertPayload {
  name: string;
  email: string;
  phone: string;
  bio: string;
  fitnessGoal: string;
  profilePicture: string;
  preferences: string[];
}
