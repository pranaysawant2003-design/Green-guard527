import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import ThemeProvider from './components/ThemeProvider.jsx'
import axios from 'axios'

// Configure axios early in app lifecycle
axios.defaults.baseURL = 'http://localhost:5000'
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

createRoot(document.getElementById('root')).render(
  // StrictMode disabled temporarily due to Leaflet map compatibility issue
  // StrictMode causes double-rendering which breaks Leaflet's map initialization
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)
