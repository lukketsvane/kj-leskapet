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
import { FoodItem } from '../types'

interface CameraScreenProps {
  onClose: () => void;
  onAddItems: (items: FoodItem[]) => void;
  kjoleskapId: string;
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
          prompt: `Analyze the image of food items. Return a JSON array if food items are recognized, following these strict rules:

1. Identify each food item.
2. For each item, provide:
   - name: Common name (Norwegian if possible).
   - quantity: Estimate, whole for countable, decimals for measurable.
   - unit: Relevant unit (e.g., stk, grams, liters).
   - category: Food category (Frukt, Grønnsak, etc.).
   - expirationDate: Estimated in YYYY-MM-DD format.

If no food items are identified, return an empty array. Use "unknown" if unsure.

Example:
[
  {
    "name": "Eple",
    "quantity": 3,
    "unit": "stk",
    "category": "Frukt",
    "expirationDate": "2024-10-16"
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

      const items: FoodItem[] = parsedItems.map((item: any, index: number) => ({
        id: `temp-${index}`,
        name: item.name && item.name !== "unknown" ? item.name : 'Ukjent vare',
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'stk',
        category: item.category || 'Ukategorisert',
        expirationDate: item.expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        kjoleskap_id: kjoleskapId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: ''
      }))
      setDetectedItems(items)
      setSelectedItems(new Set(items.map(item => item.id)))
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

  const handleUpdateItem = (itemId: string, field: keyof FoodItem, value: string | number) => {
    setDetectedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Legg til matvarer med bilde</DialogTitle>
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
                  {detectedItems.length === 0 ? (
                    <div className="flex items-center justify-center text-yellow-500">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      <span>Ingen matvarer oppdaget. Prøv å ta et nytt bilde.</span>
                    </div>
                  ) : (
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
                                type="date"
                                value={item.expirationDate}
                                onChange={(e) => handleUpdateItem(item.id, 'expirationDate', e.target.value)}
                              />
                              <Button onClick={() => setEditingItem(null)}>Ferdig</Button>
                            </div>
                          ) : (
                            <Label htmlFor={item.id} className="flex-1">
                              {item.name} - {item.quantity} {item.unit} ({item.category})
                              <br />
                              <span className="text-sm text-gray-500">Utløper: {item.expirationDate}</span>
                              <Button variant="ghost" size="sm" onClick={() => handleEditItem(item.id)} className="ml-2">
                                Rediger
                              </Button>
                            </Label>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => {
                      setCapturedImage(null)
                      setDetectedItems([])
                      setSelectedItems(new Set())
                    }}>
                      <X className="mr-2 h-4 w-4" /> Ta nytt bilde
                    </Button>
                    <Button onClick={handleAddItems} disabled={selectedItems.size === 0}>
                      <Check className="mr-2 h-4 w-4" /> Legg til valgte ({selectedItems.size})
                    </Button>
                  </div>
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