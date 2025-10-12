/**
 * Login page.
 *
 * Renders a simple email/password sign-in form and redirects to the
 * intended route on success.
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** Login form component */
export default function Login() {
  const { signInWithEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Get the redirect URL from query parameters, default to home page
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/'

  /** Handle form submission by attempting sign-in then navigating */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      navigate(redirectTo)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Login</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">No account? <Link to="/register" className="text-indigo-600 hover:underline">Register</Link></p>
    </div>
  )
}


