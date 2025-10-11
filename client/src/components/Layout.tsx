import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

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

export default function Layout() {
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
