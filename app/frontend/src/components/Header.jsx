import { Link, NavLink } from 'react-router-dom'

// App title and the links between the three pages. NavLink underlines the current one.
const links = [['/', 'Home'], ['/tool', 'Tool'], ['/findings', 'Findings']]

export default function Header() {
  return (
    <header className='flex flex-wrap justify-between items-end mb-8 gap-x-4'>
      <Link to='/' className='flex flex-col items-start'>
        <h1 className='font-mono font-bold text-2xl tracking-tight text-[#191C1E]'>COMPRESSPATH</h1>
        <p className='font-mono text-sm text-[#6B6577]'>Telepathology Degradation Benchmark</p>
      </Link>
      <nav aria-label='Main' className='flex gap-4 text-sm font-semibold text-[#A12F77]'>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `py-2 ${isActive ? 'underline' : 'hover:underline'}`}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
