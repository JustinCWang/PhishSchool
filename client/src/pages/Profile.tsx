/**
 * Profile page.
 *
 * Lets the user view and update profile data stored in the `Users` table and
 * optionally sync their auth email.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'

/** Profile editor form */
export default function Profile() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  /** Load profile details for the authenticated user */
  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!user) return
      // Load from Users table; fallback to auth email
      const { data, error } = await supabase
        .from('Users')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!isMounted) return
      if (error) {
        console.error('Failed to load profile:', error.message)
      }
      setEmail(data?.email ?? user.email ?? '')
      setFirstName(data?.first_name ?? '')
      setLastName(data?.last_name ?? '')
    }
    load()
    return () => {
      isMounted = false
    }
  }, [user])

  /** Save profile to database and optionally update auth email */
  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)

    // Update Users table first
    const { error: profileError } = await supabase
      .from('Users')
      .upsert(
        {
          user_id: user.id,
          email,
          first_name: firstName,
          last_name: lastName,
        },
        { onConflict: 'user_id' }
      )

    if (profileError) {
      setSaving(false)
      setMessage('Failed to save profile.')
      console.error('Profile save error:', profileError.message)
      return
    }

    // Optionally sync auth email if it changed
    if (email && email !== user.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email })
      if (emailErr) {
        // Not fatal for profile data, but inform the user
        setMessage('Saved profile, but failed to update login email.')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setMessage('Saved!')
  }

  if (!user) {
    return <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">Please sign in to view your profile.</div>
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Your Profile</h1>
      <form className="space-y-4" onSubmit={onSave}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p className="mt-1 text-xs text-gray-500">Changing this will also update your login email.</p>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  )
}


