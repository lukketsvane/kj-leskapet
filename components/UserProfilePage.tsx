import React from 'react'
import { User, MessageCircle, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfile, FoodItem } from '../types'

interface UserProfilePageProps {
  user: UserProfile
  onClose: () => void
  onSendRequest: (item: FoodItem) => Promise<boolean>
  onStartChat: () => void
  requestedItem: FoodItem | null
  isRequesting: boolean
  requestAccepted: boolean
}

export function UserProfilePage({
  user,
  onClose,
  onSendRequest,
  onStartChat,
  requestedItem,
  isRequesting,
  requestAccepted
}: UserProfilePageProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Brukerprofil</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-4 top-4">
            <X size={16} />
          </Button>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex items-center space-x-2">
            <User size={16} className="text-gray-400" />
            <span className="text-sm">{user.points} poeng</span>
          </div>
        </div>
        {requestedItem && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Forespurt matvare:</h3>
            <p>{requestedItem.name}</p>
            <p className="text-sm text-gray-500">
              Mengde: {requestedItem.quantity} {requestedItem.unit}
            </p>
            <Button
              onClick={() => onSendRequest(requestedItem)}
              disabled={isRequesting || requestAccepted}
              className="mt-2 w-full"
            >
              {isRequesting ? 'Sender forespørsel...' : requestAccepted ? 'Forespørsel sendt' : 'Send forespørsel'}
            </Button>
          </div>
        )}
        {requestAccepted && (
          <Button onClick={onStartChat} className="mt-4 w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Start chat
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}