import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TamaguiProvider } from 'tamagui'
import { config } from '@repo/ui'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TamaguiProvider config={config}>
      <App />
    </TamaguiProvider>
  </StrictMode>,
)
