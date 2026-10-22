import 'dotenv/config'
import { prisma } from '../lib/prisma'

// Popula o banco com categorias e produtos de exemplo.
// Cada produto ganha uma imagem ilustrativa em SVG, guardada no próprio banco
// como "data URI" (funciona no Neon sem depender de arquivos na API).
// Pode ser substituída por fotos reais enviadas pelo Multer.

const categorias = [
  { nome: 'Alimentação', icone: '🥫', cor: '#f59e0b' },
  { nome: 'Hortifruti', icone: '🥬', cor: '#16a34a' },
  { nome: 'Limpeza', icone: '🧽', cor: '#0ea5e9' },
]

type ProdutoSeed = [nome: string, marca: string, unidade: string, preco: number, estoque: number, emoji: string, destaque?: boolean]

const produtos: Record<string, ProdutoSeed[]> = {
  'Alimentação': [
    ['Arroz Branco Tipo 1 5kg', 'Tio João', 'pct', 27.9, 80, '🍚', true],
    ['Feijão Preto 1kg', 'Camil', 'pct', 8.49, 120, '🫘'],
    ['Macarrão Espaguete 500g', 'Renata', 'pct', 4.79, 150, '🍝'],
    ['Óleo de Soja 900ml', 'Soya', 'un', 7.99, 90, '🫗'],
    ['Café Torrado e Moído 500g', 'Melitta', 'pct', 21.9, 60, '☕', true],
    ['Leite Integral 1L', 'Piracanjuba', 'L', 5.49, 200, '🥛'],
    ['Açúcar Refinado 1kg', 'União', 'pct', 4.99, 110, '🧂'],
    ['Pão de Forma 500g', 'Pullman', 'pct', 9.9, 40, '🍞'],
    ['Ovos Brancos', 'Granja Mantiqueira', 'dz', 12.9, 50, '🥚', true],
    ['Biscoito Recheado 130g', 'Oreo', 'pct', 3.99, 8, '🍪'],
    ['Molho de Tomate 340g', 'Pomarola', 'un', 3.29, 95, '🥫'],
    ['Queijo Mussarela', 'Tirolez', 'kg', 44.9, 15, '🧀'],
  ],
  'Hortifruti': [
    ['Banana Prata', 'Hortifruti Local', 'kg', 6.99, 70, '🍌', true],
    ['Maçã Gala', 'Fischer', 'kg', 9.98, 55, '🍎'],
    ['Tomate Italiano', 'Hortifruti Local', 'kg', 8.49, 40, '🍅', true],
    ['Alface Crespa', 'Horta Orgânica', 'un', 3.49, 30, '🥬'],
    ['Cenoura', 'Hortifruti Local', 'kg', 4.99, 45, '🥕'],
    ['Batata Inglesa', 'Hortifruti Local', 'kg', 5.79, 100, '🥔'],
    ['Cebola', 'Hortifruti Local', 'kg', 4.49, 85, '🧅'],
    ['Laranja Pera', 'Citrus Sul', 'kg', 3.99, 120, '🍊'],
    ['Morango 250g', 'Vale do Caí', 'bdj', 9.9, 6, '🍓'],
    ['Abacate', 'Hortifruti Local', 'kg', 8.9, 25, '🥑'],
  ],
  'Limpeza': [
    ['Detergente Líquido 500ml', 'Ypê', 'un', 2.69, 160, '🧴', true],
    ['Sabão em Pó 1,6kg', 'Omo', 'pct', 24.9, 35, '🫧'],
    ['Água Sanitária 2L', 'Qboa', 'L', 7.49, 70, '🧪'],
    ['Desinfetante 2L Lavanda', 'Pinho Sol', 'L', 12.9, 45, '🌸'],
    ['Esponja Multiuso c/ 4', 'Scotch-Brite', 'pct', 8.99, 60, '🧽'],
    ['Papel Higiênico 12 rolos', 'Neve', 'pct', 22.9, 5, '🧻', true],
    ['Amaciante 2L', 'Comfort', 'L', 19.9, 28, '👕'],
    ['Saco de Lixo 50L c/ 30', 'Dover Roll', 'pct', 11.5, 4, '🗑️'],
  ],
}

function svg(emoji: string, cor: string) {
  return (`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${cor}" stop-opacity="0.35"/>
    </radialGradient>
  </defs>
  <rect width="600" height="450" fill="url(#g)"/>
  <circle cx="300" cy="225" r="150" fill="${cor}" fill-opacity="0.12"/>
  <text x="300" y="235" font-size="190" text-anchor="middle" dominant-baseline="middle"
    font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">${emoji}</text>
</svg>`).replace(/\n\s*/g, ' ')
}

async function main() {
  // Limpa as tabelas e reinicia a numeração dos ids
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "fotos", "produtos", "categorias" RESTART IDENTITY CASCADE')

  let n = 0
  for (const cat of categorias) {
    const categoria = await prisma.categoria.create({
      data: { nome: cat.nome, icone: cat.icone },
    })

    for (const [nome, marca, unidade, preco, estoque, emoji, destaque] of produtos[cat.nome]) {
      const produto = await prisma.produto.create({
        data: { nome, marca, unidade, preco, estoque, destaque: !!destaque, categoriaId: categoria.id },
      })
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(emoji, cat.cor))
      await prisma.foto.create({
        data: { descricao: nome.slice(0, 40), url, produtoId: produto.id },
      })
      n++
    }
  }
  console.log(`Seed concluído: ${categorias.length} categorias e ${n} produtos.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
