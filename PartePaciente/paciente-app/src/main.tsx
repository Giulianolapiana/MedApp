import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReservaProvider } from './context/ReservaContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ReservaProvider>
        <App />
      </ReservaProvider>
    </BrowserRouter>
  </StrictMode>,
)
