import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithEmail: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)


