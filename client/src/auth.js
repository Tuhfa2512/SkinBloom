import axios from 'axios'

// Simple JWT decode function (no external dependencies)
function jwtDecode(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000 // Add timeout
})

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      logout()
    }
    return Promise.reject(error)
  }
)

export function setToken(token) { 
  if (token) {
    localStorage.setItem('token', token)
  }
}

export function logout() { 
  localStorage.removeItem('token')
  // Don't redirect automatically, let the app handle it
}

export function me() {
  const token = localStorage.getItem('token')
  if (!token) return null
  
  try { 
    const decoded = jwtDecode(token)
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      localStorage.removeItem('token'); // Clean up expired token
      return null
    }
    
    return decoded 
  } catch (e) { 
    console.warn('Token decode error (safe to ignore):', e)
    localStorage.removeItem('token'); // Clean up invalid token
    return null 
  }
}

export default API