import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import streamifier from 'streamifier'
import fs from 'node:fs/promises'
import path from 'node:path'

const router = Router()

const fotoSchema = z.object({
  descricao: z.string()
    .min(1, 'Descrição não pode ser vazia.')
    .max(40, 'Descrição deve ter no máximo 40 caracteres.'),
  produtoId: z.coerce
    .number({ message: 'produtoId deve ser um número inteiro.' })
    .int('produtoId deve ser um número inteiro.')
    .positive('produtoId deve ser um número inteiro positivo.'),
})

type FotoInput = z.infer<typeof fotoSchema>

router.get('/', async (req, res) => {
  try {
    const fotos = await prisma.foto.findMany({ include: { produto: true } })
    res.status(200).json(fotos)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar fotos.' })
  }
})

// Multer: guarda o arquivo em memória (buffer), aceita só imagens até 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Envie apenas arquivos de imagem.'))
  },
})

const usaCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'x'

if (usaCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Converte o buffer do Multer em stream e envia ao Cloudinary
function uploadParaCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'mercado/produtos' },
      (error, result) => {
        if (error || !result) reject(error)
        else resolve(result.secure_url)
      }
    )
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

// Alternativa sem Cloudinary: grava o buffer na pasta uploads/ da API
async function salvaEmDisco(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || '.jpg'
  const nome = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
  await fs.mkdir('uploads', { recursive: true })
  await fs.writeFile(path.join('uploads', nome), file.buffer)
  const base = process.env.API_URL ?? 'http://localhost:3000'
  return `${base}/uploads/${nome}`
}

router.post('/', (req, res, next) => {
  // Trata erros do próprio Multer (tamanho, tipo de arquivo)
  upload.single('imagem')(req, res, err => {
    if (err) {
      res.status(400).json({ erro: err.message })
      return
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ erro: 'Imagem é obrigatória.' })
      return
    }

    const valida = fotoSchema.safeParse(req.body)
    if (!valida.success) {
      const erros = valida.error.issues.map(e => ({ campo: e.path[0], mensagem: e.message }))
      res.status(400).json({ erros })
      return
    }

    const { descricao, produtoId }: FotoInput = valida.data

    const url = usaCloudinary
      ? await uploadParaCloudinary(req.file.buffer)
      : await salvaEmDisco(req.file)

    const foto = await prisma.foto.create({ data: { descricao, url, produtoId } })
    res.status(201).json(foto)
  } catch (error) {
    if ((error as any).code == 'P2003') {
      res.status(404).json({ erro: 'Produto não encontrado.' })
      return
    }
    res.status(500).json({ erro: 'Erro interno no servidor.' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const foto = await prisma.foto.delete({ where: { id: Number(req.params.id) } })
    res.status(200).json(foto)
  } catch (error) {
    res.status(404).json({ erro: 'Foto não encontrada.' })
  }
})

export default router
