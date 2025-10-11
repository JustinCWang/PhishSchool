import { useState } from 'react'
import { GoogleGenAI } from '@google/genai'
import { Link } from 'react-router-dom'

export default function Home() {
  const [geminiOutput, setGeminiOutput] = useState<string>('')

  async function handleGeminiDemo() {
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Explain how AI works in a few words',
      })
      setGeminiOutput(response.text ?? '')
    } catch (error) {
      setGeminiOutput('Failed to fetch from Gemini. Check console and your API key.')
      console.error('Gemini demo error', error)
    }
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Welcome to PhishSchool</h1>
        <p className="mt-2 text-gray-600">Learn to spot phishing, test emails, and run training campaigns.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">Learn</h2>
          <p className="mb-4 text-sm text-gray-600">Practice on realistic emails and decide: safe or phishing?</p>
          <Link to="/learn" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Start Learning</Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">Detector</h2>
          <p className="mb-4 text-sm text-gray-600">Upload .eml files and get a phishing suspicion score.</p>
          <Link to="/detector" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Open Detector</Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:col-span-2">
          <h2 className="mb-2 text-lg font-semibold">Campaigns</h2>
          <p className="mb-4 text-sm text-gray-600">Opt-in to periodic test phishing emails and track progress.</p>
          <Link to="/campaigns" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Manage Campaigns</Link>
        </div>
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-2 text-lg font-semibold">Gemini Demo</h3>
        <div className="flex items-center gap-3">
          <button onClick={handleGeminiDemo} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">Run Gemini Demo</button>
          {geminiOutput && <span className="text-sm text-gray-700">{geminiOutput}</span>}
        </div>
      </section>
    </div>
  )
}
