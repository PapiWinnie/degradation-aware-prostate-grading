// App title, subtitle and links that jump to the About and Findings sections.
export default function Header() {
  return (
    <div className='flex justify-between items-end mb-8 gap-4'>
      <div className='flex flex-col items-start'>
        <h1 className='font-mono font-bold text-2xl tracking-tight text-[#191C1E]'>COMPRESSPATH</h1>
        <p className='font-mono text-sm text-[#737686]'>Telepathology Degradation Benchmark</p>
      </div>
      <nav className='flex gap-4 text-sm font-semibold text-[#004AC6]'>
        <a href='#about' className='hover:underline'>About</a>
        <a href='#findings' className='hover:underline'>Findings</a>
      </nav>
    </div>
  )
}
