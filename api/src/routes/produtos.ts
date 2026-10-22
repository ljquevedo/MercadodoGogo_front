import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

const router = Router()

const produtoSchema = z.object({
  nome: z.string().min(2, 'Nome deve possuir, no mínimo, 2 caracteres.').max(60),
  marca: z.string().min(2, 'Marca deve possuir, no mínimo, 2 caracteres.').max(30),
  unidade: z.enum(['un', 'kg', 'g', 'L', 'ml', 'pct', 'dz', 'bdj'], {
    message: 'Unidade inválida.',
  }),
  preco: z.coerce.number().positive('Preço deve ser maior que zero.'),
  estoque: z.coerce.number().int().min(0, 'Estoque não pode ser negativo.'),
  destaque: z.boolean().optional().default(false),
  categoriaId: z.coerce.number().int().positive('Categoria é obrigatória.'),
})

const incluir = {
  categoria: true,
  fotos: { orderBy: { id: 'asc' as const } },
}

function formataErros(error: z.ZodError) {
  return error.issues.map(e => ({ campo: e.path[0], mensagem: e.message }))
}

// Lista todos (ou filtra por ?categoriaId=1 e/ou ?destaque=true)
router.get('/', async (req, res) => {
  const { categoriaId, destaque } = req.query
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ...(categoriaId ? { categoriaId: Number(categoriaId) } : {}),
        ...(destaque === 'true' ? { destaque: true } : {}),
      },
      include: incluir,
      orderBy: { nome: 'asc' },
    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar produtos.' })
  }
})

// Pesquisa por nome, marca ou categoria
router.get('/pesquisa/:termo', async (req, res) => {
  const { termo } = req.params
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { marca: { contains: termo, mode: 'insensitive' } },
          { categoria: { nome: { contains: termo, mode: 'insensitive' } } },
        ],
      },
      include: incluir,
      orderBy: { nome: 'asc' },
    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(500).json({ erro: 'Erro na pesquisa.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(req.params.id) },
      include: incluir,
    })
    if (!produto) {
      res.status(404).json({ erro: 'Produto não encontrado.' })
      return
    }
    res.status(200).json(produto)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar produto.' })
  }
})

router.post('/', async (req, res) => {
  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erros: formataErros(valida.error) })
    return
  }
  try {
    const produto = await prisma.produto.create({ data: valida.data, include: incluir })
    res.status(201).json(produto)
  } catch (error) {
    if ((error as any).code == 'P2003') {
      res.status(404).json({ erro: 'Categoria não encontrada.' })
      return
    }
    res.status(400).json({ erro: 'Erro ao cadastrar produto.' })
  }
})

router.put('/:id', async (req, res) => {
  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erros: formataErros(valida.error) })
    return
  }
  try {
    const produto = await prisma.produto.update({
      where: { id: Number(req.params.id) },
      data: valida.data,
      include: incluir,
    })
    res.status(200).json(produto)
  } catch (error) {
    if ((error as any).code == 'P2025') {
      res.status(404).json({ erro: 'Produto não encontrado.' })
      return
    }
    res.status(400).json({ erro: 'Erro ao alterar produto.' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    // As fotos são removidas junto (onDelete: Cascade no schema)
    const produto = await prisma.produto.delete({ where: { id: Number(req.params.id) } })
    res.status(200).json(produto)
  } catch (error) {
    if ((error as any).code == 'P2025') {
      res.status(404).json({ erro: 'Produto não encontrado.' })
      return
    }
    res.status(400).json({ erro: 'Erro ao excluir produto.' })
  }
})

export default router
