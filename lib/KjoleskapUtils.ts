import { supabase } from '../lib/supabase'

export const fetchKjoleskaps = async (userId: string): Promise<Kjoleskap[]> => {
  const { data, error } = await supabase
    .from('kjoleskaps')
    .select('*')
    .or(`user_id.eq.${userId},id.in.(${(await supabase.from('user_kjoleskaps').select('kjoleskap_id').eq('user_id', userId)).data?.map(uk => uk.kjoleskap_id).join(',')})`)
  
  if (error) throw error
  return data || []
}

export const createDefaultKjoleskap = async (userId: string, userEmail: string | undefined): Promise<Kjoleskap> => {
  const { data, error } = await supabase
    .from('kjoleskaps')
    .insert([{ name: userEmail ? `${userEmail.split('@')[0]}s kjøleskap` : 'Mitt kjøleskap', user_id: userId, is_shared: false, is_default: true }])
    .select()
  if (error) throw error
  return data[0]
}

export const fetchFoodItems = async (kjoleskapId: string): Promise<FoodItem[]> => {
  const { data, error } = await supabase.from('food_items').select('*').eq('kjoleskap_id', kjoleskapId)
  if (error) throw error
  return data || []
}

export const fetchSharedKjoleskaps = async (userId: string): Promise<Kjoleskap[]> => {
  const { data, error } = await supabase.from('kjoleskaps').select('*').neq('user_id', userId).eq('is_shared', true)
  if (error) throw error
  return data || []
}

export const shareFoodItem = async (itemId: string, kjoleskapIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('shared_food_items')
    .insert(kjoleskapIds.map(kjoleskapId => ({ food_item_id: itemId, kjoleskap_id: kjoleskapId })))
  if (error) throw error
}