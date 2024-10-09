"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '../lib/supabase'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  kjoleskap_id: string;
}

interface FoodItemSuggestion {
  id: string;
  name: string;
  category: string;
  default_unit: string;
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

export const FoodItemList: React.FC<{ kjoleskapId: string }> = ({ kjoleskapId }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [suggestions, setSuggestions] = useState<FoodItemSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFoodItems()
  }, [kjoleskapId])

  useEffect(() => {
    if (name.length > 1) {
      searchFoodItems(name)
    } else {
      setSuggestions([])
    }
  }, [name])

  const fetchFoodItems = async () => {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('kjoleskap_id', kjoleskapId)
    
    if (error) {
      console.error('Error fetching food items:', error)
    } else {
      setFoodItems(data || [])
    }
  }

  const searchFoodItems = async (searchTerm: string) => {
    try {
      const { data, error } = await supabase
        .from('food_item_database')
        .select('id, name, category, default_unit')
        .ilike('name', `%${searchTerm}%`)
        .limit(5)

      if (error) throw error

      setSuggestions(data || [])
    } catch (error) {
      console.error('Error searching food items:', error)
    }
  }

  const handleSelectSuggestion = (suggestion: FoodItemSuggestion) => {
    setName(suggestion.name)
    setCategory(suggestion.category)
    setUnit(suggestion.default_unit)
    setOpen(false)
  }

  const handleAddItem = async (e: React.FormEvent) => {
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
        setFoodItems([...foodItems, data[0]])
        toast({
          title: "Suksess",
          description: `${name} er lagt til i kjøleskapet.`,
        })
        // Reset form
        setName('')
        setCategory('')
        setQuantity('')
        setUnit('')
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Matvarer i kjøleskapet</h2>
      
      <form onSubmit={handleAddItem} className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="food-name">Navn på matvare</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between"
              >
                {name ? name : "Velg matvare..."}
                <X
                  className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  onClick={() => setName('')}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Søk etter matvare..." onValueChange={setName} />
                <CommandEmpty>Ingen matvarer funnet.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          name === suggestion.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {suggestion.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
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

      <div className="space-y-2">
        {foodItems.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
            <span>{item.name} - {item.quantity} {item.unit}</span>
            <span className="text-sm text-gray-500">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}