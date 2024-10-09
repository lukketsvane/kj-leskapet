import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface Kjoleskap {
  id: string
  name: string
  user_id: string
  is_shared: boolean
  is_default: boolean
}

export interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  expiration_date: string
  kjoleskap_id: string
  user_id: string
}

export const fetchKjoleskaps = async (userId: string): Promise<Kjoleskap[]> => {
  try {
    const userKjoleskapsQuery = supabase
      .from('user_kjoleskaps')
      .select('kjoleskap_id')
      .eq('user_id', userId)

    const { data: userKjoleskaps, error: userKjoleskapsError } = await userKjoleskapsQuery

    if (userKjoleskapsError) throw userKjoleskapsError

    const kjoleskapsIds = userKjoleskaps?.map(uk => uk.kjoleskap_id) || []

    const { data, error } = await supabase
      .from('kjoleskaps')
      .select('*')
      .or(`user_id.eq.${userId},id.in.(${kjoleskapsIds.join(',')})`)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching kjoleskaps:', error)
    throw error
  }
}

export const createDefaultKjoleskap = async (userId: string, userEmail: string | undefined): Promise<Kjoleskap> => {
  try {
    const kjoleskapName = userEmail ? `${userEmail.split('@')[0]}s kjøleskap` : 'Mitt kjøleskap'
    const { data, error } = await supabase
      .from('kjoleskaps')
      .insert([{ 
        name: kjoleskapName, 
        user_id: userId, 
        is_shared: false, 
        is_default: true 
      }])
      .select()
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No data returned after inserting kjoleskap')
    return data[0]
  } catch (error) {
    console.error('Error creating default kjoleskap:', error)
    throw error
  }
}

export const fetchFoodItems = async (kjoleskapId: string): Promise<FoodItem[]> => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('kjoleskap_id', kjoleskapId)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching food items:', error)
    throw error
  }
}

export const fetchSharedKjoleskaps = async (userId: string): Promise<Kjoleskap[]> => {
  try {
    const { data, error } = await supabase
      .from('kjoleskaps')
      .select('*')
      .neq('user_id', userId)
      .eq('is_shared', true)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching shared kjoleskaps:', error)
    throw error
  }
}

export const shareFoodItem = async (itemId: string, kjoleskapIds: string[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from('shared_food_items')
      .insert(kjoleskapIds.map(kjoleskapId => ({ 
        food_item_id: itemId, 
        kjoleskap_id: kjoleskapId 
      })))
    if (error) throw error
  } catch (error) {
    console.error('Error sharing food item:', error)
    throw error
  }
}

export const updateFoodItem = async (item: Partial<FoodItem> & { id: string }): Promise<void> => {
  try {
    const { error } = await supabase
      .from('food_items')
      .update(item)
      .eq('id', item.id)
    if (error) throw error
  } catch (error) {
    console.error('Error updating food item:', error)
    throw error
  }
}

export const deleteFoodItem = async (itemId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', itemId)
    if (error) throw error
  } catch (error) {
    console.error('Error deleting food item:', error)
    throw error
  }
}