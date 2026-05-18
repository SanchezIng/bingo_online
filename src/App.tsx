import { RouterProvider } from 'react-router-dom'
import { router } from '@/lib/router'
import PWAUpdatePrompt from '@/shared/components/PWAUpdatePrompt'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
    </>
  )
}
