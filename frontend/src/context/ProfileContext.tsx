import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profilesApi } from '../api/profiles'
import type { Profile } from '../types/profile'

interface ProfileContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  setActiveProfileId: (id: number | null) => void
  isLoading: boolean
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

const STORAGE_KEY = 'activeProfileId'

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesApi.getAll,
  })

  const [activeProfileId, setActiveProfileIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : null
  })

  // Auto-select first profile if none stored and profiles are loaded
  useEffect(() => {
    if (!activeProfileId && profiles.length > 0) {
      const firstId = profiles[0].id
      setActiveProfileIdState(firstId)
      localStorage.setItem(STORAGE_KEY, String(firstId))
    }
  }, [profiles, activeProfileId])

  const setActiveProfileId = (id: number | null) => {
    setActiveProfileIdState(id)
    if (id !== null) {
      localStorage.setItem(STORAGE_KEY, String(id))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, setActiveProfileId, isLoading }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
