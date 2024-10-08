import React, { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from '../lib/supabase'

interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  image_url?: string;
}

interface Kjoleskap {
  id: string;
  name: string;
}

interface FoodItemComponentProps {
  item: FoodItem;
  onShare: (itemId: string, kjoleskapIds: string[]) => void;
  sharedKjoleskaps: Kjoleskap[];
}

export const FoodItemComponent: React.FC<FoodItemComponentProps> = ({ item, onShare, sharedKjoleskaps }) => {
  const [selectedKjoleskaps, setSelectedKjoleskaps] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleShareClick = () => {
    if (selectedKjoleskaps.length > 0) {
      onShare(item.id, selectedKjoleskaps);
      setSelectedKjoleskaps([]);
      setIsOpen(false);
    }
  };

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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2">
            <Share2 size={16} className="mr-2" /> Del
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Del {item.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 my-4">
            {sharedKjoleskaps.map(kjoleskap => (
              <div key={kjoleskap.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`share-${item.id}-${kjoleskap.id}`}
                  checked={selectedKjoleskaps.includes(kjoleskap.id)}
                  onCheckedChange={(checked) => {
                    setSelectedKjoleskaps(prev =>
                      checked
                        ? [...prev, kjoleskap.id]
                        : prev.filter(id => id !== kjoleskap.id)
                    );
                  }}
                />
                <Label htmlFor={`share-${item.id}-${kjoleskap.id}`}>{kjoleskap.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleShareClick} 
              disabled={selectedKjoleskaps.length === 0}
            >
              Del med valgte kjøleskap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};