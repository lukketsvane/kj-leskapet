import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Share2, Trash2, X } from 'lucide-react'
import { FoodItem } from '../types'

interface FoodItemComponentProps {
  item: FoodItem
  onShare: (itemId: string, kjoleskapIds: string[]) => void
  sharedKjoleskaps: any[]
  onDelete: (itemId: string) => void
  isGridView: boolean
}

const FoodItemPopover: React.FC<{ item: FoodItem; onClose: () => void }> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </Button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600"><strong>Kategori:</strong> {item.category || 'Ukjent kategori'}</p>
          <p className="text-sm text-gray-600"><strong>Mengde:</strong> {item.quantity} {item.unit}</p>
          <p className="text-sm text-gray-600"><strong>Utløpsdato:</strong> {item.expirationDate || 'Ikke angitt'}</p>
          <p className="text-sm text-gray-600"><strong>Plassering:</strong> {item.location || 'Ikke angitt'}</p>
          <p className="text-sm text-gray-600"><strong>Notater:</strong> {item.notes || 'Ingen notater'}</p>
        </div>
      </div>
    </div>
  )
}

export const FoodItemComponent: React.FC<FoodItemComponentProps> = ({ item, onShare, sharedKjoleskaps, onDelete, isGridView }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (isGridView) {
    return (
      <>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Card className={`overflow-hidden cursor-pointer ${isOpen ? 'relative z-50' : ''}`}>
              <CardContent className="p-2">
                <div className="aspect-square bg-gray-200 mb-2 flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{item.category || 'Ukjent kategori'}</p>
                    <p className="text-xs">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(item.id, sharedKjoleskaps.map(k => k.id));
                      }}
                    >
                      <Share2 size={14} />
                      <span className="sr-only">Del matvare</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      <Trash2 size={14} />
                      <span className="sr-only">Slett matvare</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverTrigger>
          <PopoverContent className="w-screen h-screen p-0">
            <FoodItemPopover item={item} onClose={() => setIsOpen(false)} />
          </PopoverContent>
        </Popover>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </>
    )
  } else {
    return (
      <>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Card className={`overflow-hidden cursor-pointer ${isOpen ? 'relative z-50' : ''} flex items-center`}>
              <CardContent className="p-2 flex items-center w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex-grow">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {item.category || 'Ukjent kategori'} • {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(item.id, sharedKjoleskaps.map(k => k.id));
                      }}
                    >
                      <Share2 size={14} />
                      <span className="sr-only">Del matvare</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      <Trash2 size={14} />
                      <span className="sr-only">Slett matvare</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverTrigger>
          <PopoverContent className="w-screen h-screen p-0">
            <FoodItemPopover item={item} onClose={() => setIsOpen(false)} />
          </PopoverContent>
        </Popover>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </>
    )
  }
}