export interface Kjoleskap {
  id: string;
  name: string;
  user_id: string;
  is_shared: boolean;
  is_default: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  kjoleskap_id: string;
  image_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Session {
  user: {
    id: string;
    email: string;
  };
}