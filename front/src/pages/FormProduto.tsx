import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { CategoriaType, FotoType, ProdutoType } from '../utils/types'
import { UNIDADES } from '../utils/types'
import { apiUrl } from '../utils/formata'

type Inputs = {
  nome: string
  marca: string
  unidade: string
  preco: number
  estoque: number
  destaque: boolean
  categoriaId: number
}

type FotoInputs = { descricao: string; imagem: FileList }

const campo = 'w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 focus:ring-2 focus:ring-folha-500 outline-none'

export default function FormProduto() {
  const { produtoId } = useParams()
  const editando = !!produtoId
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [fotos, setFotos] = useState<FotoType[]>([])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Inputs>({
    defaultValues: { unidade: 'un', estoque: 0, destaque: false },
  })
  const fotoForm = useForm<FotoInputs>()

  useEffect(() => {
    fetch(`${apiUrl}/categorias`).then(r => r.json()).then(setCategorias)
  }, [])

  useEffect(() => {
    if (!editando || categorias.length === 0) return
    fetch(`${apiUrl}/produtos/${produtoId}`).then(r => r.json()).then((p: ProdutoType) => {
      reset({
        nome: p.nome, marca: p.marca, unidade: p.unidade, preco: Number(p.preco),
        estoque: p.estoque, destaque: p.destaque, categoriaId: p.categoriaId,
      })
      setFotos(p.fotos)
    })
  }, [produtoId, editando, categorias.length, reset])

  async function salva(data: Inputs) {
    const response = await fetch(`${apiUrl}/produtos${editando ? `/${produtoId}` : ''}`, {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, preco: Number(data.preco), estoque: Number(data.estoque), categoriaId: Number(data.categoriaId) }),
    })
    const dados = await response.json()
    if (!response.ok) {
      toast.error(dados.erros?.map((e: { mensagem: string }) => e.mensagem).join(' ') ?? dados.erro)
      return
    }
    toast.success(editando ? 'Produto alterado!' : 'Produto cadastrado! Agora envie as fotos.')
    if (!editando) navigate(`/produtos/${dados.id}/editar`)
  }

  // Upload com Multer: os dados vão como multipart/form-data, o arquivo no campo "imagem"
  async function enviaFoto(data: FotoInputs) {
    const formData = new FormData()
    formData.append('descricao', data.descricao)
    formData.append('produtoId', String(produtoId))
    formData.append('imagem', data.imagem[0])

    const response = await fetch(`${apiUrl}/fotos`, { method: 'POST', body: formData })
    const dados = await response.json()
    if (!response.ok) {
      toast.error(dados.erros?.map((e: { mensagem: string }) => e.mensagem).join(' ') ?? dados.erro)
      return
    }
    setFotos(f => [...f, dados])
    fotoForm.reset()
    toast.success('Foto enviada!')
  }

  async function excluiFoto(id: number) {
    const response = await fetch(`${apiUrl}/fotos/${id}`, { method: 'DELETE' })
    if (response.ok) {
      setFotos(f => f.filter(x => x.id !== id))
      toast.success('Foto removida.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8">
      <Link to="/produtos" className="text-sm text-folha-700 hover:underline">← Voltar à gestão de produtos</Link>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{editando ? 'Editar produto' : 'Novo produto'}</h1>

      <div className="mt-6 grid md:grid-cols-[1fr_340px] gap-6 items-start">
        <form onSubmit={handleSubmit(salva)} className="bg-white rounded-3xl p-6 ring-1 ring-stone-200 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Nome</span>
            <input className={campo} {...register('nome', { required: 'Informe o nome', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })} />
            {errors.nome && <small className="text-tomate">{errors.nome.message}</small>}
          </label>
          <label>
            <span className="text-sm font-medium">Marca</span>
            <input className={campo} {...register('marca', { required: 'Informe a marca' })} />
            {errors.marca && <small className="text-tomate">{errors.marca.message}</small>}
          </label>
          <label>
            <span className="text-sm font-medium">Categoria</span>
            <select className={campo} {...register('categoriaId', { required: 'Escolha a categoria' })}>
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
            </select>
            {errors.categoriaId && <small className="text-tomate">{errors.categoriaId.message}</small>}
          </label>
          <label>
            <span className="text-sm font-medium">Preço (R$)</span>
            <input type="number" step="0.01" min="0.01" className={campo} {...register('preco', { required: 'Informe o preço' })} />
            {errors.preco && <small className="text-tomate">{errors.preco.message}</small>}
          </label>
          <label>
            <span className="text-sm font-medium">Unidade</span>
            <select className={campo} {...register('unidade')}>
              {UNIDADES.map(u => <option key={u}>{u}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Estoque</span>
            <input type="number" min="0" className={campo} {...register('estoque', { required: true })} />
          </label>
          <label className="flex items-center gap-2 self-end pb-2.5">
            <input type="checkbox" className="w-5 h-5 accent-folha-600" {...register('destaque')} />
            <span className="text-sm font-medium">Oferta da semana (destaque)</span>
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={isSubmitting} className="rounded-full bg-folha-600 hover:bg-folha-700 text-white px-6 py-2.5 font-medium disabled:opacity-50">
              {editando ? 'Salvar alterações' : 'Cadastrar'}
            </button>
            {editando && (
              <Link to={`/detalhes/${produtoId}`} className="rounded-full ring-1 ring-stone-300 px-5 py-2.5 text-sm font-medium hover:bg-stone-50">
                Ver na vitrine
              </Link>
            )}
          </div>
        </form>

        <aside className="bg-white rounded-3xl p-6 ring-1 ring-stone-200">
          <h2 className="font-semibold">Fotos do produto</h2>
          {!editando ? (
            <p className="mt-2 text-sm text-stone-500">Cadastre o produto primeiro para poder enviar fotos.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {fotos.map(f => (
                  <div key={f.id} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100">
                    <img src={f.url} alt={f.descricao} title={f.descricao} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => excluiFoto(f.id)}
                      className="absolute inset-0 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition">
                      Remover
                    </button>
                  </div>
                ))}
                {fotos.length === 0 && <p className="col-span-3 text-sm text-stone-500">Nenhuma foto ainda.</p>}
              </div>
              <form onSubmit={fotoForm.handleSubmit(enviaFoto)} className="mt-4 grid gap-2">
                <input placeholder="Descrição da foto" className={campo}
                  {...fotoForm.register('descricao', { required: true, maxLength: 40 })} />
                <input type="file" accept="image/*"
                  className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-folha-100 file:px-4 file:py-2 file:text-folha-700"
                  {...fotoForm.register('imagem', { required: true })} />
                <button disabled={fotoForm.formState.isSubmitting}
                  className="rounded-full bg-stone-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
                  {fotoForm.formState.isSubmitting ? 'Enviando...' : 'Enviar foto'}
                </button>
              </form>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
