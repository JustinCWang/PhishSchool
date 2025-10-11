import { useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      if (data.session?.user) {
        void ensureUsersRow(data.session.user)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        void ensureUsersRow(newSession.user)
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

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

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, signInWithEmail, signUpWithEmail, signOut }),
    [user, session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
