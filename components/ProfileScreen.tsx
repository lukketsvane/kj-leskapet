import React, { useState, useEffect } from 'react'
import { X, LogOut, User } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '../lib/supabase'

interface ProfileScreenProps {
  onClose: () => void;
  onLogout: () => void;
  userId: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose, onLogout, userId }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error

        setUserProfile(profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        toast({
          title: "Feil",
          description: "Kunne ikke hente brukerprofil. Vennligst prøv igjen.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId, toast])

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Profil</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : userProfile ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name || 'User'} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{userProfile.full_name || 'Unnamed User'}</h2>
                  <p className="text-sm text-gray-500">{userProfile.email}</p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" /> Logg ut
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Ingen profilinformasjon tilgjengelig</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}