/**
 * App layout and navigation.
 *
 * Provides a top navigation bar that reflects auth state and an outlet for
 * nested page routes.
 */
import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** Top navigation bar with auth-aware actions */
function Navbar() {
  const { user, signOut } = useAuth()
  return (
    <nav className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex items-center gap-4 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
        <Link to="/" className="flex items-center" aria-label="PhishSchool Home">
          <img src="/phishschoollogo.png" alt="PhishSchool" className="h-8 w-auto object-contain sm:h-10" />
        </Link>
        <div className="flex flex-1 items-center justify-center gap-1 text-xs sm:justify-start sm:gap-2 sm:text-sm">
          <NavLink to="/learn" className={({ isActive }: { isActive: boolean }) => `min-w-0 flex-1 text-center px-2 py-1 rounded-md sm:flex-none sm:px-3 sm:py-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Learn</NavLink>
          <NavLink to="/detector" className={({ isActive }: { isActive: boolean }) => `min-w-0 flex-1 text-center px-2 py-1 rounded-md sm:flex-none sm:px-3 sm:py-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Detector</NavLink>
          <NavLink to="/campaigns" className={({ isActive }: { isActive: boolean }) => `min-w-0 flex-1 text-center px-2 py-1 rounded-md sm:flex-none sm:px-3 sm:py-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Campaigns</NavLink>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <NavLink to="/profile" className={({ isActive }: { isActive: boolean }) => `px-2 py-1 rounded-md text-xs sm:px-3 sm:py-2 sm:text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Profile</NavLink>
              <span className="hidden sm:inline text-gray-600 truncate max-w-[10rem]">{user.email}</span>
              <button onClick={signOut} className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 sm:px-3 sm:py-2 sm:text-sm">Sign out</button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }: { isActive: boolean }) => `px-2 py-1 rounded-md text-xs sm:px-3 sm:py-2 sm:text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }: { isActive: boolean }) => `px-2 py-1 rounded-md text-xs sm:px-3 sm:py-2 sm:text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Register</NavLink>
            </>
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
    </div>
  )
}
