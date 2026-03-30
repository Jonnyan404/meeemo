import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

function App() {
  return <div className="p-4">Meeemo Command Palette</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
)
