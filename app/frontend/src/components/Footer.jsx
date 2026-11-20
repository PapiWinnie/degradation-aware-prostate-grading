import { NavLink } from 'react-router-dom'

// The site footer. It is the only place that links to the privacy policy, so it
// appears on every page. The page links repeat the header so a reader at the
// bottom of a long page does not have to scroll back up.
const PAGES = [['/', 'Home'], ['/tool', 'Tool'], ['/findings', 'Findings']]
const CONTACT_EMAIL = 'w.nji1@alustudent.com'

const heading = 'font-mono text-xs font-bold text-[#A12F77] mb-2'
const link = 'inline-block py-1 text-sm text-[#5A5266] hover:text-[#A12F77] hover:underline'

export default function Footer() {
  return (
    <footer className='mt-16 pt-8 border-t border-[#F0C9DC]'>
      <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>

        <div className='lg:col-span-2'>
          <p className='font-mono font-bold text-lg tracking-tight text-[#191C1E]'>COMPRESSPATH</p>
          <p className='mt-2 text-sm text-[#5A5266] max-w-md'>
            A research test bench for telepathology researchers and developers. Its output is experimental and is not a
            diagnosis. It must not be used for patient care.
          </p>
        </div>

        <nav aria-label='Pages'>
          <p className={heading}>PAGES</p>
          <ul className='flex flex-col'>
            {PAGES.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to} end className={({ isActive }) => `${link} ${isActive ? 'underline' : ''}`}>{label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label='Legal and contact'>
          <p className={heading}>LEGAL AND CONTACT</p>
          <ul className='flex flex-col'>
            <li>
              <NavLink to='/privacy' className={({ isActive }) => `${link} ${isActive ? 'underline' : ''}`}>Privacy policy</NavLink>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className={link}>{CONTACT_EMAIL}</a>
            </li>
          </ul>
        </nav>
      </div>

      <div className='mt-8 py-5 border-t border-[#F0C9DC] text-xs text-[#6B6577] flex flex-wrap justify-between gap-x-6 gap-y-2'>
        <p>A capstone project by Winston Nji, African Leadership University.</p>
        <p>Sample patches from SICAPv2 (Silva-Rodriguez et al., 2020), licensed CC BY 4.0.</p>
      </div>
    </footer>
  )
}
