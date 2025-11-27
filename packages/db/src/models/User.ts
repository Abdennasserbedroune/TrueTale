export type UserRole = "writer" | "reader";

export interface SocialLinks {
  website?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export interface NotificationPreferences {
  emailUpdates?: boolean;
  newFollowers?: boolean;
  bookReviews?: boolean;
  orderNotifications?: boolean;
}

export interface PayoutSettings {
  frequency: "daily" | "weekly" | "monthly";
  minimumThreshold: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string; // Optional because it might not be selected or needed in all contexts
  role: UserRole;
  name?: string;
  profile?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  socials?: SocialLinks;
  is_verified: boolean; // Snake_case to match SQL
  verification_token?: string;
  verification_expires?: string; // Timestamptz comes as string
  reset_token?: string;
  reset_expires?: string;
  refresh_tokens?: any[]; // JSONB
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
  payout_settings?: PayoutSettings;
  notification_preferences?: NotificationPreferences;
  deletion_requested_at?: string;
  created_at: string;
  updated_at: string;
}

export type IUser = User;
