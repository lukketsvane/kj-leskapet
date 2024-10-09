'use client';

import React, { useState, useEffect } from 'react'
import { Plus, Grid, List, User, Loader2, Menu, Search, Camera, MapPin } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { FoodItemComponent } from './FoodItemComponent'
import { supabase } from '../lib/supabase'
import { fetchKjoleskaps, createDefaultKjoleskap, fetchFoodItems } from '@/lib/KjoleskapUtils'
import { ProfileScreen } from './ProfileScreen'
import { AddFoodItemScreen } from './AddFoodItemScreen'
import CameraScreen from './CameraScreen'
import NearbyFoodMap from './NearbyFoodMap'
import { Kjoleskap, FoodItem, Session } from '../types'

export default function RefrigeratorApp() {
  const [currentKjoleskap, setCurrentKjoleskap] = useState<Kjoleskap | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isGridView, setIsGridView] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddFoodItem, setShowAddFoodItem] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showNearbyMap, setShowNearbyMap] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

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

  useEffect(() => {
    const filtered = foodItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredFoodItems(filtered)
  }, [searchTerm, foodItems])

  const fetchAllData = async (userId: string) => {
    try {
      setLoading(true)
      let kjoleskaps = await fetchKjoleskaps(userId)
      if (kjoleskaps.length === 0) {
        const defaultKjoleskap = await createDefaultKjoleskap(userId, session?.user?.email ?? '')
        kjoleskaps = [defaultKjoleskap]
      }
      setCurrentKjoleskap(kjoleskaps[0])
      await fetchFoodItemsForKjoleskap(kjoleskaps[0].id)
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
      setFilteredFoodItems(items)
    } catch (error: any) {
      setError('Feil ved henting av matvarer: ' + error.message)
    }
  }

  const handleDeleteFoodItem = async (itemId: string) => {
    try {
      await supabase.from('food_items').delete().eq('id', itemId)
      setFoodItems(prevItems => prevItems.filter(item => item.id !== itemId))
      toast({ title: "Slettet", description: "Matvaren er nå fjernet fra kjøleskapet." })
    } catch (error) {
      console.error('Error deleting food item:', error)
      toast({ title: "Feil", description: "Kunne ikke slette matvaren. Vennligst prøv igjen.", variant: "destructive" })
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setCurrentKjoleskap(null)
      setFoodItems([])
      toast({ title: "Logget ut", description: "Du har blitt logget ut av appen." })
    } catch (error) {
      console.error('Error logging out:', error)
      toast({ title: "Feil", description: "Kunne ikke logge ut. Vennligst prøv igjen.", variant: "destructive" })
    }
  }

  const handleAddFoodItem = (newItem: FoodItem) => {
    setFoodItems(prev => [...prev, newItem])
    toast({ title: "Suksess", description: `${newItem.name} ble lagt til i kjøleskapet.` })
  }

  const handleAddItemsFromCamera = (newItems: FoodItem[]) => {
    setFoodItems(prev => [...prev, ...newItems])
    toast({ title: "Suksess", description: `${newItems.length} matvare(r) ble lagt til i kjøleskapet.` })
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
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden text-xs">
      <header className="bg-white shadow-sm px-2 py-1 flex justify-between items-center">
        <Button variant="ghost" size="sm"><Menu size={16} /></Button>
        <h1 className="text-sm font-semibold">{currentKjoleskap?.name || 'Kjøleskap'}</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowProfile(true)}><User size={16} /></Button>
      </header>

      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="px-2 py-1 flex-shrink-0">
          <div className="relative">
            <Input
              type="text"
              placeholder="Søk etter matvarer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-6 pr-2 py-1 w-full text-xs"
            />
            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          </div>
        </div>

        <main className="flex-grow overflow-y-auto px-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-1 text-red-500 text-xs">{error}</div>
        ) : (
          <div className={isGridView ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" : "space-y-2"}>
            {filteredFoodItems.map((item) => (
              <FoodItemComponent 
                key={item.id} 
                item={item} 
                onDelete={handleDeleteFoodItem}
                isGridView={isGridView}
              />
            ))}
          </div>
        )}
        </main>
      </div>

      <footer className="bg-white shadow-sm px-2 py-1 flex justify-between items-center flex-shrink-0">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setShowCamera(true)} aria-label="Kamera">
            <Camera size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowNearbyMap(true)} aria-label="Finn i nærheten">
            <MapPin size={16} />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setShowAddFoodItem(true)} aria-label="Legg til matvare">
            <Plus size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsGridView(!isGridView)} aria-label="Endre visning">
            {isGridView ? <List size={16} /> : <Grid size={16} />}
          </Button>
        </div>
      </footer>

      {showProfile && (
        <ProfileScreen 
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          userId={session.user.id}
        />
      )}

      {showAddFoodItem && currentKjoleskap && (
        <AddFoodItemScreen
          onClose={() => setShowAddFoodItem(false)}
          onAddItem={handleAddFoodItem}
          kjoleskapId={currentKjoleskap.id}
        />
      )}

      {showCamera && currentKjoleskap && (
        <CameraScreen
          onClose={() => setShowCamera(false)}
          onAddItems={handleAddItemsFromCamera}
          kjoleskapId={currentKjoleskap.id}
        />
      )}

      {showNearbyMap && currentKjoleskap && (
        <NearbyFoodMap
          onClose={() => setShowNearbyMap(false)}
          foodItems={foodItems}
          currentKjoleskap={currentKjoleskap}
        />
      )}

      <Toaster />
    </div>
  )
}