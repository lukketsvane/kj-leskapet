"use client"

import React, { useState, useRef, ChangeEvent } from 'react'
import { Camera, X, Check, Loader2, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
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
          prompt: `Analyze this image of food items and provide a detailed list. For each item:
          1. Identify the food item.
          2. Estimate the quantity (use appropriate units like pieces, grams, or milliliters).
          3. Suggest a category (e.g., Fruit, Vegetable, Dairy, Meat, Beverage, Snack, etc.).
          4. Estimate an approximate expiration date based on typical shelf life.
          
          Format the response as a JSON array of objects, each with 'name', 'quantity', 'unit', 'category', and 'expirationDate' properties. 
          Example:
          [
            {
              "name": "Apple",
              "quantity": 3,
              "unit": "pieces",
              "category": "Fruit",
              "expirationDate": "2024-10-16"
            },
            {
              "name": "Milk",
              "quantity": 1,
              "unit": "liter",
              "category": "Dairy",
              "expirationDate": "2024-10-13"
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
      if (typeof data.items === 'string') {
        // If the response is a string, try to parse it as JSON
        try {
          parsedItems = JSON.parse(data.items)
        } catch (error) {
          console.error('Error parsing items:', error)
          throw new Error('Invalid response format from API')
        }
      } else if (Array.isArray(data.items)) {
        // If it's already an array, use it directly
        parsedItems = data.items
      } else {
        throw new Error('Unexpected response format from API')
      }

      const items: FoodItem[] = parsedItems.map((item: any, index: number) => ({
        id: `temp-${index}`,
        name: item.name || 'Unknown Item',
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'piece',
        category: item.category || 'Uncategorized',
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
                  <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                    {detectedItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={item.id}
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <Label htmlFor={item.id}>
                          {item.name} - {item.quantity} {item.unit} ({item.category})
                          <br />
                          <span className="text-sm text-gray-500">Expires: {item.expirationDate}</span>
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
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