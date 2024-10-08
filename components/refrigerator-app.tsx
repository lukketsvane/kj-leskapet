'use client';

import React, { useState, useEffect, useCallback, ErrorInfo } from 'react'
import { useSwipeable } from 'react-swipeable'
import { UserPlus, Plus, Camera, X, Home, Grid, List, Search, User, Share2, Loader2, ChevronLeft, ChevronRight, Menu, Trash2, Upload } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const supabaseUrl = 'https://tuvjhtfipbcidawhfqvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dmpodGZpcGJjaWRhd2hmcXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzOTE5OTIsImV4cCI6MjA0Mzk2Nzk5Mn0.75MkqNWYkgWLMB2K5fG345cGnq5Mry7R4oJ432sXhoU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  kjoleskap_id: string;
  image_url?: string;
}

interface Kjoleskap {
  id: string;
  name: string;
  user_id: string;
  is_shared: boolean;
  is_default: boolean;
}

const FoodItemComponent: React.FC<{ item: FoodItem, onShare: (itemId: string, kjoleskapIds: string[]) => void, sharedKjoleskaps: Kjoleskap[] }> = ({ item, onShare, sharedKjoleskaps }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    {item.image_url ? (
      <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover mb-2 rounded" />
    ) : (
      <div className="w-full h-32 bg-gray-200 mb-2 rounded flex items-center justify-center">
        <span className="text-gray-400">No image</span>
      </div>
    )}
    <h3 className="font-semibold">{item.name}</h3>
    <p className="text-sm text-gray-600">{item.category}</p>
    <p className="text-sm">{item.quantity} {item.unit}</p>
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 size={16} className="mr-2" /> Del
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Del {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {sharedKjoleskaps.map(kjoleskap => (
            <div key={kjoleskap.id} className="flex items-center space-x-2">
              <Checkbox
                id={kjoleskap.id}
                onCheckedChange={(checked) => checked && onShare(item.id, [kjoleskap.id])}
              />
              <label htmlFor={kjoleskap.id}>{kjoleskap.name}</label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  </div>
)

export default function RefrigeratorApp() {
  const [currentKjoleskaps, setCurrentKjoleskaps] = useState<Kjoleskap[]>([])
  const [selectedKjoleskapIndex, setSelectedKjoleskapIndex] = useState(0)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharedKjoleskaps, setSharedKjoleskaps] = useState<Kjoleskap[]>([])
  const [session, setSession] = useState<any>(null)
  const [isGridView, setIsGridView] = useState(true)
  const { toast } = useToast()

  const handlers = useSwipeable({
    onSwipedLeft: () => switchKjoleskap(1),
    onSwipedRight: () => switchKjoleskap(-1),
  })

  useEffect(() => {
    const setupSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) {
        fetchKjoleskaps()
        fetchSharedKjoleskaps()
      }
    }
    setupSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchKjoleskaps()
        fetchSharedKjoleskaps()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchKjoleskaps = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .or(`user_id.eq.${user.id},id.in.(${(await supabase.from('user_kjoleskaps').select('kjoleskap_id').eq('user_id', user.id)).data?.map(uk => uk.kjoleskap_id).join(',')})`)
      
      if (error) throw error

      if (data && data.length > 0) {
        setCurrentKjoleskaps(data)
        fetchFoodItems(data[0].id)
      } else {
        const defaultKjoleskap = await createDefaultKjoleskap(user.id, user.email)
        setCurrentKjoleskaps([defaultKjoleskap])
        fetchFoodItems(defaultKjoleskap.id)
      }
    } catch (error) {
      setError('Feil ved henting av kjøleskap. Vennligst prøv igjen.')
      toast({ title: "Feil", description: "Kunne ikke hente kjøleskap. Vennligst oppdater siden.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchSharedKjoleskaps = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('kjoleskaps').select('*').neq('user_id', user.id).eq('is_shared', true)
    if (error) console.error('Error fetching shared kjoleskaps:', error)
    else setSharedKjoleskaps(data || [])
  }

  const createDefaultKjoleskap = async (userId: string, userEmail: string | undefined) => {
    const { data, error } = await supabase
      .from('kjoleskaps')
      .insert([{ name: userEmail ? `${userEmail.split('@')[0]}s kjøleskap` : 'Mitt kjøleskap', user_id: userId, is_shared: false, is_default: true }])
      .select()
    if (error) throw error
    return data[0]
  }

  const fetchFoodItems = async (kjoleskapId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('food_items').select('*').eq('kjoleskap_id', kjoleskapId)
      if (error) throw error
      setFoodItems(data || [])
    } catch (error: any) {
      setError('Feil ved henting av matvarer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const switchKjoleskap = async (direction: number) => {
    if (currentKjoleskaps.length === 0) return
    setLoading(true)
    const newIndex = (selectedKjoleskapIndex + direction + currentKjoleskaps.length) % currentKjoleskaps.length
    setSelectedKjoleskapIndex(newIndex)
    await fetchFoodItems(currentKjoleskaps[newIndex].id)
    setLoading(false)
  }

  const handleShareFoodItem = async (itemId: string, kjoleskapIds: string[]) => {
    try {
      const { error } = await supabase
        .from('shared_food_items')
        .insert(kjoleskapIds.map(kjoleskapId => ({ food_item_id: itemId, kjoleskap_id: kjoleskapId })))
      if (error) throw error
      toast({ title: "Delt", description: "Matvaren er nå delt med valgte kjøleskap." })
    } catch (error) {
      console.error('Error sharing food item:', error)
      toast({ title: "Feil", description: "Kunne ikke dele matvaren. Vennligst prøv igjen.", variant: "destructive" })
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md">
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google']} />
        </div>
      </div>
    )
  }

  return (
    <div {...handlers} className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => {}}><Menu size={24} /></Button>
        <h1 className="text-xl font-bold">{currentKjoleskaps[selectedKjoleskapIndex]?.name || 'Kjøleskap'}</h1>
        <Button variant="ghost" onClick={() => {}}><User size={24} /></Button>
      </header>

      <main className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <div className={isGridView ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4" : "space-y-2 p-4"}>
            {foodItems.map((item) => (
              <FoodItemComponent key={item.id} item={item} onShare={handleShareFoodItem} sharedKjoleskaps={sharedKjoleskaps} />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white shadow-sm p-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => switchKjoleskap(-1)} disabled={loading || currentKjoleskaps.length === 0}>
          <ChevronLeft size={24} />
        </Button>
        <div className="flex space-x-4">
          <Button variant="ghost" onClick={() => {}}><UserPlus size={24} /></Button>
          <Button variant="ghost" onClick={() => {}}><Camera size={24} /></Button>
          <Button variant="ghost" onClick={() => {}}><Plus size={24} /></Button>
          <Button variant="ghost" onClick={() => setIsGridView(!isGridView)}>
            {isGridView ? <List size={24} /> : <Grid size={24} />}
          </Button>
        </div>
        <Button variant="ghost" onClick={() => switchKjoleskap(1)} disabled={loading || currentKjoleskaps.length === 0}>
          <ChevronRight size={24} />
        </Button>
      </footer>
      <Toaster />
    </div>
  )
}