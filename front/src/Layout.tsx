import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Titulo from './components/Titulo.tsx'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Titulo />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        Mercado do Gogó · Trabalho #2 Full Stack — demonstração do pacote TanStack Table
      </footer>
      <Toaster richColors position="top-center" />
    </div>
  )
}
