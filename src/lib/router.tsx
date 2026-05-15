import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/shared/components/Layout'
import Home from '@/modo-presencial/pages/Home'
import MisCartones from '@/modo-presencial/pages/MisCartones'
import CrearCartonManual from '@/modo-presencial/pages/CrearCartonManual'
import Jugar from '@/modo-presencial/pages/Jugar'
import EditorPatrones from '@/modo-presencial/pages/EditorPatrones'
import ConfiguracionJuego from '@/modo-presencial/pages/ConfiguracionJuego'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cartones', element: <MisCartones /> },
      { path: 'cartones/nuevo', element: <CrearCartonManual /> },
      { path: 'patrones', element: <EditorPatrones /> },
      { path: 'configurar', element: <ConfiguracionJuego /> },
      { path: 'jugar', element: <Jugar /> },
    ],
  },
])
