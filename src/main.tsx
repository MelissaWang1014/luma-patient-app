import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './parent.css'
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
