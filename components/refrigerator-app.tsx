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
  calories: number;
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try refreshing the page.</h1>
    }

    return this.props.children
  }
}

interface FoodSearchScreenProps {
  onClose: () => void;
  currentKjoleskapId: string;
  onAddItem: (item: FoodItem) => void;
}

const FoodSearchScreen: React.FC<FoodSearchScreenProps> = ({ onClose, currentKjoleskapId, onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [newFoodItem, setNewFoodItem] = useState<Omit<FoodItem, 'id' | 'kjoleskap_id'>>({ 
    name: '', 
    category: '', 
    calories: 0, 
    quantity: 1, 
    unit: 'stk' 
  })
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFoodItems()
  }, [])

  useEffect(() => {
    const filtered = foodItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredFoodItems(filtered)
  }, [searchTerm, foodItems])

  const fetchFoodItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
      
      if (error) throw error
      setFoodItems(data || [])
    } catch (error) {
      console.error('Error fetching food items:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke hente matvarer. Vennligst prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddExistingFoodItem = async (item: FoodItem) => {
    if (!currentKjoleskapId) {
      toast({
        title: "Feil",
        description: "Ingen kjøleskap valgt. Vennligst velg et kjøleskap først.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert([{ ...item, kjoleskap_id: currentKjoleskapId }])
        .select()
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to insert food item: ${error.message}`)
      }
      
      if (data && data[0]) {
        onAddItem(data[0])
        toast({
          title: "Suksess",
          description: `${item.name} ble lagt til i kjøleskapet.`,
        })
      } else {
        throw new Error('No data returned after insertion')
      }
    } catch (error) {
      console.error('Error adding food item:', error)
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke legge til matvare. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleAddNewFoodItem = async () => {
    if (!currentKjoleskapId) {
      toast({
        title: "Feil",
        description: "Ingen kjøleskap valgt. Vennligst velg et kjøleskap først.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert([{ ...newFoodItem, kjoleskap_id: currentKjoleskapId }])
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        setFoodItems([...foodItems, data[0]])
        onAddItem(data[0])
      }
      setNewFoodItem({ name: '', category: '', calories: 0, quantity: 1, unit: 'stk' })
      toast({
        title: "Suksess",
        description: `${newFoodItem.name} ble lagt til i kjøleskapet.`,
      })
    } catch (error) {
      console.error('Error adding new food item:', error)
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke legge til ny matvare. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Legg til matvare</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

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

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="mb-6 max-h-60 overflow-y-auto">
            {filteredFoodItems.length === 0 ? (
              <p className="text-center text-gray-500">Ingen matvarer funnet</p>
            ) : (
              filteredFoodItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.category} - {item.calories} kalorier</p>
                  </div>
                  <Button onClick={() => handleAddExistingFoodItem(item)} size="sm">
                    <Plus size={16} className="mr-1" /> Legg til
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Legg til ny matvare:</h3>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Navn"
              value={newFoodItem.name}
              onChange={(e) => setNewFoodItem({...newFoodItem, name: e.target.value})}
            />
            <Input
              type="text"
              placeholder="Kategori"
              value={newFoodItem.category}
              onChange={(e) => setNewFoodItem({...newFoodItem, category: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Kalorier"
              value={newFoodItem.calories}
              onChange={(e) => setNewFoodItem({...newFoodItem, calories: parseInt(e.target.value) || 0})}
            />
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Antall"
                value={newFoodItem.quantity}
                onChange={(e) => setNewFoodItem({...newFoodItem, quantity: parseInt(e.target.value) || 0})}
              />
              <Select
                value={newFoodItem.unit}
                onValueChange={(value) => setNewFoodItem({...newFoodItem, unit: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Enhet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stk">stk</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAddNewFoodItem} disabled={!newFoodItem.name}>
            Legg til ny matvare
          </Button>
        </div>
      </div>
    </div>
  )
}

const DeleromScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [kjøleskapSearchTerm, setKjøleskapSearchTerm] = useState('')
  const [searchedKjøleskaps, setSearchedKjøleskaps] = useState<Kjoleskap[]>([])
  const { toast } = useToast()

  const handleSearch = async () => {
    try {
      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .ilike('name', `%${kjøleskapSearchTerm}%`)
        .eq('is_shared', true)
      
      if (error) throw error
      setSearchedKjøleskaps(data || [])
    } catch (error) {
      console.error('Error searching kjøleskaps:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke søke etter kjøleskap. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleConnect = async (kjoleskap: Kjoleskap) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('user_kjoleskaps')
        .insert([{ user_id: user.id, kjoleskap_id: kjoleskap.id }])
        .select()
      
      if (error) throw error
      
      toast({
        title: "Suksess",
        description: `Du er nå koblet til ${kjoleskap.name}.`,
      })
    } catch (error) {
      console.error('Error connecting to kjøleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke koble til kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Delerom</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="mb-4">
          <Label htmlFor="kjoleskap-search">Søk etter kjøleskap:</Label>
          <div className="flex space-x-2">
            <Input
              id="kjoleskap-search"
              type="text"
              placeholder="Skriv inn kjøleskapnavn..."
              value={kjøleskapSearchTerm}
              onChange={(e) => setKjøleskapSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}>Søk</Button>
          </div>
        </div>

        <div className="mb-6 max-h-60 overflow-y-auto">
          {searchedKjøleskaps.length === 0 ? (
            <p className="text-center text-gray-500">Ingen kjøleskap funnet</p>
          ) : (
            searchedKjøleskaps.map((kjoleskap) => (
              <div key={kjoleskap.id} className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded">
                <p className="font-semibold">{kjoleskap.name}</p>
                <Button onClick={() => handleConnect(kjoleskap)} size="sm">
                  <Plus size={16} className="mr-1" /> Koble til
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const CameraScreen: React.FC<{ onClose: () => void, onCapture: (image: string) => void }> = ({ onClose, onCapture }) => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      const imageDataUrl = canvas.toDataURL('image/jpeg')
      onCapture(imageDataUrl)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ta bilde</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="mb-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
        </div>

        <div className="flex justify-center">
          <Button onClick={handleCapture}>
            <Camera size={16} className="mr-2" /> Ta bilde
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ProfileScreenProps {
  onClose: () => void
  onLogout: () => void
  userId: string
  sharedKjoleskaps: Kjoleskap[]
}
const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose, onLogout, userId, sharedKjoleskaps }) => {
  const [user, setUser] = useState<any>(null)
  const [personalKjoleskap, setPersonalKjoleskap] = useState<Kjoleskap | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sharingItem, setSharingItem] = useState<FoodItem | null>(null)
  const [selectedKjoleskaps, setSelectedKjoleskaps] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(userData.user)

        const { data: kjoleskapsData, error: kjoleskapsError } = await supabase
          .from('kjoleskaps')
          .select('*')
          .eq('user_id', userId)
          .eq('is_default', true)
          .single()
        if (kjoleskapsError) throw kjoleskapsError
        setPersonalKjoleskap(kjoleskapsData)

        if (kjoleskapsData) {
          const { data: foodItemsData, error: foodItemsError } = await supabase
            .from('food_items')
            .select('*')
            .eq('kjoleskap_id', kjoleskapsData.id)
          if (foodItemsError) throw foodItemsError
          setFoodItems(foodItemsData || [])
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke hente brukerdata. Vennligst prøv igjen.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  const handleShare = async () => {
    if (!sharingItem) return

    try {
      const sharesToAdd = selectedKjoleskaps.map(kjoleskapId => ({
        food_item_id: sharingItem.id,
        kjoleskap_id: kjoleskapId
      }))

      const { error } = await supabase
        .from('shared_food_items')
        .insert(sharesToAdd)

      if (error) throw error

      toast({
        title: "Delt",
        description: `${sharingItem.name} er nå delt med valgte kjøleskap.`,
      })
    } catch (error) {
      console.error('Error sharing food item:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke dele matvaren. Vennligst prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setSharingItem(null)
      setSelectedKjoleskaps([])
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }


  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profil</h2>
          <Button onClick={onClose} variant="ghost">
            <X size={24} />
          </Button>
        </div>
        
        {user && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{user.email}</h1>
            <p className="text-xl text-gray-500">Personlig kjøleskap: {personalKjoleskap?.name}</p>
          </div>
        )}

        <h3 className="text-xl font-semibold mb-4">Dine matvarer</h3>
        <div className="space-y-4 mb-6">
          {foodItems.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
              <span>{item.name}</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSharingItem(item)}>
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
                          checked={selectedKjoleskaps.includes(kjoleskap.id)}
                          onCheckedChange={(checked) => {
                            setSelectedKjoleskaps(
                              checked
                                ? [...selectedKjoleskaps, kjoleskap.id]
                                : selectedKjoleskaps.filter(id => id !== kjoleskap.id)
                            )
                          }}
                        />
                        <label htmlFor={kjoleskap.id}>{kjoleskap.name}</label>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleShare} disabled={selectedKjoleskaps.length === 0}>
                    Del med valgte kjøleskap
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>

        <Button onClick={onLogout} variant="destructive" className="w-full">
          Logg ut
        </Button>
      </div>
    </div>
  )
}
const ConnectedKjoleskapsScreen: React.FC<{ 
  onClose: () => void, 
  kjoleskaps: Kjoleskap[], 
  onSelect: (index: number) => void,
  onRemove: (kjoleskap: Kjoleskap) => void,
  onAdd: () => void
}> = ({ onClose, kjoleskaps, onSelect, onRemove, onAdd }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Tilkoblede kjøleskap</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        {kjoleskaps.length === 0 ? (
          <p className="text-center text-gray-500 mb-4">Ingen tilkoblede kjøleskap</p>
        ) : (
          kjoleskaps.map((kjoleskap, index) => (
            <div key={kjoleskap.id} className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded">
              <Button variant="ghost" className="w-full justify-start" onClick={() => onSelect(index)}>
                {kjoleskap.name}
              </Button>
              {!kjoleskap.is_default && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(kjoleskap)}>
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))
        )}

        <Button onClick={onAdd} className="w-full mt-4">
          <Plus size={16} className="mr-2" /> Legg til nytt kjøleskap
        </Button>
      </div>
    </div>
  )
}

const AddKjoleskapScreen: React.FC<{ 
  onClose: () => void, 
  onAdd: (name: string) => void 
}> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Legg til nytt kjøleskap</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="kjoleskap-name">Navn på kjøleskap:</Label>
            <Input
              id="kjoleskap-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv inn navn..."
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Legg til</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ShareFoodItemDialog: React.FC<{
  item: FoodItem,
  sharedKjoleskaps: Kjoleskap[],
  onShare: (itemId: string, kjoleskapIds: string[]) => void
}> = ({ item, sharedKjoleskaps, onShare }) => {
  const [selectedKjoleskaps, setSelectedKjoleskaps] = useState<string[]>([])

  const handleShare = () => {
    onShare(item.id, selectedKjoleskaps)
  }

  return (
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
                checked={selectedKjoleskaps.includes(kjoleskap.id)}
                onCheckedChange={(checked) => {
                  setSelectedKjoleskaps(
                    checked
                      ? [...selectedKjoleskaps, kjoleskap.id]
                      : selectedKjoleskaps.filter(id => id !== kjoleskap.id)
                  )
                }}
              />
              <label htmlFor={kjoleskap.id}>{kjoleskap.name}</label>
            </div>
          ))}
        </div>
        <Button onClick={handleShare} disabled={selectedKjoleskaps.length === 0}>
          Del med valgte kjøleskap
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default function RefrigeratorApp() {
  const [currentKjoleskaps, setCurrentKjoleskaps] = useState<Kjoleskap[]>([])
  const [selectedKjoleskapIndex, setSelectedKjoleskapIndex] = useState(0)
  const [showDelerom, setShowDelerom] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showConnectedKjoleskaps, setShowConnectedKjoleskaps] = useState(false)
  const [showAddKjoleskap, setShowAddKjoleskap] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isGridView, setIsGridView] = useState(true)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [switchingKjoleskap, setSwitchingKjoleskap] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharedKjoleskaps, setSharedKjoleskaps] = useState<Kjoleskap[]>([])
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
        fetchSharedKjoleskaps()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { data: userKjoleskaps, error: userKjoleskapsError } = await supabase
        .from('user_kjoleskaps')
        .select('kjoleskap_id')
        .eq('user_id', user.id)

      if (userKjoleskapsError) throw userKjoleskapsError

      const kjoleskapsIds = userKjoleskaps.map(uk => uk.kjoleskap_id)

      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .or(`user_id.eq.${user.id},id.in.(${kjoleskapsIds.join(',')})`)
      
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

  const fetchSharedKjoleskaps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .neq('user_id', user.id)
        .eq('is_shared', true)

      if (error) throw error
      setSharedKjoleskaps(data || [])
    } catch (error) {
      console.error('Error fetching shared kjoleskaps:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke hente delte kjøleskap. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const createDefaultKjoleskap = async (userId: string, userEmail: string | undefined) => {
    try {
      const kjoleskapName = userEmail ? `${userEmail.split('@')[0]}s kjøleskap` : 'Mitt kjøleskap'
      const { data, error } = await supabase
        .from('kjoleskaps')
        .insert([{ name: kjoleskapName, user_id: userId, is_shared: false, is_default: true }])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Feil ved opprettelse av standard kjøleskap:', error)
      throw error
    }
  }

  const fetchFoodItems = async (kjoleskapId: string) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { data: kjoleskap, error: kjoleskapError } = await supabase
        .from('kjoleskaps')
        .select('*')
        .eq('id', kjoleskapId)
        .single()

      if (kjoleskapError) throw kjoleskapError

      if (!kjoleskap || (kjoleskap.user_id !== user.id && !kjoleskap.is_shared)) {
        throw new Error('User does not have access to this kjoleskap')
      }

      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('kjoleskap_id', kjoleskapId)
      
      if (error) throw error
      setFoodItems(data || [])
    } catch (error: any) {
      if (error.message === 'User does not have access to this kjoleskap') {
        setError('Du har ikke tilgang til å se matvarer i dette kjøleskapet.')
        toast({
          title: "Feil",
          description: "Du har ikke tilgang til dette kjøleskapet.",
          variant: "destructive",
        })
      } else {
        setError('Feil ved henting av matvarer: ' + error.message)
        console.error('Feil ved henting av matvarer:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setCurrentKjoleskaps([])
      setFoodItems([])
      toast({
        title: "Logget ut",
        description: "Du har blitt logget ut av appen.",
      })
    } catch (error) {
      console.error('Error logging out:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke logge ut. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const switchKjoleskap = async (direction: number) => {
    if (currentKjoleskaps.length === 0) {
      toast({
        title: "Feil",
        description: "Ingen kjøleskap tilgjengelig.",
        variant: "destructive",
      })
      return
    }

    setSwitchingKjoleskap(true)
    const newIndex = (selectedKjoleskapIndex + direction + currentKjoleskaps.length) % currentKjoleskaps.length
    setSelectedKjoleskapIndex(newIndex)
    const selectedKjoleskap = currentKjoleskaps[newIndex]
    if (selectedKjoleskap && selectedKjoleskap.id) {
      await fetchFoodItems(selectedKjoleskap.id)
    } else {
      toast({
        title: "Feil",
        description: "Kunne ikke bytte kjøleskap. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
    setSwitchingKjoleskap(false)
  }

  const handleRemoveKjoleskap = async (kjoleskap: Kjoleskap) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { error } = await supabase
        .from('user_kjoleskaps')
        .delete()
        .eq('user_id', user.id)
        .eq('kjoleskap_id', kjoleskap.id)

      if (error) throw error

      setCurrentKjoleskaps(currentKjoleskaps.filter(k => k.id !== kjoleskap.id))
      toast({
        title: "Suksess",
        description: `${kjoleskap.name} ble fjernet fra dine tilkoblede kjøleskap.`,
      })
    } catch (error) {
      console.error('Error removing kjøleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke fjerne kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleAddFoodItem = (newItem: FoodItem) => {
    setFoodItems([...foodItems, newItem])
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
        toast({
          title: "Suksess",
          description: `${name} ble lagt til i dine kjøleskap.`,
        })
      }
    } catch (error) {
      console.error('Error adding kjøleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke legge til kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleShareFoodItem = async (itemId: string, kjoleskapIds: string[]) => {
    try {
      const sharesToAdd = kjoleskapIds.map(kjoleskapId => ({
        food_item_id: itemId,
        kjoleskap_id: kjoleskapId
      }))

      const { error } = await supabase
        .from('shared_food_items')
        .insert(sharesToAdd)

      if (error) throw error

      toast({
        title: "Delt",
        description: "Matvaren er nå delt med valgte kjøleskap.",
      })
    } catch (error) {
      console.error('Error sharing food item:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke dele matvaren. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {foodItems.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded-lg shadow">
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
          <ShareFoodItemDialog
            item={item}
            sharedKjoleskaps={sharedKjoleskaps}
            onShare={handleShareFoodItem}
          />
        </div>
      ))}
    </div>
  )

  const ListView = () => (
    <div className="space-y-2 p-4">
      {foodItems.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded-lg shadow flex items-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover mr-4 rounded" />
          ) : (
            <div className="w-16 h-16 bg-gray-200 mr-4 rounded flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          <div className="flex-grow">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.category}</p>
          </div>
          <p className="text-sm">{item.quantity} {item.unit}</p>
        </div>
      ))}
    </div>
  )

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
          />
        </div>
      </div>
    )
  }

  const currentKjoleskapId = currentKjoleskaps[selectedKjoleskapIndex]?.id

  return (
    <ErrorBoundary>
      <div {...handlers} className="flex flex-col h-screen bg-gray-100">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setShowConnectedKjoleskaps(true)}>
            <Menu size={24} />
          </Button>
          <h1 className="text-xl font-bold">{currentKjoleskaps[selectedKjoleskapIndex]?.name || 'Kjøleskap'}</h1>
          <Button variant="ghost" onClick={() => setShowProfile(true)}>
            <User size={24} />
          </Button>
        </header>

        <main className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : (
            <>
              {isGridView ? <GridView /> : <ListView />}
            </>
          )}
        </main>

        <footer className="bg-white shadow-sm p-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => switchKjoleskap(-1)} disabled={switchingKjoleskap || currentKjoleskaps.length === 0}>
            <ChevronLeft size={24} />
          </Button>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => setShowDelerom(true)}>
              <UserPlus size={24} />
            </Button>
            <Button variant="ghost" onClick={() => setShowCamera(true)}>
              <Camera size={24} />
            </Button>
            <Button variant="ghost" onClick={() => setShowFoodSearch(true)}>
              <Plus size={24} />
            </Button>
            <Button variant="ghost" onClick={() => setIsGridView(!isGridView)}>
              {isGridView ? <List size={24} /> : <Grid size={24} />}
            </Button>
          </div>
          <Button variant="ghost" onClick={() => switchKjoleskap(1)} disabled={switchingKjoleskap || currentKjoleskaps.length === 0}>
            <ChevronRight size={24} />
          </Button>
        </footer>

        {showDelerom && <DeleromScreen onClose={() => setShowDelerom(false)} />}
        {showCamera && <CameraScreen onClose={() => setShowCamera(false)} onCapture={setCapturedImage} />}
        {showFoodSearch && currentKjoleskapId && (
          <FoodSearchScreen 
            onClose={() => setShowFoodSearch(false)} 
            currentKjoleskapId={currentKjoleskapId}
            onAddItem={handleAddFoodItem}
          />
        )}
        {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} onLogout={handleLogout} />}
        {showConnectedKjoleskaps && (
          <ConnectedKjoleskapsScreen 
            onClose={() => setShowConnectedKjoleskaps(false)}
            kjoleskaps={currentKjoleskaps}
            onSelect={(index) => {
              setSelectedKjoleskapIndex(index)
              setShowConnectedKjoleskaps(false)
              fetchFoodItems(currentKjoleskaps[index].id)
            }}
            onRemove={handleRemoveKjoleskap}
            onAdd={() => setShowAddKjoleskap(true)}
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
    </ErrorBoundary>
  )
}