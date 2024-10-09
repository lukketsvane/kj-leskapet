import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '../lib/supabase'

interface AddFoodItemScreenProps {
  onClose: () => void;
  onAddItem: (newItem: FoodItem) => void;
  kjoleskapId: string;
}

interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  kjoleskap_id: string;
}

const categories = [
  "Frukt og grønt",
  "Meieriprodukter",
  "Kjøtt",
  "Fisk",
  "Bakevarer",
  "Tørrvarer",
  "Drikke",
  "Annet"
]

const units = [
  "stk",
  "g",
  "kg",
  "ml",
  "l",
  "pakke",
  "boks"
]

export const AddFoodItemScreen: React.FC<AddFoodItemScreenProps> = ({ onClose, onAddItem, kjoleskapId }) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !category || !quantity || !unit) {
      toast({
        title: "Feil",
        description: "Vennligst fyll ut alle feltene.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert([
          { name, category, quantity: Number(quantity), unit, kjoleskap_id: kjoleskapId }
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        onAddItem(data[0])
        toast({
          title: "Suksess",
          description: `${name} er lagt til i kjøleskapet.`,
        })
        onClose()
      }
    } catch (error) {
      console.error('Error adding food item:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke legge til matvaren. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Legg til ny matvare</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="food-name">Navn på matvare</Label>
            <Input
              id="food-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Melk, Brød, Epler"
            />
          </div>

          <div>
            <Label htmlFor="food-category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="food-category">
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="food-quantity">Antall</Label>
            <Input
              id="food-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="F.eks. 1, 2, 3"
            />
          </div>

          <div>
            <Label htmlFor="food-unit">Enhet</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger id="food-unit">
                <SelectValue placeholder="Velg enhet" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Plus size={16} className="mr-2" /> Legg til matvare
          </Button>
        </form>
      </div>
    </div>
  )
}