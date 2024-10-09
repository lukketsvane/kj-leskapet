import React, { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Kjoleskap } from '../types'
import { supabase } from '../lib/supabase'
import { useToast } from "@/components/ui/use-toast"

interface DeleromScreenProps {
  onClose: () => void;
  onConnect: (kjoleskap: Kjoleskap) => Promise<void>;
  onDisconnect: (kjoleskapId: string) => Promise<void>;
  userKjoleskaps: Kjoleskap[];
}

export const DeleromScreen: React.FC<DeleromScreenProps> = ({ onClose, onConnect, onDisconnect, userKjoleskaps }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [availableKjoleskaps, setAvailableKjoleskaps] = useState<Kjoleskap[]>([])
  const [newKjoleskapName, setNewKjoleskapName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchAvailableKjoleskaps = async () => {
      try {
        const { data, error } = await supabase
          .from('kjoleskaps')
          .select('*')
          .eq('is_shared', true)
          .not('id', 'in', `(${userKjoleskaps.map(k => k.id).join(',')})`)

        if (error) throw error

        setAvailableKjoleskaps(data || [])
      } catch (error) {
        console.error('Error fetching available kjøleskaps:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke hente tilgjengelige kjøleskap.",
          variant: "destructive"
        })
      }
    }

    fetchAvailableKjoleskaps()
  }, [userKjoleskaps, toast])

  const filteredKjoleskaps = availableKjoleskaps.filter(kjoleskap =>
    kjoleskap.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateKjoleskap = async () => {
    if (!newKjoleskapName.trim()) return

    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('kjoleskaps')
        .insert([
          { name: newKjoleskapName, user_id: user.id, is_shared: false, is_default: false }
        ])
        .select()
        .single()

      if (error) throw error

      await onConnect(data)
      setNewKjoleskapName('')
      toast({
        title: "Suksess",
        description: `Nytt kjøleskap "${data.name}" er opprettet.`,
      })
    } catch (error) {
      console.error('Error creating new kjøleskap:', error)
      toast({
        title: "Feil",
        description: "Kunne ikke opprette nytt kjøleskap. Vennligst prøv igjen.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kjøleskap</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="connect">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connect">Koble til</TabsTrigger>
            <TabsTrigger value="create">Opprett ny</TabsTrigger>
          </TabsList>
          <TabsContent value="connect">
            <div className="space-y-4">
              <Input
                placeholder="Søk etter kjøleskap..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredKjoleskaps.map((kjoleskap) => (
                    <div key={kjoleskap.id} className="flex justify-between items-center">
                      <span>{kjoleskap.name}</span>
                      <Button size="sm" onClick={() => onConnect(kjoleskap)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Dine tilkoblede kjøleskap</h3>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {userKjoleskaps.map((kjoleskap) => (
                      <div key={kjoleskap.id} className="flex justify-between items-center">
                        <span>{kjoleskap.name}</span>
                        <Button size="sm" variant="destructive" onClick={() => onDisconnect(kjoleskap.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="create">
            <div className="space-y-4">
              <Input
                placeholder="Navn på nytt kjøleskap"
                value={newKjoleskapName}
                onChange={(e) => setNewKjoleskapName(e.target.value)}
              />
              <Button onClick={handleCreateKjoleskap} disabled={isCreating || !newKjoleskapName.trim()}>
                {isCreating ? 'Oppretter...' : 'Opprett nytt kjøleskap'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}