import React, { useState, useEffect } from 'react'
import { X, Save, Edit2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { supabase } from '../lib/supabase'
import { UserProfile, Kjoleskap } from '../types'

interface ProfileScreenProps {
  onClose: () => void;
  onLogout: () => void;
  userId: string;
}

interface ExtendedUserProfile extends UserProfile {
  bio: string | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose, onLogout, userId }) => {
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null)
  const [ownedKjoleskaps, setOwnedKjoleskaps] = useState<Kjoleskap[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedBio, setEditedBio] = useState('')

  useEffect(() => {
    const fetchProfileAndKjoleskaps = async () => {
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError

        setProfile(profileData as ExtendedUserProfile)
        setEditedName(profileData.full_name || '')
        setEditedBio(profileData.bio || '')

        // Fetch owned kjoleskaps
        const { data: kjoleskapsData, error: kjoleskapsError } = await supabase
          .from('kjoleskaps')
          .select('*')
          .eq('user_id', userId)

        if (kjoleskapsError) throw kjoleskapsError

        setOwnedKjoleskaps(kjoleskapsData)
      } catch (error) {
        console.error('Error fetching profile or kjoleskaps:', error)
      }
    }

    fetchProfileAndKjoleskaps()
  }, [userId])

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editedName, bio: editedBio })
        .eq('id', userId)

      if (error) throw error

      setProfile(prev => ({ ...prev!, full_name: editedName, bio: editedBio }))
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profil</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        {profile && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
                <AvatarFallback>{profile.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Ditt navn"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{profile.full_name || 'Ingen navn satt'}</h2>
                )}
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Fortell litt om deg selv"
                  rows={3}
                />
              ) : (
                <p>{profile.bio || 'Ingen bio satt'}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Dine kjøleskap</h3>
              <ScrollArea className="h-[100px]">
                {ownedKjoleskaps.map((kjoleskap) => (
                  <div key={kjoleskap.id} className="py-2">
                    {kjoleskap.name}
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div className="flex justify-between">
              {isEditing ? (
                <Button onClick={handleSaveProfile}>
                  <Save className="mr-2 h-4 w-4" /> Lagre endringer
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" /> Rediger profil
                </Button>
              )}
              <Button variant="destructive" onClick={onLogout}>Logg ut</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}