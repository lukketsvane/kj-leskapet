import React, { useState, useRef } from 'react'
import { Camera, X, Check, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

export const CameraScreen: React.FC<CameraScreenProps> = ({ onClose, onAddItems, kjoleskapId }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<FoodItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  const analyzeImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true)
    try {
      // TODO: Replace with actual API call to OpenAI
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      const items: FoodItem[] = data.items.map((item: string, index: number) => ({
        id: `temp-${index}`,
        name: item,
        category: 'Ukjent',
        quantity: 1,
        unit: 'stk',
        kjoleskap_id: kjoleskapId,
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
          <DialogTitle>Ta bilde av matvarer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!capturedImage ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black" />
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
                        <Label htmlFor={item.id}>{item.name}</Label>
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