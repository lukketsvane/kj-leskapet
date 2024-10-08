import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface AddKjoleskapScreenProps {
  onClose: () => void;
  onAdd: (name: string) => void;
}

export const AddKjoleskapScreen: React.FC<AddKjoleskapScreenProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Legg til nytt kjøleskap</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="kjoleskap-name">Navn på kjøleskap:</Label>
            <Input
              id="kjoleskap-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv inn navn..."
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Legg til</Button>
          </div>
        </form>
      </div>
    </div>
  )
}