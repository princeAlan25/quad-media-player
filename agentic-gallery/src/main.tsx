import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MediaLibraryProvider } from './Shared/MediaContextProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MediaLibraryProvider>
      <App />
    </MediaLibraryProvider>
  </StrictMode>,
)
