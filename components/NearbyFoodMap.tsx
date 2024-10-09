'use client';

import React, { useState, useEffect } from 'react'
import { X, User, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import dynamic from 'next/dynamic'
import { FoodItem, Kjoleskap, UserProfile } from '../types'
import { foodCategoryIcons, FoodCategory, createIconWrapper } from '../lib/foodCategoryIcons'
import ReactDOMServer from 'react-dom/server'

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

interface NearbyFoodMapProps {
  onClose: () => void;
  foodItems: FoodItem[];
  currentKjoleskap: Kjoleskap;
  currentUser: UserProfile;
  onSendRequest: (item: FoodItem) => Promise<boolean>;
  onAcceptChat: (item: FoodItem) => void;
}

export default function NearbyFoodMap({ onClose, foodItems, currentKjoleskap, currentUser, onSendRequest, onAcceptChat }: NearbyFoodMapProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [L, setL] = useState<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestAccepted, setRequestAccepted] = useState(false)

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet)
      delete leaflet.Icon.Default.prototype._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
      })
      setMapReady(true)
    })
  }, [])

  const filteredFoodItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const createIcon = (IconComponent: React.ElementType) => {
    if (!L) return null
    const { component: Icon, props, wrapperStyle } = createIconWrapper(IconComponent)
    const iconHtml = ReactDOMServer.renderToString(
      <div style={wrapperStyle}>
        <Icon {...props} />
      </div>
    )
    return L.divIcon({
      html: iconHtml,
      className: 'custom-icon',
      iconSize: [32, 32],
    })
  }

  const handleSendRequest = async (item: FoodItem) => {
    setIsRequesting(true)
    setSelectedItem(item)
    try {
      const accepted = await onSendRequest(item)
      setRequestAccepted(accepted)
    } catch (error) {
      console.error('Error sending request:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleAcceptChat = () => {
    if (selectedItem) {
      onAcceptChat(selectedItem)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">MATVARER</DialogTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowProfile(true)}>
            <User size={16} />
          </Button>
        </DialogHeader>
        <div className="flex-grow flex flex-col space-y-4 overflow-hidden">
          <div className="relative">
            <Input
              type="text"
              placeholder="Søk"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
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
            {mapReady ? (
              <MapContainer 
                center={[currentKjoleskap.latitude, currentKjoleskap.longitude]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[currentKjoleskap.latitude, currentKjoleskap.longitude]}>
                  <Popup>
                    {currentKjoleskap.name}
                  </Popup>
                </Marker>
                {filteredFoodItems.map((item) => {
                  const IconComponent = foodCategoryIcons[item.category as FoodCategory] || foodCategoryIcons['Annet']
                  const icon = createIcon(IconComponent)
                  return icon ? (
                    <Marker 
                      key={item.id} 
                      position={[currentKjoleskap.latitude, currentKjoleskap.longitude]}
                      icon={icon}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          <p>Kategori: {item.category}</p>
                          <p>Mengde: {item.quantity} {item.unit}</p>
                          <p>Utløpsdato: {new Date(item.expirationDate).toLocaleDateString('no-NO')}</p>
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
                  ) : null
                })}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Laster kart...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      {showProfile && (
        <Dialog open={showProfile} onOpenChange={() => setShowProfile(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Brukerprofil</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Navn
                </label>
                <Input id="name" value={currentUser.name} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">
                  E-post
                </label>
                <Input id="email" value={currentUser.email} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="points" className="text-right">
                  Poeng
                </label>
                <Input id="points" value={currentUser.points.toString()} className="col-span-3" readOnly />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}