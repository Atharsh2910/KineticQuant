import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SMEDetail from './pages/SMEDetail'
import Portfolio from './pages/Portfolio'
import Transactions from './pages/Transactions'
import Goals from './pages/Goals'
import Settings from './pages/Settings'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
          <Route path="/portfolio" element={session ? <Portfolio session={session} /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={session ? <Transactions session={session} /> : <Navigate to="/login" />} />
          <Route path="/goals" element={session ? <Goals session={session} /> : <Navigate to="/login" />} />
          <Route path="/settings" element={session ? <Settings session={session} /> : <Navigate to="/login" />} />
          <Route path="/sme/:id" element={session ? <SMEDetail session={session} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
