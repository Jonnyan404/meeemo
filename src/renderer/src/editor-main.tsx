import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoEditor } from './editor/MemoEditor'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoEditor />
  </StrictMode>
)
