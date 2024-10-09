import { Session as SupabaseSession } from '@supabase/supabase-js'

export interface Kjoleskap {
  id: string;
  name: string;
  user_id: string;
  is_shared: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate: string;
  kjoleskap_id: string;
  created_at: string;
  updated_at: string;
  image_url: string;
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

export type Session = SupabaseSession