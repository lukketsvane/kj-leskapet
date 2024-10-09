import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req: NextRequest) {
  try {
    const { items, kjoleskapId } = await req.json()

    if (!Array.isArray(items) || items.length === 0 || !kjoleskapId) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Fetch the current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('food_items')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('Error fetching table structure:', tableError)
      return NextResponse.json({ error: 'Failed to fetch table structure', details: tableError.message }, { status: 500 })
    }

    // Check if image_url column exists
    const hasImageUrl = tableInfo && tableInfo[0] && 'image_url' in tableInfo[0]

    const { data, error } = await supabase
      .from('food_items')
      .insert(items.map(item => {
        const newItem: any = {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          kjoleskap_id: kjoleskapId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        // Only add image_url if the column exists
        if (hasImageUrl) {
          newItem.image_url = item.image_url || null
        }
        return newItem
      }))
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to add items', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data })
  } catch (error) {
    console.error('Error in /api/add-food-items:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}