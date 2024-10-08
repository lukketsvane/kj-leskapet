import React from 'react'
import { Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,  } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from '../lib/supabase'


interface FoodItemComponentProps {
  item: FoodItem;
  onShare: (itemId: string, kjoleskapIds: string[]) => void;
  sharedKjoleskaps: Kjoleskap[];
}

export const FoodItemComponent: React.FC<FoodItemComponentProps> = ({ item, onShare, sharedKjoleskaps }) => (
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
                onCheckedChange={(checked) => checked && onShare(item.id, [kjoleskap.id])}
              />
              <label htmlFor={kjoleskap.id}>{kjoleskap.name}</label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  </div>
)