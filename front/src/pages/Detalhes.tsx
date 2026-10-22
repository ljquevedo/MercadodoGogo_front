import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ProdutoType } from '../utils/types'
import { apiUrl, moeda, corCategoria, ESTOQUE_BAIXO } from '../utils/formata'

export default function Detalhes() {
  const { produtoId } = useParams()
  const [produto, setProduto] = useState<ProdutoType>()
  const [fotoAtual, setFotoAtual] = useState(0)

  useEffect(() => {
    async function buscaDados() {
      const response = await fetch(`${apiUrl}/produtos/${produtoId}`)
      if (response.ok) setProduto(await response.json())
    }
    buscaDados()
  }, [produtoId])

  if (!produto) return <p className="max-w-5xl mx-auto px-4 mt-10 text-stone-500">Carregando...</p>

  const foto = produto.fotos[fotoAtual]

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8">
      <Link to="/" className="text-sm text-folha-700 hover:underline">← Voltar à vitrine</Link>

      <section className="mt-4 grid md:grid-cols-2 gap-8 bg-white rounded-3xl p-6 ring-1 ring-stone-200">
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
            {foto ? (
              <img src={foto.url} alt={foto.descricao} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-8xl">{produto.categoria.icone}</div>
            )}
          </div>
          {produto.fotos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {produto.fotos.map((f, i) => (
                <button key={f.id} onClick={() => setFotoAtual(i)}
                  className={`w-20 h-16 rounded-lg overflow-hidden ring-2 shrink-0 ${i === fotoAtual ? 'ring-folha-500' : 'ring-transparent'}`}>
                  <img src={f.url} alt={f.descricao} title={f.descricao} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${corCategoria[produto.categoria.nome] ?? ''}`}>
            {produto.categoria.icone} {produto.categoria.nome}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">{produto.nome}</h1>
          <p className="text-stone-500">Marca: {produto.marca}</p>

          <p className="mt-6 font-display text-4xl font-extrabold text-folha-700">
            {moeda(produto.preco)} <span className="text-base font-sans font-medium text-stone-500">por {produto.unidade}</span>
          </p>

          <p className={`mt-4 text-sm font-medium ${produto.estoque < ESTOQUE_BAIXO ? 'text-tomate' : 'text-stone-600'}`}>
            {produto.estoque === 0
              ? 'Produto esgotado'
              : produto.estoque < ESTOQUE_BAIXO
                ? `Restam apenas ${produto.estoque} em estoque`
                : `${produto.estoque} em estoque`}
          </p>
          {produto.destaque && <p className="mt-2 text-sm font-semibold text-tomate">🔥 Oferta da semana</p>}

          <div className="mt-auto pt-6">
            <Link to={`/produtos/${produto.id}/editar`}
              className="inline-block rounded-full bg-stone-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700">
              Editar produto e fotos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
