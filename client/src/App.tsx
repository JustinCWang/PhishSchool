import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import Learn from './learn/Learn'
import Detector from './detector/Detector'
import Campaigns from './campaigns/Campaigns'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Profile from './pages/Profile.tsx'
import Phished from './pages/Phished.tsx'

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
        <Route path="profile" element={<Profile />} />
        <Route path="phished" element={<Phished />} />
      </Route>
    </Routes>
  )
}

export default App