export const apiUrl = import.meta.env.VITE_API_URL

export function moeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Remove acentos e deixa minúsculo: "Feijão" -> "feijao"
export function normaliza(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export const ESTOQUE_BAIXO = 10

export const corCategoria: Record<string, string> = {
  'Alimentação': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Hortifruti': 'bg-folha-100 text-folha-700 ring-folha-500/30',
  'Limpeza': 'bg-sky-100 text-sky-800 ring-sky-200',
}
