import { getSupabaseClient } from "../config/supabaseClient";
import bcrypt from "bcrypt";

export interface UserCreateData {
  id: string;
  email: string;
  username: string;
  password?: string;
  role?: "reader" | "writer";
  name?: string;
  profile?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  socials?: Record<string, string>;
  is_verified?: boolean;
}

export interface UserUpdateData {
  email?: string;
  username?: string;
  name?: string;
  profile?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  socials?: Record<string, string>;
  is_verified?: boolean;
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
  payout_settings?: {
    frequency: "daily" | "weekly" | "monthly";
    minimumThreshold: number;
  };
  notification_preferences?: {
    emailUpdates: boolean;
    newFollowers: boolean;
    bookReviews: boolean;
    orderNotifications: boolean;
  };
  deletion_requested_at?: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: "reader" | "writer";
  name?: string | null;
  profile?: string | null;
  bio?: string | null;
  avatar?: string | null;
  location?: string | null;
  socials?: Record<string, string>;
  is_verified: boolean;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean;
  payout_settings?: {
    frequency: "daily" | "weekly" | "monthly";
    minimumThreshold: number;
  };
  notification_preferences?: {
    emailUpdates: boolean;
    newFollowers: boolean;
    bookReviews: boolean;
    orderNotifications: boolean;
  };
  deletion_requested_at?: string | null;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  }

  async findByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.supabase.from("users").select("*").eq("username", username).single();

    if (error || !data) {
      return null;
    }

    return data as User;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email.toLowerCase()},username.eq.${username}`)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  }

  async create(userData: UserCreateData): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        id: userData.id,
        email: userData.email.toLowerCase(),
        username: userData.username,
        role: userData.role || "reader",
        name: userData.name || null,
        profile: userData.profile || null,
        bio: userData.bio || null,
        avatar: userData.avatar || null,
        location: userData.location || null,
        socials: userData.socials || {},
        is_verified: userData.is_verified || false,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create user");
    }

    return data as User;
  }

  async update(id: string, updateData: UserUpdateData): Promise<User> {
    const updates: Record<string, any> = {};

    if (updateData.email !== undefined) updates.email = updateData.email.toLowerCase();
    if (updateData.username !== undefined) updates.username = updateData.username;
    if (updateData.name !== undefined) updates.name = updateData.name;
    if (updateData.profile !== undefined) updates.profile = updateData.profile;
    if (updateData.bio !== undefined) updates.bio = updateData.bio;
    if (updateData.avatar !== undefined) updates.avatar = updateData.avatar;
    if (updateData.location !== undefined) updates.location = updateData.location;
    if (updateData.socials !== undefined) updates.socials = updateData.socials;
    if (updateData.is_verified !== undefined) updates.is_verified = updateData.is_verified;
    if (updateData.stripe_account_id !== undefined) updates.stripe_account_id = updateData.stripe_account_id;
    if (updateData.stripe_onboarding_complete !== undefined)
      updates.stripe_onboarding_complete = updateData.stripe_onboarding_complete;
    if (updateData.payout_settings !== undefined) updates.payout_settings = updateData.payout_settings;
    if (updateData.notification_preferences !== undefined)
      updates.notification_preferences = updateData.notification_preferences;
    if (updateData.deletion_requested_at !== undefined)
      updates.deletion_requested_at = updateData.deletion_requested_at;

    const { data, error } = await this.supabase.from("users").update(updates).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update user");
    }

    return data as User;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("users").delete().eq("id", id);

    if (error) {
      throw new Error(error.message || "Failed to delete user");
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch {
      return false;
    }
  }
}
