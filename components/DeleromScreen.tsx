import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'

import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { supabase } from '../lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,  } from "@/components/ui/dialog"

interface DeleromScreenProps {
  onClose: () => void;
  onConnect: (kjoleskap: Kjoleskap) => void;
}

export const DeleromScreen: React.FC<DeleromScreenProps> = ({ onClose, onConnect }) => {
  const [kjøleskapSearchTerm, setKjøleskapSearchTerm] = useState('')
  const [searchedKjøleskaps, setSearchedKjøleskaps] = useState<Kjoleskap[]>([])
  const { toast } = useToast()

  const handleSearch = async () => {
    try {
      const { data, error } = await supabase
        .from('kjoleskaps')
        .select('*')
        .ilike('name', `%${kjøleskapSearchTerm}%`)
        .eq('is_shared', true)
      
      if (error) throw error
      setSearchedKjøleskaps(data || [])
    } catch (error) {
      console.error('Error searching kjøleskaps:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke søke etter kjøleskap. Vennligst prøv igjen.",
        variant: "destructive",
      })
    }
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
          <Label htmlFor="kjoleskap-search">Søk etter kjøleskap:</Label>
          <div className="flex space-x-2">
            <Input
              id="kjoleskap-search"
              type="text"
              placeholder="Skriv inn kjøleskapnavn..."
              value={kjøleskapSearchTerm}
              onChange={(e) => setKjøleskapSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}>Søk</Button>
          </div>
        </div>

        <div className="mb-6 max-h-60 overflow-y-auto">
          {searchedKjøleskaps.length === 0 ? (
            <p className="text-center text-gray-500">Ingen kjøleskap funnet</p>
          ) : (
            searchedKjøleskaps.map((kjoleskap) => (
              <div key={kjoleskap.id} className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded">
                <p className="font-semibold">{kjoleskap.name}</p>
                <Button onClick={() => onConnect(kjoleskap)} size="sm">
                  <Plus size={16} className="mr-1" /> Koble til
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}