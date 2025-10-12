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
    <div className="mx-auto max-w-3xl min-h-[70vh] flex flex-col items-center justify-start text-center px-6 pt-16 md:pt-24">
      <h1 className="mb-2 text-6xl md:text-7xl font-extrabold text-red-600">
        <span className="mr-2">🎣</span>
        You have been phished!
        <span className="ml-2">🪝</span>
      </h1>
      <p className="mb-6 text-gray-700 text-base md:text-lg max-w-2xl">
        This was a safe simulation from PhishSchool. Learn how to spot these attempts and improve your resilience.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleAcknowledge}
        disabled={updating}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-md ring-1 ring-blue-300 transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {!updating && (
          <img src="/LearnFish.png" alt="Learn at PhishSchool" className="h-6 w-6 md:h-7 md:w-7" />
        )}
        {updating ? 'Updating…' : 'Take me back to PhishSchool'}
      </button>
    </div>
  )
}


