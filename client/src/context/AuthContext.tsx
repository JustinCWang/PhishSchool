/**
 * AuthProvider component.
 *
 * Manages Supabase auth session and user state, ensures corresponding rows
 * exist in backend tables, and exposes auth actions to the app via context.
 */
import { useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

/** Provider component that supplies auth state and actions to descendants. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  /** Initialize session and subscribe to auth state changes. */
  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      if (data.session?.user) {
        void ensureUsersRow(data.session.user)
        void ensureScoresRow(data.session.user)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        void ensureUsersRow(newSession.user)
        void ensureScoresRow(newSession.user)
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  /** Sign in the user with email/password using Supabase */
  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  /** Create a new user account with additional profile metadata */
  async function signUpWithEmail(email: string, password: string, firstName: string, lastName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })
    return { error: error?.message }
  }

  /** Ensure a corresponding row exists in the `Users` table for this user */
  async function ensureUsersRow(currentUser: User) {
    const upsertPayload = {
      user_id: currentUser.id,
      email: currentUser.email,
      first_name: (currentUser.user_metadata && (currentUser.user_metadata.first_name as string)) || undefined,
      last_name: (currentUser.user_metadata && (currentUser.user_metadata.last_name as string)) || undefined,
    }
    const { error: upsertError } = await supabase
      .from('Users')
      .upsert(upsertPayload, { onConflict: 'user_id' })
    if (upsertError) {
      console.error('Failed to ensure Users row:', upsertError.message)
    }
  }

  /** Ensure a default `Scores` row exists without overwriting existing stats */
  async function ensureScoresRow(currentUser: User) {
    // Insert default scores if missing; do not overwrite existing stats
    const { error } = await supabase
      .from('Scores')
      .upsert(
        { score_id: currentUser.id, learn_correct: 0, learn_attempted: 0 },
        { onConflict: 'score_id', ignoreDuplicates: true }
      )
    if (error) {
      console.error('Failed to ensure Scores row:', error.message)
    }
  }

  /** Sign the current user out */
  async function signOut() {
    await supabase.auth.signOut()
  }

  /** Memoized context value passed down to consumers */
  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, signInWithEmail, signUpWithEmail, signOut }),
    [user, session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
