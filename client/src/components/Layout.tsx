import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

function Navbar() {
  const { user, signOut } = useAuth()
  return (
    <nav className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex items-center gap-6 px-8 py-4">
        <Link to="/" className="flex items-center" aria-label="PhishSchool Home">
          <img src="/phishschoollogo.png" alt="PhishSchool" className="h-8 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <NavLink to="/learn" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Learn</NavLink>
          <NavLink to="/detector" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Detector</NavLink>
          <NavLink to="/campaigns" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Campaigns</NavLink>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-gray-600">{user.email}</span>
              <button onClick={signOut} className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">Sign out</button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }: { isActive: boolean }) => `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function Layout() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-white to-gray-400 text-gray-900">
      <Navbar />
      <main className="w-full px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
