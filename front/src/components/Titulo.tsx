import { Link, NavLink } from 'react-router-dom'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition ${
    isActive ? 'bg-white text-folha-700' : 'text-folha-50 hover:bg-folha-600'
  }`

export default function Titulo() {
  return (
    <header className="bg-folha-700 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-milho text-2xl shadow-inner">🛒</span>
          <span className="leading-tight">
            <span className="block font-display text-2xl font-extrabold tracking-tight">Mercado do Gogó</span>
            <span className="block text-xs text-folha-100">alimentação · hortifruti · limpeza</span>
          </span>
        </Link>
        <nav className="flex gap-1">
          <NavLink to="/" end className={linkClasse}>Vitrine</NavLink>
          <NavLink to="/produtos" end className={linkClasse}>Gestão de Produtos</NavLink>
          <NavLink to="/produtos/novo" className={linkClasse}>+ Novo Produto</NavLink>
        </nav>
      </div>
    </header>
  )
}
