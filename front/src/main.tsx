import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

import Layout from './Layout.tsx'
import Home from './pages/Home.tsx'
import Detalhes from './pages/Detalhes.tsx'
import TabelaProdutos from './pages/TabelaProdutos.tsx'
import FormProduto from './pages/FormProduto.tsx'

const rotas = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'detalhes/:produtoId', element: <Detalhes /> },
      { path: 'produtos', element: <TabelaProdutos /> },
      { path: 'produtos/novo', element: <FormProduto /> },
      { path: 'produtos/:produtoId/editar', element: <FormProduto /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>,
)
