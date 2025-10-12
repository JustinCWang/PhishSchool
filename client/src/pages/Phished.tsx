/**
 * Phished landing page.
 *
 * Shown after a simulated phishing click. Lets the user acknowledge the
 * event and increments a counter in the `Users` table.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

/** Acknowledge-and-continue component for simulated phish events */
export default function Phished() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // No-op; we increment only when user clicks the button
  }, [])

  /** Increment the user's `num_fished` metric and redirect to Learn */
  const handleAcknowledge = async () => {
    setError(null)
    if (!user) {
      navigate('/login')
      return
    }
    setUpdating(true)
    try {
      // Increment num_fished for this user in `Users` table
      const { data, error: fetchErr } = await supabase
        .from('Users')
        .select('num_fished')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      const current = typeof data?.num_fished === 'number' ? data.num_fished : 0

      const { error: updateErr } = await supabase
        .from('Users')
        .update({ num_fished: current + 1 })
        .eq('user_id', user.id)

      if (updateErr) throw updateErr

      navigate('/learn')
    } catch (e) {
      const err = e as Error
      setError(err.message || 'Failed to update your stats')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="mb-6 text-5xl font-extrabold text-red-600">You have been Phished!</h1>
      <p className="mb-8 text-gray-700">This was a safe simulation from PhishSchool. Learn how to spot these attempts and improve your resilience.</p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleAcknowledge}
        disabled={updating}
        className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
      >
        {updating ? 'Updating…' : 'I Understand — Take me to Learn'}
      </button>
    </div>
  )
}


