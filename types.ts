import { Session as SupabaseSession } from '@supabase/supabase-js'

export interface Kjoleskap {
  id: string;
  name: string;
  user_id: string;
  is_shared: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate: string;
  kjoleskap_id: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type Session = SupabaseSession;

// Additional types that might be useful:

export type KjoleskapId = Kjoleskap['id'];
export type FoodItemId = FoodItem['id'];
export type UserId = UserProfile['id'];

export interface KjoleskapWithItems extends Kjoleskap {
  items: FoodItem[];
}

export interface CreateKjoleskapInput {
  name: string;
  user_id: string;
  is_shared?: boolean;
  is_default?: boolean;
}

export interface UpdateKjoleskapInput {
  name?: string;
  is_shared?: boolean;
  is_default?: boolean;
}

export interface CreateFoodItemInput {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate: string;
  kjoleskap_id: string;
  image_url?: string;
}

export interface UpdateFoodItemInput {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expirationDate?: string;
  image_url?: string;
}

export interface UpdateUserProfileInput {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}