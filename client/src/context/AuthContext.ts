/**
 * Auth context types and instance.
 *
 * Defines the shape of authentication state and actions shared by the
 * application, and exports a typed React context.
 */
import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

/** Public interface exposed to consumers of the auth context. */
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

/** React context that carries authentication state and actions. */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)


