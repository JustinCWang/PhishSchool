import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { sendPhishingNow } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function Campaigns() {
  const { user } = useAuth()
  const [optedIn, setOptedIn] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [streak] = useState<number>(0)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sendingNow, setSendingNow] = useState(false)
  const [sendNowMessage, setSendNowMessage] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [canCollapse, setCanCollapse] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadPreferences() {
      if (!user) {
        setLoading(false)
        setOptedIn(false)
        setFrequency('weekly')
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('Users')
        .select('opted_in, frequency')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!isMounted) return
      if (error) {
        console.error('Failed to load campaign preferences:', error.message)
        setErrorMessage('Unable to load preferences right now.')
      } else {
        setOptedIn(Boolean(data?.opted_in))
        if (data?.frequency === 'daily' || data?.frequency === 'weekly' || data?.frequency === 'monthly') {
          setFrequency(data.frequency)
        } else {
          setFrequency('weekly')
        }
        setCanCollapse(Boolean(data))
      }
      setLoading(false)
    }
    void loadPreferences()
    return () => {
      isMounted = false
    }
  }, [user])

  const handleSave = async () => {
    if (!user) {
      setErrorMessage('You need to be signed in to save preferences.')
      return
    }
    setSaving(true)
    setErrorMessage(null)
    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      opted_in: optedIn,
      frequency: optedIn ? frequency : 'weekly',
    }
    if (user.email) {
      upsertPayload.email = user.email
    }
    const firstName = typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : null
    if (firstName) {
      upsertPayload.first_name = firstName
    }
    const lastName = typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : null
    if (lastName) {
      upsertPayload.last_name = lastName
    }

    const { error } = await supabase
      .from('Users')
      .upsert(
        upsertPayload,
        { onConflict: 'user_id' }
      )
    setSaving(false)
    if (error) {
      console.error('Failed to save campaign preferences:', error)
      setErrorMessage(`Failed to save preferences. ${error.message ?? ''}`.trim())
      return
    }
    setSaved(true)
    setCanCollapse(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSendNow = async () => {
    if (!user) {
      setErrorMessage('You need to be signed in to send a test email.')
      return
    }
    setSendingNow(true)
    setSendNowMessage(null)
    setErrorMessage(null)
    try {
      const res = await sendPhishingNow({ user_id: user.id })
      setSendNowMessage(res.message || 'Email sent!')
    } catch (err) {
      const e = err as Error
      setErrorMessage(e.message || 'Failed to send email')
    } finally {
      setSendingNow(false)
      setTimeout(() => setSendNowMessage(null), 4000)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header Section */}
      <div className="text-center">
      <h1 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent inline-flex items-center gap-3">
          <span>Training Campaigns</span>
          <img src="/CampaignFish.png" alt="Campaign Fish" className="h-18 w-auto object-contain" />
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Receive realistic phishing simulations and track your detection skills over time
        </p>
      </div>

      {/* Daily Streak (only when frequency is daily) */}
      {optedIn && frequency === 'daily' && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-orange-50 px-5 py-2 text-orange-700 ring-1 ring-orange-200">
            <span className="text-xl">🔥</span>
            <span className="font-semibold">Daily streak</span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-sm font-semibold">{streak} day{streak === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}

      {/* Opt-in Card */}
      <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-blue-50 p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-indigo-100 p-4 text-4xl">📬</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Enable Test Campaigns</h2>
              <p className="text-gray-600">Stay sharp with regular phishing detection practice</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => canCollapse && setCollapsed(!collapsed)}
            disabled={!canCollapse}
            title={canCollapse ? 'Collapse/expand' : 'Select and save a preference to collapse'}
            className={`rounded-md px-6 py-2 text-4xl font-semibold leading-none ${
              canCollapse ? 'text-gray-700 hover:bg-white/60' : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="opt-in-toggle" checked={optedIn} onChange={(e) => setOptedIn(e.target.checked)} disabled={!user || loading || saving} className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" />
              <label htmlFor="opt-in-toggle" className="cursor-pointer">
                <div className="font-semibold text-gray-800">
                  Receive test phishing emails
                </div>
                <div className="text-sm text-gray-500">
                  We'll send safe simulations to your inbox
                </div>
              </label>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                optedIn
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {optedIn ? '✓ Active' : 'Inactive'}
            </div>
          </div>

          {/* Frequency Selection */}
          {optedIn && (
            <div className="animate-fadeIn space-y-3 rounded-xl bg-white p-6 shadow-md">
              <label className="block font-semibold text-gray-800">
                Email Frequency
              </label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <button onClick={() => setFrequency('daily')} disabled={saving} className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${frequency === 'daily' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
                  <div className="mb-1 text-2xl">🌅</div>
                  <div className="font-semibold text-gray-800">Daily</div>
                  <div className="text-xs text-gray-500">Most practice</div>
                </button>
                <button onClick={() => setFrequency('weekly')} disabled={saving} className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${frequency === 'weekly' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
                  <div className="mb-1 text-2xl">📅</div>
                  <div className="font-semibold text-gray-800">Weekly</div>
                  <div className="text-xs text-gray-500">Recommended</div>
                </button>
                <button onClick={() => setFrequency('monthly')} disabled={saving} className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${frequency === 'monthly' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
                  <div className="mb-1 text-2xl">🗓️</div>
                  <div className="font-semibold text-gray-800">Monthly</div>
                  <div className="text-xs text-gray-500">Light practice</div>
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button type="button" onClick={handleSave} disabled={!user || loading || saving} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving...' : saved ? (
              <span className="flex items-center justify-center gap-2">
                <span>✓</span> Preferences Saved!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💾</span> Save Preferences
              </span>
            )}
          </button>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          {!user && !errorMessage && <p className="text-sm text-gray-600">Sign in to manage your phishing campaign preferences.</p>}
          {loading && <p className="text-sm text-gray-500">Loading preferences...</p>}
          </div>
        )}
      </div>

      {/* Performance Dashboard */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-full bg-purple-100 p-4 text-4xl">📊</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Performance</h2>
            <p className="text-gray-600">Track your phishing detection success rate</p>
          </div>
        </div>

        {/* Send Now CTA */}
        <div className="mb-6 flex flex-col items-start gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-cyan-50 p-6 ring-1 ring-indigo-100">
          <div className="text-gray-700">
            Instantly trigger a simulated phishing email to your inbox.
          </div>
          <button
            type="button"
            onClick={handleSendNow}
            disabled={!user || sendingNow}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingNow ? 'Sending…' : 'Send Test Email Now'}
          </button>
          {sendNowMessage && <p className="text-sm text-green-700">{sendNowMessage}</p>}
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-lg">
            <div className="mb-2 text-2xl">📧</div>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm opacity-90">Emails Received</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white shadow-lg">
            <div className="mb-2 text-2xl">✅</div>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm opacity-90">Correctly Identified</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-red-500 to-pink-500 p-6 text-white shadow-lg">
            <div className="mb-2 text-2xl">🎣</div>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm opacity-90">Phishing Attempts</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-6 text-white shadow-lg">
            <div className="mb-2 text-2xl">⭐</div>
            <div className="text-3xl font-bold">—%</div>
            <div className="text-sm opacity-90">Success Rate</div>
          </div>
        </div>

        {/* Empty State */}
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mb-4 text-5xl">🚀</div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            Ready to Start Training?
          </h3>
          <p className="mb-4 text-gray-600">
            Enable campaigns above to receive your first test email and start tracking your progress
          </p>
          <div className="mx-auto max-w-md">
            <div className="space-y-2 text-left text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>100% safe simulated phishing emails</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Real-world scenarios to improve your skills</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Detailed feedback on each attempt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="text-3xl">ℹ️</div>
          <div>
            <h3 className="mb-1 font-bold text-gray-800">How It Works</h3>
            <p className="text-sm text-gray-700">
              Our training campaigns send realistic but completely safe phishing simulations to help you 
              practice identifying threats. All emails are clearly marked and tracked separately from your 
              real inbox. You'll get immediate feedback on your performance and learn from each interaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
