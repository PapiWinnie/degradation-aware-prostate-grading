import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Tool from './pages/Tool'
import Findings from './pages/Findings'
import Privacy from './pages/Privacy'

// The browser tab title for each page.
const TITLES = { '/tool': 'Tool', '/findings': 'Findings', '/privacy': 'Privacy policy' }

// One page per route. Any unknown address goes back to the home page.
export default function App() {
  const { pathname } = useLocation()

  // A new page should start at the top, not wherever the last one was scrolled to.
  useEffect(() => {
    document.title = TITLES[pathname] ? `${TITLES[pathname]} · CompressPath` : 'CompressPath'
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className='min-h-screen flex flex-col px-4 py-8 sm:px-10 sm:py-12 max-w-[1100px] mx-auto'>
      <Header />
      <main className='flex-1'>
        <Routes>
          <Route path='/'         element={<Home />} />
          <Route path='/tool'     element={<Tool />} />
          <Route path='/findings' element={<Findings />} />
          <Route path='/privacy'  element={<Privacy />} />
          <Route path='*'         element={<Navigate to='/' replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
