import { useState } from 'react'

export default function Campaigns() {
  const [optedIn, setOptedIn] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="mb-4 text-6xl">🎯</div>
        <h1 className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
          Training Campaigns
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Receive realistic phishing simulations and track your detection skills over time
        </p>
      </div>

      {/* Opt-in Card */}
      <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-blue-50 p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-full bg-indigo-100 p-4 text-4xl">📬</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Enable Test Campaigns</h2>
            <p className="text-gray-600">Stay sharp with regular phishing detection practice</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="opt-in-toggle"
                checked={optedIn}
                onChange={(e) => setOptedIn(e.target.checked)}
                className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
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
                <button
                  onClick={() => setFrequency('daily')}
                  className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 ${
                    frequency === 'daily'
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="mb-1 text-2xl">🌅</div>
                  <div className="font-semibold text-gray-800">Daily</div>
                  <div className="text-xs text-gray-500">Most practice</div>
                </button>
                <button
                  onClick={() => setFrequency('weekly')}
                  className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 ${
                    frequency === 'weekly'
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="mb-1 text-2xl">📅</div>
                  <div className="font-semibold text-gray-800">Weekly</div>
                  <div className="text-xs text-gray-500">Recommended</div>
                </button>
                <button
                  onClick={() => setFrequency('monthly')}
                  className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 ${
                    frequency === 'monthly'
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="mb-1 text-2xl">🗓️</div>
                  <div className="font-semibold text-gray-800">Monthly</div>
                  <div className="text-xs text-gray-500">Light practice</div>
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2">
                <span>✓</span> Preferences Saved!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💾</span> Save Preferences
              </span>
            )}
          </button>
        </div>
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
