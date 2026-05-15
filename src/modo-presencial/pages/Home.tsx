import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold text-blue-600">🎯 Bingo Digital</h1>
      <p className="mb-10 max-w-md text-lg text-gray-600">
        Digitaliza tus cartones físicos y marca los números automáticamente durante el juego.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => navigate('/cartones')}
          className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-95"
        >
          Crear cartón
        </button>
        <button
          onClick={() => navigate('/jugar')}
          className="rounded-xl border-2 border-blue-600 px-8 py-4 text-lg font-semibold text-blue-600 transition hover:bg-blue-50 active:scale-95"
        >
          Empezar a jugar
        </button>
      </div>
    </div>
  )
}
