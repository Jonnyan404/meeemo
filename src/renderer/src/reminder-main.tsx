import { createRoot } from 'react-dom/client'
import { ReminderPanel } from './reminder/ReminderPanel'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(<ReminderPanel />)
