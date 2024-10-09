"use client"

import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from '../lib/supabase'
import { FoodItemComponent } from './FoodItemComponent'

interface KjoleskapManagerProps {
  kjoleskapId: string;
}

interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  kjoleskap_id: string;
  image_url?: string;
}

interface Kjoleskap {
  id: string;
  name: string;
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

export const KjoleskapManager: React.FC<KjoleskapManagerProps> = ({ kjoleskapId }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<Partial<FoodItem>>({})
  const [sharedKjoleskaps, setSharedKjoleskaps] = useState<Kjoleskap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFoodItems()
    fetchSharedKjoleskaps()
  }, [kjoleskapId])

  const fetchFoodItems = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('kjoleskap_id', kjoleskapId)

      if (error) throw error

      setFoodItems(data || [])
    } catch (error) {
      console.error('Error fetching food items:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke hente matvarer. Vennligst prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSharedKjoleskaps = async () => {
    try {
      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .neq('id', kjoleskapId)

      if (error) throw error

      setSharedKjoleskaps(data || [])
    } catch (error) {
      console.error('Error fetching shared kjoleskaps:', error)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.quantity || !newItem.unit) {
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
          { ...newItem, kjoleskap_id: kjoleskapId, quantity: Number(newItem.quantity) }
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setFoodItems([...foodItems, data[0]])
        setNewItem({})
        setIsAddDialogOpen(false)
        toast({
          title: "Suksess",
          description: `${data[0].name} er lagt til i kjøleskapet.`,
        })
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

  const handleShareItem = async (itemId: string, targetKjoleskapIds: string[]) => {
    try {
      const { data: sourceItem } = await supabase
        .from('food_items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (!sourceItem) throw new Error('Item not found')

      const newItems = targetKjoleskapIds.map(targetId => ({
        ...sourceItem,
        id: undefined,
        kjoleskap_id: targetId
      }))

      const { data, error } = await supabase
        .from('food_items')
        .insert(newItems)
        .select()

      if (error) throw error

      toast({
        title: "Suksess",
        description: `${sourceItem.name} er delt med ${targetKjoleskapIds.length} kjøleskap(er).`,
      })
    } catch (error) {
      console.error('Error sharing food item:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke dele matvaren. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setFoodItems(foodItems.filter(item => item.id !== itemId))
      toast({
        title: "Suksess",
        description: "Matvaren er slettet fra kjøleskapet.",
      })
    } catch (error) {
      console.error('Error deleting food item:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke slette matvaren. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mitt Kjøleskap</h1>
        <div className="space-x-2">
          <Button onClick={fetchFoodItems}>
            <RefreshCw size={16} className="mr-2" /> Oppdater
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" /> Legg til matvare
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Legg til ny matvare</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Navn
                  </Label>
                  <Input
                    id="name"
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Kategori
                  </Label>
                  <Select
                    value={newItem.category || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Antall
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Enhet
                  </Label>
                  <Select
                    value={newItem.unit || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Velg enhet" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddItem}>Legg til</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foodItems.map((item) => (
              <FoodItemComponent
                key={item.id}
                item={item}
                onShare={handleShareItem}
                sharedKjoleskaps={sharedKjoleskaps}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}