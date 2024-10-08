"use client";
import React, { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { UserPlus, Plus, Camera, X, Home, Grid, List, Search, LogOut, Share2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Supabase client setup
const supabaseUrl = 'https://tuvjhtfipbcidawhfqvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dmpodGZpcGJjaWRhd2hmcXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzOTE5OTIsImV4cCI6MjA0Mzk2Nzk5Mn0.75MkqNWYkgWLMB2K5fG345cGnq5Mry7R4oJ432sXhoU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function RefrigeratorApp() {
  const [currentKjoleskaps, setCurrentKjoleskaps] = useState<any[]>([])
  const [selectedKjoleskapIndex, setSelectedKjoleskapIndex] = useState(0)
  const [showDelerom, setShowDelerom] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isGridView, setIsGridView] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [foodItems, setFoodItems] = useState<any[]>([])
  const [allFoodItems, setAllFoodItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const { toast } = useToast()

  const handlers = useSwipeable({
    onSwipedLeft: () => switchKjoleskap(1),
    onSwipedRight: () => switchKjoleskap(-1),
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchKjoleskaps()
        fetchUsers()
        fetchAllFoodItems()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchKjoleskaps()
        fetchUsers()
        fetchAllFoodItems()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchKjoleskaps() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) throw error

      if (data && data.length > 0) {
        setCurrentKjoleskaps(data)
        fetchFoodItems(data[0].id)
      } else {
        const defaultKjoleskap = await createDefaultKjoleskap(user.id)
        setCurrentKjoleskaps([defaultKjoleskap])
        fetchFoodItems(defaultKjoleskap.id)
      }
    } catch (error) {
      setError('Feil ved henting av kjøleskap. Vennligst prøv igjen.')
      toast({
        title: "Feil",
        description: "Kunne ikke hente kjøleskap. Vennligst oppdater siden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createDefaultKjoleskap(userId: string) {
    try {
      const { data, error } = await supabase
        .from('kjoleskaps')
        .insert([{ name: 'Mitt Kjøleskap', user_id: userId, is_shared: false }])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Feil ved opprettelse av standard kjøleskap:', error)
      throw error
    }
  }

  async function fetchFoodItems(kjoleskapId: string) {
    try {
      setLoading(true)
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
      setFoodItems(data || [])
    } catch (error) {
      setError('Feil ved henting av matvarer: ' + (error as Error).message)
      console.error('Feil ved henting av matvarer:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllFoodItems() {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .is('kjoleskap_id', null)
      
      if (error) throw error
      setAllFoodItems(data || [])
    } catch (error) {
      console.error('Feil ved henting av alle matvarer:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke hente matvarer. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase.from('profiles').select('*')
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Feil ved henting av brukere:', error)
    }
  }

  const switchKjoleskap = (direction: number) => {
    const newIndex = (selectedKjoleskapIndex + direction + currentKjoleskaps.length) % currentKjoleskaps.length
    setSelectedKjoleskapIndex(newIndex)
    fetchFoodItems(currentKjoleskaps[newIndex].id)
  }

  const toggleView = () => setIsGridView(!isGridView)
  const toggleDelerom = () => setShowDelerom(!showDelerom)
  const toggleCamera = () => setShowCamera(!showCamera)
  const toggleFoodSearch = () => setShowFoodSearch(!showFoodSearch)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const handleAddFoodItem = async (item: any) => {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert([{ ...item, kjoleskap_id: currentKjoleskaps[selectedKjoleskapIndex].id }])
        .select()
      
      if (error) throw error
      
      setFoodItems([...foodItems, data[0]])
      toast({
        title: "Suksess",
        description: `${item.name} ble lagt til i kjøleskapet.`,
      })
    } catch (error) {
      console.error('Feil ved tillegging av matvare:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke legge til matvare. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFoodItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
      
      setFoodItems(foodItems.filter(item => item.id !== itemId))
      toast({
        title: "Suksess",
        description: "Matvare ble slettet fra kjøleskapet.",
      })
    } catch (error) {
      console.error('Feil ved sletting av matvare:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke slette matvare. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const shareFoodItem = async (foodItemId: string, targetKjoleskapId: string) => {
    try {
      const foodItem = foodItems.find(item => item.id === foodItemId)
      if (!foodItem) throw new Error('Matvare ikke funnet')

      const { data, error } = await supabase
        .from('food_items')
        .insert([{ ...foodItem, id: undefined, kjoleskap_id: targetKjoleskapId }])
        .select()
      
      if (error) throw error
      
      toast({
        title: "Suksess",
        description: `${foodItem.name} ble delt til det valgte kjøleskapet.`,
      })
    } catch (error) {
      console.error('Feil ved deling av matvare:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke dele matvare. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const GridView = () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      {foodItems.length === 0 ? (
        <p>Ingen matvarer funnet. Legg til noen!</p>
      ) : (
        foodItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow">
            <div className="w-full h-24 bg-gray-200 rounded-md mb-2"></div>
            <p className="text-sm font-semibold">{item.name}</p>
            <p className="text-xs text-gray-500">{item.calories} kalorier</p>
            <div className="flex justify-between mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 size={16} className="mr-2" />
                    Del
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="grid gap-2">
                    {currentKjoleskaps.map((kjoleskap) => (
                      <Button key={kjoleskap.id} onClick={() => shareFoodItem(item.id, kjoleskap.id)}>
                        Del til {kjoleskap.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={() => handleDeleteFoodItem(item.id)}>
                <X size={16} className="mr-2" />
                Slett
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const ListView = () => (
    <div className="flex flex-col gap-2 p-4">
      {foodItems.length === 0 ? (
        <p>Ingen matvarer funnet. Legg til noen!</p>
      ) : (
        foodItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4"></div>
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500">{item.calories} kalorier, {item.category}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="grid gap-2">
                    {currentKjoleskaps.map((kjoleskap) => (
                      <Button key={kjoleskap.id} onClick={() => shareFoodItem(item.id, kjoleskap.id)}>
                        Del til {kjoleskap.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={() => handleDeleteFoodItem(item.id)}>
                <X size={16} />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const DeleromScreen = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-80">
        <h2 className="text-lg font-bold mb-4">Del kjøleskap</h2>
        <div className="mb-4">
          <Label htmlFor="user-select">Velg bruker å dele med:</Label>
          <select id="user-select" className="w-full p-2 border rounded">
            {users.map(user => (
              <option key={user.id}   value={user.id}>{user.email}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Button onClick={toggleDelerom} className="mr-2">Avbryt</Button>
          <Button>Del</Button>
        </div>
      </div>
    </div>
  )

  const CameraScreen = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Ta bilde</h2>
        <div className="mb-4">
          <div className="w-64 h-64 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex justify-end">
          <Button onClick={toggleCamera} className="mr-2">Avbryt</Button>
          <Button>Ta bilde</Button>
        </div>
      </div>
    </div>
  )

  const FoodSearchScreen = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-80">
        <h2 className="text-lg font-bold mb-4">Legg til matvare</h2>
        <div className="mb-4">
          <Label htmlFor="food-search">Søk etter matvare:</Label>
          <Input
            id="food-search"
            type="text"
            placeholder="Skriv inn matvare..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mb-4 max-h-60 overflow-y-auto">
          {allFoodItems
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((item) => (
              <div key={item.id} className="flex justify-between items-center mb-2">
                <span>{item.name}</span>
                <Button onClick={() => handleAddFoodItem(item)}>Legg til</Button>
              </div>
            ))
          }
        </div>
        <div className="flex justify-end">
          <Button onClick={toggleFoodSearch}>Lukk</Button>
        </div>
      </div>
    </div>
  )

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Logg inn på KJØLESKAPET</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={[]}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen w-full bg-cover bg-center flex flex-col"
      style={{ backgroundImage: 'url(https://i.ibb.co/1Zf3XbJ/image.png)' }}
    >
      <div className="flex-1 flex flex-col" {...handlers}>
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center">
            <button onClick={() => switchKjoleskap(-1)} className="mr-2">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-black">
              {currentKjoleskaps[selectedKjoleskapIndex]?.name || 'KJØLESKAPET'}
            </h1>
            <button onClick={() => switchKjoleskap(1)} className="ml-2">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleView} className="p-2 bg-white rounded-full shadow">
              {isGridView ? <List size={20} /> : <Grid size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 bg-white rounded-full shadow">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            isGridView ? <GridView /> : <ListView />
          )}
        </div>
        {capturedImage && (
          <div className="absolute bottom-20 right-4 w-24 h-24">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover rounded-lg" />
          </div>
        )}
      </div>
      <div className="flex justify-between items-center p-4 bg-gray-200 bg-opacity-50">
        <button onClick={toggleDelerom}>
          <UserPlus className="text-gray-700" size={24} />
        </button>
        <button onClick={toggleFoodSearch}>
          <Plus className="text-gray-700" size={24} />
        </button>
        <button onClick={toggleCamera}>
          <Camera className="text-gray-700" size={24} />
        </button>
      </div>
      {showDelerom && <DeleromScreen />}
      {showCamera && <CameraScreen />}
      {showFoodSearch && <FoodSearchScreen />}
      <Toaster />
    </div>
  )
}