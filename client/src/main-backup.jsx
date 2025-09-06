import './styles.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './ui/App.jsx'
import SimpleDashboard from './ui/SimpleDashboard.jsx'
import Login from './ui/Login.jsx'
import Register from './ui/Register.jsx'
import Products from './ui/Products.jsx'
import Profile from './ui/Profile.jsx'
import Routine from './ui/Routine.jsx'
import Feedback from './ui/Feedback.jsx'
import Timeline from './ui/Timeline.jsx'
import Tickets from './ui/Tickets.jsx'
const root = createRoot(document.getElementById('root'))
root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path='/' element={<App />}>
          <Route index element={<SimpleDashboard />} />
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          <Route path='products' element={<Products />} />
          <Route path='profile' element={<Profile />} />
          <Route path='routine' element={<Routine />} />
          <Route path='feedback' element={<Feedback />} />
          <Route path='timeline' element={<Timeline />} />
          <Route path='tickets' element={<Tickets />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)
