import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'முகப்பு', icon: HomeIcon },
  { to: '/chapters', label: 'குறள்கள்', icon: BookIcon },
  { to: '/search', label: 'தேடல்', icon: SearchIcon },
  { to: '/mine', label: 'எனது', icon: HeartIcon },
  { to: '/settings', label: 'அமைப்புகள்', icon: GearIcon },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-cream-50/95 backdrop-blur border-t border-gold-400/30 pb-[env(safe-area-inset-bottom)]"
      aria-label="முதன்மை வழிசெலுத்தல்"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-maroon-700' : 'text-charcoal-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7a1f1a' : '#241f1c88'} strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7a1f1a' : '#241f1c88'} strokeWidth="1.8">
      <path d="M4 5.5c2-1 5-1 8 0v13c-3-1-6-1-8 0z" strokeLinejoin="round" />
      <path d="M20 5.5c-2-1-5-1-8 0v13c3-1 6-1 8 0z" strokeLinejoin="round" />
    </svg>
  )
}
function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7a1f1a' : '#241f1c88'} strokeWidth="1.8">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}
function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#7a1f1a' : 'none'} stroke={active ? '#7a1f1a' : '#241f1c88'} strokeWidth="1.8">
      <path d="M12 20s-7-4.35-9.5-8.8C.7 8 2 4.5 5.4 4c2-.3 3.7.6 4.6 2.3C10.9 4.6 12.6 3.7 14.6 4c3.4.5 4.7 4 3 7.2C19 15.65 12 20 12 20Z" />
    </svg>
  )
}
function GearIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7a1f1a' : '#241f1c88'} strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a8 8 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a8 8 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a8 8 0 0 0 1.7 1l.4 2.9h4l.4-2.9a8 8 0 0 0 1.7-1l2.5 1 2-3.5z" strokeLinejoin="round" />
    </svg>
  )
}
