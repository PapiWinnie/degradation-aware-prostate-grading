import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Tool from './pages/Tool'
import Findings from './pages/Findings'

// The browser tab title for each page.
const TITLES = { '/tool': 'Tool', '/findings': 'Findings' }

// One page per route. Any unknown address goes back to the home page.
export default function App() {
  const { pathname } = useLocation()

  // A new page should start at the top, not wherever the last one was scrolled to.
  useEffect(() => {
    document.title = TITLES[pathname] ? `${TITLES[pathname]} · CompressPath` : 'CompressPath'
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className='min-h-screen px-4 py-8 sm:px-10 sm:py-12 max-w-[1100px] mx-auto'>
      <Header />
      <main>
        <Routes>
          <Route path='/'         element={<Home />} />
          <Route path='/tool'     element={<Tool />} />
          <Route path='/findings' element={<Findings />} />
          <Route path='*'         element={<Navigate to='/' replace />} />
        </Routes>
      </main>
    </div>
  )
}
