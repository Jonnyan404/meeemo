import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TodoPopover } from './todo/TodoPopover'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TodoPopover />
  </StrictMode>
)
