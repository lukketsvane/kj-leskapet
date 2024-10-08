import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tuvjhtfipbcidawhfqvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dmpodGZpcGJjaWRhd2hmcXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzOTE5OTIsImV4cCI6MjA0Mzk2Nzk5Mn0.75MkqNWYkgWLMB2K5fG345cGnq5Mry7R4oJ432sXhoU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchKjoleskaps(userId: string) {
  const { data, error } = await supabase
    .from('kjoleskaps')
    .select('*')
    .or(`user_id.eq.${userId},is_shared.eq.true`)
  
  if (error) throw error
  return data
}

export async function createDefaultKjoleskap(userId: string, userEmail: string) {
  const kjoleskapName = `${userEmail.split('@')[0]}s kjøleskap`
  const { data, error } = await supabase
    .from('kjoleskaps')
    .insert([{ name: kjoleskapName, user_id: userId, is_shared: false }])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function fetchFoodItems(kjoleskapId: string) {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('kjoleskap_id', kjoleskapId)
  
  if (error) {
    if (error.code === 'PGRST301') {
      throw new Error('Du har ikke tilgang til å se matvarer i dette kjøleskapet.')
    }
    throw error
  }
  return data || []
}

export async function fetchAllFoodItems() {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
  
  if (error) throw error
  return data || []
} 
