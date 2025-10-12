/**
 * Registration page.
 *
 * Creates a new account with email/password and basic profile info, then
 * prompts the user to verify their email.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** Registration form component */
export default function Register() {
  const { signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** Handle registration and redirect to home */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signUpWithEmail(email, password, firstName, lastName)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      alert('Verify your email to complete registration.')
      navigate('/')
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Creating account...' : 'Register'}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link></p>
    </div>
  )
}


