import { hrefFor, useHashPath } from './lib/hash-route'
import { LIBRARY_PAGE } from './lib/library-routes'
import { BldPage } from './pages/BldPage'
import { LibraryPage } from './pages/LibraryPage'
import { PracticePage } from './pages/PracticePage'
import './App.css'

const PAGES = [
  { id: LIBRARY_PAGE, label: 'Thư viện công thức' },
  { id: 'luyen-tap', label: 'Luyện tập' },
  { id: 'bld', label: 'BLD bịt mắt' },
] as const

function App() {
  const [pageId, ...rest] = useHashPath()
  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0]

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">CFOP Rubik</h1>
        <nav className="app-nav" aria-label="Trang">
          {PAGES.map((p) => (
            <a key={p.id} href={hrefFor(p.id)} aria-current={p === page ? 'page' : undefined}>
              {p.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {page.id === LIBRARY_PAGE && <LibraryPage path={rest} />}
        {page.id === 'luyen-tap' && <PracticePage />}
        {page.id === 'bld' && <BldPage path={rest} />}
      </main>
    </div>
  )
}

export default App
