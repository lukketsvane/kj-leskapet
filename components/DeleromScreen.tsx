import React, { useState, useEffect } from 'react'
import { X, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '../lib/supabase'

interface Kjoleskap {
  id: string;
  name: string;
  is_shared: boolean;
}

interface DeleromScreenProps {
  onClose: () => void;
  onConnect: (kjoleskap: Kjoleskap) => Promise<void>;
  onDisconnect: (kjoleskapId: string) => Promise<void>;
  userKjoleskaps: Kjoleskap[];
}

export const DeleromScreen: React.FC<DeleromScreenProps> = ({ onClose, onConnect, onDisconnect, userKjoleskaps }) => {
  const [allKjoleskaps, setAllKjoleskaps] = useState<Kjoleskap[]>([])
  const [filteredKjoleskaps, setFilteredKjoleskaps] = useState<Kjoleskap[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newKjoleskapName, setNewKjoleskapName] = useState('')
  const [isAddingKjoleskap, setIsAddingKjoleskap] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAllKjoleskaps()
  }, [])

  useEffect(() => {
    const filtered = allKjoleskaps.filter(kjoleskap => 
      kjoleskap.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredKjoleskaps(filtered)
  }, [searchTerm, allKjoleskaps])

  const fetchAllKjoleskaps = async () => {
    try {
      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .eq('is_shared', true)
      
      if (error) throw error
      setAllKjoleskaps(data || [])
    } catch (error) {
      console.error('Error fetching kjoleskaps:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke hente kjøleskap. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleAddKjoleskap = async () => {
    if (!newKjoleskapName.trim()) return

    try {
      const { data, error } = await supabase
        .from('kjoleskaps')
        .insert([{ name: newKjoleskapName, is_shared: true }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setAllKjoleskaps([...allKjoleskaps, data[0]])
        setNewKjoleskapName('')
        setIsAddingKjoleskap(false)
        toast({
          title: "Suksess",
          description: `${newKjoleskapName} ble lagt til i delerom.`,
        })
      }
    } catch (error) {
      console.error('Error adding kjoleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke legge til kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const handleConnect = async (kjoleskap: Kjoleskap) => {
    if (isConnecting) return
    setIsConnecting(true)
    try {
      await onConnect(kjoleskap)
      toast({
        title: "Suksess",
        description: `Du er nå koblet til ${kjoleskap.name}.`,
      })
    } catch (error) {
      console.error('Error connecting to kjoleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke koble til kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (kjoleskapId: string) => {
    try {
      await onDisconnect(kjoleskapId)
      toast({
        title: "Suksess",
        description: "Du er nå frakoblet kjøleskapet.",
      })
    } catch (error) {
      console.error('Error disconnecting from kjoleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke koble fra kjøleskapet. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
  }

  const isConnected = (kjoleskapId: string) => {
    return userKjoleskaps.some(uk => uk.id === kjoleskapId)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Delerom</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Søk etter kjøleskap..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-64 mb-4">
          {filteredKjoleskaps.length === 0 ? (
            <p className="text-center text-gray-500">Ingen kjøleskap funnet</p>
          ) : (
            filteredKjoleskaps.map((kjoleskap) => (
              <div key={kjoleskap.id} className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded">
                <p className="font-semibold">{kjoleskap.name}</p>
                {isConnected(kjoleskap.id) ? (
                  <Button variant="destructive" size="sm" onClick={() => handleDisconnect(kjoleskap.id)}>
                    <Trash2 size={16} className="mr-1" /> Fjern
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleConnect(kjoleskap)} disabled={isConnecting}>
                    <Plus size={16} className="mr-1" /> Koble til
                  </Button>
                )}
              </div>
            ))
          )}
        </ScrollArea>

        <Dialog open={isAddingKjoleskap} onOpenChange={setIsAddingKjoleskap}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus size={16} className="mr-2" /> Legg til nytt kjøleskap
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til nytt kjøleskap</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-kjoleskap-name">Navn på kjøleskap</Label>
              <Input
                id="new-kjoleskap-name"
                value={newKjoleskapName}
                onChange={(e) => setNewKjoleskapName(e.target.value)}
                placeholder="Skriv inn navn..."
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAddKjoleskap}>Legg til</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}