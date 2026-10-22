import { Router } from 'express'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { produtos: true } } },
    })
    res.status(200).json(categorias)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar categorias.' })
  }
})

export default router
