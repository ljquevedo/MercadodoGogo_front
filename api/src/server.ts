import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import routesCategorias from './routes/categorias'
import routesProdutos from './routes/produtos'
import routesFotos from './routes/fotos'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

// Imagens enviadas pelo Multer quando o Cloudinary não está configurado
app.use('/uploads', express.static(path.resolve('uploads')))

app.use('/categorias', routesCategorias)
app.use('/produtos', routesProdutos)
app.use('/fotos', routesFotos)

app.get('/', (req, res) => {
  res.send('API: Mercado do Gogó — produtos de alimentação, limpeza e hortifruti')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})
