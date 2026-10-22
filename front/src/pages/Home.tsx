import { useEffect, useState } from 'react'
import { CardProduto } from '../components/CardProduto'
import { InputPesquisa } from '../components/InputPesquisa'
import type { CategoriaType, ProdutoType } from '../utils/types'
import { apiUrl } from '../utils/formata'

export default function Home() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([])
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [termo, setTermo] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch(`${apiUrl}/categorias`).then(r => r.json()).then(setCategorias)
  }, [])

  useEffect(() => {
    async function buscaDados() {
      setCarregando(true)
      const url = termo
        ? `${apiUrl}/produtos/pesquisa/${encodeURIComponent(termo)}`
        : `${apiUrl}/produtos${categoriaId ? `?categoriaId=${categoriaId}` : ''}`
      const response = await fetch(url)
      setProdutos(await response.json())
      setCarregando(false)
    }
    buscaDados()
  }, [categoriaId, termo])

  const ofertas = !termo && !categoriaId ? produtos.filter(p => p.destaque) : []
  const titulo = termo
    ? `Resultados para “${termo}”`
    : categoriaId
      ? categorias.find(c => c.id === categoriaId)?.nome
      : 'Todos os produtos'

  return (
    <>
      <section className="bg-folha-700 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-12">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold max-w-2xl leading-tight">
            Do hortifruti à faxina, <span className="text-milho">tudo fresquinho</span> e com preço bom.
          </h1>
          <div className="mt-6">
            <InputPesquisa
              onPesquisa={t => { setCategoriaId(null); setTermo(t) }}
              onLimpa={() => { setTermo(''); setCategoriaId(null) }}
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="flex flex-wrap gap-2">
          <Chip ativo={!categoriaId && !termo} onClick={() => { setTermo(''); setCategoriaId(null) }}>
            🛒 Todos
          </Chip>
          {categorias.map(c => (
            <Chip key={c.id} ativo={categoriaId === c.id} onClick={() => { setTermo(''); setCategoriaId(c.id) }}>
              {c.icone} {c.nome} <span className="opacity-60">({c._count?.produtos ?? 0})</span>
            </Chip>
          ))}
        </div>

        {ofertas.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-extrabold">
              Ofertas da semana <span className="text-tomate">●</span>
            </h2>
            <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {ofertas.map(p => <CardProduto key={p.id} data={p} />)}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl font-extrabold">{titulo}</h2>
          {carregando ? (
            <p className="mt-4 text-stone-500">Carregando produtos...</p>
          ) : produtos.length === 0 ? (
            <p className="mt-4 text-stone-500">Nenhum produto encontrado.</p>
          ) : (
            <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {produtos.map(p => <CardProduto key={p.id} data={p} />)}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ring-1 transition ${
        ativo ? 'bg-milho ring-milho text-stone-900' : 'bg-white ring-stone-200 hover:ring-folha-500'
      }`}
    >
      {children}
    </button>
  )
}
