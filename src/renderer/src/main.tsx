import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CommandPalette } from './palette/CommandPalette'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CommandPalette />
  </StrictMode>
)
