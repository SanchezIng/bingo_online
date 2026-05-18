import { RouterProvider } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { Analytics } from '@vercel/analytics/react'
import { router } from '@/lib/router'
import PWAUpdatePrompt from '@/shared/components/PWAUpdatePrompt'
import ErrorFallback from '@/shared/components/ErrorFallback'

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
      <Analytics />
    </Sentry.ErrorBoundary>
  )
}
