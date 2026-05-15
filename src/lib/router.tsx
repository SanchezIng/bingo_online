import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/shared/components/Layout'
import Home from '@/modo-presencial/pages/Home'
import MisCartones from '@/modo-presencial/pages/MisCartones'
import CrearCartonManual from '@/modo-presencial/pages/CrearCartonManual'
import Jugar from '@/modo-presencial/pages/Jugar'
import EditorPatrones from '@/modo-presencial/pages/EditorPatrones'
import ConfiguracionJuego from '@/modo-presencial/pages/ConfiguracionJuego'

// Lazy-load: Tesseract.js pesa ~2MB, no debe ir en el bundle inicial
const CrearCartonOCR = lazy(() => import('@/modo-presencial/pages/CrearCartonOCR'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cartones', element: <MisCartones /> },
      { path: 'cartones/nuevo', element: <CrearCartonManual /> },
      {
        path: 'cartones/foto',
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-sm text-gray-500">
                Cargando módulo OCR…
              </div>
            }
          >
            <CrearCartonOCR />
          </Suspense>
        ),
      },
      { path: 'patrones', element: <EditorPatrones /> },
      { path: 'configurar', element: <ConfiguracionJuego /> },
      { path: 'jugar', element: <Jugar /> },
    ],
  },
])
