/**
 * ============================================================
 *  TanStack Table — Gestão de Produtos do Mercado
 * ============================================================
 *  A TanStack Table é "headless": ela NÃO desenha nada na tela.
 *  Ela só calcula o estado da tabela (linhas ordenadas, filtradas,
 *  paginadas, selecionadas...) e nós montamos o HTML/Tailwind.
 *
 *  Recursos demonstrados nesta página:
 *   1. Definição tipada das colunas (createColumnHelper)
 *   2. Ordenação ao clicar no cabeçalho (getSortedRowModel)
 *   3. Filtro global sem acento (globalFilterFn personalizado)
 *   4. Filtros por coluna: categoria e "estoque baixo" (getFilteredRowModel)
 *   5. Paginação com tamanho de página (getPaginationRowModel)
 *   6. Mostrar/ocultar colunas (columnVisibility)
 *   7. Seleção de linhas com checkbox (rowSelection)
 *   8. Rodapé com totais calculados sobre as linhas filtradas
 * ============================================================
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { CategoriaType, ProdutoType } from '../utils/types'
import { apiUrl, moeda, normaliza, corCategoria, ESTOQUE_BAIXO } from '../utils/formata'

// ---------- 3. Filtro global: ignora acentos e maiúsculas ----------
// Busca o texto digitado no nome, marca e categoria da linha.
const filtroSemAcento: FilterFn<ProdutoType> = (row, _columnId, valor: string) => {
  const alvo = normaliza(`${row.original.nome} ${row.original.marca} ${row.original.categoria.nome}`)
  return alvo.includes(normaliza(valor))
}

// ---------- 1. Definição das colunas ----------
const col = createColumnHelper<ProdutoType>()

export default function TabelaProdutos() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([])
  const [categorias, setCategorias] = useState<CategoriaType[]>([])

  // Estados controlados da tabela (ficam no React, a tabela só lê/escreve)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nome', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ marca: true, unidade: false })
  const [rowSelection, setRowSelection] = useState({})

  async function carrega() {
    const [p, c] = await Promise.all([
      fetch(`${apiUrl}/produtos`).then(r => r.json()),
      fetch(`${apiUrl}/categorias`).then(r => r.json()),
    ])
    setProdutos(p)
    setCategorias(c)
  }
  useEffect(() => { carrega() }, [])

  function confirmaExclusao(produto: ProdutoType) {
    toast(`Excluir “${produto.nome}”?`, {
      description: 'As fotos do produto também serão removidas.',
      action: {
        label: 'Excluir',
        onClick: async () => {
          const r = await fetch(`${apiUrl}/produtos/${produto.id}`, { method: 'DELETE' })
          if (r.ok) {
            setProdutos(lista => lista.filter(p => p.id !== produto.id))
            toast.success('Produto excluído.')
          } else toast.error('Não foi possível excluir.')
        },
      },
    })
  }

  // As colunas ficam em useMemo para não serem recriadas a cada render
  const columns = useMemo(() => [
    // 7. Coluna de seleção (checkbox no cabeçalho seleciona a página inteira)
    col.display({
      id: 'selecao',
      header: ({ table }) => (
        <input type="checkbox" className="w-4 h-4 accent-folha-600"
          checked={table.getIsAllPageRowsSelected()}
          ref={el => { if (el) el.indeterminate = table.getIsSomePageRowsSelected() }}
          onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="w-4 h-4 accent-folha-600"
          checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      ),
      enableSorting: false,
      enableHiding: false,
    }),

    col.accessor(row => row.fotos[0]?.url, {
      id: 'foto',
      header: 'Foto',
      cell: info => info.getValue()
        ? <img src={info.getValue()} alt="" className="w-12 h-10 rounded-md object-cover" />
        : <span className="text-2xl">{info.row.original.categoria.icone}</span>,
      enableSorting: false,
    }),

    col.accessor('nome', {
      header: 'Produto',
      cell: info => (
        <Link to={`/detalhes/${info.row.original.id}`} className="font-medium hover:text-folha-700">
          {info.getValue()}
          {info.row.original.destaque && <span className="ml-2 text-[10px] bg-tomate text-white px-1.5 py-0.5 rounded-full align-middle">OFERTA</span>}
        </Link>
      ),
      footer: ({ table }) => `${table.getFilteredRowModel().rows.length} produto(s)`,
    }),

    col.accessor('marca', { header: 'Marca' }),

    // 4. Filtro por coluna: compara o nome da categoria exatamente
    col.accessor(row => row.categoria.nome, {
      id: 'categoria',
      header: 'Categoria',
      cell: info => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${corCategoria[info.getValue()] ?? ''}`}>
          {info.getValue()}
        </span>
      ),
      filterFn: 'equals',
    }),

    // accessorFn converte para número: assim a ordenação é numérica, não alfabética
    col.accessor(row => Number(row.preco), {
      id: 'preco',
      header: 'Preço',
      cell: info => <span className="tabular-nums">{moeda(info.getValue())}</span>,
      meta: { alinhar: 'right' },
    }),

    col.accessor('unidade', { header: 'Un.' }),

    // 4. Filtro personalizado: quando ativo, mostra só estoque abaixo do limite
    col.accessor('estoque', {
      header: 'Estoque',
      cell: info => (
        <span className={`tabular-nums font-medium ${info.getValue() < ESTOQUE_BAIXO ? 'text-tomate' : ''}`}>
          {info.getValue()}
          {info.getValue() < ESTOQUE_BAIXO && ' ⚠️'}
        </span>
      ),
      filterFn: (row, id, somenteBaixo: boolean) => !somenteBaixo || (row.getValue(id) as number) < ESTOQUE_BAIXO,
      meta: { alinhar: 'right' },
    }),

    // Coluna calculada: valor do estoque = preço x quantidade
    col.accessor(row => Number(row.preco) * row.estoque, {
      id: 'valorEstoque',
      header: 'Valor em estoque',
      cell: info => <span className="tabular-nums">{moeda(info.getValue())}</span>,
      // 8. Rodapé: soma apenas as linhas que passaram pelos filtros
      footer: ({ table }) => moeda(
        table.getFilteredRowModel().rows.reduce((soma, r) => soma + (r.getValue('valorEstoque') as number), 0)
      ),
      meta: { alinhar: 'right' },
    }),

    col.display({
      id: 'acoes',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Link to={`/produtos/${row.original.id}/editar`}
            className="px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-stone-300 hover:bg-stone-100">Editar</Link>
          <button onClick={() => confirmaExclusao(row.original)}
            className="px-2.5 py-1 rounded-full text-xs font-medium text-tomate ring-1 ring-red-200 hover:bg-red-50">Excluir</button>
        </div>
      ),
      enableHiding: false,
    }),
  ], [])

  // ---------- O "coração": useReactTable ----------
  const table = useReactTable({
    data: produtos,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: filtroSemAcento,
    sortDescFirst: false,                        // todo clique começa em ordem crescente
    getRowId: row => String(row.id),            // a seleção usa o id do produto
    getCoreRowModel: getCoreRowModel(),          // obrigatório
    getSortedRowModel: getSortedRowModel(),      // 2. ordenação
    getFilteredRowModel: getFilteredRowModel(),  // 3 e 4. filtros
    getPaginationRowModel: getPaginationRowModel(), // 5. paginação
    initialState: { pagination: { pageSize: 10 } },
  })

  const filtroCategoria = (table.getColumn('categoria')?.getFilterValue() as string) ?? ''
  const somenteBaixo = (table.getColumn('estoque')?.getFilterValue() as boolean) ?? false
  const selecionados = table.getSelectedRowModel().rows
  const { pageIndex, pageSize } = table.getState().pagination
  const totalFiltrado = table.getFilteredRowModel().rows.length

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Gestão de Produtos</h1>
          <p className="text-sm text-stone-500">Tabela construída com <code className="bg-stone-200/70 px-1.5 rounded">@tanstack/react-table</code></p>
        </div>
        <Link to="/produtos/novo" className="rounded-full bg-folha-600 hover:bg-folha-700 text-white px-5 py-2.5 text-sm font-medium">
          + Novo produto
        </Link>
      </div>

      {/* ---------- Barra de filtros ---------- */}
      <div className="mt-6 flex flex-wrap items-center gap-3 bg-white rounded-2xl p-3 ring-1 ring-stone-200">
        <input
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="🔍 Filtrar por nome, marca ou categoria (ex.: feijao)"
          className="flex-1 min-w-60 rounded-full bg-stone-50 px-4 py-2 ring-1 ring-stone-200 focus:ring-2 focus:ring-folha-500 outline-none"
        />
        <select
          value={filtroCategoria}
          onChange={e => table.getColumn('categoria')?.setFilterValue(e.target.value || undefined)}
          className="rounded-full bg-stone-50 px-4 py-2 ring-1 ring-stone-200 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c.id} value={c.nome}>{c.icone} {c.nome}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm px-2">
          <input type="checkbox" className="w-4 h-4 accent-tomate" checked={somenteBaixo}
            onChange={e => table.getColumn('estoque')?.setFilterValue(e.target.checked || undefined)} />
          Estoque baixo (&lt; {ESTOQUE_BAIXO})
        </label>

        {/* 6. Mostrar / ocultar colunas */}
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-full px-4 py-2 ring-1 ring-stone-200 text-sm hover:bg-stone-50">⚙️ Colunas</summary>
          <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-stone-200 p-2">
            {table.getAllLeafColumns().filter(c => c.getCanHide()).map(c => (
              <label key={c.id} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-stone-50 rounded">
                <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
                {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* 7. Resumo da seleção */}
      {selecionados.length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-milho/20 ring-1 ring-milho px-4 py-2 text-sm">
          <span>
            <b>{selecionados.length}</b> selecionado(s) · valor em estoque:{' '}
            <b>{moeda(selecionados.reduce((s, r) => s + (r.getValue('valorEstoque') as number), 0))}</b>
          </span>
          <button onClick={() => table.resetRowSelection()} className="underline">Limpar seleção</button>
        </div>
      )}

      {/* ---------- A tabela em si: só percorremos o que a TanStack calculou ---------- */}
      <div className="mt-3 overflow-x-auto bg-white rounded-2xl ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-folha-50 text-folha-900">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const ordem = header.column.getIsSorted()
                  const direita = (header.column.columnDef.meta as { alinhar?: string })?.alinhar === 'right'
                  return (
                    <th key={header.id}
                      className={`px-3 py-3 font-semibold whitespace-nowrap ${direita ? 'text-right' : 'text-left'}`}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        // 2. Clique alterna: crescente → decrescente → sem ordem
                        <button onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-folha-600 select-none">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-xs w-3">{ordem === 'asc' ? '▲' : ordem === 'desc' ? '▼' : '↕'}</span>
                        </button>
                      ) : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}
                className={`border-t border-stone-100 ${row.getIsSelected() ? 'bg-milho/10' : 'hover:bg-stone-50'}`}>
                {row.getVisibleCells().map(cell => {
                  const direita = (cell.column.columnDef.meta as { alinhar?: string })?.alinhar === 'right'
                  return (
                    <td key={cell.id} className={`px-3 py-2 ${direita ? 'text-right' : ''}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr><td colSpan={table.getVisibleLeafColumns().length} className="px-3 py-10 text-center text-stone-500">
                {produtos.length === 0 ? 'Carregando...' : 'Nenhum produto corresponde aos filtros.'}
              </td></tr>
            )}
          </tbody>
          {/* 8. Rodapé */}
          <tfoot className="bg-stone-50 font-semibold">
            {table.getFooterGroups().map(fg => (
              <tr key={fg.id} className="border-t border-stone-200">
                {fg.headers.map(h => {
                  const direita = (h.column.columnDef.meta as { alinhar?: string })?.alinhar === 'right'
                  return (
                    <td key={h.id} className={`px-3 py-2 ${direita ? 'text-right' : ''}`}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.footer, h.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {/* 5. Paginação */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-stone-600">
          Mostrando {totalFiltrado === 0 ? 0 : pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, totalFiltrado)} de {totalFiltrado}
        </span>
        <div className="flex items-center gap-1">
          <BotaoPag onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>«</BotaoPag>
          <BotaoPag onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</BotaoPag>
          <span className="px-3">Página <b>{pageIndex + 1}</b> de <b>{Math.max(table.getPageCount(), 1)}</b></span>
          <BotaoPag onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</BotaoPag>
          <BotaoPag onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>»</BotaoPag>
          <select value={pageSize} onChange={e => table.setPageSize(Number(e.target.value))}
            className="ml-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-200">
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} por página</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

function BotaoPag({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props}
      className="w-8 h-8 rounded-full bg-white ring-1 ring-stone-200 hover:bg-folha-50 disabled:opacity-40 disabled:hover:bg-white">
      {children}
    </button>
  )
}
