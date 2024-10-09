"use client"

import React, { useState, useRef, ChangeEvent } from 'react'
import { Camera, X, Check, Loader2, Upload, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number | null;
  quantity: number;
  unit: string;
  kjoleskap_id: string;
  created_at: string;
  updated_at: string;
  expiration_date: string | null;
}

interface CameraScreenProps {
  onClose: () => void;
  onAddItems: (items: FoodItem[]) => void;
  kjoleskapId: string;
}

// Simple function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function CameraScreen({ onClose, onAddItems, kjoleskapId }: CameraScreenProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<FoodItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke få tilgang til kameraet. Sjekk tillatelsene dine.",
        variant: "destructive"
      })
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg')
        setCapturedImage(imageDataUrl)
        analyzeImage(imageDataUrl)
      }
    }
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setCapturedImage(imageDataUrl)
        analyzeImage(imageDataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageDataUrl,
          prompt: `Analyze the image of food items. Return a JSON array of identified food items, following these strict rules:

1. Identify each distinct food item visible in the image.
2. For each item, provide:
   - name: Common name in Norwegian. If unsure of the Norwegian name, use the English name rather than "unknown".
   - quantity: Estimated amount. Use whole numbers for countable items (e.g., 3 for apples) and decimals for measurable items (e.g., 0.5 for half a loaf of bread).
   - unit: Relevant unit (e.g., "stk" for pieces, "gram" for weight, "liter" for volume).
   - category: Food category in Norwegian (e.g., "Frukt og grønt", "Meieriprodukter", "Kjøtt", "Drikke", "Bakevarer").
   - calories: Estimated calories per unit, if known. Use null if unknown.
   - expiration_date: Estimated expiration date in YYYY-MM-DD format. Use null if unsure.

3. If you can identify an item but are unsure about some of its properties, provide your best guess rather than using "unknown".
4. Only use "unknown" as a last resort when you cannot identify the item at all.
5. If no food items are identified in the image, return an empty array.

Example response:
[
  {
    "name": "Eple",
    "quantity": 3,
    "unit": "stk",
    "category": "Frukt og grønt",
    "calories": 52,
    "expiration_date": "2024-10-16"
  },
  {
    "name": "Melk",
    "quantity": 1,
    "unit": "liter",
    "category": "Meieriprodukter",
    "calories": 42,
    "expiration_date": "2024-10-10"
  }
]`
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      let parsedItems: any[] = []
      if (Array.isArray(data.items)) {
        parsedItems = data.items
      } else if (typeof data.items === 'string') {
        try {
          parsedItems = JSON.parse(data.items)
        } catch (error) {
          console.error('Error parsing items:', error)
          parsedItems = []
        }
      }

      const items: FoodItem[] = parsedItems.map((item: any) => ({
        id: generateId(),
        name: item.name || 'Ukjent vare',
        category: item.category || '',
        calories: item.calories !== undefined ? Number(item.calories) : null,
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'stk',
        kjoleskap_id: kjoleskapId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expiration_date: item.expiration_date || null
      }))
      setDetectedItems(items)
      setSelectedItems(new Set(items.map(item => item.id)))

      // Log the detected items to the console
      console.log('Detected items:', items)
    } catch (error) {
      console.error('Error analyzing image:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke analysere bildet. Vennligst prøv igjen.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleAddItems = () => {
    const itemsToAdd = detectedItems.filter(item => selectedItems.has(item.id))
    onAddItems(itemsToAdd)
    onClose()
  }

  const handleEditItem = (itemId: string) => {
    setEditingItem(itemId)
  }

  const handleUpdateItem = (itemId: string, field: keyof FoodItem, value: string | number | null) => {
    setDetectedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value, updated_at: new Date().toISOString() } : item
    ))
  }

  const handleAddNewItem = () => {
    const newItem: FoodItem = {
      id: generateId(),
      name: '',
      category: '',
      calories: null,
      quantity: 1,
      unit: 'stk',
      kjoleskap_id: kjoleskapId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expiration_date: null
    }
    setDetectedItems(prev => [...prev, newItem])
    setSelectedItems(prev => new Set(prev).add(newItem.id))
    setEditingItem(newItem.id)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Legg til matvarer i kjøleskapet</DialogTitle>
          <DialogDescription>
            Ta et bilde eller last opp et bilde av matvarene du vil legge til i kjøleskapet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!capturedImage ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black" />
              <div className="flex justify-between">
                <Button onClick={startCamera} className="w-1/2 mr-2">
                  <Camera className="mr-2 h-4 w-4" /> Start kamera
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} className="w-1/2 ml-2">
                  <Upload className="mr-2 h-4 w-4" /> Last opp bilde
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button onClick={captureImage} className="w-full">
                <Camera className="mr-2 h-4 w-4" /> Ta bilde
              </Button>
            </>
          ) : (
            <>
              <img src={capturedImage} alt="Captured" className="w-full h-64 object-cover" />
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Analyserer bilde...</span>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                    {detectedItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={item.id}
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        {editingItem === item.id ? (
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              placeholder="Navn"
                            />
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                placeholder="Antall"
                                className="w-1/3"
                              />
                              <Input
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                placeholder="Enhet"
                                className="w-1/3"
                              />
                              <Input
                                value={item.category}
                                onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                placeholder="Kategori"
                                className="w-1/3"
                              />
                            </div>
                            <Input
                              type="number"
                              value={item.calories !== null ? item.calories : ''}
                              onChange={(e) => handleUpdateItem(item.id, 'calories', e.target.value ? Number(e.target.value) : null)}
                              placeholder="Kalorier"
                            />
                            <Input
                              type="date"
                              value={item.expiration_date || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'expiration_date', e.target.value || null)}
                            />
                            <Button onClick={() => setEditingItem(null)}>Ferdig</Button>
                          </div>
                        ) : (
                          <Label htmlFor={item.id} className="flex-1">
                            {item.name} - {item.quantity} {item.unit} ({item.category})
                            <br />
                            <span className="text-sm text-gray-500">
                              Kalorier: {item.calories !== null ? item.calories : 'Ukjent'}
                              {item.expiration_date && `, Utløper: ${item.expiration_date}`}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleEditItem(item.id)} className="ml-2">
                              Rediger
                            </Button>
                          </Label>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleAddNewItem}>
                      Legg til ny vare
                    </Button>
                    <Button onClick={handleAddItems} disabled={selectedItems.size === 0}>
                      <Check className="mr-2 h-4 w-4" /> Legg til i kjøleskapet ({selectedItems.size})
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setCapturedImage(null)
                    setDetectedItems([])
                    setSelectedItems(new Set())
                  }} className="w-full">
                    <X className="mr-2 h-4 w-4" /> Ta nytt bilde
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Dialog>
  )
}