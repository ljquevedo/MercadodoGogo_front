import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type Inputs = { termo: string }

type Props = {
  onPesquisa: (termo: string) => void
  onLimpa: () => void
}

export function InputPesquisa({ onPesquisa, onLimpa }: Props) {
  const { register, handleSubmit, reset } = useForm<Inputs>()

  function enviaPesquisa(data: Inputs) {
    if (data.termo.trim().length < 2) {
      toast.error('Informe, no mínimo, 2 caracteres')
      return
    }
    onPesquisa(data.termo.trim())
  }

  function limpa() {
    reset({ termo: '' })
    onLimpa()
  }

  return (
    <form onSubmit={handleSubmit(enviaPesquisa)} className="flex gap-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-4 grid place-items-center text-stone-400">🔍</span>
        <input
          type="search"
          placeholder="Buscar arroz, detergente, banana..."
          className="w-full rounded-full bg-white text-stone-800 pl-11 pr-4 py-3 ring-1 ring-stone-300 focus:ring-2 focus:ring-folha-500 outline-none"
          {...register('termo')}
        />
      </div>
      <button type="submit" className="rounded-full bg-folha-600 hover:bg-folha-700 text-white px-5 font-medium">
        Buscar
      </button>
      <button type="button" onClick={limpa} className="rounded-full bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50 px-4 text-sm">
        Limpar
      </button>
    </form>
  )
}
