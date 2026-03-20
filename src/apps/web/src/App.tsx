import { TamaguiProvider } from 'tamagui'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { config } from '@repo/ui'
import { queryClient } from './queryClient'
import i18n from './i18n'
import { AuthProvider } from './providers/AuthProvider'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  )
}
