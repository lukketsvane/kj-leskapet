import React, { useState, useEffect } from 'react'
import { X, User, MessageCircle, Loader2, MapPin, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { FoodItem, Kjoleskap, UserProfile } from '@/types'
import { foodCategoryIcons, FoodCategory, createIconWrapper } from '@/lib/foodCategoryIcons'
import ReactDOMServer from 'react-dom/server'
import { supabase } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"

interface NearbyFoodMapProps {
  onClose: () => void;
  foodItems: FoodItem[];
  currentKjoleskap: Kjoleskap;
  currentUser: UserProfile;
}

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
})

const createIcon = (IconComponent: React.ElementType) => {
  const { component: Icon, props, wrapperStyle } = createIconWrapper(IconComponent);
  return L.divIcon({
    html: ReactDOMServer.renderToString(
      <div style={wrapperStyle}>
        <Icon {...props} />
      </div>
    ),
    className: 'custom-icon',
    iconSize: [32, 32],
  })
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

export default function NearbyFoodMap({ onClose, foodItems, currentKjoleskap, currentUser }: NearbyFoodMapProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestAccepted, setRequestAccepted] = useState(false)
  const [allSharedFoodItems, setAllSharedFoodItems] = useState<FoodItem[]>([])
  const { toast } = useToast()

  const filteredFoodItems = allSharedFoodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const fetchAllSharedFoodItems = async () => {
      try {
        const { data, error } = await supabase
          .from('food_items')
          .select(`
            *,
            kjoleskap:kjoleskaps(id, name, latitude, longitude, is_shared)
          `)
          .eq('kjoleskaps.is_shared', true)
          .order('created_at', { ascending: false })

        if (error) throw error

        setAllSharedFoodItems(data.filter(item => item.kjoleskap.is_shared) || [])
      } catch (error) {
        console.error('Error fetching shared food items:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke hente delte matvarer. Vennligst prøv igjen.",
          variant: "destructive"
        })
      }
    }

    fetchAllSharedFoodItems()
  }, [toast])

  const handleSendRequest = async (item: FoodItem) => {
    setIsRequesting(true)
    setSelectedItem(item)
    try {
      const { data, error } = await supabase
        .from('food_requests')
        .insert({
          food_item_id: item.id,
          requester_id: currentUser.id,
          status: 'pending'
        })

      if (error) throw error

      setRequestAccepted(true)
      toast({
        title: "Forespørsel sendt",
        description: `Din forespørsel om ${item.name} er sendt.`,
      })
    } catch (error) {
      console.error('Error sending request:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke sende forespørsel. Vennligst prøv igjen.",
        variant: "destructive"
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleAcceptChat = async () => {
    if (selectedItem) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .insert({
            food_item_id: selectedItem.id,
            requester_id: currentUser.id,
            owner_id: selectedItem.user_id
          })

        if (error) throw error

        toast({
          title: "Chat startet",
          description: `Du kan nå chatte om ${selectedItem.name}.`,
        })
        // Here you would typically navigate to a chat screen or open a chat dialog
        console.log('Chat started:', data)
      } catch (error) {
        console.error('Error starting chat:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke starte chat. Vennligst prøv igjen.",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Matvarer i nærheten</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex flex-col space-y-4 overflow-hidden">
          <div className="relative">
            <Input
              type="text"
              placeholder="Søk etter matvarer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex-grow">
            <MapContainer 
              center={[currentKjoleskap.latitude, currentKjoleskap.longitude]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapUpdater center={[currentKjoleskap.latitude, currentKjoleskap.longitude]} />
              <Marker position={[currentKjoleskap.latitude, currentKjoleskap.longitude]}>
                <Popup>
                  {currentKjoleskap.name} (Ditt kjøleskap)
                </Popup>
              </Marker>
              {filteredFoodItems.map((item) => {
                const IconComponent = foodCategoryIcons[item.category as FoodCategory] || foodCategoryIcons['Annet']
                return (
                  <Marker 
                    key={item.id} 
                    position={[item.kjoleskap.latitude, item.kjoleskap.longitude]}
                    icon={createIcon(IconComponent)}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p>Kategori: {item.category}</p>
                        <p>Mengde: {item.quantity} {item.unit}</p>
                        <p>Utløpsdato: {new Date(item.expirationDate).toLocaleDateString('no-NO')}</p>
                        <p>Kjøleskap: {item.kjoleskap.name}</p>
                        {!requestAccepted && (
                          <Button
                            onClick={() => handleSendRequest(item)}
                            disabled={isRequesting}
                            className="mt-2 w-full"
                          >
                            {isRequesting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sender forespørsel...
                              </>
                            ) : (
                              'Send forespørsel'
                            )}
                          </Button>
                        )}
                        {requestAccepted && selectedItem?.id === item.id && (
                          <Button
                            onClick={handleAcceptChat}
                            className="mt-2 w-full"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Start chat
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}