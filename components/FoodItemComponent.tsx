import React, { useState } from 'react'
import { Share2, Trash2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleShare = async () => {
    await onShare(item.id, selectedKjoleskaps)
    setIsShareDialogOpen(false)
    setSelectedKjoleskaps([])
  }

  return (
    <>
      <Card 
        className="w-full h-48 cursor-pointer transition-all duration-200 hover:shadow-lg"
        onClick={() => setIsDetailModalOpen(true)}
      >
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-24 object-cover mb-2 rounded" />
            ) : (
              <div className="w-full h-24 bg-gray-200 mb-2 rounded flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
            <h3 className="font-semibold truncate">{item.name}</h3>
            <p className="text-sm text-gray-600 truncate">{item.category}</p>
          </div>
          <p className="text-sm">{item.quantity} {item.unit}</p>
        </CardContent>
      </Card>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover rounded" />
            )}
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Quantity:</strong> {item.quantity} {item.unit}</p>
          </div>
          <DialogFooter className="sm:justify-start">
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 size={16} className="mr-2" /> Del
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
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
            <Button variant="destructive" size="sm" onClick={() => {
              onDelete(item.id)
              setIsDetailModalOpen(false)
            }}>
              <Trash2 size={16} className="mr-2" /> Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}