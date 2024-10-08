import { supabase } from '../lib/supabase'
import { Kjoleskap, FoodItem } from '../types'

export const fetchKjoleskaps = async (userId: string): Promise<Kjoleskap[]> => {
  const { data, error } = await supabase
    .from('kjoleskaps')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching kjoleskaps:', error)
    return []
  }

  return data || []
}

export const createDefaultKjoleskap = async (userId: string, email: string): Promise<Kjoleskap> => {
  const { data, error } = await supabase
    .from('kjoleskaps')
    .insert([
      { name: `${email}'s Kjøleskap`, user_id: userId, is_default: true }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating default kjoleskap:', error)
    throw error
  }

  return data
}

export const fetchFoodItems = async (kjoleskapId: string): Promise<FoodItem[]> => {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('kjoleskap_id', kjoleskapId)

  if (error) {
    console.error('Error fetching food items:', error)
    return []
  }

  return data || []
}

export const fetchSharedKjoleskaps = async (userId: string): Promise<Kjoleskap[]> => {
  const { data, error } = await supabase
    .from('kjoleskaps')
    .select('*')
    .eq('is_shared', true)
    .neq('user_id', userId)

  if (error) {
    console.error('Error fetching shared kjoleskaps:', error)
    return []
  }

  return data || []
}

export const shareFoodItem = async (itemId: string, kjoleskapIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('shared_food_items')
    .insert(kjoleskapIds.map(kjoleskapId => ({ food_item_id: itemId, kjoleskap_id: kjoleskapId })))

  if (error) {
    console.error('Error sharing food item:', error)
    throw error
  }
}