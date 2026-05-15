import { NavLink, Outlet } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/cartones', label: 'Mis Cartones', end: false },
  { to: '/patrones', label: 'Patrones', end: false },
  { to: '/jugar', label: 'Jugar', end: false },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-blue-600">🎯 Bingo Digital</span>
          <nav aria-label="Navegación principal">
            <ul className="flex gap-1">
              {navLinks.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      [
                        'rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      ].join(' ')
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
