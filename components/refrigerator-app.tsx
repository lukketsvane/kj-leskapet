'use client';

import React, { useState, useEffect } from 'react'
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
  const [showProfile, setShowProfile] = useState(false)
  const [showConnectedKjoleskaps, setShowConnectedKjoleskaps] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isGridView, setIsGridView] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [foodItems, setFoodItems] = useState<any[]>([])
  const [allFoodItems, setAllFoodItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [switchingKjoleskap, setSwitchingKjoleskap] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [newFoodItem, setNewFoodItem] = useState({ name: '', category: '', calories: 0 })
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showRemoveKjoleskapConfirmation, setShowRemoveKjoleskapConfirmation] = useState(false)
  const [kjoleskapToRemove, setKjoleskapToRemove] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
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
        fetchAllFoodItems()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchKjoleskaps()
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
        .or(`user_id.eq.${user.id},is_shared.eq.true`)
      
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
      toast({
        title: "Feil",
        description: "Kunne ikke hente kjøleskap. Vennligst oppdater siden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createDefaultKjoleskap(userId: string, userEmail: string) {
    try {
      const kjoleskapName = `${userEmail.split('@')[0]}s kjøleskap`
      const { data, error } = await supabase
        .from('kjoleskaps')
        .insert([{ name: kjoleskapName, user_id: userId, is_shared: false }])
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

  const switchKjoleskap = async (direction: number) => {
    setSwitchingKjoleskap(true)
    const newIndex = (selectedKjoleskapIndex + direction + currentKjoleskaps.length) % currentKjoleskaps.length
    setSelectedKjoleskapIndex(newIndex)
    await fetchFoodItems(currentKjoleskaps[newIndex].id)
    setSwitchingKjoleskap(false)
  }

  const toggleView = () => setIsGridView(!isGridView)
  const toggleDelerom = () => setShowDelerom(!showDelerom)
  const toggleCamera = () => setShowCamera(!showCamera)
  const toggleFoodSearch = () => setShowFoodSearch(!showFoodSearch)
  const toggleProfile = () => setShowProfile(!showProfile)
  const toggleConnectedKjoleskaps = () => setShowConnectedKjoleskaps(!showConnectedKjoleskaps)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setShowProfile(false)
    setShowLogoutConfirmation(false)
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

  const handleAddNewFoodItem = async () => {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert([{ ...newFoodItem, kjoleskap_id: currentKjoleskaps[selectedKjoleskapIndex].id }])
        .select()
      
      if (error) throw error
      
      setFoodItems([...foodItems, data[0]])
      setAllFoodItems([...allFoodItems, data[0]])
      setNewFoodItem({ name: '', category: '', calories: 0 })
      toast({
        title: "Suksess",
        description: `${newFoodItem.name} ble lagt til i kjøleskapet.`,
      })
    } catch (error) {
      console.error('Feil ved tillegging av ny matvare:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke legge til ny matvare. Vennligst prøv igjen.",
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

      const { id, ...foodItemWithoutId } = foodItem

      const { data, error } = await supabase
        .from('food_items')
        .insert([{ ...foodItemWithoutId, kjoleskap_id: targetKjoleskapId }])
        .select()
      
      if (error) throw error
      
      toast({
        title: "Suksess",
        description: `${foodItem.name} ble delt til det valgte kjøleskapet.`,
      })

      // Refetch food items for the current kjøleskap
      await fetchFoodItems(currentKjoleskaps[selectedKjoleskapIndex].id)
    } catch (error) {
      console.error('Feil ved deling av matvare:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke dele matvare. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const removeKjoleskap = async (kjoleskapId: string) => {
    try {
      const { error } = await supabase
        .from('kjoleskaps')
        .delete()
        .eq('id', kjoleskapId)
      
      if (error) throw error

      setCurrentKjoleskaps(currentKjoleskaps.filter(k => k.id !== kjoleskapId))
      if (currentKjoleskaps.length > 0) {
        setSelectedKjoleskapIndex(0)
        fetchFoodItems(currentKjoleskaps[0].id)
      }
      
      toast({
        title: "Suksess",
        description: "Kjøleskapet ble fjernet.",
      })
    } catch (error) {
      console.error('Feil ved fjerning av kjøleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke fjerne kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setShowRemoveKjoleskapConfirmation(false)
      setKjoleskapToRemove(null)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result as string
      setCapturedImage(base64Image)

      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image:  base64Image }),
        })

        if (!response.ok) {
          throw new Error('Failed to analyze image')
        }

        const data = await response.json()
        const detectedItems = data.items || []

        for (const item of detectedItems) {
          await handleAddFoodItem({ name: item, category: 'Detected', calories: 0 })
        }

        toast({
          title: "Suksess",
          description: `${detectedItems.length} matvarer ble lagt til fra bildet.`,
        })
      } catch (error) {
        console.error('Error analyzing image:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke analysere bildet. Vennligst prøv igjen.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
        toggleCamera()
      }
    }
    reader.readAsDataURL(file)
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
          <Label htmlFor="kjoleskap-select">Velg kjøleskap å dele med:</Label>
          <select id="kjoleskap-select" className="w-full p-2 border rounded">
            {currentKjoleskaps.map(kjoleskap => (
              <option key={kjoleskap.id} value={kjoleskap.id}>{kjoleskap.name}</option>
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
        <h2 className="text-lg font-bold mb-4">Last opp bilde</h2>
        <div className="mb-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={toggleCamera} className="mr-2">Avbryt</Button>
          {isUploading && <Loader2 className="animate-spin" />}
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
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Legg til ny matvare:</h3>
          <Input
            type="text"
            placeholder="Navn"
            value={newFoodItem.name}
            onChange={(e) => setNewFoodItem({...newFoodItem, name: e.target.value})}
            className="mb-2"
          />
          <Input
            type="text"
            placeholder="Kategori"
            value={newFoodItem.category}
            onChange={(e) => setNewFoodItem({...newFoodItem, category: e.target.value})}
            className="mb-2"
          />
          <Input
            type="number"
            placeholder="Kalorier"
            value={newFoodItem.calories}
            onChange={(e) => setNewFoodItem({...newFoodItem, calories: parseInt(e.target.value) || 0})}
            className="mb-2"
          />
          <Button onClick={handleAddNewFoodItem} className="w-full">Legg til ny matvare</Button>
        </div>
        <div className="flex justify-end">
          <Button onClick={toggleFoodSearch}>Lukk</Button>
        </div>
      </div>
    </div>
  )

  const ProfileScreen = () => (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profil</h2>
          <Button onClick={toggleProfile} variant="ghost">
            <X size={24} />
          </Button>
        </div>
        <div className="mb-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold text-center">{session?.user?.email?.split('@')[0] || 'Bruker'}</h1>
          <p className="text-xl text-center text-gray-500">+ 4 200</p>
          <p className="text-center text-gray-500">deler mat 1km</p>
        </div>
        <h3 className="text-xl font-semibold mb-4">{session?.user?.email?.split('@')[0] || 'Bruker'}s kjøleskap</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-gray-200 aspect-square rounded-md"></div>
          ))}
        </div>
        <Dialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">Logg ut</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Er du sikker på at du vil logge ut?</DialogTitle>
              <DialogDescription>
                Du vil bli logget ut av appen og må logge inn igjen for å få tilgang.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowLogoutConfirmation(false)}>Avbryt</Button>
              <Button variant="destructive" onClick={handleLogout}>Logg ut</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  const ConnectedKjoleskapsScreen = () => (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tilkoblede Kjøleskap</h2>
          <Button onClick={toggleConnectedKjoleskaps} variant="ghost">
            <X size={24} />
          </Button>
        </div>
        <div className="mb-6">
          {currentKjoleskaps.map((kjoleskap) => (
            <div key={kjoleskap.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md mb-2">
              <span>{kjoleskap.name}</span>
              <div>
                <Button onClick={() => {
                  setSelectedKjoleskapIndex(currentKjoleskaps.findIndex(k => k.id === kjoleskap.id))
                  toggleConnectedKjoleskaps()
                }} className="mr-2">
                  Velg
                </Button>
                <Button variant="destructive" onClick={() => {
                  setKjoleskapToRemove(kjoleskap)
                  setShowRemoveKjoleskapConfirmation(true)
                }}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Søk etter kjøleskap</h3>
          <Input
            type="text"
            placeholder="Søk etter kjøleskap..."
            className="mb-2"
          />
          <Button className="w-full">Søk</Button>
        </div>
      </div>
      <Dialog open={showRemoveKjoleskapConfirmation} onOpenChange={setShowRemoveKjoleskapConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Er du sikker på at du vil fjerne dette kjøleskapet?</DialogTitle>
            <DialogDescription>
              Dette vil permanent fjerne kjøleskapet "{kjoleskapToRemove?.name}" og alle dets innhold.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRemoveKjoleskapConfirmation(false)}>Avbryt</Button>
            <Button variant="destructive" onClick={() => removeKjoleskap(kjoleskapToRemove?.id)}>Fjern</Button>
          </div>
        </DialogContent>
      </Dialog>
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
            <button onClick={toggleConnectedKjoleskaps} className="mr-2">
              <Menu size={24} />
            </button>
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
            <button onClick={toggleView}>{isGridView ? <List size={24} /> : <Grid size={24} />}</button>
            <button onClick={toggleProfile}><User size={24} /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : switchingKjoleskap ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : (
          isGridView ? <GridView /> : <ListView />
        )}
      </div>
      <div className="flex justify-around p-4 bg-white">
        <button onClick={toggleDelerom}><UserPlus size={24} /></button>
        <button onClick={toggleCamera}><Camera size={24} /></button>
        <button onClick={toggleFoodSearch}><Plus size={24} /></button>
        <button onClick={() => {}}><Home size={24} /></button>
      </div>
      {showDelerom && <DeleromScreen />}
      {showCamera && <CameraScreen />}
      {showFoodSearch && <FoodSearchScreen />}
      {showProfile && <ProfileScreen />}
      {showConnectedKjoleskaps && <ConnectedKjoleskapsScreen />}
      <Toaster />
    </div>
  )
}