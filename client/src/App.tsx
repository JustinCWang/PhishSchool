import { useState } from 'react'
import { GoogleGenAI } from '@google/genai'
import { Routes, Route, Outlet, Link, NavLink } from 'react-router-dom'
import './App.css'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import { useAuth } from './context/AuthContext.tsx'

function Navbar() {
  const { user, signOut } = useAuth()
  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-indigo-600">PhishSchool</Link>
        <div className="flex items-center gap-2 text-sm">
          <NavLink to="/learn" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-indigo-700'}`}>Learn</NavLink>
          <NavLink to="/detector" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-indigo-700'}`}>Detector</NavLink>
          <NavLink to="/campaigns" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-indigo-700'}`}>Campaigns</NavLink>
          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="hidden sm:inline text-gray-600">{user.email}</span>
              <button onClick={signOut} className="rounded-md bg-gray-900 px-3 py-2 text-white hover:bg-gray-800">Sign out</button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-indigo-700'}`}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-indigo-700'}`}>Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function Layout() {
  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-600">© {new Date().getFullYear()} PhishSchool</footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="learn" element={<Learn />} />
        <Route path="detector" element={<Detector />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  )
}

function Home() {
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

function Learn() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learn</h1>
      <p className="text-gray-600">You will see practice emails here. For now, here’s a placeholder card with a sample email body and controls.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Practice Email #1</h2>
          <p className="mt-2 text-sm text-gray-700">Subject: Action Required - Verify Your Account</p>
        </div>
        <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm text-gray-800">Hello, your account requires verification. Click the link below to proceed to secure your account now.</div>
        <div className="flex gap-3">
          <button className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">Not Phishing</button>
          <button className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">Phishing</button>
        </div>
      </div>
    </div>
  )
}

function Detector() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detector</h1>
      <p className="text-gray-600">Upload an .eml file. We will parse and score it.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <form className="space-y-4">
          <input type="file" accept=".eml" className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Analyze</button>
        </form>
        <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-700">Score: — (placeholder)</div>
      </div>
    </div>
  )
}

function Campaigns() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <p className="text-gray-600">Opt-in to receive test phishing emails and track your progress over time.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <form className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            I want to receive periodic test phishing emails
          </label>
          <button type="button" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Save Preferences</button>
        </form>
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Your Performance</h2>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">No data yet. Complete some tests to see your stats here.</div>
        </div>
      </div>
    </div>
  )
}

export default App
