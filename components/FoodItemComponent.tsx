import React, { useState } from 'react'
import { Share2, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FoodItem, Kjoleskap } from '../types'

interface FoodItemComponentProps {
  item: FoodItem;
  onShare: (itemId: string, kjoleskapIds: string[]) => Promise<void>;
  sharedKjoleskaps: Kjoleskap[];
  onDelete: (itemId: string) => void;
}

export const FoodItemComponent: React.FC<FoodItemComponentProps> = ({ item, onShare, sharedKjoleskaps, onDelete }) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedKjoleskaps, setSelectedKjoleskaps] = useState<string[]>([])

  const handleShare = async () => {
    await onShare(item.id, selectedKjoleskaps)
    setIsShareDialogOpen(false)
    setSelectedKjoleskaps([])
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
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
      <div className="mt-2 flex justify-between">
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 size={16} className="mr-2" /> Del
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Del {item.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="mt-2 max-h-60">
              {sharedKjoleskaps.map((kjoleskap) => (
                <div key={kjoleskap.id} className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id={`share-${item.id}-${kjoleskap.id}`}
                    checked={selectedKjoleskaps.includes(kjoleskap.id)}
                    onCheckedChange={(checked) => {
                      setSelectedKjoleskaps(prev =>
                        checked
                          ? [...prev, kjoleskap.id]
                          : prev.filter(id => id !== kjoleskap.id)
                      )
                    }}
                  />
                  <Label htmlFor={`share-${item.id}-${kjoleskap.id}`}>{kjoleskap.name}</Label>
                </div>
              ))}
            </ScrollArea>
            <DialogFooter>
              <Button onClick={handleShare} disabled={selectedKjoleskaps.length === 0}>
                Del med valgte kjøleskap
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 size={16} className="mr-2" /> Slett
        </Button>
      </div>
    </div>
  )
}