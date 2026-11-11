// App title, subtitle and the links between the three pages (tool, About, Findings).
// 'page' is the current hash, used to underline the active link.
export default function Header({ page }) {
  const links = [['', 'Tool'], ['about', 'About'], ['findings', 'Findings']]
  return (
    <div className='flex justify-between items-end mb-8 gap-4'>
      <div className='flex flex-col items-start'>
        <h1 className='font-mono font-bold text-2xl tracking-tight text-[#191C1E]'>COMPRESSPATH</h1>
        <p className='font-mono text-sm text-[#737686]'>Telepathology Degradation Benchmark</p>
      </div>
      <nav className='flex gap-4 text-sm font-semibold text-[#004AC6]'>
        {links.map(([id, label]) => (
          <a key={label} href={`#${id}`}
             className={(page === id || (id === '' && page !== 'about' && page !== 'findings')) ? 'underline' : 'hover:underline'}>
            {label}
          </a>
        ))}
      </nav>
    </div>
  )
}
