/**
 * `useAuth` hook.
 *
 * Convenience hook to access the authentication context with a runtime guard
 * ensuring it is used within `AuthProvider`.
 */
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

/** Get the current auth context value; throws if used outside provider. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


