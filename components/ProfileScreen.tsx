import React, { useState, useEffect } from 'react'
import { X, Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,  } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from '../lib/supabase'

import { useToast } from "@/components/ui/use-toast"

interface ProfileScreenProps {
  onClose: () => void;
  onLogout: () => void;
  userId: string;
  sharedKjoleskaps: Kjoleskap[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose, onLogout, userId, sharedKjoleskaps }) => {
  const [user, setUser] = useState<any>(null)
  const [personalKjoleskap, setPersonalKjoleskap] = useState<Kjoleskap | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKjoleskaps, setSelectedKjoleskaps] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(userData.user)

        const { data: kjoleskapsData, error: kjoleskapsError } = await supabase
          .from('kjoleskaps')
          .select('*')
          .eq('user_id', userId)
          .eq('is_default', true)
          .single()
        if (kjoleskapsError) throw kjoleskapsError
        setPersonalKjoleskap(kjoleskapsData)

        if (kjoleskapsData) {
          const { data: foodItemsData, error: foodItemsError } = await supabase
            .from('food_items')
            .select('*')
            .eq('kjoleskap_id', kjoleskapsData.id)
          if (foodItemsError) throw foodItemsError
          setFoodItems(foodItemsData || [])
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke hente brukerdata. Vennligst prøv igjen.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  const handleShare = async (itemId: string) => {
    if (selectedKjoleskaps.length === 0) return

    try {
      const sharesToAdd = selectedKjoleskaps.map(kjoleskapId => ({
        food_item_id: itemId,
        kjoleskap_id: kjoleskapId
      }))

      const { error } = await supabase
        .from('shared_food_items')
        .insert(sharesToAdd)

      if (error) throw error

      toast({
        title: "Delt",
        description: "Matvaren er nå delt med valgte kjøleskap.",
      })
    } catch (error) {
      console.error('Error sharing food item:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke dele matvaren. Vennligst prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setSelectedKjoleskaps([])
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profil</h2>
          <Button onClick={onClose} variant="ghost">
            <X size={24} />
          </Button>
        </div>
        
        {user && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{user.email}</h1>
            <p className="text-xl text-gray-500">Personlig kjøleskap: {personalKjoleskap?.name}</p>
          </div>
        )}

        <h3 className="text-xl font-semibold mb-4">Dine matvarer</h3>
        <div className="space-y-4 mb-6">
          {foodItems.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
              <span>{item.name}</span>
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
                          checked={selectedKjoleskaps.includes(kjoleskap.id)}
                          onCheckedChange={(checked) => {
                            setSelectedKjoleskaps(
                              checked
                                ? [...selectedKjoleskaps, kjoleskap.id]
                                : selectedKjoleskaps.filter(id => id !== kjoleskap.id)
                            )
                          }}
                        />
                        <label htmlFor={kjoleskap.id}>{kjoleskap.name}</label>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => handleShare(item.id)} disabled={selectedKjoleskaps.length === 0}>
                    Del med valgte kjøleskap
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>

        <Button onClick={onLogout} variant="destructive" className="w-full">
          Logg ut
        </Button>
      </div>
    </div>
  )
}