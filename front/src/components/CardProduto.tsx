import { Link } from 'react-router-dom'
import type { ProdutoType } from '../utils/types'
import { moeda, corCategoria, ESTOQUE_BAIXO } from '../utils/formata'

export function CardProduto({ data }: { data: ProdutoType }) {
  const foto = data.fotos[0]
  return (
    <Link
      to={`/detalhes/${data.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden ring-1 ring-stone-200 hover:ring-folha-500 hover:-translate-y-0.5 hover:shadow-lg transition"
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        {foto ? (
          <img src={foto.url} alt={foto.descricao} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-6xl">{data.categoria.icone}</div>
        )}
        {data.destaque && (
          <span className="absolute top-2 left-2 bg-tomate text-white text-xs font-semibold px-2 py-1 rounded-full">Oferta</span>
        )}
        {data.estoque < ESTOQUE_BAIXO && (
          <span className="absolute top-2 right-2 bg-white/90 text-tomate text-xs font-semibold px-2 py-1 rounded-full">
            Últimas {data.estoque} un.
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${corCategoria[data.categoria.nome] ?? 'bg-stone-100'}`}>
          {data.categoria.nome}
        </span>
        <h3 className="mt-2 font-semibold leading-snug group-hover:text-folha-700">{data.nome}</h3>
        <p className="text-sm text-stone-500">{data.marca}</p>
        <p className="mt-auto pt-3 font-display text-2xl font-extrabold text-folha-700">
          {moeda(data.preco)}
          <span className="ml-1 text-sm font-sans font-medium text-stone-500">/{data.unidade}</span>
        </p>
      </div>
    </Link>
  )
}
