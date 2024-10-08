'use client';

import React, { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { UserPlus, Plus, Camera, Grid, List, User, Loader2, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Auth } from '@supabase/auth-ui-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,  } from "@/components/ui/dialog"

import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { FoodItemComponent } from './FoodItemComponent'
import { supabase } from '../lib/supabase'

import { fetchKjoleskaps, createDefaultKjoleskap, fetchFoodItems, fetchSharedKjoleskaps, shareFoodItem } from '@/lib/KjoleskapUtils'
import { ProfileScreen } from './ProfileScreen'
import { DeleromScreen } from './DeleromScreen'
import { AddKjoleskapScreen } from './AddKjoleskapScreen'

export default function RefrigeratorApp() {
  const [currentKjoleskaps, setCurrentKjoleskaps] = useState<Kjoleskap[]>([])
  const [selectedKjoleskapIndex, setSelectedKjoleskapIndex] = useState(0)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharedKjoleskaps, setSharedKjoleskaps] = useState<Kjoleskap[]>([])
  const [session, setSession] = useState<any>(null)
  const [isGridView, setIsGridView] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [showDelerom, setShowDelerom] = useState(false)
  const [showAddKjoleskap, setShowAddKjoleskap] = useState(false)
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
        await fetchAllData(session.user.id)
      }
    }
    setupSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchAllData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchAllData = async (userId: string) => {
    try {
      setLoading(true)
      let kjoleskaps = await fetchKjoleskaps(userId)
      if (kjoleskaps.length === 0) {
        const defaultKjoleskap = await createDefaultKjoleskap(userId, session?.user?.email)
        kjoleskaps = [defaultKjoleskap]
      }
      setCurrentKjoleskaps(kjoleskaps)
      await fetchFoodItemsForKjoleskap(kjoleskaps[0].id)
      const shared = await fetchSharedKjoleskaps(userId)
      setSharedKjoleskaps(shared)
    } catch (error: any) {
      setError('Feil ved henting av data. Vennligst prøv igjen.')
      toast({ title: "Feil", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchFoodItemsForKjoleskap = async (kjoleskapId: string) => {
    try {
      const items = await fetchFoodItems(kjoleskapId)
      setFoodItems(items)
    } catch (error: any) {
      setError('Feil ved henting av matvarer: ' + error.message)
    }
  }

  const switchKjoleskap = async (direction: number) => {
    if (currentKjoleskaps.length === 0) return
    setLoading(true)
    const newIndex = (selectedKjoleskapIndex + direction + currentKjoleskaps.length) % currentKjoleskaps.length
    setSelectedKjoleskapIndex(newIndex)
    await fetchFoodItemsForKjoleskap(currentKjoleskaps[newIndex].id)
    setLoading(false)
  }

  const handleShareFoodItem = async (itemId: string, kjoleskapIds: string[]) => {
    try {
      await shareFoodItem(itemId, kjoleskapIds)
      toast({ title: "Delt", description: "Matvaren er nå delt med valgte kjøleskap." })
    } catch (error) {
      console.error('Error sharing food item:', error)
      toast({ title: "Feil", description: "Kunne ikke dele matvaren. Vennligst prøv igjen.", variant: "destructive" })
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setCurrentKjoleskaps([])
      setFoodItems([])
      toast({ title: "Logget ut", description: "Du har blitt logget ut av appen." })
    } catch (error) {
      console.error('Error logging out:', error)
      toast({ title: "Feil", description: "Kunne ikke logge ut. Vennligst prøv igjen.", variant: "destructive" })
    }
  }

  const handleConnectKjoleskap = async (kjoleskap: Kjoleskap) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('user_kjoleskaps')
        .insert([{ user_id: user.id, kjoleskap_id: kjoleskap.id }])
        .select()
      
      if (error) throw error
      
      setCurrentKjoleskaps([...currentKjoleskaps, kjoleskap])
      toast({ title: "Suksess", description: `Du er nå koblet til ${kjoleskap.name}.` })
    } catch (error) {
      console.error('Error connecting to kjøleskap:', error)
      toast({ title: "Feil", description: "Kunne ikke koble til kjøleskapet. Vennligst prøv igjen.", variant: "destructive" })
    }
  }

  const handleAddKjoleskap = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('kjoleskaps')
        .insert([{ name, user_id: user.id, is_shared: false, is_default: false }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setCurrentKjoleskaps([...currentKjoleskaps, data[0]])
        toast({ title: "Suksess", description: `${name} ble lagt til i dine kjøleskap.` })
      }
    } catch (error) {
      console.error('Error adding kjøleskap:', error)
      toast({ title: "Feil", description: "Kunne ikke legge til kjøleskapet. Vennligst prøv igjen.", variant: "destructive" })
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
        <Button variant="ghost" onClick={() => setShowDelerom(true)}><Menu size={24} /></Button>
        <h1 className="text-xl font-bold">{currentKjoleskaps[selectedKjoleskapIndex]?.name || 'Kjøleskap'}</h1>
        <Button variant="ghost" onClick={() => setShowProfile(true)}><User size={24} /></Button>
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
          <Button variant="ghost" onClick={() => setShowDelerom(true)}><UserPlus size={24} /></Button>
          <Button variant="ghost" onClick={() => {/* TODO: Implement camera functionality */}}><Camera size={24} /></Button>
          <Button variant="ghost" onClick={() => setShowAddKjoleskap(true)}><Plus size={24} /></Button>
          <Button variant="ghost" onClick={() => setIsGridView(!isGridView)}>
            {isGridView ? <List size={24} /> : <Grid size={24} />}
          </Button>
        </div>
        <Button variant="ghost" onClick={() => switchKjoleskap(1)} disabled={loading || currentKjoleskaps.length === 0}>
          <ChevronRight size={24} />
        </Button>
      </footer>

      {showProfile && (
        <ProfileScreen 
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          userId={session.user.id}
          sharedKjoleskaps={sharedKjoleskaps}
        />
      )}

      {showDelerom && (
        <DeleromScreen 
          onClose={() => setShowDelerom(false)}
          onConnect={handleConnectKjoleskap}
        />
      )}

      {showAddKjoleskap && (
        <AddKjoleskapScreen
          onClose={() => setShowAddKjoleskap(false)}
          onAdd={handleAddKjoleskap}
        />
      )}

      <Toaster />
    </div>
  )
}