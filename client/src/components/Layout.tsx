/**
 * App layout and navigation.
 *
 * Provides a top navigation bar that reflects auth state and an outlet for
 * nested page routes.
 */
import { Outlet, Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'

/** Top navigation bar with auth-aware actions */
function Navbar() {
  const { user, signOut } = useAuth()
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadFirstName() {
      if (!user) {
        setFirstName(null)
        return
      }
      try {
        const { data, error } = await supabase
          .from('Users')
          .select('first_name')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!isMounted) return
        if (error) {
          // Fallback to auth metadata or email username
          const fallback = typeof user.user_metadata?.first_name === 'string' && user.user_metadata.first_name
            ? user.user_metadata.first_name
            : (user.email ? user.email.split('@')[0] : '')
          setFirstName(fallback || null)
        } else {
          const nameFromDb = (data && typeof data.first_name === 'string' && data.first_name) || null
          if (nameFromDb) {
            setFirstName(nameFromDb)
          } else {
            const fallback = typeof user.user_metadata?.first_name === 'string' && user.user_metadata.first_name
              ? user.user_metadata.first_name
              : (user.email ? user.email.split('@')[0] : '')
            setFirstName(fallback || null)
          }
        }
      } catch {
        const fallback = typeof user?.user_metadata?.first_name === 'string' && user.user_metadata.first_name
          ? user.user_metadata.first_name
          : (user?.email ? user.email.split('@')[0] : '')
        setFirstName(fallback || null)
      }
    }
    void loadFirstName()
    return () => { isMounted = false }
  }, [user])

  return (
    <nav className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-white/60">
      <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
        <Link to="/" className="flex items-center" aria-label="PhishSchool Home">
          <img src="/phishschoollogo.png" alt="PhishSchool" className="h-8 w-auto object-contain sm:h-10" />
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">
          <NavLink to="/learn" className={({ isActive }: { isActive: boolean }) => `min-w-0 flex-1 text-center px-2 py-1 rounded-full sm:flex-none sm:px-3 sm:py-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'}`}>Learn</NavLink>
          <NavLink to="/detector" className={({ isActive }: { isActive: boolean }) => `min-w-0 flex-1 text-center px-2 py-1 rounded-full sm:flex-none sm:px-3 sm:py-2 ${isActive ? 'bg-red-100 text-red-700' : 'text-gray-700 hover:bg-gray-100 hover:text-red-700'}`}>Detector</NavLink>
          <NavLink to="/campaigns" className={({ isActive }: { isActive: boolean }) => `min-w-0 flex-1 text-center px-2 py-1 rounded-full sm:flex-none sm:px-3 sm:py-2 ${isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-gray-100 hover:text-orange-700'}`}>Campaigns</NavLink>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              {firstName && (
                <span className="hidden sm:inline rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">Hi, {firstName}!</span>
              )}
              <NavLink to="/profile" className={({ isActive }: { isActive: boolean }) => `px-2 py-1 rounded-full text-xs sm:px-3 sm:py-2 sm:text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'}`}>Profile</NavLink>
              <button onClick={signOut} className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 sm:text-sm">Sign out</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className={({ isActive }: { isActive: boolean }) => `px-2 py-1 rounded-full text-xs sm:px-3 sm:py-2 sm:text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'}`}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }: { isActive: boolean }) => `px-2 py-1 rounded-full text-xs sm:px-3 sm:py-2 sm:text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-white bg-blue-600 hover:bg-blue-700'}`}>Get Started</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

/** Default page layout wrapper with main outlet */
export default function Layout() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-blue-100 to-cyan-100 text-gray-900">
      <Navbar />
      <main className="w-full px-8 py-8">
        <Outlet />
      </main>
      <footer className="w-full px-8 pb-8 pt-4 text-center text-sm text-gray-600">
        <div className="mb-2">© {new Date().getFullYear()} PhishSchool. All rights reserved.</div>
        <div className="flex items-center justify-center gap-4">
          <a className="hover:text-blue-700" href="#">Privacy</a>
          <a className="hover:text-blue-700" href="#">Terms</a>
          <a className="hover:text-blue-700" href="#">Contact</a>
        </div>
      </footer>
    </div>
  )
}
