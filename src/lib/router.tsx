import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/shared/components/Layout'
import Home from '@/modo-presencial/pages/Home'
import MisCartones from '@/modo-presencial/pages/MisCartones'
import Jugar from '@/modo-presencial/pages/Jugar'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cartones', element: <MisCartones /> },
      { path: 'jugar', element: <Jugar /> },
    ],
  },
])
