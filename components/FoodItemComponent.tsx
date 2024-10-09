import React, { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Share2, Trash2, X, Check, Camera } from 'lucide-react'
import { FoodItem, Kjoleskap } from '@/types'
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"
import Image from 'next/image'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface FoodItemComponentProps {
  item: FoodItem
  onShare: (itemId: string, kjoleskapId: string, isShared: boolean) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
  onUpdateImage: (itemId: string, imageUrl: string) => Promise<void>
  isGridView: boolean
  isProfileKjoleskap: boolean
  isSharedKjoleskap: boolean
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
          {item.imageUrl && (
            <div className="w-full h-48 relative">
              <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" className="rounded-lg" />
            </div>
          )}
          <p className="text-sm text-gray-600"><strong>Kategori:</strong> {item.category || 'Ukjent kategori'}</p>
          <p className="text-sm text-gray-600"><strong>Mengde:</strong> {item.quantity} {item.unit}</p>
          <p className="text-sm text-gray-600"><strong>Utløpsdato:</strong> {item.expirationDate ? format(new Date(item.expirationDate), 'dd. MMMM yyyy', { locale: nb }) : 'Ikke angitt'}</p>
          <p className="text-sm text-gray-600"><strong>Plassering:</strong> {item.location || 'Ikke angitt'}</p>
          <p className="text-sm text-gray-600"><strong>Notater:</strong> {item.notes || 'Ingen notater'}</p>
        </div>
      </div>
    </div>
  )
}

const SharePopover: React.FC<{ 
  item: FoodItem;
  onShare: (itemId: string, kjoleskapId: string, isShared: boolean) => Promise<void>;
  onClose: () => void;
}> = ({ item, onShare, onClose }) => {
  const [sharedKjoleskaps, setSharedKjoleskaps] = useState<Kjoleskap[]>([])
  const [sharedItemKjoleskaps, setSharedItemKjoleskaps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [sharedKjoleskapsResponse, sharedItemKjoleskapsResponse] = await Promise.all([
          supabase.from('kjoleskaps').select('*').eq('is_shared', true),
          supabase.from('shared_food_items').select('kjoleskap_id').eq('food_item_id', item.id)
        ])

        if (sharedKjoleskapsResponse.error) throw sharedKjoleskapsResponse.error
        if (sharedItemKjoleskapsResponse.error) throw sharedItemKjoleskapsResponse.error

        setSharedKjoleskaps(sharedKjoleskapsResponse.data || [])
        setSharedItemKjoleskaps(sharedItemKjoleskapsResponse.data.map(item => item.kjoleskap_id))
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke hente kjøleskap data. Vennligst prøv igjen.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [item.id, toast])

  const handleToggleShare = async (kjoleskapId: string) => {
    const isCurrentlyShared = sharedItemKjoleskaps.includes(kjoleskapId)
    try {
      await onShare(item.id, kjoleskapId, !isCurrentlyShared)
      setSharedItemKjoleskaps(prev => 
        isCurrentlyShared
          ? prev.filter(id => id !== kjoleskapId)
          : [...prev, kjoleskapId]
      )
      toast({
        title: isCurrentlyShared ? "Deling fjernet" : "Delt",
        description: isCurrentlyShared
          ? "Matvaren er ikke lenger delt med dette kjøleskapet."
          : "Matvaren er nå delt med valgt kjøleskap.",
      })
    } catch (error) {
      console.error('Error toggling share status:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke endre delingstatus. Vennligst prøv igjen.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div className="p-4">Laster...</div>
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Del med offentlige kjøleskap</h3>
      <ScrollArea className="h-[200px] mb-4">
        {sharedKjoleskaps.length > 0 ? (
          sharedKjoleskaps.map((kjoleskap) => (
            <div key={kjoleskap.id} className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id={kjoleskap.id} 
                checked={sharedItemKjoleskaps.includes(kjoleskap.id)}
                onCheckedChange={() => handleToggleShare(kjoleskap.id)}
              />
              <label htmlFor={kjoleskap.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {kjoleskap.name}
              </label>
              {sharedItemKjoleskaps.includes(kjoleskap.id) && (
                <Check size={16} className="text-green-500" />
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Ingen offentlige kjøleskap tilgjengelig for deling. Kontakt en administrator for å legge til offentlige kjøleskap.</p>
        )}
      </ScrollArea>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Lukk</Button>
      </div>
    </div>
  )
}

export const FoodItemComponent: React.FC<FoodItemComponentProps> = ({ 
  item, 
  onShare, 
  onDelete, 
  onUpdateImage,
  isGridView, 
  isProfileKjoleskap,
  isSharedKjoleskap
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const { toast } = useToast()

  const handleShare = async (itemId: string, kjoleskapId: string, isShared: boolean) => {
    await onShare(itemId, kjoleskapId, isShared)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { data, error } = await supabase.storage
        .from('food-images')
        .upload(`${item.id}/${file.name}`, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(`${item.id}/${file.name}`)

      await onUpdateImage(item.id, publicUrl)

      toast({
        title: "Bilde lastet opp",
        description: "Bildet ble lastet opp og lagret.",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke laste opp bildet. Vennligst prøv igjen.",
        variant: "destructive"
      })
    }
  }

  const renderShareButton = () => {
    if (isSharedKjoleskap) return null;

    return (
      <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={(e) => {
              e.stopPropagation();
              setIsShareOpen(true);
            }}
          >
            <Share2 size={14} />
            <span className="sr-only">Del matvare</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 bg-white" onInteractOutside={(e) => e.preventDefault()}>
          <SharePopover 
            item={item}
            onShare={handleShare} 
            onClose={() => setIsShareOpen(false)} 
          />
        </PopoverContent>
      </Popover>
    );
  };

  const renderDeleteButton = () => {
    if (isProfileKjoleskap || isSharedKjoleskap) return null;

    return (
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
    );
  };

  const renderFoodImage = () => {
    if (item.imageUrl) {
      return (
        <Image 
          src={item.imageUrl} 
          alt={item.name} 
          width={100} 
          height={100} 
          className="object-cover w-full h-full rounded-lg"
        />
      )
    } else {
      return (
        <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded-lg">
          Ingen bilde
        </div>
      )
    }
  }

  const renderImageUploadButton = () => {
    if (isSharedKjoleskap) return null;

    return (
      <label htmlFor={`image-upload-${item.id}`} className="cursor-pointer">
        <input
          id={`image-upload-${item.id}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 absolute top-1 right-1 bg-white bg-opacity-75 hover:bg-opacity-100"
        >
          <Camera size={14} />
          <span className="sr-only">Last opp bilde</span>
        </Button>
      </label>
    )
  }

  if (isGridView) {
    return (
      <>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Card className={`overflow-hidden cursor-pointer ${isOpen ? 'relative z-50' : ''}`}>
              <CardContent className="p-2">
                <div className="aspect-square mb-2 relative">
                  {renderFoodImage()}
                  {renderImageUploadButton()}
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{item.category || 'Ukjent kategori'}</p>
                    <p className="text-xs">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {renderShareButton()}
                    {renderDeleteButton()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverTrigger>
          <PopoverContent className="w-screen h-screen p-0 bg-white">
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
                <div className="w-12 h-12 mr-3 relative">
                  {renderFoodImage()}
                  {renderImageUploadButton()}
                </div>
                <div className="flex justify-between items-center w-full">
                  <div className="flex-grow">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {item.category || 'Ukjent kategori'} • {item.quantity} {item.unit}
                    </p>
                  
                  </div>
                  <div className="flex space-x-1">
                    {renderShareButton()}
                    {renderDeleteButton()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverTrigger>
          <PopoverContent className="w-screen h-screen p-0 bg-white">
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