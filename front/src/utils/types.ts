export type CategoriaType = {
  id: number
  nome: string
  icone: string
  _count?: { produtos: number }
}

export type FotoType = {
  id: number
  descricao: string
  url: string
  produtoId: number
}

export type ProdutoType = {
  id: number
  nome: string
  marca: string
  unidade: string
  preco: string | number // o Prisma devolve Decimal como string
  estoque: number
  destaque: boolean
  categoriaId: number
  categoria: CategoriaType
  fotos: FotoType[]
}

export const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'dz', 'bdj'] as const
