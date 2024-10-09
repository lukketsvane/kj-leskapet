import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { FoodItem, Kjoleskap } from '../types'
import { foodCategoryIcons, FoodCategory, createIconWrapper } from '../lib/foodCategoryIcons'
import ReactDOMServer from 'react-dom/server'

interface NearbyFoodMapProps {
  onClose: () => void;
  foodItems: FoodItem[];
  currentKjoleskap: Kjoleskap;
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

export default function NearbyFoodMap({ onClose, foodItems, currentKjoleskap }: NearbyFoodMapProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFoodItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">MATVARER</DialogTitle>
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
                return (
                  <Marker 
                    key={item.id} 
                    position={[currentKjoleskap.latitude, currentKjoleskap.longitude]}
                    icon={createIcon(IconComponent)}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p>Kategori: {item.category}</p>
                        <p>Mengde: {item.quantity} {item.unit}</p>
                        <p>Utløpsdato: {new Date(item.expirationDate).toLocaleDateString('no-NO')}</p>
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